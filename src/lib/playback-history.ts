/** Favourite reciters and recently played recitations (saved on the device). */
export type RecentPlay = { reader: string; chapter: number; verse: number; at: number };
export const MAX_RECENT = 10;

/** Newest first; one entry per reciter + surah, keeping the latest verse. */
export function addRecent(list: RecentPlay[], item: RecentPlay, max = MAX_RECENT): RecentPlay[] {
  const rest = list.filter((r) => !(r.reader === item.reader && r.chapter === item.chapter));
  return [item, ...rest].slice(0, max);
}

export function toggleFavorite(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** Favourites first, original order kept within each group. */
export function sortReciters<T extends { id: string }>(readers: readonly T[], favorites: string[]): T[] {
  return [...readers].sort((a, b) => Number(favorites.includes(b.id)) - Number(favorites.includes(a.id)));
}
