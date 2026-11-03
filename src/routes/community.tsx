import { createFileRoute } from "@tanstack/react-router";
import { MosqueIcon } from "@/components/icons/islamic";
import { ComingSoon } from "@/components/coming-soon";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Community resources — My Quran" },
      { name: "description", content: "Mosques, classes and services near you." },
      { property: "og:title", content: "Community resources — My Quran" },
      { property: "og:description", content: "Mosques, classes and services near you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => {
    const { t } = useLang();
    return <ComingSoon title={t("communityTitle")} sub={t("communitySub")} icon={MosqueIcon} />;
  },
});
