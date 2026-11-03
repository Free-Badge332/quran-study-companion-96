import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Check, ChevronRight } from "lucide-react";
import { CHAPTER_LIST } from "@/lib/quran";
import { initializeAudio, refreshDownloads, useOfflineAudio } from "@/lib/offline-audio";
import { isFullSurah, recentDownloads, reciterById } from "@/lib/reciters";

export function DownloadedQuran() {
  const { records } = useOfflineAudio();
  useEffect(() => { void initializeAudio().catch(() => {}); void refreshDownloads().catch(() => {}); }, []);
  const items = recentDownloads(records, 5);
  // Hidden until something is saved; the home screen then also shows the Reciters entry.
  if (items.length === 0) return null;
  return (
    <section className="mt-8" aria-labelledby="downloaded-quran">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="downloaded-quran" className="font-display text-2xl text-foreground">Recent downloads</h2>
        <Link to="/downloads" className="flex min-h-11 items-center gap-1 text-sm text-primary">See all <ChevronRight size={16} /></Link>
      </div>
      {
        <ul className="flex gap-3 overflow-x-auto pb-2">
          {items.map((d) => {
            const meta = CHAPTER_LIST.find((c) => c.id === d.chapter);
            const full = !!meta && isFullSurah(d, meta.totalVerses);
            return (
              <li key={`${d.reader}/${d.chapter}`} className="shrink-0">
                <Link to="/chapter/$id" params={{ id: String(d.chapter) }} search={{ source: "downloaded", reciter: d.reader }} className="flex w-44 flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-soft hover:border-primary">
                  <span className="font-arabic text-xl text-primary">{meta?.name.ar}</span>
                  <span className="truncate font-semibold text-foreground">{d.chapter}. {meta?.transliterationName}</span>
                  <span className="truncate text-xs text-muted-foreground">{reciterById(d.reader)?.name ?? d.reader}</span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">{full && <Check size={12} className="text-primary" />}{full ? "Full surah" : `${d.count}/${meta?.totalVerses} ayahs`} · {(d.bytes / 1048576).toFixed(1)} MB</span>
                </Link>
              </li>
            );
          })}
        </ul>
      }
    </section>
  );
}
