import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { CHAPTER_LIST, fetchChapter, toArabicNumber } from "@/lib/quran";
import { useLang } from "@/lib/lang";

function pickForToday() {
  const day = Math.floor(Date.now() / 86400000);
  const total = CHAPTER_LIST.reduce((n, c) => n + c.totalVerses, 0);
  let idx = (day * 2654435761) % total;
  for (const c of CHAPTER_LIST) {
    if (idx < c.totalVerses) return { chapter: c.id, verse: idx + 1 };
    idx -= c.totalVerses;
  }
  return { chapter: 1, verse: 1 };
}

export function DailyVerse() {
  const { lang, t } = useLang();
  const [pick, setPick] = useState<{ chapter: number; verse: number } | null>(null);
  useEffect(() => setPick(pickForToday()), []);
  const q = useQuery({
    queryKey: ["chapter", String(pick?.chapter), lang],
    queryFn: () => { if (!pick) throw new Error("No verse selected"); return fetchChapter(String(pick.chapter), lang); },
    staleTime: Infinity, gcTime: 60000,
    enabled: !!pick,
  });
  if (!pick) return null;
  const v = q.data?.verses.find((x) => x.id === pick.verse);
  const meta = CHAPTER_LIST.find((c) => c.id === pick.chapter);
  if (!meta) return null;

  return (
    <Link
      to="/chapter/$id"
      params={{ id: String(pick.chapter) }}
      hash={`v-${pick.verse}`}
      className="relative mx-auto mb-10 block max-w-3xl overflow-hidden rounded-2xl border border-border bg-card p-8 text-center shadow-soft transition hover:border-primary"
    >
      <img src="/imgs/islamic-decorations.svg" alt="" className="pointer-events-none absolute -left-10 -top-10 h-32 opacity-20" />
      <img src="/imgs/islamic-decorations.svg" alt="" className="pointer-events-none absolute -bottom-10 -right-10 h-32 opacity-20" />
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-primary">{t("verseOfDay")}</p>
      {v ? (
        <>
          <p dir="rtl" className="font-arabic text-3xl leading-loose text-foreground">
            {v.text} <span className="text-primary">{toArabicNumber(v.id)}</span>
          </p>
          {v.translation && <p className="mt-4 text-muted-foreground">{v.translation}</p>}
        </>
      ) : (
        <div className="mx-auto h-20 max-w-xl animate-pulse rounded-lg bg-muted" />
      )}
      <p className="mt-4 text-sm font-medium text-primary">
        {meta.transliterationName} ({pick.verse})
      </p>
    </Link>
  );
}
