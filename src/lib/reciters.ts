import { audioUrl, READERS } from "./quran";
import MP3QURAN_LIST from "@/data/mp3quran-reciters.json";

export type ReciterCategory = "ethiopian" | "sudanese" | "international";
/** ayah = one file per verse (verse-by-verse sync); surah = one file per whole surah. */
export type ReciterKind = "ayah" | "surah";
export type Reciter = {
  id: string;
  name: string;
  arabicName: string;
  category: ReciterCategory;
  country: string;
  kind: ReciterKind;
  style: string;
  riwayah: string;
  /** A'udhu billah recording, only for reciters who recorded one (verse-by-verse sources). */
  istiadhaUrl?: string;
  quality: string;
  source: string;
  sourceUrl: string;
  /** Full-surah file base URL (surah reciters only). */
  server?: string;
  /** Verified biography with citation; null until verified. */
  bio: { text: string; citation: string; url: string } | null;
  licensing: string;
};

export const CATEGORY_LABEL: Record<ReciterCategory, string> = { ethiopian: "Ethiopian", sudanese: "Sudanese", international: "International" };

const EVERYAYAH = "EveryAyah.com (ayah-by-ayah files, VerseByVerseQuran.com)";
const EVERYAYAH_LICENCE = "Streamed and saved on your own device from the public source for personal listening. The app does not bundle or redistribute these files. A redistribution licence has not been confirmed.";
const MP3QURAN = "MP3Quran.net (official public API)";
const MP3QURAN_LICENCE = "Served from MP3Quran.net's public developer API and saved on your own device for personal listening. The app does not bundle or redistribute these files. Written redistribution terms have not been confirmed.";

/** Published reciters: identity and recordings checked against the live source. */
export const RECITERS: Reciter[] = [
  { id: "noreen-siddiq", name: "Sheikh Noreen Muhammad Siddiq", arabicName: "نورين محمد صديق", category: "sudanese", country: "Sudan", kind: "surah", style: "Murattal", riwayah: "Al-Duri an Abi Amr", quality: "MP3, whole surahs (114)", source: MP3QURAN, sourceUrl: "https://mp3quran.net/eng/noreen", server: "https://cdn.mp3quran.net/audio/noreen-siddiq/r1/",
    bio: { text: "Sudanese imam (1982–2020) from North Kordofan, known for his recitation; he led prayers at mosques in Khartoum and died in a car accident in November 2020.", citation: "Wikipedia; BBC News, 9 Feb 2021", url: "https://en.wikipedia.org/wiki/Noreen_Muhammad_Siddiq" }, licensing: MP3QURAN_LICENCE },
  { id: "alzain-ahmad", name: "Sheikh Alzain Mohamed Ahmed", arabicName: "الزين محمد أحمد", category: "sudanese", country: "Sudan", kind: "surah", style: "Murattal", riwayah: "Hafs an Asim", quality: "MP3, whole surahs (114)", source: MP3QURAN, sourceUrl: "https://mp3quran.net/eng/zain", server: "https://cdn.mp3quran.net/audio/zain-ahmad/r1/", bio: null, licensing: MP3QURAN_LICENCE },
  { id: "Abdul_Basit_Mujawwad_128kbps", name: "Abdul Basit Abdus-Samad", arabicName: "عبد الباسط عبد الصمد", category: "international", country: "Egypt", kind: "ayah", style: "Mujawwad", riwayah: "Hafs an Asim", quality: "128 kbps MP3", source: EVERYAYAH, sourceUrl: "https://everyayah.com/data/Abdul_Basit_Mujawwad_128kbps/", bio: null, licensing: EVERYAYAH_LICENCE },
  { id: "Yasser_Ad-Dussary_128kbps", name: "Yasser Ad-Dussary", arabicName: "ياسر الدوسري", category: "international", country: "Saudi Arabia", kind: "ayah", style: "Murattal", riwayah: "Hafs an Asim", quality: "128 kbps MP3", source: EVERYAYAH, sourceUrl: "https://everyayah.com/data/Yasser_Ad-Dussary_128kbps/", bio: null, licensing: EVERYAYAH_LICENCE },
  { id: "Alafasy_128kbps", istiadhaUrl: "https://everyayah.com/data/Alafasy_128kbps/audhubillah.mp3", name: "Mishary Rashid Alafasy", arabicName: "مشاري راشد العفاسي", category: "international", country: "Kuwait", kind: "ayah", style: "Murattal", riwayah: "Hafs an Asim", quality: "128 kbps MP3", source: EVERYAYAH, sourceUrl: "https://everyayah.com/data/Alafasy_128kbps/", bio: null, licensing: EVERYAYAH_LICENCE },
];

/** Every reciter on MP3Quran.net with a complete 114-surah recording (snapshot bundled for offline browsing). */
for (const m of MP3QURAN_LIST as { id: string; name: string; arabicName: string; moshaf: string; server: string }[]) {
  const [riwayah, style] = m.moshaf.split(" - ").map((x) => x.trim());
  RECITERS.push({ id: m.id, name: m.name, arabicName: m.arabicName, category: "international", country: "", kind: "surah", style: style || "Murattal", riwayah: riwayah || m.moshaf, quality: "MP3, whole surahs (114)", source: MP3QURAN, sourceUrl: m.server, server: m.server, bio: null, licensing: MP3QURAN_LICENCE });
}
/** Reciters highlighted at the top of the list. */
export const FEATURED_IDS = ["noreen-siddiq", "alzain-ahmad"];
export const isFullSurah = (d: { whole: boolean; count: number }, totalVerses: number) => d.whole || d.count >= totalVerses;

// Verse-by-verse reciters must be playable by the existing per-ayah engine.
if (RECITERS.some((r) => r.kind === "ayah" && !READERS.some((p) => p.id === r.id))) throw new Error("Reciter catalog out of sync");

export const reciterById = (id: string) => RECITERS.find((r) => r.id === id);
export const isSurahReciter = (id: string) => reciterById(id)?.kind === "surah";
/** Verse 0 means the whole-surah recording. */
export const WHOLE_SURAH = 0;

export function recordingUrl(reader: string, chapter: number, verse: number) {
  const r = reciterById(reader);
  if (r?.kind === "surah" && r.server) return `${r.server}${String(chapter).padStart(3, "0")}.mp3`;
  return audioUrl(reader, chapter, verse);
}

export function searchReciters(list: Reciter[], query: string, category: ReciterCategory | "all" | "favorites", favorites: string[] = []) {
  const q = query.trim().toLowerCase();
  return list.filter((r) => (category === "all" || (category === "favorites" ? favorites.includes(r.id) : r.category === category)) && (!q || `${r.name} ${r.arabicName} ${r.style} ${r.riwayah} ${r.country}`.toLowerCase().includes(q)));
}

export type DownloadedSurah = { reader: string; chapter: number; count: number; bytes: number; whole: boolean; latest: number };
/** Group finished downloads into surah/reciter entries. */
export function downloadedSurahs(records: { reader: string; chapter: number; verse?: number; status: string; bytes: number; updated_at?: number }[]): DownloadedSurah[] {
  const map = new Map<string, DownloadedSurah>();
  for (const r of records) {
    if (r.status !== "downloaded") continue;
    const k = `${r.reader}/${r.chapter}`;
    const e = map.get(k) ?? { reader: r.reader, chapter: r.chapter, count: 0, bytes: 0, whole: false, latest: 0 };
    e.count++; e.bytes += r.bytes; if (r.verse === WHOLE_SURAH) e.whole = true; e.latest = Math.max(e.latest, r.updated_at ?? 0);
    map.set(k, e);
  }
  return [...map.values()].sort((a, b) => a.chapter - b.chapter);
}
/** Most recently downloaded surahs first, capped for the home screen. */
export function recentDownloads(records: Parameters<typeof downloadedSurahs>[0], limit = 5) {
  return downloadedSurahs(records).sort((a, b) => b.latest - a.latest).slice(0, limit);
}
