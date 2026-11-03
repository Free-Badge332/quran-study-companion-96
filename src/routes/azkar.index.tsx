import type React from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Moon, Sun, Sunset } from "lucide-react";
import { PrayerMatIcon } from "@/components/icons/islamic";
import { AZKAR } from "@/data/adhkar";
import { DevotionTabs, PageTitle } from "@/components/dhikr-list";
import { azkarKey, useStored } from "@/lib/devotion";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/azkar/")({
  head: () => ({
    meta: [
      { title: "Daily azkar — My Quran" },
      { name: "description", content: "Morning, evening, after-prayer and bedtime remembrance with counters and references." },
      { property: "og:title", content: "Daily azkar — My Quran" },
      { property: "og:description", content: "Morning, evening, after-prayer and bedtime remembrance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AzkarIndex,
});

const ICONS = { morning: Sun, evening: Sunset, "after-prayer": PrayerMatIcon, sleep: Moon } as Record<string, React.ComponentType<{ size?: number }>>;

export function CategoryRow({ id, title, total, to }: { id: string; title: string; total: number; to: "azkar" | "duas" }) {
  const { t } = useLang();
  const [counts] = useStored<Record<string, number>>(azkarKey(id), {});
  const Icon = ICONS[id] ?? Sun;
  const done = Object.values(counts).filter(Boolean).length;
  const inner = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={22} /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="block text-sm text-muted-foreground">{to === "azkar" ? t("azkarCount", { n: total }) : t("duaCount", { n: total })}{to === "azkar" && done > 0 ? ` · ${t("progressN", { a: Math.min(done, total), b: total })}` : ""}</span>
      </span>
      <ChevronRight size={18} className="text-muted-foreground" />
    </>
  );
  const cls = "surface-card-interactive flex items-center gap-4 p-4";
  return to === "azkar" ? (
    <Link to="/azkar/$category" params={{ category: id }} className={cls}>{inner}</Link>
  ) : (
    <Link to="/duas/$category" params={{ category: id }} className={cls}>{inner}</Link>
  );
}

function AzkarIndex() {
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-2xl px-4 pb-10">
      <PageTitle title={t("azkarTitle")} sub={t("azkarSub")} />
      <DevotionTabs active="azkar" />
      <Link to="/tasbih" className="bg-counter-shell shadow-elevated mb-5 flex items-center gap-4 rounded-2xl p-4 transition-transform active:scale-[0.99]">
        <span className="lcd-screen grid h-12 w-16 shrink-0 place-items-center rounded-lg font-lcd text-xl" aria-hidden>33</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t("tasbihTitle")}</span>
          <span className="block truncate text-sm opacity-80">{t("tasbihOpen")}</span>
        </span>
        <ChevronRight size={18} className="shrink-0 opacity-80" />
      </Link>
      <div className="space-y-3">
        {AZKAR.map((c) => <CategoryRow key={c.id} id={c.id} title={t(c.titleKey)} total={c.items.length} to="azkar" />)}
      </div>
    </main>
  );
}
