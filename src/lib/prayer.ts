import { CalculationMethod, Coordinates, Madhab, PrayerTimes } from "adhan";

export type PrayerName = "fajr" | "sunrise" | "dhuhr" | "asr" | "maghrib" | "isha";
export const PRAYERS: PrayerName[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"];

export type City = { id: string; name: string; lat: number; lng: number };
export const CITIES: City[] = [
  { id: "addis", name: "Addis Ababa", lat: 9.03, lng: 38.74 },
  { id: "adama", name: "Adama", lat: 8.54, lng: 39.27 },
  { id: "jimma", name: "Jimma", lat: 7.67, lng: 36.83 },
  { id: "harar", name: "Harar", lat: 9.31, lng: 42.12 },
  { id: "diredawa", name: "Dire Dawa", lat: 9.6, lng: 41.85 },
  { id: "bahirdar", name: "Bahir Dar", lat: 11.59, lng: 37.39 },
  { id: "dessie", name: "Dessie", lat: 11.13, lng: 39.63 },
  { id: "hawassa", name: "Hawassa", lat: 7.06, lng: 38.48 },
  { id: "nairobi", name: "Nairobi", lat: -1.29, lng: 36.82 },
  { id: "mecca", name: "Makkah", lat: 21.42, lng: 39.83 },
  { id: "medina", name: "Madinah", lat: 24.47, lng: 39.61 },
  { id: "riyadh", name: "Riyadh", lat: 24.71, lng: 46.68 },
  { id: "dubai", name: "Dubai", lat: 25.2, lng: 55.27 },
  { id: "cairo", name: "Cairo", lat: 30.04, lng: 31.24 },
  { id: "istanbul", name: "Istanbul", lat: 41.01, lng: 28.98 },
  { id: "london", name: "London", lat: 51.51, lng: -0.13 },
  { id: "washington", name: "Washington, DC", lat: 38.9, lng: -77.04 },
  { id: "minneapolis", name: "Minneapolis", lat: 44.98, lng: -93.27 },
];

export const METHODS = {
  mwl: { label: "Muslim World League", make: () => CalculationMethod.MuslimWorldLeague() },
  egypt: { label: "Egyptian General Authority", make: () => CalculationMethod.Egyptian() },
  makkah: { label: "Umm al-Qura, Makkah", make: () => CalculationMethod.UmmAlQura() },
  karachi: { label: "University of Islamic Sciences, Karachi", make: () => CalculationMethod.Karachi() },
  isna: { label: "ISNA (North America)", make: () => CalculationMethod.NorthAmerica() },
} as const;
export type MethodId = keyof typeof METHODS;

export type PrayerSettings = { city: string; custom?: { lat: number; lng: number; accuracy?: number; at?: number }; method: MethodId; hanafi: boolean; hijriOffset: number };
export const DEFAULT_SETTINGS: PrayerSettings = { city: "addis", method: "mwl", hanafi: false, hijriOffset: 0 };
export const SETTINGS_KEY = "prayer-settings-v1";

export function coordsFor(s: PrayerSettings) {
  if (s.city === "custom" && s.custom) return s.custom;
  const c = CITIES.find((x) => x.id === s.city) ?? CITIES[0]!;
  return { lat: c.lat, lng: c.lng };
}

export function timesFor(s: PrayerSettings, date = new Date()): Record<PrayerName, Date> {
  const { lat, lng } = coordsFor(s);
  const params = METHODS[s.method].make();
  params.madhab = s.hanafi ? Madhab.Hanafi : Madhab.Shafi;
  const p = new PrayerTimes(new Coordinates(lat, lng), date, params);
  return { fajr: p.fajr, sunrise: p.sunrise, dhuhr: p.dhuhr, asr: p.asr, maghrib: p.maghrib, isha: p.isha };
}

/** Next obligatory prayer (sunrise excluded) after `now`, rolling over to tomorrow's Fajr. */
export function nextPrayer(s: PrayerSettings, now = new Date()): { name: PrayerName; at: Date } {
  const today = timesFor(s, now);
  for (const n of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as PrayerName[]) if (today[n] > now) return { name: n, at: today[n] };
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  return { name: "fajr", at: timesFor(s, tomorrow).fajr };
}

export function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function formatDuration(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}

const HIJRI_MONTHS = ["Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani", "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qa'dah", "Dhu al-Hijjah"];

/** Hijri date via the device's Umm al-Qura calendar, shifted by a user offset in days. */
export function hijri(date = new Date(), offset = 0) {
  const d = new Date(date);
  d.setDate(d.getDate() + offset);
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", { day: "numeric", month: "numeric", year: "numeric" }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value.replace(/\D/g, ""));
  const day = get("day");
  const month = get("month");
  const year = get("year");
  return { day, month, year, monthName: HIJRI_MONTHS[month - 1] ?? "", label: `${day} ${HIJRI_MONTHS[month - 1] ?? ""} ${year} AH` };
}

/** Days until 1 Ramadan (0 when currently in Ramadan). */
export function daysUntilRamadan(date = new Date(), offset = 0) {
  for (let i = 0; i < 400; i++) {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    const h = hijri(d, offset);
    if (h.month === 9) return i;
  }
  return -1;
}
