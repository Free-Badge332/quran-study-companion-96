import { useSyncExternalStore } from "react";
import { getValue, loadBundledJson, setValue } from "./offline-store";

export type Grade = { grade: string; by: string };
export type Hadith = { n: number; an?: number | null; ar: string; en: string; book: number; inBook: number; grades: Grade[] };
export type BookMeta = { id: number; name: string; count: number; first: number; last: number };
export type Collection = { id: string; name: string; total: number; books: BookMeta[] };
export type Catalog = { source: string; commit: string; url: string; collections: Collection[] };

export const loadCatalog = () => loadBundledJson<Catalog>("/hadith/collections.json");
export const loadBook = (collection: string, book: number) => loadBundledJson<Hadith[]>(`/hadith/${collection}/${book}.json`);

export async function getCollection(id: string) {
  const c = (await loadCatalog()).collections.find((x) => x.id === id);
  if (!c) throw new Error("Unknown collection");
  return c;
}

export async function findHadith(collection: string, n: number): Promise<{ hadith: Hadith; collection: Collection; book: BookMeta } | null> {
  const c = await getCollection(collection);
  for (const b of c.books) {
    if (n < Math.min(b.first, b.last) || n > Math.max(b.first, b.last)) continue;
    const hadith = (await loadBook(collection, b.id)).find((h) => h.n === n);
    if (hadith) return { hadith, collection: c, book: b };
  }
  // Numbering is not always monotonic between books; fall back to a full scan.
  for (const b of c.books) {
    const hadith = (await loadBook(collection, b.id)).find((h) => h.n === n);
    if (hadith) return { hadith, collection: c, book: b };
  }
  return null;
}

const stripDiacritics = (s: string) => s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
export function matchesQuery(h: Hadith, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return false;
  return h.en.toLowerCase().includes(s) || stripDiacritics(h.ar).includes(stripDiacritics(s));
}

export async function searchCollection(collection: string, q: string, limit = 50) {
  const c = await getCollection(collection);
  const results: Hadith[] = [];
  for (const b of c.books) {
    for (const h of await loadBook(collection, b.id)) {
      if (matchesQuery(h, q)) results.push(h);
      if (results.length >= limit) return results;
    }
  }
  return results;
}

/** Same pick on every device for a given calendar day: short hadith with both Arabic and English text. */
export function dayIndex(date: Date) {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
}
export function pickDaily(catalog: Catalog, d: number) {
  const c = catalog.collections[d % catalog.collections.length]!;
  const books = c.books.filter((b) => b.id !== 0);
  return { collection: c, book: books[(d * 7) % books.length]! };
}
export function chooseFromBook(items: Hadith[], d: number) {
  const short = items.filter((h) => h.ar && h.en.length >= 60 && h.en.length <= 450);
  const pool = short.length ? short : items.filter((h) => h.ar && h.en);
  return pool[d % pool.length] ?? items[0]!;
}
export async function dailyHadith(date = new Date()) {
  const d = dayIndex(date);
  const { collection, book } = pickDaily(await loadCatalog(), d);
  return { collection, book, hadith: chooseFromBook(await loadBook(collection.id, book.id), d) };
}

// Favorites: stored in the existing device user store under their own key.
export type Favorite = { collection: string; n: number; ar: string; en: string; savedAt: number };
const KEY = "hadith-favorites-v1";
let favorites: Favorite[] = [];
let ready: Promise<void> | undefined;
let writes = Promise.resolve();
const subs = new Set<() => void>();
const EMPTY: Favorite[] = [];

export function initializeFavorites() {
  if (!ready) ready = getValue<Favorite[]>(KEY).then((saved) => {
    if (Array.isArray(saved)) favorites = saved;
    subs.forEach((f) => f());
  }).catch((e) => { ready = undefined; throw e; });
  return ready;
}
export function useHadithFavorites() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      void initializeFavorites().catch(() => window.dispatchEvent(new Event("quran-storage-error")));
      return () => subs.delete(f);
    },
    () => favorites,
    () => EMPTY,
  );
}
export const isFavorite = (list: Favorite[], collection: string, n: number) => list.some((f) => f.collection === collection && f.n === n);
export async function toggleFavorite(collection: string, h: Hadith) {
  await initializeFavorites();
  favorites = isFavorite(favorites, collection, h.n)
    ? favorites.filter((f) => !(f.collection === collection && f.n === h.n))
    : [{ collection, n: h.n, ar: h.ar.slice(0, 400), en: h.en.slice(0, 400), savedAt: Date.now() }, ...favorites];
  const snapshot = favorites;
  subs.forEach((f) => f());
  writes = writes.then(() => setValue(KEY, snapshot)).catch(() => { window.dispatchEvent(new Event("quran-storage-error")); });
  return writes;
}
