import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { dailyHadith, loadCatalog, searchCollection, useHadithFavorites, type Hadith } from "@/lib/hadith";
import { HadithCard } from "@/components/hadith-card";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/hadith/")({
  head: () => ({
    meta: [
      { title: "Hadith Library — My Quran" },
      { name: "description", content: "Sahih al-Bukhari and Sahih Muslim in Arabic and English with references, search and favorites, available offline." },
      { property: "og:title", content: "Hadith Library — My Quran" },
      { property: "og:description", content: "Browse, search and save authentic hadith with full references, offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HadithHome,
});

function HadithHome() {
  const { t } = useLang();
  const navigate = useNavigate();
  const catalog = useQuery({ queryKey: ["hadith-catalog"], queryFn: loadCatalog, staleTime: Infinity });
  const daily = useQuery({ queryKey: ["hadith-daily", new Date().toDateString()], queryFn: () => dailyHadith(), staleTime: Infinity });
  const favs = useHadithFavorites();
  const [collection, setCollection] = useState("bukhari");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Hadith[] | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    const s = q.trim();
    if (!s) return;
    if (/^\d+$/.test(s)) {
      void navigate({ to: "/hadith/$collection/n/$number", params: { collection, number: s } });
      return;
    }
    setBusy(true);
    try { setResults(await searchCollection(collection, s)); } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24">
      <section className="py-10 text-center">
        <p dir="rtl" className="font-arabic text-4xl text-primary">الحديث النبوي</p>
        <h1 className="mt-3 font-display text-4xl text-foreground">{t("hadithTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{t("hadithSub")}</p>
      </section>

      <section aria-labelledby="daily" className="mb-10">
        <h2 id="daily" className="mb-3 font-display text-2xl text-foreground">{t("dailyHadith")}</h2>
        {daily.data ? <HadithCard collection={daily.data.collection.id} hadith={daily.data.hadith} bookName={daily.data.book.name} />
          : <p className="text-muted-foreground">{daily.isError ? t("hadithLoadError") : t("hadithLoading")}</p>}
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-2xl text-foreground">{t("collections")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {catalog.data?.collections.map((c) => (
            <Link key={c.id} to="/hadith/$collection" params={{ collection: c.id }} className="rounded-xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary">
              <p className="font-display text-2xl text-foreground">{c.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.books.length} {t("books")} · {c.total.toLocaleString()} {t("hadiths")}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
          <select aria-label={t("collections")} value={collection} onChange={(e) => setCollection(e.target.value)} className="rounded-full border border-input bg-card px-4 py-3 text-foreground">
            {catalog.data?.collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchHadith")} aria-label={t("searchHadith")}
            className="flex-1 rounded-full border border-input bg-card px-5 py-3 text-foreground shadow-soft outline-none focus:ring-2 focus:ring-ring" />
        </form>
        {busy && <p className="mt-4 text-muted-foreground">{t("searching")}</p>}
        {!busy && results && (
          <div className="mt-4 flex flex-col gap-4">
            {results.length === 0 && <p className="text-muted-foreground">{t("noHadith")}</p>}
            {results.map((h) => <HadithCard key={h.n} collection={collection} hadith={h} compact />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl text-foreground">{t("favorites")}</h2>
        {favs.length === 0 && <p className="text-muted-foreground">{t("favoritesEmpty")}</p>}
        <div className="flex flex-col gap-3">
          {favs.map((f) => (
            <Link key={`${f.collection}-${f.n}`} to="/hadith/$collection/n/$number" params={{ collection: f.collection, number: String(f.n) }} className="rounded-xl border border-border bg-card p-4 shadow-soft hover:border-primary">
              <p className="text-sm font-semibold text-primary">{catalog.data?.collections.find((c) => c.id === f.collection)?.name} · {t("hadithNo")} {f.n}</p>
              <p className="mt-2 line-clamp-2 text-sm text-foreground">{f.en || f.ar}</p>
            </Link>
          ))}
        </div>
      </section>

      {catalog.data && (
        <p className="mt-12 text-center text-xs text-muted-foreground">
          {t("hadithSource")}: <a href={catalog.data.url} target="_blank" rel="noreferrer" className="inline-block py-2 underline">{catalog.data.source}</a> ({catalog.data.commit.slice(0, 7)})
        </p>
      )}
    </main>
  );
}
