import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { findHadith } from "@/lib/hadith";
import { HadithCard } from "@/components/hadith-card";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/hadith/$collection/n/$number")({
  head: () => ({
    meta: [
      { title: "Hadith — My Quran" },
      { name: "description", content: "A single hadith with Arabic text, English translation, book and reference number." },
      { property: "og:title", content: "Hadith — My Quran" },
      { property: "og:description", content: "Read this hadith with its full reference." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HadithPage,
});

function HadithPage() {
  const { collection, number } = Route.useParams();
  const { t } = useLang();
  const q = useQuery({ queryKey: ["hadith", collection, number], queryFn: () => findHadith(collection, Number(number)), staleTime: Infinity, retry: false });
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <nav className="py-6 text-sm"><Link to="/hadith" className="inline-flex min-h-11 items-center gap-1 text-primary"><ChevronLeft size={16} />{t("hadithTitle")}</Link></nav>
      {q.isPending && <p className="text-center text-muted-foreground">{t("hadithLoading")}</p>}
      {(q.isError || q.data === null) && <p className="text-center text-muted-foreground">{t("noHadith")}</p>}
      {q.data && (
        <>
          <HadithCard collection={collection} hadith={q.data.hadith} bookName={q.data.book.name} />
          <p className="mt-4 text-center text-sm">
            <Link to="/hadith/$collection/$book" params={{ collection, book: String(q.data.book.id) }} className="text-primary">
              {q.data.collection.name} · {t("bookLabel")} {q.data.book.id}: {q.data.book.name}
            </Link>
          </p>
        </>
      )}
    </main>
  );
}
