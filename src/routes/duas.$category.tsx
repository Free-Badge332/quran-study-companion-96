import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { DUAS } from "@/data/adhkar";
import { DhikrList, PageTitle } from "@/components/dhikr-list";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/duas/$category")({
  loader: ({ params }) => {
    const category = DUAS.find((c) => c.id === params.category);
    if (!category) throw notFound();
    return { id: category.id };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Duas: ${params.category} — My Quran` },
      { name: "description", content: "Supplications with Arabic text, meaning and references." },
      { property: "og:title", content: `Duas: ${params.category} — My Quran` },
      { property: "og:description", content: "Supplications with Arabic text, meaning and references." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DuaCategory,
});

function DuaCategory() {
  const { id } = Route.useLoaderData();
  const { t } = useLang();
  const category = DUAS.find((c) => c.id === id)!;
  return (
    <main className="mx-auto max-w-2xl px-4 pb-10">
      <Link to="/duas" className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft size={16} />{t("duasTitle")}</Link>
      <PageTitle title={t(category.titleKey)} />
      <DhikrList category={category} counter={false} />
    </main>
  );
}
