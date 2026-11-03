// Device location for Qibla and prayer times. Uses the WebView geolocation API, which Capacitor
// maps to Android location services once the permission is granted. Coordinates never leave the device.
export type Fix = { lat: number; lng: number; accuracy: number; at: number };
export type GeoError = "unsupported" | "denied" | "blocked" | "unavailable" | "timeout";

/** Android permission result → our state. "denied" before asking means Android will no longer show the dialog. */
export function classifyPermission(before: string, after?: string): "granted" | "denied" | "blocked" {
  const granted = (v?: string) => v === "granted";
  if (granted(before) || granted(after)) return "granted";
  if (before === "denied") return "blocked";
  return "denied";
}

async function nativeFix(): Promise<Fix> {
  const { Geolocation } = await import("@capacitor/geolocation");
  let st;
  try { st = await Geolocation.checkPermissions(); } catch { throw "unavailable" as GeoError; } // location services off
  // Either precise or approximate is fine; the accuracy label tells the user which they gave.
  const pick = (p: { location: string; coarseLocation: string }) => (p.location === "granted" ? "granted" : p.coarseLocation);
  let state = classifyPermission(pick(st));
  if (state === "denied") {
    const r = await Geolocation.requestPermissions({ permissions: ["location", "coarseLocation"] });
    state = classifyPermission(pick(st), pick(r));
  }
  if (state !== "granted") throw state as GeoError;
  try {
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
    return { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: Date.now() };
  } catch (e) {
    throw (/timeout/i.test(String((e as Error)?.message ?? e)) ? "timeout" : "unavailable") as GeoError;
  }
}

/** Opens this app's page in Android Settings so a blocked permission can be turned back on. */
export async function openAppSettings(): Promise<boolean> {
  try {
    const { NativeSettings, AndroidSettings, IOSSettings } = await import("capacitor-native-settings");
    await NativeSettings.open({ optionAndroid: AndroidSettings.ApplicationDetails, optionIOS: IOSSettings.App });
    return true;
  } catch { return false; }
}

export async function getFix(): Promise<Fix> {
  const { Capacitor } = await import("@capacitor/core");
  if (Capacitor.isNativePlatform()) return nativeFix();
  return webFix();
}

function webFix(): Promise<Fix> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return reject("unsupported" as GeoError);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: Date.now() }),
      (e) => reject((e.code === 1 ? "denied" : e.code === 3 ? "timeout" : "unavailable") as GeoError),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 },
    );
  });
}

/** Human label for how precise a fix is; city-level fixes are never described as precise. */
export function accuracyLabel(m: number): "precise" | "approximate" | "city" {
  return m <= 100 ? "precise" : m <= 3000 ? "approximate" : "city";
}

/** Angular spread (degrees) of recent compass readings; large spread means calibration is needed. */
export function headingSpread(samples: number[]): number {
  if (samples.length < 2) return 0;
  const base = samples[0]!;
  const diffs = samples.map((s) => ((s - base + 540) % 360) - 180);
  return Math.max(...diffs) - Math.min(...diffs);
}
