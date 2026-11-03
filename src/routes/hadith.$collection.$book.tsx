import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getCollection, loadBook } from "@/lib/hadith";
import { HadithCard } from "@/components/hadith-card";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/hadith/$collection/$book")({
  head: () => ({
    meta: [
      { title: "Hadith book — My Quran" },
      { name: "description", content: "Read every hadith in this book with Arabic text, English translation and reference numbers." },
      { property: "og:title", content: "Hadith book — My Quran" },
      { property: "og:description", content: "Read hadith with full references, offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookPage,
});

const PAGE = 20;

function BookPage() {
  const { collection, book } = Route.useParams();
  const { t } = useLang();
  const [shown, setShown] = useState(PAGE);
  const q = useQuery({
    queryKey: ["hadith-book", collection, book],
    queryFn: async () => {
      const c = await getCollection(collection);
      const meta = c.books.find((b) => String(b.id) === book);
      if (!meta) throw new Error("Unknown book");
      return { c, meta, items: await loadBook(collection, meta.id) };
    },
    staleTime: Infinity,
    retry: false,
  });
  if (q.isError) return <p className="py-20 text-center text-muted-foreground">{t("hadithLoadError")}</p>;
  if (!q.data) return <p className="py-20 text-center text-muted-foreground">{t("hadithLoading")}</p>;
  const { c, meta, items } = q.data;
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <nav className="pt-6 text-sm"><Link to="/hadith/$collection" params={{ collection }} className="inline-flex min-h-11 items-center gap-1 text-primary"><ChevronLeft size={16} />{c.name}</Link></nav>
      <h1 className="pt-6 text-center font-display text-3xl text-foreground">{t("bookLabel")} {meta.id} · {meta.name}</h1>
      <p className="mb-8 mt-2 text-center text-muted-foreground">{meta.count} {t("hadiths")}</p>
      <div className="flex flex-col gap-4">
        {items.slice(0, shown).map((h) => <HadithCard key={h.n} collection={collection} hadith={h} bookName={meta.name} />)}
      </div>
      {shown < items.length && (
        <button onClick={() => setShown((s) => s + PAGE)} className="mx-auto mt-8 block rounded-full border border-primary px-6 py-2 text-primary">
          {t("next")} ({items.length - shown})
        </button>
      )}
    </main>
  );
}
