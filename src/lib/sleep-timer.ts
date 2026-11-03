/**
 * Sleep timer for the recitation player.
 *
 * Time is tracked against the wall clock (an absolute deadline), never by
 * counting ticks, so it stays correct when the screen is locked or the app is
 * minimised and JavaScript timers are throttled. The player calls `check()`
 * from audio `timeupdate` events (which keep firing during background
 * playback) and one low-cost timeout covers the deadline itself.
 */
import { useSyncExternalStore } from 'react';

export const SLEEP_PRESETS = [5, 10, 15, 30, 45, 60] as const;
export const FADE_MS = 15_000;
export const MAX_CUSTOM_MINUTES = 600;

export type SleepState =
  | { mode: 'off' }
  | { mode: 'duration'; totalMs: number; endsAt: number | null; remainingMs: number; paused: boolean }
  | { mode: 'surah'; chapter: number | null };

export function startDuration(minutes: number, now: number): SleepState {
  const m = clampMinutes(minutes);
  return { mode: 'duration', totalMs: m * 60_000, endsAt: now + m * 60_000, remainingMs: m * 60_000, paused: false };
}

export function clampMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return 1;
  return Math.min(MAX_CUSTOM_MINUTES, Math.max(1, Math.round(minutes)));
}

export function remainingMs(s: SleepState, now: number): number {
  if (s.mode !== 'duration') return 0;
  if (s.paused || s.endsAt === null) return s.remainingMs;
  return Math.max(0, s.endsAt - now);
}

export function pauseState(s: SleepState, now: number): SleepState {
  if (s.mode !== 'duration' || s.paused) return s;
  return { ...s, paused: true, endsAt: null, remainingMs: remainingMs(s, now) };
}

export function resumeState(s: SleepState, now: number): SleepState {
  if (s.mode !== 'duration' || !s.paused) return s;
  return { ...s, paused: false, endsAt: now + s.remainingMs };
}

export function resetState(s: SleepState, now: number): SleepState {
  if (s.mode !== 'duration') return s;
  return { ...s, paused: false, endsAt: now + s.totalMs, remainingMs: s.totalMs };
}

export function isExpired(s: SleepState, now: number): boolean {
  return s.mode === 'duration' && !s.paused && remainingMs(s, now) <= 0;
}

/** Volume multiplier (1 → 0) over the last FADE_MS before expiry. */
export function fadeFactor(s: SleepState, now: number, fadeMs = FADE_MS): number {
  if (s.mode !== 'duration') return 1;
  const r = remainingMs(s, now);
  if (r >= fadeMs) return 1;
  return Math.max(0, r / fadeMs);
}

/** End-of-surah mode stops after the last verse of the chapter it was set on. */
export function stopsAtSurahEnd(s: SleepState, chapter: number): boolean {
  return s.mode === 'surah' && (s.chapter === null || s.chapter === chapter);
}

export function formatRemaining(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = total % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

// ---- Shared store -------------------------------------------------------

let state: SleepState = { mode: 'off' };
let autoPaused = false;
let deadline: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();
const expireListeners = new Set<() => void>();

function emit() { listeners.forEach((fn) => fn()); }
function schedule() {
  if (deadline) clearTimeout(deadline);
  deadline = undefined;
  if (state.mode === 'duration' && !state.paused) {
    deadline = setTimeout(() => sleepTimer.check(), Math.max(0, remainingMs(state, Date.now())) + 50);
  }
}
function set(next: SleepState) { state = next; schedule(); emit(); }

export const sleepTimer = {
  get: () => state,
  subscribe(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; },
  onExpire(cb: () => void) { expireListeners.add(cb); return () => { expireListeners.delete(cb); }; },
  start(minutes: number) { autoPaused = false; set(startDuration(minutes, Date.now())); },
  endOfSurah(chapter: number | null) { autoPaused = false; set({ mode: 'surah', chapter }); },
  cancel() { autoPaused = false; set({ mode: 'off' }); },
  reset() { set(resetState(state, Date.now())); },
  pause() { autoPaused = false; set(pauseState(state, Date.now())); },
  resume() { autoPaused = false; set(resumeState(state, Date.now())); },
  /** Playback paused: freeze the countdown so it never runs during silence. */
  playbackPaused() { if (state.mode === 'duration' && !state.paused) { autoPaused = true; set(pauseState(state, Date.now())); } },
  playbackResumed() { if (autoPaused) { autoPaused = false; set(resumeState(state, Date.now())); } },
  /** Returns the volume multiplier; fires expiry when the deadline passes. */
  check(now = Date.now()): number {
    if (isExpired(state, now)) { set({ mode: 'off' }); expireListeners.forEach((fn) => fn()); return 0; }
    return fadeFactor(state, now);
  },
  /** Called by the player when a surah's last verse finished. Returns true to stop. */
  surahEnded(chapter: number): boolean {
    if (!stopsAtSurahEnd(state, chapter)) return false;
    set({ mode: 'off' });
    expireListeners.forEach((fn) => fn());
    return true;
  },
};

export function useSleepTimer() {
  return useSyncExternalStore(sleepTimer.subscribe, sleepTimer.get, sleepTimer.get);
}
