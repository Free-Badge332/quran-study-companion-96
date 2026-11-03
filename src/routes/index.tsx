import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { ChevronRight, MapPin } from "lucide-react";
import { DuaIcon, HadithIcon, MosqueIcon, QiblaIcon, QuranIcon, RamadanIcon, ReadingProgressIcon, TasbihIcon } from "@/components/icons/islamic";
import { DailyVerse } from "@/components/daily-verse";
import { DownloadedQuran } from "@/components/downloaded-quran";
import { CHAPTER_LIST } from "@/lib/quran";
import { HomeTasbih } from "@/components/home-tasbih";
import { QuranGoalCard } from "@/components/quran-goal-card";
import { RecentlyPlayed } from "@/components/recently-played";
import { useProgress } from "@/lib/progress";
import { formatDuration, formatTime, hijri, nextPrayer, timesFor } from "@/lib/prayer";
import { useNow, usePrayerSettings } from "@/lib/use-prayer";
import type { MsgKey } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { CITIES } from "@/lib/prayer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Quran — Quran, azkar, duas and prayer times" },
      { name: "description", content: "Read the Quran, keep your daily azkar, find duas and see prayer and Ramadan times — all offline." },
      { property: "og:title", content: "My Quran — Quran, azkar, duas and prayer times" },
      { property: "og:description", content: "Quran, hadith, azkar, duas and prayer times in English, Amharic and Afaan Oromoo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

type Tile = { to: "/quran" | "/azkar" | "/duas" | "/hadith" | "/ramadan" | "/qibla" | "/tasbih"; label: MsgKey; icon: ComponentType<{ size?: number }> };
const TILES: Tile[] = [
  { to: "/quran", label: "navQuran", icon: QuranIcon },
  { to: "/azkar", label: "navAzkar", icon: TasbihIcon },
  { to: "/duas", label: "navDuas", icon: DuaIcon },
  { to: "/hadith", label: "navHadith", icon: HadithIcon },
  { to: "/qibla", label: "navQibla", icon: QiblaIcon },
  { to: "/ramadan", label: "prayerTimes", icon: MosqueIcon },
];

function Home() {
  const { lang, t } = useLang();
  const now = useNow();
  const [s] = usePrayerSettings();
  const progress = useProgress();
  const next = now ? nextPrayer(s, now) : null;
  const h = now ? hijri(now, s.hijriOffset) : null;
  // Sha'ban (8) and Ramadan (9): surface the Ramadan dashboard.
  const ramadanSeason = h?.month === 8 || h?.month === 9;
  const tiles: Tile[] = ramadanSeason ? [...TILES, { to: "/ramadan", label: "navRamadan", icon: RamadanIcon }] : TILES;
  const hour = now?.getHours() ?? 8;
  const isha = now ? timesFor(s, now).isha : null;
  const suggest = !now ? "morning" : isha && now > isha ? "sleep" : hour < 12 && hour >= 3 ? "morning" : "evening";
  const suggestKey: MsgKey = suggest === "morning" ? "morningAzkar" : suggest === "sleep" ? "sleepAzkar" : "eveningAzkar";
  const place = s.city === "custom" ? t("myLocation") : (CITIES.find((c) => c.id === s.city)?.name ?? CITIES[0]!.name);
  const last = progress.lastRead;
  const lastMeta = last ? CHAPTER_LIST.find((c) => c.id === last.chapterId) : undefined;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-10">
      <section className="flex items-end justify-between gap-3 pt-5">
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-foreground">{t("assalamu")}</h1>
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{h?.label ?? "\u00a0"}</p>
        </div>
      </section>

      <Link to="/ramadan" className="mt-4 block overflow-hidden rounded-3xl bg-primary bg-islamic-pattern p-5 text-primary-foreground shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-xs opacity-85"><MapPin size={12} /> <span className="truncate">{place}</span> · {t("nextPrayer")}</p>
            <p className="mt-1 font-display text-3xl">{next ? t(next.name) : "…"} <span className="text-xl tabular-nums opacity-90">{next ? formatTime(next.at) : ""}</span></p>
          </div>
          <span className="shrink-0 rounded-full bg-primary-foreground/15 px-3 py-1 text-sm tabular-nums">
            {next && now ? t("inTime", { t: formatDuration(next.at.getTime() - now.getTime()) }) : "…"}
          </span>
        </div>
        <p className="mt-3 flex items-center gap-1 text-sm opacity-85">{t("prayerTimes")} <ChevronRight size={14} /></p>
      </Link>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          {last && lastMeta && (
            <Link to="/chapter/$id" params={{ id: String(last.chapterId) }} className="surface-card-interactive flex items-center gap-4 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ReadingProgressIcon size={22} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted-foreground">{t("continueReading")}</span>
                <span className="block truncate font-semibold text-foreground">{lastMeta.transliterationName} · {t("verseN", { n: last.verseId })}</span>
              </span>
              <span dir="rtl" lang="ar" className="font-arabic text-xl text-primary">{lastMeta.name.ar}</span>
            </Link>
          )}
          <HomeTasbih />
        </div>
        <div className="space-y-4">
          <QuranGoalCard />
          <RecentlyPlayed />
          <Link to="/azkar/$category" params={{ category: suggest }} className="surface-card-interactive flex items-center gap-4 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><TasbihIcon size={22} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{t("suggestedNow")}</span>
              <span className="block font-semibold text-foreground">{t(suggestKey)}</span>
            </span>
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>
        </div>
      </div>

      <section className="mt-8" aria-labelledby="quick-access">
        <h2 id="quick-access" className="mb-3 font-display text-2xl text-foreground">{t("quickAccess")}</h2>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {tiles.map(({ to, label, icon: Icon }) => (
            <Link key={label} to={to} className="flex min-w-0 flex-col items-center gap-1.5 rounded-2xl p-1.5 text-center transition active:scale-95 hover:bg-card">
              <span className="grid h-13 w-13 place-items-center rounded-2xl border border-border bg-card text-primary shadow-soft"><Icon size={24} /></span>
              <span className="w-full truncate text-xs font-medium text-foreground">{t(label)}</span>
            </Link>
          ))}
        </div>
      </section>

      <DownloadedQuran />

      <div className="mt-8" lang={lang}><DailyVerse /></div>
    </main>
  );
}
