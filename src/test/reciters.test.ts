import { describe, expect, it } from 'vitest';
import { FEATURED_IDS, RECITERS, downloadedSurahs, recentDownloads, searchReciters } from '@/lib/reciters';
describe('Reciter library', () => {
  it('includes the full catalogue, featured Sudanese reciters first, with no category tabs', () => {
    expect(RECITERS.length).toBeGreaterThan(150);
    expect(FEATURED_IDS).toEqual(['noreen-siddiq', 'alzain-ahmad']);
    for (const r of RECITERS) expect(r.sourceUrl).toMatch(/^https:\/\/(everyayah\.com|([a-z0-9]+\.)?mp3quran\.net)\//);
    expect(new Set(RECITERS.map(r => r.id)).size).toBe(RECITERS.length);
  });
  it('never shows an unverified biography', () => { expect(RECITERS.every(r => r.bio === null || r.bio.citation.length > 0)).toBe(true); });
  it('searches by English or Arabic name and by category', () => {
    expect(searchReciters(RECITERS, 'noreen', 'all').map(r => r.id)).toEqual(['noreen-siddiq']);
    expect(searchReciters(RECITERS, '', 'favorites', ['alzain-ahmad']).map(r => r.id)).toEqual(['alzain-ahmad']);
    expect(searchReciters(RECITERS, 'نورين', 'all').map(r => r.id)).toEqual(['noreen-siddiq']);
  });
  it('groups only finished downloads by surah and reciter', () => {
    const g = downloadedSurahs([
      { reader: 'A', chapter: 112, status: 'downloaded', bytes: 100 },
      { reader: 'A', chapter: 112, status: 'downloaded', bytes: 50 },
      { reader: 'A', chapter: 1, status: 'queued', bytes: 0 },
    ]);
    expect(g).toEqual([{ reader: 'A', chapter: 112, count: 2, bytes: 150, whole: false, latest: 0 }]);
  });
  it('home shows only the 5 most recent downloads', () => {
    const rows = Array.from({ length: 7 }, (_, i) => ({ reader: 'R', chapter: i + 1, verse: 0, status: 'downloaded', bytes: 1, updated_at: i }));
    expect(recentDownloads(rows).map(d => d.chapter)).toEqual([7, 6, 5, 4, 3]);
    expect(recentDownloads(rows.slice(0, 2)).length).toBe(2);
  });
});
