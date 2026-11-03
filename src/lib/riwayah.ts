/** Riwayah (narration) text bundled from KFGQPC data by scripts/prepare-riwayat.py. */
export type RiwayahKey = "hafs" | "duri" | "warsh" | "qalun" | "bazzi";
export type RiwayahVerse = { id: number; text: string };

export const RIWAYAH_LABEL: Record<RiwayahKey, string> = {
  hafs: "Hafs an Asim",
  duri: "Al-Duri an Abi Amr",
  warsh: "Warsh an Nafi",
  qalun: "Qalun an Nafi",
  bazzi: "Al-Bazzi an Ibn Kathir",
};

/** Map a reciter's riwayah label to a bundled text, or null when no text is bundled for it. */
export function riwayahKey(label: string): RiwayahKey | null {
  const s = label.toLowerCase();
  if (s.includes("hafs")) return "hafs";
  if ((s.includes("duri") || s.includes("dori")) && s.includes("amr")) return "duri";
  if (s.includes("warsh")) return "warsh";
  if (s.includes("qalon") || s.includes("qalun") || s.includes("qaloon")) return "qalun";
  if (s.includes("bizi") || s.includes("bazzi")) return "bazzi";
  return null;
}

export async function fetchRiwayahChapter(key: Exclude<RiwayahKey, "hafs">, chapter: number): Promise<RiwayahVerse[]> {
  const res = await fetch(`/quran/riwayat/${key}/${chapter}.json`);
  if (!res.ok) throw new Error("Riwayah text unavailable");
  return res.json() as Promise<RiwayahVerse[]>;
}

/** Reduce Uthmani text to its bare letters so only wording (not vowel marks) is compared. */
export function bareLetters(text: string): string {
  return text
    .normalize("NFC")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u08D3-\u08FF]/g, "")
    .replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, "\u0627")
    .replace(/\u0649/g, "\u064A")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Mark which words of `other` have no counterpart in `hafs` across a whole surah, so differing
 * verse numbering between riwayat does not matter. Greedy walk that resyncs within a short window.
 */
export function markSurahDifferences(other: RiwayahVerse[], hafs: string[]): { id: number; words: { word: string; differs: boolean }[] }[] {
  const b = hafs.flatMap((t) => t.split(/\s+/).filter(Boolean)).map(bareLetters);
  const flat = other.flatMap((v) => v.text.split(/\s+/).filter(Boolean).map((word) => ({ id: v.id, word, bare: bareLetters(word), differs: false })));
  const W = 8;
  let j = 0;
  for (let i = 0; i < flat.length; i++) {
    if (flat[i]!.bare === b[j]) { j++; continue; }
    let best: [number, number] | null = null;
    for (let di = 0; di <= W && !best; di++)
      for (let dj = 0; dj <= W; dj++) {
        if (di + dj === 0) continue;
        const x = flat[i + di], y = b[j + dj];
        if (x && y !== undefined && x.bare === y && flat[i + di + 1]?.bare === b[j + dj + 1]) { best = [di, dj]; break; }
      }
    if (!best) { flat[i]!.differs = true; j++; continue; }
    for (let k = 0; k < best[0]; k++) flat[i + k]!.differs = true;
    i += best[0]; j += best[1] + 1;
  }
  return other.map((v) => ({ id: v.id, words: flat.filter((w) => w.id === v.id).map(({ word, differs }) => ({ word, differs })) }));
}
