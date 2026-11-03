import CHAPTERS from "@/data/chapters-list.json";

export const VERSE_AUDIO_API_URL = "https://everyayah.com/data";

export const LANGUAGES = [
  { id: "en", label: "English" },
  { id: "am", label: "አማርኛ" },
  { id: "om", label: "Afaan Oromoo" },
  { id: "fr", label: "Français" },
  { id: "tr", label: "Türkçe" },
  { id: "ru", label: "Русский" },
  { id: "ar", label: "العربية" },
] as const;
export type Lang = (typeof LANGUAGES)[number]["id"];

export const READERS = [
  { id: "Abdul_Basit_Mujawwad_128kbps", name: "Abdul Basit" },
  { id: "Yasser_Ad-Dussary_128kbps", name: "Yasser Ad-Dussary" },
  { id: "Alafasy_128kbps", name: "Mishary Alafasy" },
];

export type ChapterListItem = (typeof CHAPTERS)[number];
export const CHAPTER_LIST = CHAPTERS;

export type Verse = { id: number; text: string; translation?: string | undefined; transliteration: string };
export type Chapter = {
  id: number;
  name: string;
  transliteration: string;
  translation?: string | undefined;
  type: string;
  total_verses: number;
  verses: Verse[];
};

export async function fetchChapter(id: string, lang: Lang): Promise<Chapter> {
  const { loadLocalChapter } = await import('./offline-store');
  return loadLocalChapter(Number(id), lang);
}

export function audioUrl(readerId: string, chapterId: number, verseId: number) {
  const f = `${String(chapterId).padStart(3, "0")}${String(verseId).padStart(3, "0")}`;
  return `${VERSE_AUDIO_API_URL}/${readerId}/${f}.mp3`;
}

export function toArabicNumber(n: number) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d] ?? d);
}

export function stripTashkeel(s: string) {
  return s.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "");
}
