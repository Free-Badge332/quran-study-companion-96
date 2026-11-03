import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ComponentType } from "react";
import { Check } from "lucide-react";
import { QuranGoalCard } from "@/components/quran-goal-card";
import { CHECKLIST, checklistProgress, nextFastEvent, toggleItem, type ChecklistItem } from "@/lib/ramadan";
import { localDateKey } from "@/lib/devotion";
import type { MsgKey } from "@/lib/i18n";
import { ChevronRight, LocateFixed } from "lucide-react";
import { RamadanIcon, DuaIcon, QuranIcon, TasbihIcon, QiblaIcon } from "@/components/icons/islamic";
import { CITIES, METHODS, PRAYERS, daysUntilRamadan, formatDuration, formatTime, hijri, nextPrayer, timesFor, type MethodId } from "@/lib/prayer";
import { useStored } from "@/lib/devotion";
import { useNow, usePrayerSettings } from "@/lib/use-prayer";
import { PageTitle } from "@/components/dhikr-list";
import { useLang } from "@/lib/lang";
import { getFix } from "@/lib/geo";

export const Route = createFileRoute("/ramadan")({
  head: () => ({
    meta: [
      { title: "Prayer times & Ramadan — My Quran" },
      { name: "description", content: "Offline prayer times, suhoor and iftar times, Hijri date and a Ramadan fasting tracker." },
      { property: "og:title", content: "Prayer times & Ramadan — My Quran" },
      { property: "og:description", content: "Offline prayer times, suhoor and iftar, and a fasting tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RamadanPage,
});

type Quick = { to: "/azkar" | "/duas/$category" | "/tasbih" | "/quran" | "/qibla"; label: MsgKey; icon: ComponentType<{ size?: number }>; params?: { category: string } };
const QUICK: Quick[] = [
  { to: "/azkar", label: "navAzkar", icon: TasbihIcon },
  { to: "/duas/$category", label: "navDuas", icon: DuaIcon, params: { category: "fasting" } },
  { to: "/tasbih", label: "tasbihTitle", icon: TasbihIcon },
  { to: "/quran", label: "navQuran", icon: QuranIcon },
  { to: "/qibla", label: "navQibla", icon: QiblaIcon },
];

function RamadanPage() {
  const { t } = useLang();
  const now = useNow();
  const [s, setS] = usePrayerSettings();
  const [locating, setLocating] = useState<"" | "busy" | "denied">("");
  const h = now ? hijri(now, s.hijriOffset) : null;
  const inRamadan = h?.month === 9;
  const [fasts, setFasts] = useStored<number[]>(`fasting-${h?.year ?? "x"}`, []);
  const times = now ? timesFor(s, now) : null;
  const next = now ? nextPrayer(s, now) : null;
  const fast = now && times ? nextFastEvent(now, times, timesFor(s, new Date(now.getTime() + 864e5)).fajr) : null;
  const [checks, setChecks] = useStored<ChecklistItem[]>(`ramadan-checklist-${now ? localDateKey(now) : "x"}`, []);
  const pct = checklistProgress(checks);
  const done = Math.round(pct * CHECKLIST.length);

  const locate = async () => {
    setLocating("busy");
    try {
      const f = await getFix();
      setS((x) => ({ ...x, city: "custom", custom: { lat: f.lat, lng: f.lng, accuracy: f.accuracy, at: f.at } }));
      setLocating("");
    } catch { setLocating("denied"); }
  };

  const field = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground";
  return (
    <main className="mx-auto max-w-3xl px-4 pb-10">
      <PageTitle title={t("ramadanTitle")} sub={t("ramadanSub")} />

      <section className="relative overflow-hidden rounded-3xl bg-primary bg-islamic-pattern p-5 text-primary-foreground shadow-soft">
        <svg aria-hidden viewBox="0 0 100 100" className="pointer-events-none absolute -right-4 -top-4 h-32 w-32 text-gold opacity-70">
          <path d="M62 14a38 38 0 1 0 24 62A32 32 0 1 1 62 14Z" fill="currentColor" />
          <path d="M80 26l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8Z" fill="currentColor" />
        </svg>
        <div className="relative">
          <p className="flex items-center gap-2 text-sm opacity-90"><RamadanIcon size={16} tone="mono" /> {h?.label ?? "…"}</p>
          <p className="mt-2 font-display text-3xl">
            {!h ? "…" : inRamadan ? t("ramadanDay", { n: h.day }) : t("ramadanIn", { n: daysUntilRamadan(now!, s.hijriOffset) })}
          </p>
          {fast && now && (
            <p className="mt-1 text-sm opacity-90">
              {t(fast.kind === "iftar" ? "iftarIn" : "suhoorIn")} <span className="font-semibold tabular-nums">{formatDuration(fast.at.getTime() - now.getTime())}</span>
            </p>
          )}
          {times && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-primary-foreground/10 p-3"><p className="text-xs opacity-80">{t("suhoorEnds")}</p><p className="mt-0.5 text-2xl font-semibold tabular-nums">{formatTime(times.fajr)}</p></div>
              <div className="rounded-xl bg-primary-foreground/10 p-3"><p className="text-xs opacity-80">{t("iftar")}</p><p className="mt-0.5 text-2xl font-semibold tabular-nums">{formatTime(times.maghrib)}</p></div>
            </div>
          )}
        </div>
      </section>
      {h && !inRamadan && <p className="mt-3 text-sm text-muted-foreground">{t("outsideRamadan")}</p>}

      <nav aria-label={t("quickAccess")} className="mt-4 grid grid-cols-5 gap-1">
        {QUICK.map(({ to, label, icon: Icon, params }) => (
          <Link key={label} to={to} params={params as never} className="flex min-w-0 flex-col items-center gap-1 rounded-xl p-1.5 text-center transition active:scale-95">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-card text-primary shadow-soft"><Icon size={22} /></span>
            <span className="w-full truncate text-xs font-medium text-foreground">{t(label)}</span>
          </Link>
        ))}
      </nav>

      <section aria-labelledby="ck" className="surface-card mt-4 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id="ck" className="font-display text-xl text-foreground">{t("checklistTitle")}</h2>
          <span className="text-sm text-muted-foreground tabular-nums">{t("checklistDone", { a: done, b: CHECKLIST.length })}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct * 100)}>
          <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct * 100}%` }} />
        </div>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {CHECKLIST.map((item) => {
            const on = checks.includes(item);
            return (
              <li key={item}>
                <button aria-pressed={on} onClick={() => setChecks((l) => toggleItem(l, item))} className={`flex min-h-11 w-full items-center gap-3 rounded-lg border px-3 text-left text-sm transition active:scale-[0.98] ${on ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background text-foreground"}`}>
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${on ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>{on && <Check size={14} />}</span>
                  {t(`ck_${item}` as MsgKey)}
                </button>
              </li>
            );
          })}
        </ul>
        {done === CHECKLIST.length && <p className="mt-3 text-sm font-medium text-primary">{t("allDone")}</p>}
      </section>

      <div className="mt-4"><QuranGoalCard /></div>

      <section className="surface-card mt-4 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-foreground">{t("prayerTimes")}</h2>
          {next && now && <span className="text-sm text-muted-foreground">{t(next.name)} {t("inTime", { t: formatDuration(next.at.getTime() - now.getTime()) })}</span>}
        </div>
        <ul className="mt-4 divide-y divide-border">
          {PRAYERS.map((p) => (
            <li key={p} className={`flex items-center justify-between py-3 ${next?.name === p ? "font-semibold text-primary" : "text-foreground"}`}>
              <span>{t(p)}</span>
              <span className="tabular-nums">{times ? formatTime(times[p]) : "—"}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">{t("timesNote")}</p>
      </section>

      <section className="surface-card mt-4 p-4">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-foreground">{t("fastingTracker")}</h2>
          <span className="text-sm text-muted-foreground">{t("fastsDone", { n: fasts.length })}</span>
        </div>
        <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-10">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
            const on = fasts.includes(d);
            return (
              <button
                key={d}
                aria-pressed={on}
                onClick={() => setFasts((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))}
                className={`aspect-square rounded-xl text-sm font-medium transition ${on ? "bg-primary text-primary-foreground" : inRamadan && h?.day === d ? "border-2 border-primary text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {d}
              </button>
            );
          })}
        </div>
        <Link to="/duas/$category" params={{ category: "fasting" }} className="mt-5 flex items-center justify-between rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-primary">
          {t("ramadanDuas")} <ChevronRight size={16} />
        </Link>
      </section>

      <section className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-5 shadow-soft sm:grid-cols-2">
        <label className="space-y-1 text-sm text-muted-foreground">
          {t("location")}
          <select className={field} value={s.city} onChange={(e) => setS((x) => ({ ...x, city: e.target.value }))}>
            {s.custom && <option value="custom">{t("myLocation")}</option>}
            {CITIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <div className="flex items-end">
          <button onClick={locate} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground hover:border-primary">
            <LocateFixed size={16} /> {locating === "busy" ? t("locating") : t("useMyLocation")}
          </button>
        </div>
        {locating === "denied" && <p className="text-sm text-destructive sm:col-span-2">{t("locationDenied")}</p>}
        <label className="space-y-1 text-sm text-muted-foreground">
          {t("method")}
          <select className={field} value={s.method} onChange={(e) => setS((x) => ({ ...x, method: e.target.value as MethodId }))}>
            {Object.entries(METHODS).map(([id, m]) => <option key={id} value={id}>{m.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm text-muted-foreground">
          {t("asrMethod")}
          <select className={field} value={s.hanafi ? "h" : "s"} onChange={(e) => setS((x) => ({ ...x, hanafi: e.target.value === "h" }))}>
            <option value="s">{t("asrStandard")}</option>
            <option value="h">{t("asrHanafi")}</option>
          </select>
        </label>
        <label className="space-y-1 text-sm text-muted-foreground sm:col-span-2">
          {t("hijriAdjust")} · <span className="text-xs">{t("hijriAdjustHelp")}</span>
          <select className={field} value={s.hijriOffset} onChange={(e) => setS((x) => ({ ...x, hijriOffset: Number(e.target.value) }))}>
            {[-2, -1, 0, 1, 2].map((n) => <option key={n} value={n}>{n > 0 ? `+${n}` : n} {t("days")}</option>)}
          </select>
        </label>
      </section>
    </main>
  );
}
