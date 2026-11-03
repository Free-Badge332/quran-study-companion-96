import { useSyncExternalStore } from "react";
import { getValue, setValue } from "./offline-store";

// Durable device-only storage: native SQLite and web IndexedDB.
export type Bookmark = { chapterId: number; verseId: number; text: string; savedAt: number };
export type State = {
  lastRead?: { chapterId: number; verseId: number };
  read: Record<string, number[]>; // chapterId -> verse ids read
  minutes: Record<string, number>; // YYYY-MM-DD -> seconds read
  bookmarks: Bookmark[];
};

const KEY = "quran-progress-v1";
const EMPTY: State = { read: {}, minutes: {}, bookmarks: [] };
let state: State = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

let ready: Promise<void> | undefined;
let writes = Promise.resolve();
export function initializeProgress() {
  if (!ready) ready = getValue<State>(KEY).then(saved => {
    if (saved) state = { ...EMPTY, ...saved };
    loaded = true;
    subs.forEach(f => f());
  }).catch(error => { ready = undefined; throw error; });
  return ready;
}
function load() {
  if (loaded || typeof window === "undefined") return;
  void initializeProgress().catch(() => { window.dispatchEvent(new Event('quran-storage-error')); });
}
function retryAfterLoad(action: () => void) {
  void initializeProgress().then(action).catch(() => window.dispatchEvent(new Event('quran-storage-error')));
}
function set(next: State) {
  state = next;
  writes = writes.then(() => setValue(KEY, next)).catch(() => { window.dispatchEvent(new Event('quran-storage-error')); });
  subs.forEach(f => f());
}

export function useProgress() {
  return useSyncExternalStore(
    (cb) => {
      load();
      subs.add(cb);
      cb();
      return () => subs.delete(cb);
    },
    () => state,
    () => EMPTY,
  );
}

export function markVerseRead(chapterId: number, verseId: number) {
  if (!loaded) { retryAfterLoad(() => markVerseRead(chapterId, verseId)); return; }
  const list = state.read[chapterId] ?? [];
  if (list.includes(verseId)) { if (state.lastRead?.chapterId !== chapterId || state.lastRead?.verseId !== verseId) set({ ...state, lastRead: { chapterId, verseId } }); return; }
  set({ ...state, lastRead: { chapterId, verseId }, read: { ...state.read, [chapterId]: [...list, verseId] } });
}

export function today(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function addReadingSeconds(sec: number) {
  if (!loaded) { retryAfterLoad(() => addReadingSeconds(sec)); return; }
  const k = today();
  set({ ...state, minutes: { ...state.minutes, [k]: (state.minutes[k] ?? 0) + sec } });
}

export function isBookmarked(s: State, chapterId: number, verseId: number) {
  return s.bookmarks.some((b) => b.chapterId === chapterId && b.verseId === verseId);
}

export function toggleBookmark(chapterId: number, verseId: number, text: string) {
  if (!loaded) { retryAfterLoad(() => toggleBookmark(chapterId, verseId, text)); return; }
  const exists = isBookmarked(state, chapterId, verseId);
  set({
    ...state,
    bookmarks: exists
      ? state.bookmarks.filter((b) => !(b.chapterId === chapterId && b.verseId === verseId))
      : [{ chapterId, verseId, text, savedAt: Date.now() }, ...state.bookmarks],
  });
}

export function resetProgress() {
  if (!loaded) { retryAfterLoad(resetProgress); return; }
  set({ ...state, read: {}, minutes: {} });
}
