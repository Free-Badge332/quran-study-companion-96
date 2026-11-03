import { Link } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { ReadingProgressIcon } from "@/components/icons/islamic";
import { useLang } from "@/lib/lang";
import { GOAL_OPTIONS, useQuranGoal } from "@/lib/quran-goal";

/** Daily Quran reading goal (minutes in the reader today) with a continue action. */
export function QuranGoalCard() {
  const { t } = useLang();
  const g = useQuranGoal();
  const done = g.pct >= 1;
  const to = g.lastRead ? String(g.lastRead.chapterId) : "1";
  return (
    <section aria-labelledby="quran-goal" className="surface-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="quran-goal" className="flex items-center gap-2 font-display text-xl text-foreground">
          <ReadingProgressIcon size={20} /> {t("quranGoal")}
        </h2>
        <select
          aria-label={t("goalEdit")}
          value={g.goal}
          onChange={(e) => g.setGoal(Number(e.target.value))}
          className="min-h-11 rounded-md border border-input bg-background px-2 text-sm text-foreground"
        >
          {GOAL_OPTIONS.map((n) => <option key={n} value={n}>{t("minN", { n })}</option>)}
        </select>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(g.pct * 100)} aria-label={t("quranGoal")}>
        <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${g.pct * 100}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm">
        <span className={done ? "flex items-center gap-1 font-medium text-primary" : "text-muted-foreground tabular-nums"}>
          {done ? <><Check size={14} /> {t("goalDone")}</> : t("goalMinutes", { a: g.minutes, b: g.goal })}
        </span>
        <Link to="/chapter/$id" params={{ id: to }} className="flex min-h-11 items-center gap-1 font-semibold text-primary">
          {g.lastRead ? t("keepReading") : t("startReading")} <ChevronRight size={16} />
        </Link>
      </div>
    </section>
  );
}
