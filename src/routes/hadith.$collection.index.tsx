import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCollection } from "@/lib/hadith";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/hadith/$collection/")({
  head: () => ({
    meta: [
      { title: "Hadith collection — My Quran" },
      { name: "description", content: "Browse the books of this hadith collection with Arabic text, English translation and references." },
      { property: "og:title", content: "Hadith collection — My Quran" },
      { property: "og:description", content: "Browse hadith by book, offline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollectionPage,
});

function CollectionPage() {
  const { collection } = Route.useParams();
  const { t } = useLang();
  const q = useQuery({ queryKey: ["hadith-collection", collection], queryFn: () => getCollection(collection), staleTime: Infinity, retry: false });
  if (q.isError) return <p className="py-20 text-center text-muted-foreground">{t("hadithLoadError")}</p>;
  if (!q.data) return <p className="py-20 text-center text-muted-foreground">{t("hadithLoading")}</p>;
  const c = q.data;
  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl px-4 pb-10">
      <nav className="pt-6 text-sm"><Link to="/hadith" className="inline-flex min-h-11 items-center gap-1 text-primary"><ChevronLeft size={16} />{t("hadithTitle")}</Link></nav>
      <h1 className="py-6 text-center font-display text-4xl text-foreground">{c.name}</h1>
      <p className="mb-6 text-center text-muted-foreground">{c.books.length} {t("books")} · {c.total.toLocaleString()} {t("hadiths")}</p>
      <ol className="grid gap-3 sm:grid-cols-2">
        {c.books.map((b) => (
          <li key={b.id} className="min-w-0">
            <Link to="/hadith/$collection/$book" params={{ collection, book: String(b.id) }} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-soft hover:border-primary">
              <span className="star-badge grid h-11 w-11 shrink-0 place-items-center text-sm font-semibold text-primary-foreground">{b.id}</span>
              <span className="min-w-0">
                <span className="block break-words font-semibold text-foreground">{b.name}</span>
                <span className="text-xs text-muted-foreground">{b.count} {t("hadiths")} · {b.first}–{b.last}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
