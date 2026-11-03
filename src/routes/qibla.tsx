import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LocateFixed, RefreshCw } from "lucide-react";
import { accuracyLabel, getFix, openAppSettings, headingSpread, type GeoError } from "@/lib/geo";
import { QiblaIcon } from "@/components/icons/islamic";
import { PageTitle } from "@/components/dhikr-list";
import { CITIES, coordsFor } from "@/lib/prayer";
import { usePrayerSettings } from "@/lib/use-prayer";
import { compassPoint, distanceToKaaba, qiblaBearing } from "@/lib/qibla";

export const Route = createFileRoute("/qibla")({
  head: () => ({
    meta: [
      { title: "Qibla direction — My Quran" },
      { name: "description", content: "Find the direction of the Kaaba from your phone's location or a chosen city, with a live compass." },
      { property: "og:title", content: "Qibla direction — My Quran" },
      { property: "og:description", content: "Accurate Qibla bearing from your location, works offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QiblaPage,
});

type OrientEvt = DeviceOrientationEvent & { webkitCompassHeading?: number };

function useHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [active, setActive] = useState(false);
  const samples = useRef<number[]>([]);
  const [unstable, setUnstable] = useState(false);

  useEffect(() => {
    const D = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
    if (D?.requestPermission) setNeedsPermission(true);
    else setActive(true);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onEvt = (e: Event) => {
      const ev = e as OrientEvt;
      let h: number | null = null;
      if (typeof ev.webkitCompassHeading === "number") h = ev.webkitCompassHeading;
      else if (ev.absolute && ev.alpha != null) h = (360 - ev.alpha) % 360;
      if (h == null) return;
      // Screen rotated to landscape: compensate so the dial still points the right way.
      const angle = (screen.orientation?.angle ?? 0) as number;
      h = (h + angle) % 360;
      setHeading(h);
      samples.current = [...samples.current.slice(-19), h];
      if (samples.current.length >= 20) setUnstable(headingSpread(samples.current) > 25);
    };
    window.addEventListener("deviceorientationabsolute", onEvt);
    window.addEventListener("deviceorientation", onEvt);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onEvt);
      window.removeEventListener("deviceorientation", onEvt);
    };
  }, [active]);

  const request = async () => {
    const D = (window as unknown as { DeviceOrientationEvent: { requestPermission: () => Promise<string> } }).DeviceOrientationEvent;
    try {
      if ((await D.requestPermission()) === "granted") { setNeedsPermission(false); setActive(true); }
    } catch { /* user declined */ }
  };
  return { heading, needsPermission, request, unstable };
}

const GEO_MSG: Record<GeoError, string> = {
  denied: "Location permission was declined. Tap Use my location to ask again, or pick a city instead.",
  blocked: "Location is turned off for this app. Open Settings → Permissions → Location and choose Allow, then come back.",
  unavailable: "Couldn't get a location. Check that Location is turned on, then try again.",
  timeout: "Finding your location took too long. Move near a window or outdoors and try again.",
  unsupported: "This device can't share its location. Pick a city instead.",
};

function QiblaPage() {
  const [settings, setSettings] = usePrayerSettings();
  const { lat, lng } = coordsFor(settings);
  const usingDevice = settings.city === "custom" && !!settings.custom;
  const cityName = CITIES.find((c) => c.id === settings.city)?.name ?? CITIES[0]!.name;
  const acc = settings.custom?.accuracy;
  const bearing = qiblaBearing(lat, lng);
  const km = distanceToKaaba(lat, lng);
  const { heading, needsPermission, request, unstable } = useHeading();
  const [geo, setGeo] = useState<"idle" | "explain" | "busy" | GeoError>("idle");

  const locate = async () => {
    setGeo("busy");
    try {
      const f = await getFix();
      setSettings((x) => ({ ...x, city: "custom", custom: { lat: f.lat, lng: f.lng, accuracy: f.accuracy, at: f.at } }));
      setGeo("idle");
    } catch (e) { setGeo(e as GeoError); }
  };

  const dialRotation = heading == null ? 0 : -heading;
  const offBy = heading == null ? null : ((bearing - heading + 540) % 360) - 180;
  const aligned = offBy != null && Math.abs(offBy) < 5;
  const sourceText = usingDevice
    ? `Your location${acc != null ? ` · ${accuracyLabel(acc) === "precise" ? "precise" : accuracyLabel(acc) === "approximate" ? "approximate" : "city-level"} (±${acc < 1000 ? `${Math.round(acc)} m` : `${(acc / 1000).toFixed(1)} km`})` : ""}`
    : `${cityName} (chosen city, not GPS)`;

  return (
    <main className="mx-auto max-w-md px-4 pb-10">
      <PageTitle title="Qibla" sub={sourceText} />

      <div className="relative mx-auto aspect-square w-full max-w-[18rem]">
        <div
          className="absolute inset-0 rounded-full border border-border bg-card shadow-soft transition-transform duration-200 motion-reduce:transition-none"
          style={{ transform: `rotate(${dialRotation}deg)` }}
        >
          {["N", "E", "S", "W"].map((p, i) => (
            <span key={p} className="absolute inset-0 flex justify-center pt-3 text-xs font-semibold text-muted-foreground" style={{ transform: `rotate(${i * 90}deg)` }}>
              <span className={p === "N" ? "text-destructive" : ""}>{p}</span>
            </span>
          ))}
          <div className="absolute inset-0 flex justify-center" style={{ transform: `rotate(${bearing}deg)` }}>
            <div className="flex flex-col items-center pt-8">
              <span className={`grid h-12 w-12 place-items-center rounded-full ${aligned ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                <QiblaIcon size={26} />
              </span>
              <span className="mt-1 h-20 w-1 rounded-full bg-gold" />
            </div>
          </div>
        </div>
        <span className="absolute left-1/2 top-0 h-4 w-1 -translate-x-1/2 -translate-y-2 rounded-full bg-foreground" aria-hidden />
        <span className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground" aria-hidden />
      </div>

      <div className="mt-6 text-center">
        <p className="font-display text-5xl text-foreground tabular-nums">{Math.round(bearing)}°</p>
        <p className="mt-1 text-sm text-muted-foreground">{compassPoint(bearing)} from true north · {Math.round(km).toLocaleString()} km to the Kaaba</p>
        <p className={`mt-3 text-sm font-medium ${aligned ? "text-primary" : "text-foreground"}`} aria-live="polite">
          {heading == null
            ? "No live compass on this device. Face the angle above using a compass."
            : aligned
              ? "You are facing the Qibla."
              : `Turn ${offBy! > 0 ? "right" : "left"} ${Math.abs(Math.round(offBy!))}°`}
        </p>
        {heading != null && unstable && (
          <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Compass readings are jumping. Move the phone in a figure-8 a few times and keep it away from metal, magnets and other phones.</p>
        )}
        {needsPermission && (
          <button onClick={request} className="mt-4 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
            Use phone compass
          </button>
        )}
      </div>

      <section className="surface-card mt-6 p-4">
        {geo === "explain" ? (
          <>
            <p className="text-sm text-foreground">Your location is used only on this phone to work out the exact Qibla bearing and your prayer times. It is never sent anywhere.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setGeo("idle")} className="min-h-11 rounded-md border border-input text-sm text-foreground">Not now</button>
              <button onClick={locate} className="min-h-11 rounded-md bg-primary text-sm font-medium text-primary-foreground">Continue</button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => (usingDevice ? locate() : setGeo("explain"))}
              disabled={geo === "busy"}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition active:scale-[0.98] disabled:opacity-60"
            >
              {usingDevice ? <RefreshCw size={16} className={geo === "busy" ? "animate-spin" : ""} /> : <LocateFixed size={16} />}
              {geo === "busy" ? "Finding your location…" : usingDevice ? "Update my location" : "Use my location"}
            </button>
            {geo !== "idle" && geo !== "busy" && <p className="mt-2 text-sm text-destructive" role="alert">{GEO_MSG[geo]}</p>}
            {geo === "blocked" && (
              <button onClick={() => void openAppSettings()} className="mt-2 min-h-11 w-full rounded-md border border-input text-sm font-medium text-foreground">Open Android Settings</button>
            )}
            <label className="mt-3 block text-xs text-muted-foreground">
              Or choose a city
              <select
                className="mt-1 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                value={settings.city}
                onChange={(e) => setSettings((x) => ({ ...x, city: e.target.value }))}
              >
                {settings.custom && <option value="custom">My location</option>}
                {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <p className="mt-3 text-xs text-muted-foreground">The same location is used for <Link to="/ramadan" className="text-primary underline">prayer times</Link>. Works offline once set.</p>
          </>
        )}
      </section>
    </main>
  );
}
