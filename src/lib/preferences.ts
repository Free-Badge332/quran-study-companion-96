import { useEffect, useState } from 'react';
import { getValue, setValue } from './offline-store';
export function usePreference<T>(key: string, fallback: T) {
  const [value, setState] = useState(fallback);
  useEffect(() => { let active = true; void getValue<T>(`preference:${key}`).then(saved => { if (active && saved !== undefined) setState(saved); }).catch(() => {}); return () => { active = false; }; }, [key]);
  const set = (next: T) => { setState(next); void setValue(`preference:${key}`, next).catch(() => window.dispatchEvent(new Event('quran-storage-error'))); };
  return [value, set] as const;
}
