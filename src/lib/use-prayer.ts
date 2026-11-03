import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, SETTINGS_KEY, type PrayerSettings } from "./prayer";
import { useStored } from "./devotion";

export function usePrayerSettings() {
  return useStored<PrayerSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}

/** Current time, set only after mount (avoids hydration mismatch) and refreshed every 30s. */
export function useNow() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  return now;
}
