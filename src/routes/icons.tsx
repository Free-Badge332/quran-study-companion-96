import { createFileRoute } from "@tanstack/react-router";
import { Bell, BookOpen, Bookmark, Clock, Compass, Download, Hand, Headphones, MoonStar, Search, Settings } from "lucide-react";
import { ICON_CATALOG, QuranIcon, DuaIcon, PrayerTimesIcon, LecturesIcon, RamadanIcon, QiblaIcon, BookmarkIcon, DownloadIcon, PrayerReminderIcon, TasbihIcon } from "@/components/icons/islamic";

export const Route = createFileRoute("/icons")({
  head: () => ({
    meta: [
      { title: "Icon Preview — My Quran" },
      { name: "description", content: "Preview the Islamic icon set in light and dark themes." },
      { property: "og:title", content: "Icon Preview — My Quran" },
      { property: "og:description", content: "Islamic icon set preview for My Quran." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: IconsPage,
});

const USE_LABEL = { nav: "Nav", card: "Card", action: "Action" } as const;

const COMPARE = [
  ["Quran", QuranIcon, BookOpen],
  ["Azkar", TasbihIcon, Hand],
  ["Dua", DuaIcon, Hand],
  ["Prayer times", PrayerTimesIcon, Clock],
  ["Lectures", LecturesIcon, Headphones],
  ["Ramadan", RamadanIcon, MoonStar],
  ["Qibla", QiblaIcon, Compass],
  ["Bookmark", BookmarkIcon, Bookmark],
  ["Download", DownloadIcon, Download],
  ["Reminder", PrayerReminderIcon, Bell],
] as const;

function Panel({ dark }: { dark?: boolean }) {
  return (
    <section className={dark ? "dark" : ""}>
      <div className="rounded-2xl border border-border bg-background p-4 text-foreground">
        <h2 className="mb-3 font-semibold">{dark ? "Dark theme" : "Light theme"}</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {ICON_CATALOG.map(({ name, Icon, use }) => (
            <div key={name} className="flex flex-col items-center gap-2 rounded-xl bg-card p-3 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary"><Icon size={26} title={name} /></span>
              <span className="text-xs text-foreground">{name}</span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{use.map((u) => USE_LABEL[u]).join(" · ")}</span>
            </div>
          ))}
        </div>

        <h3 className="mb-2 mt-6 text-sm font-semibold">Sizes (16 · 20 · 24 · 32 · 48)</h3>
        <div className="flex flex-wrap items-end gap-4 text-primary">
          {[16, 20, 24, 32, 48].map((s) => <QuranIcon key={s} size={s} />)}
          {[16, 20, 24, 32, 48].map((s) => <DuaIcon key={`d${s}`} size={s} />)}
        </div>

        <h3 className="mb-2 mt-6 text-sm font-semibold">Variants</h3>
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><TasbihIcon size={32} className="text-primary" /> Emerald + gold</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><TasbihIcon size={32} tone="mono" className="text-gold" /> Gold</span>
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><TasbihIcon size={32} tone="mono" className="text-muted-foreground" /> Neutral</span>
          <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground"><TasbihIcon size={26} tone="mono" /></span>
        </div>

        <h3 className="mb-2 mt-6 text-sm font-semibold">Islamic vs. Lucide</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {COMPARE.map(([n, Mine, Std]) => (
            <div key={n} className="flex items-center gap-3 rounded-lg bg-card px-3 py-2 text-primary">
              <Mine size={24} /><Std size={24} strokeWidth={1.75} className="text-muted-foreground" />
              <span className="text-xs text-foreground">{n}</span>
            </div>
          ))}
        </div>

        <h3 className="mb-2 mt-6 text-sm font-semibold">Standard actions stay Lucide</h3>
        <div className="flex flex-wrap gap-4 text-primary">
          {[Search, Settings, Bell].map((I, i) => <I key={i} size={24} strokeWidth={1.75} />)}
        </div>
      </div>
    </section>
  );
}

function IconsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24">
      <h1 className="py-8 text-center font-display text-4xl text-foreground">Icon preview</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel />
        <Panel dark />
      </div>
    </main>
  );
}
