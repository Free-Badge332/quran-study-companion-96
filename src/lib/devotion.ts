import { useCallback, useEffect, useState } from "react";
import { getValue, setValue } from "./offline-store";

// Small device-stored values (azkar counters, fasting tracker, prayer settings).
// Each key keeps its own record in the existing user store; writes are serialized per key.
const cache = new Map<string, unknown>();
const subs = new Map<string, Set<() => void>>();
let writes = Promise.resolve();

export function useStored<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setLocal] = useState<T>(() => (cache.has(key) ? (cache.get(key) as T) : initial));
  const [ready, setReady] = useState(cache.has(key));
  useEffect(() => {
    let alive = true;
    const listener = () => alive && setLocal((cache.get(key) as T) ?? initial);
    if (!subs.has(key)) subs.set(key, new Set());
    subs.get(key)!.add(listener);
    if (!cache.has(key)) {
      getValue<T>(key)
        .then((v) => {
          if (!cache.has(key)) cache.set(key, v ?? initial);
          subs.get(key)?.forEach((f) => f());
        })
        .catch(() => {})
        .finally(() => alive && setReady(true));
    } else {
      setLocal(cache.get(key) as T);
      setReady(true);
    }
    return () => {
      alive = false;
      subs.get(key)?.delete(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = (cache.has(key) ? cache.get(key) : initial) as T;
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      cache.set(key, v);
      subs.get(key)?.forEach((f) => f());
      writes = writes.then(() => setValue(key, v)).catch(() => {});
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set, ready];
}

export function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Counters reset each local day. */
export const azkarKey = (category: string, d = new Date()) => `azkar-${category}-${localDateKey(d)}`;

/** Advance a counter without exceeding its target. */
export function stepCount(current: number, target: number) {
  return Math.min(target, current + 1);
}
