import { Check } from "lucide-react";
import { LANGUAGES } from "@/lib/quran";
import { useLang } from "@/lib/lang";
import { hasFullInterface } from "@/lib/i18n";

/** Big list of language choices. Afaan Oromoo and Amharic are shown first. */
export function LanguageOptions() {
  const { lang, setLang, t } = useLang();
  const order = ["om", "am", ...LANGUAGES.map((l) => l.id).filter((id) => id !== "om" && id !== "am")];
  return (
    <div className="flex flex-col gap-2">
      {order.map((id) => {
        const l = LANGUAGES.find((x) => x.id === id)!;
        const on = lang === id;
        const primary = id === "om" || id === "am";
        return (
          <button
            key={id}
            type="button"
            onClick={() => setLang(l.id)}
            aria-pressed={on}
            className={`flex items-center justify-between rounded-xl border px-5 text-left transition ${primary ? "py-4 text-lg font-semibold" : "py-2.5 text-sm"} ${on ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:border-primary/50"}`}
          >
            <span>
              {l.label}
              {!hasFullInterface(id) && <span className="block text-xs font-normal text-muted-foreground">{t("translationNote") || "Interface text in this language is shown in English."}</span>}
            </span>
            {on && <Check size={18} />}
          </button>
        );
      })}
    </div>
  );
}

/** Shown once, until a language has been saved on this device. */
export function FirstLaunchLanguage() {
  const { needsChoice } = useLang();
  if (!needsChoice) return null;
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="pick-lang" className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background/95 p-4 backdrop-blur">
      <div className="w-full max-w-sm py-8 text-center">
        <img src="/logo.png" alt="" className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary p-2" />
        <h1 id="pick-lang" className="font-display text-3xl text-foreground">Afaan filadhu · ቋንቋ ይምረጡ</h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">Choose your language</p>
        <LanguageOptions />
      </div>
    </div>
  );
}
