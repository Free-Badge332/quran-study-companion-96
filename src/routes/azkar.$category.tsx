import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { AZKAR } from "@/data/adhkar";
import { DhikrList, PageTitle } from "@/components/dhikr-list";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/azkar/$category")({
  loader: ({ params }) => {
    const category = AZKAR.find((c) => c.id === params.category);
    if (!category) throw notFound();
    return { id: category.id };
  },
  head: ({ params }) => ({
    meta: [
      { title: `Azkar: ${params.category} — My Quran` },
      { name: "description", content: "Remembrance with a tap counter and authentic references." },
      { property: "og:title", content: `Azkar: ${params.category} — My Quran` },
      { property: "og:description", content: "Remembrance with a tap counter and authentic references." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AzkarCategory,
});

function AzkarCategory() {
  const { id } = Route.useLoaderData();
  const { t } = useLang();
  const category = AZKAR.find((c) => c.id === id)!;
  return (
    <main className="mx-auto max-w-2xl px-4 pb-10">
      <Link to="/azkar" className="mt-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ChevronLeft size={16} />{t("azkarTitle")}</Link>
      <PageTitle title={t(category.titleKey)} />
      <DhikrList category={category} />
    </main>
  );
}
