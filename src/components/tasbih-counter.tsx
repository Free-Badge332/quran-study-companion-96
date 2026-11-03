import { useState } from "react";
import { Check, RotateCcw, Undo2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLang } from "@/lib/lang";
import { haptic, isComplete, justCompleted, progress, remaining, type Target } from "@/lib/tasbih";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  target: Target;
  onIncrement: () => void;
  onUndo: () => void;
  onReset: () => void;
  /** "full" for the Tasbih screen, "compact" inside an Azkar card. */
  variant?: "full" | "compact";
};

/** Digital Tasbih: LCD count, large pearl button, secondary undo/reset. Only the button counts. */
export function TasbihCounter({
  value,
  target,
  onIncrement,
  onUndo,
  onReset,
  variant = "full",
}: Props) {
  const { t } = useLang();
  const done = isComplete(value, target);
  const full = variant === "full";
  const tap = () => {
    haptic(justCompleted(value, value + 1, target));
    onIncrement();
  };
  const label = target
    ? t("countButton", { a: value, b: target })
    : t("countButtonFree", { a: value });

  return (
    <div
      className={cn(
        "bg-counter-shell shadow-elevated",
        full ? "mx-auto w-full max-w-[18rem] rounded-[1.5rem] p-3 pb-1 sm:max-w-[22rem] sm:rounded-[2rem] sm:p-4 sm:pb-2" : "rounded-2xl p-3",
      )}
    >
      <div
        className={cn(
          full ? "space-y-3 sm:space-y-4" : "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3",
        )}
      >
        <LcdDisplay value={value} target={target} done={done} large={full} />
        <div className={cn("grid place-items-center")}>
          <CounterButton
            onTap={tap}
            label={label}
            pct={progress(value, target)}
            done={done}
            size={full ? "lg" : "md"}
          />
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {done ? t("targetReached") : ""}
      </p>
      <CounterActions value={value} onUndo={onUndo} onReset={onReset} compact={!full} />
    </div>
  );
}

function LcdDisplay({
  value,
  target,
  done,
  large,
}: {
  value: number;
  target: Target;
  done: boolean;
  large: boolean;
}) {
  const { t } = useLang();
  const digits = Math.max(large ? 4 : 3, String(value).length);
  const left = remaining(value, target);
  return (
    <div className={cn("lcd-screen min-w-0 rounded-xl", large ? "px-3.5 pb-2.5 pt-2" : "px-3 py-2")}>
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider opacity-75">
        <span className="truncate">{target ? `${t("countTarget")} ${target}` : t("noTarget")}</span>
        {done ? (
          <span className="flex shrink-0 items-center gap-1 text-gold">
            <Check size={12} strokeWidth={3} />
            {t("completed")}
          </span>
        ) : (
          left != null && (
            <span className="shrink-0 tabular-nums">{t("remainingN", { n: left })}</span>
          )
        )}
      </div>
      {/* Ghost "8" segments behind the live digits imitate a real LCD. */}
      <div
        dir="ltr"
        className={cn(
          "relative mt-1 text-right font-lcd leading-none",
          large ? "text-4xl sm:text-5xl" : "text-4xl",
        )}
        aria-hidden
      >
        <span className="absolute inset-0 text-lcd-ghost">{"8".repeat(digits)}</span>
        <span key={value} className="relative inline-block whitespace-pre animate-count-tick">
          {String(value).padStart(digits, " ")}
        </span>
      </div>
      {target != null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-lcd-ghost">
          <div
            className="h-full rounded-full bg-lcd-foreground transition-[width] duration-200"
            style={{ width: `${progress(value, target) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

function CounterButton({
  onTap,
  label,
  pct,
  done,
  size,
}: {
  onTap: () => void;
  label: string;
  pct: number;
  done: boolean;
  size: "lg" | "md";
}) {
  const C = 2 * Math.PI * 46;
  const dim = size === "lg" ? "h-24 w-24 sm:h-32 sm:w-32" : "h-20 w-20";
  return (
    <div className={cn("relative grid place-items-center", dim, done && "animate-counter-done")}>
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 -rotate-90"
        aria-hidden
      >
        <circle cx="50" cy="50" r="46" fill="none" strokeWidth="3" className="stroke-on-shell/20" />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-gold transition-[stroke-dashoffset] duration-300"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
        />
      </svg>
      <button
        type="button"
        onClick={onTap}
        aria-label={label}
        className={cn(
          "counter-button grid place-items-center rounded-full text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold",
          size === "lg" ? "h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24" : "h-14 w-14",
        )}
      >
        {done && (
          <Check
            size={size === "lg" ? 26 : 20}
            strokeWidth={2.5}
            className="text-gold"
            aria-hidden
          />
        )}
      </button>
    </div>
  );
}

function CounterActions({
  value,
  onUndo,
  onReset,
  compact,
}: {
  value: number;
  onUndo: () => void;
  onReset: () => void;
  compact: boolean;
}) {
  const { t } = useLang();
  const [confirm, setConfirm] = useState(false);
  const btn =
    "flex min-h-11 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-on-shell/80 transition-colors hover:bg-on-shell/10 hover:text-on-shell disabled:pointer-events-none disabled:opacity-35";
  return (
    <div className={cn("flex items-center", compact ? "mt-1 justify-end" : "mt-1 justify-between")}>
      <button
        type="button"
        onClick={onUndo}
        disabled={value === 0}
        className={btn}
        aria-label={t("undoCount")}
      >
        <Undo2 size={16} />
        <span className={cn(compact && "sr-only")}>{t("undoCount")}</span>
      </button>
      <button
        type="button"
        onClick={() => setConfirm(true)}
        disabled={value === 0}
        className={btn}
        aria-label={t("resetCount")}
      >
        <RotateCcw size={16} />
        <span className={cn(compact && "sr-only")}>{t("resetCount")}</span>
      </button>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resetConfirmBody", { n: value })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancelAction")}</AlertDialogCancel>
            <AlertDialogAction onClick={onReset}>{t("resetCount")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
