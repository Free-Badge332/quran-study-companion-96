import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { TasbihCounter } from "@/components/tasbih-counter";
import { TasbihIcon } from "@/components/icons/islamic";
import { TASBIH_PHRASES } from "@/data/tasbih";
import { useStored } from "@/lib/devotion";
import { useLang } from "@/lib/lang";
import { TASBIH_TARGETS, parseCustomTarget, tasbihReducer, type TasbihAction, type TasbihState } from "@/lib/tasbih";

const DEFAULT_PHRASE = TASBIH_PHRASES[0]!;
const INITIAL: TasbihState = { phrase: DEFAULT_PHRASE.id, counts: {}, targets: {}, total: 0 };
const PRESETS: number[] = TASBIH_TARGETS.filter((n) => n != null) as number[];

/** Compact home-screen Tasbih. Shares saved state with the full /tasbih screen. */
export function HomeTasbih() {
  const { t, lang } = useLang();
  const [state, setState] = useStored<TasbihState>("tasbih:v1", INITIAL);
  const dispatch = (a: TasbihAction) => setState((s) => tasbihReducer({ ...INITIAL, ...s }, a));
  const phrase = TASBIH_PHRASES.find((p) => p.id === state.phrase) ?? DEFAULT_PHRASE;
  const value = state.counts?.[phrase.id] ?? 0;
  const saved = state.targets?.[phrase.id];
  const target = saved === undefined ? phrase.target : saved;
  const isPreset = target == null || PRESETS.includes(target);
  const [custom, setCustom] = useState<string | null>(null);
  const customValid = custom != null && parseCustomTarget(custom) != null;

  const field = "min-h-11 min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground";
  return (
    <section aria-labelledby="home-tasbih" className="surface-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id="home-tasbih" className="flex items-center gap-2 font-display text-xl text-foreground">
          <TasbihIcon size={20} /> {t("homeTasbih")}
        </h2>
        <Link to="/tasbih" className="flex min-h-11 items-center gap-1 text-sm text-primary">
          {t("openFull")} <ChevronRight size={16} />
        </Link>
      </div>

      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <select aria-label={t("tasbihTitle")} value={phrase.id} onChange={(e) => dispatch({ type: "select", phrase: e.target.value })} className={field}>
          {TASBIH_PHRASES.map((p) => <option key={p.id} value={p.id}>{p.translit}</option>)}
        </select>
        <select
          aria-label={t("countTarget")}
          value={custom != null || !isPreset ? "custom" : String(target ?? "none")}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "custom") return setCustom(isPreset ? "" : String(target));
            setCustom(null);
            dispatch({ type: "target", target: v === "none" ? null : Number(v) });
          }}
          className={field}
        >
          {PRESETS.map((n) => <option key={n} value={n}>{t("countTarget")} {n}</option>)}
          <option value="none">{t("noTarget")}</option>
          <option value="custom">{t("customTarget")}{!isPreset && custom == null ? ` · ${target}` : ""}</option>
        </select>
      </div>

      {custom != null && (
        <form
          className="mb-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseCustomTarget(custom);
            if (n == null) return;
            dispatch({ type: "target", target: n });
            setCustom(null);
          }}
        >
          <input
            inputMode="numeric"
            aria-label={t("customTargetPrompt")}
            placeholder={t("customTargetPrompt")}
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/\D/g, "").slice(0, 5))}
            className={`${field} flex-1 px-3`}
            autoFocus
          />
          <button type="submit" disabled={!customValid} className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {t("setTarget")}
          </button>
        </form>
      )}

      <p dir="rtl" lang="ar" className="mb-1 truncate text-center font-arabic text-2xl leading-relaxed text-foreground">{phrase.ar}</p>
      {lang !== "ar" && <p className="mb-3 truncate text-center text-xs text-muted-foreground">{phrase.en}</p>}

      <TasbihCounter
        variant="compact"
        value={value}
        target={target}
        onIncrement={() => dispatch({ type: "tap" })}
        onUndo={() => dispatch({ type: "undo" })}
        onReset={() => dispatch({ type: "reset" })}
      />
    </section>
  );
}
