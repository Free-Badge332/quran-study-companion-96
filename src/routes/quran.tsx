import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bookmark } from "lucide-react";
import { CHAPTER_LIST, toArabicNumber } from "@/lib/quran";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/quran")({
  head: () => ({
    meta: [
      { title: "All 114 surahs — My Quran" },
      { name: "description", content: "Browse and search every surah of the Holy Quran with translations and recitation." },
      { property: "og:title", content: "All 114 surahs — My Quran" },
      { property: "og:description", content: "Browse and search every surah of the Holy Quran." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuranPage,
});

function QuranPage() {
  const { lang, t } = useLang();
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const list = CHAPTER_LIST.filter(
    (c) => !s || c.name.ar.includes(s) || c.name[lang].toLowerCase().includes(s) || c.transliterationName.toLowerCase().includes(s) || String(c.id) === s,
  );
  return (
    <main className="mx-auto w-full min-w-0 max-w-6xl px-3 pb-10 sm:px-4">
      <section className="py-10 text-center">
        <p className="font-arabic text-5xl text-primary">ٱلْقُرْآنُ ٱلْكَرِيمُ</p>
        <h1 className="mt-4 font-display text-4xl text-foreground">{t("heroTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("heroSub")}</p>
        <div className="mx-auto mt-8 flex max-w-md gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchSurah")}
            className="min-w-0 flex-1 rounded-full border border-input bg-card px-5 py-3 text-foreground shadow-soft outline-none focus:ring-2 focus:ring-ring"
          />
          <Link to="/bookmarks" aria-label={t("navBookmarks")} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-input bg-card text-primary shadow-soft">
            <Bookmark size={18} />
          </Link>
        </div>
      </section>
      {list.length === 0 && <p className="text-center text-muted-foreground">{t("noSurah")}</p>}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((c) => (
          <Link
            key={c.id}
            to="/chapter/$id"
            params={{ id: String(c.id) }}
            className="group grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft transition hover:-translate-y-0.5 hover:border-primary sm:p-4"
          >
            <span className="star-badge grid h-12 w-12 shrink-0 place-items-center text-sm font-semibold text-primary-foreground">{c.id}</span>
            <div className="min-w-0">
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] items-center gap-2">
                <p className="min-w-0 break-words font-semibold text-foreground">{c.transliterationName}</p>
                <span dir="rtl" className="min-w-0 [overflow-wrap:anywhere] text-right font-arabic text-2xl text-primary">{c.name.ar}</span>
              </div>
              <p className="mt-1 break-words text-sm text-muted-foreground">
                {c.name[lang]} · {c.totalVerses} {t("verses")} · {c.type === "meccan" ? t("meccan") : t("medinan")}
              </p>
            </div>
            <span className="sr-only">{toArabicNumber(c.id)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
