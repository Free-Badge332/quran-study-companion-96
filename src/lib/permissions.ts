import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { getValue, setValue } from './offline-store';

/**
 * Permissions the app actually uses. Only prayer times can use location
 * (optional: a city can be chosen by hand). The app sends no notifications,
 * and recitations are saved in app-private storage, which needs no permission.
 */
export type LocationState = 'granted' | 'prompt' | 'denied' | 'unsupported';

export function toLocationState(raw: string | undefined, hasGeolocation: boolean): LocationState {
  if (!hasGeolocation) return 'unsupported';
  if (raw === 'granted' || raw === 'denied') return raw;
  return 'prompt';
}

export async function readLocationState(): Promise<LocationState> {
  if (typeof navigator === 'undefined') return 'unsupported';
  const has = 'geolocation' in navigator;
  try {
    const status = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
    return toLocationState(status?.state, has);
  } catch {
    return toLocationState(undefined, has);
  }
}

/** Live location permission state; rechecked when the user returns from Android Settings. */
export function useLocationPermission() {
  const [state, setState] = useState<LocationState | null>(null);
  useEffect(() => {
    let alive = true;
    const check = () => void readLocationState().then((s) => { if (alive) setState(s); });
    check();
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', check);
    let remove: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void import('@capacitor/app').then(({ App }) => App.addListener('resume', check).then((h) => { remove = () => void h.remove(); }));
    }
    return () => { alive = false; document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', check); remove?.(); };
  }, []);
  return [state, () => void readLocationState().then(setState)] as const;
}

/** Onboarding completion is stored on its own; it says nothing about granted permissions. */
export const ONBOARDING_KEY = 'preference:onboarding-done';
export const SHOW_ONBOARDING_EVENT = 'show-onboarding';

export function needsOnboarding(saved: unknown): boolean {
  return saved !== true;
}

export async function loadOnboardingDone(): Promise<boolean> {
  try { return (await getValue<boolean>(ONBOARDING_KEY)) === true; } catch { return false; }
}

export async function saveOnboardingDone(): Promise<void> {
  await setValue(ONBOARDING_KEY, true).catch(() => window.dispatchEvent(new Event('quran-storage-error')));
}

/** Onboarding resumes at the step the user last reached. */
export const ONBOARDING_STEP_KEY = 'preference:onboarding-step';
export function resumeStep(saved: unknown, total: number): number {
  return typeof saved === 'number' && Number.isInteger(saved) && saved >= 0 && saved < total ? saved : 0;
}
export async function loadOnboardingStep(total: number): Promise<number> {
  try { return resumeStep(await getValue<number>(ONBOARDING_STEP_KEY), total); } catch { return 0; }
}
export function saveOnboardingStep(step: number): void {
  void setValue(ONBOARDING_STEP_KEY, step).catch(() => {});
}
