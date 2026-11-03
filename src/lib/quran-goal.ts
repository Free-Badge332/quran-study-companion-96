import { useStored } from "./devotion";
import { today, useProgress } from "./progress";

export const GOAL_OPTIONS = [5, 10, 15, 30, 60] as const;
export const DEFAULT_GOAL_MINUTES = 15;

/** Fraction of today's reading goal met, from seconds read and a goal in minutes. */
export function goalProgress(secondsRead: number, goalMinutes: number) {
  if (goalMinutes <= 0) return 0;
  return Math.min(1, secondsRead / (goalMinutes * 60));
}

/** Daily Quran reading goal, measured by time spent in the reader (saved on device). */
export function useQuranGoal() {
  const [goal, setGoal] = useStored<number>("quran-goal-minutes", DEFAULT_GOAL_MINUTES);
  const progress = useProgress();
  const seconds = progress.minutes[today()] ?? 0;
  return { goal, setGoal, seconds, minutes: Math.floor(seconds / 60), pct: goalProgress(seconds, goal), lastRead: progress.lastRead };
}
