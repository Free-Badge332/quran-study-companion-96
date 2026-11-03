import { createFileRoute } from "@tanstack/react-router";
import { DUAS } from "@/data/adhkar";
import { DevotionTabs, PageTitle } from "@/components/dhikr-list";
import { CategoryRow } from "./azkar.index";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/duas/")({
  head: () => ({
    meta: [
      { title: "Duas from Quran and Sunnah — My Quran" },
      { name: "description", content: "Supplications from the Quran and authentic Sunnah for daily life, hardship and Ramadan." },
      { property: "og:title", content: "Duas from Quran and Sunnah — My Quran" },
      { property: "og:description", content: "Supplications for daily life, hardship and Ramadan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DuasIndex,
});

function DuasIndex() {
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-2xl px-4 pb-10">
      <PageTitle title={t("duasTitle")} sub={t("duasSub")} />
      <DevotionTabs active="duas" />
      <div className="space-y-3">
        {DUAS.map((c) => <CategoryRow key={c.id} id={c.id} title={t(c.titleKey)} total={c.items.length} to="duas" />)}
      </div>
    </main>
  );
}
