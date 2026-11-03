import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { PageTitle } from "@/components/dhikr-list";
import { TasbihCounter } from "@/components/tasbih-counter";
import { TASBIH_PHRASES } from "@/data/tasbih";
import { useStored } from "@/lib/devotion";
import { useLang } from "@/lib/lang";
import { TASBIH_TARGETS, tasbihReducer, type TasbihAction, type TasbihState } from "@/lib/tasbih";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasbih")({
  head: () => ({
    meta: [
      { title: "Digital Tasbih — My Quran" },
      {
        name: "description",
        content:
          "A digital Tasbih counter for SubhanAllah, Alhamdulillah, Allahu Akbar and more, saved on your device and fully offline.",
      },
      { property: "og:title", content: "Digital Tasbih — My Quran" },
      {
        property: "og:description",
        content: "Count your dhikr with a tactile digital Tasbih that works offline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasbihPage,
});

// Not reset daily: the free counter keeps its counts until the user resets them.
const DEFAULT_PHRASE = TASBIH_PHRASES[0]!;
const INITIAL: TasbihState = { phrase: DEFAULT_PHRASE.id, counts: {}, targets: {}, total: 0 };

function TasbihPage() {
  const { t, lang } = useLang();
  const [state, setState] = useStored<TasbihState>("tasbih:v1", INITIAL);
  const dispatch = (a: TasbihAction) => setState((s) => tasbihReducer({ ...INITIAL, ...s }, a));
  const phrase = TASBIH_PHRASES.find((p) => p.id === state.phrase) ?? DEFAULT_PHRASE;
  const value = state.counts[phrase.id] ?? 0;
  const saved = state.targets?.[phrase.id];
  const target = saved === undefined ? phrase.target : saved;

  return (
    <main className="mx-auto max-w-2xl px-4 pb-10">
      <Link
        to="/azkar"
        className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ChevronLeft size={16} />
        {t("azkarTitle")}
      </Link>
      <PageTitle title={t("tasbihTitle")} />

      <div
        role="radiogroup"
        aria-label={t("tasbihTitle")}
        className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {TASBIH_PHRASES.map((p) => {
          const on = p.id === phrase.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => dispatch({ type: "select", phrase: p.id })}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary",
              )}
            >
              <span dir="rtl" lang="ar" className="font-arabic text-base">
                {p.ar}
              </span>
            </button>
          );
        })}
      </div>

      <section className="surface-card mb-5 px-5 py-4 text-center">
        <p dir="rtl" lang="ar" className="font-arabic text-3xl leading-loose text-foreground">
          {phrase.ar}
        </p>
        <p className="mt-2 text-sm italic text-primary">{phrase.translit}</p>
        {lang !== "ar" && <p className="mt-1 text-sm text-muted-foreground">{phrase.en}</p>}
        <p className="mt-3 text-xs text-muted-foreground">
          {t("reference")}: {phrase.ref}
        </p>
      </section>

      <TasbihCounter
        value={value}
        target={target}
        onIncrement={() => dispatch({ type: "tap" })}
        onUndo={() => dispatch({ type: "undo" })}
        onReset={() => dispatch({ type: "reset" })}
      />

      <div className="mt-6">
        <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("countTarget")}
        </p>
        <div
          role="radiogroup"
          aria-label={t("countTarget")}
          className="mx-auto flex max-w-sm justify-center gap-1 rounded-full border border-border bg-card p-1"
        >
          {TASBIH_TARGETS.map((n) => {
            const on = target === n;
            return (
              <button
                key={String(n)}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={n == null ? t("noTarget") : String(n)}
                onClick={() => dispatch({ type: "target", target: n })}
                className={cn(
                  "min-h-10 flex-1 rounded-full text-sm font-semibold tabular-nums transition-colors",
                  on
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {n ?? "∞"}
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground tabular-nums">
          {t("lifetimeTotal", { n: state.total ?? 0 })}
        </p>
      </div>
    </main>
  );
}
