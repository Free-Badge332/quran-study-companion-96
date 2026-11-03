import { createFileRoute, Link } from "@tanstack/react-router";
import { CHAPTER_LIST } from "@/lib/quran";
import { useLang } from "@/lib/lang";
import { resetProgress, today, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/statistics")({
  head: () => ({
    meta: [
      { title: "Reading statistics — My Quran" },
      { name: "description", content: "Track your Quran reading progress across surahs and verses." },
      { property: "og:title", content: "Reading statistics — My Quran" },
      { property: "og:description", content: "Track your Quran reading progress across surahs and verses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StatsPage,
});

const TOTAL_VERSES = 6236;

function StatsPage() {
  const { read, minutes, bookmarks } = useProgress();
  const { lang, t } = useLang();
  const versesRead = Object.values(read).reduce((n, l) => n + l.length, 0);
  const rows = CHAPTER_LIST.map((c) => ({ c, done: read[c.id]?.length ?? 0 }));
  const completed = rows.filter((r) => r.done >= r.c.totalVerses).length;
  const started = rows.filter((r) => r.done > 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const k = today(d);
    return { label: d.toLocaleDateString(lang, { weekday: "short" }), min: Math.round((minutes[k] ?? 0) / 60) };
  });
  const maxMin = Math.max(1, ...days.map((d) => d.min));

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24">
      <h1 className="py-8 text-center font-display text-4xl text-foreground">{t("progressTitle")}</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("versesRead")} value={`${versesRead}`} sub={`${t("of")} ${TOTAL_VERSES} · ${((versesRead / TOTAL_VERSES) * 100).toFixed(1)}%`} />
        <Stat label={t("surahsCompleted")} value={`${completed}`} sub={`${t("of")} 114`} />
        <Stat label={t("surahsStarted")} value={`${started.length}`} sub={t("inProgressOrDone")} />
        <Stat label={t("today")} value={`${days[6]!.min} ${t("min")}`} sub={`${bookmarks.length} ${t("bookmarksCount")}`} />
      </div>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-4 font-semibold text-foreground">{t("last7")}</h2>
        <div className="flex h-32 items-end gap-2">
          {days.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs text-muted-foreground">{d.min}</span>
              <div className="w-full rounded-t-md bg-primary" style={{ height: `${(d.min / maxMin) * 90}px`, minHeight: 2 }} />
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-5 shadow-soft">
        <h2 className="mb-4 font-semibold text-foreground">{t("surahProgress")}</h2>
        {started.length === 0 && <p className="text-sm text-muted-foreground">{t("progressEmpty")}</p>}
        <div className="flex flex-col gap-3">
          {started.map(({ c, done }) => {
            const pct = Math.min(100, (done / c.totalVerses) * 100);
            return (
              <Link key={c.id} to="/chapter/$id" params={{ id: String(c.id) }} className="block">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{c.id}. {c.transliterationName}</span>
                  <span className="text-muted-foreground">{done}/{c.totalVerses}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {versesRead > 0 && (
        <button onClick={() => confirm(t("resetConfirm")) && resetProgress()} className="mx-auto mt-8 block text-sm text-muted-foreground underline">
          {t("resetProgress")}
        </button>
      )}
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
