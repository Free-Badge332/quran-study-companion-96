// Pure counting rules shared by Azkar items and the Tasbih screen.
export const MAX_COUNT = 99_999;
export const TASBIH_TARGETS = [33, 99, 100, 1000, null] as const;
export type Target = number | null;

/** One tap. Counting may continue past the target (users can keep going). */
export const increment = (v: number) => Math.min(MAX_COUNT, Math.max(0, v) + 1);
/** Undo the last tap, never below zero. */
export const undo = (v: number) => Math.max(0, v - 1);
export const isComplete = (v: number, target: Target) =>
  target != null && target > 0 && v >= target;
/** True only for the tap that reaches the target, so the completion cue fires once. */
export const justCompleted = (prev: number, next: number, target: Target) =>
  target != null && prev < target && next >= target;
export const progress = (v: number, target: Target) => (target ? Math.min(1, v / target) : 0);
export const remaining = (v: number, target: Target) => (target ? Math.max(0, target - v) : null);

export type TasbihState = {
  phrase: string;
  counts: Record<string, number>;
  targets: Record<string, Target>;
  total: number;
};
export type TasbihAction =
  | { type: "tap" }
  | { type: "undo" }
  | { type: "reset" }
  | { type: "select"; phrase: string }
  | { type: "target"; target: Target };

export function tasbihReducer(s: TasbihState, a: TasbihAction): TasbihState {
  const cur = s.counts[s.phrase] ?? 0;
  switch (a.type) {
    case "tap": {
      const next = increment(cur);
      return { ...s, counts: { ...s.counts, [s.phrase]: next }, total: s.total + (next - cur) };
    }
    case "undo": {
      const next = undo(cur);
      return {
        ...s,
        counts: { ...s.counts, [s.phrase]: next },
        total: Math.max(0, s.total - (cur - next)),
      };
    }
    case "reset":
      // Lifetime total keeps earlier remembrance; only the current counter clears.
      return { ...s, counts: { ...s.counts, [s.phrase]: 0 } };
    case "select":
      return { ...s, phrase: a.phrase };
    case "target":
      return { ...s, targets: { ...s.targets, [s.phrase]: a.target } };
  }
}

/** Vibrate briefly where supported (Android WebView/Chrome); silent elsewhere. */
export function haptic(strong = false) {
  try {
    navigator.vibrate?.(strong ? [18, 60, 18] : 8);
  } catch {
    /* unsupported */
  }
}

export const MAX_TARGET = 10_000;
/** A user-typed custom target: whole number from 1 to MAX_TARGET, otherwise rejected (null). */
export function parseCustomTarget(input: string): number | null {
  const n = Number(input.trim());
  if (!Number.isInteger(n) || n < 1 || n > MAX_TARGET) return null;
  return n;
}
