import { createFileRoute } from "@tanstack/react-router";
import { LecturesIcon } from "@/components/icons/islamic";
import { ComingSoon } from "@/components/coming-soon";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/lectures")({
  head: () => ({
    meta: [
      { title: "Lectures — My Quran" },
      { name: "description", content: "Talks and lessons from trusted scholars." },
      { property: "og:title", content: "Lectures — My Quran" },
      { property: "og:description", content: "Talks and lessons from trusted scholars." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { t } = useLang();
    return <ComingSoon title={t("lecturesTitle")} sub={t("lecturesSub")} icon={LecturesIcon} />;
  },
});
