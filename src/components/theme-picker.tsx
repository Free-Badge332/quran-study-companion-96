import { Moon, Sun } from "lucide-react";
import { useLang } from "@/lib/lang";
import { useTheme, type ThemeChoice } from "@/lib/theme";

const LABELS: Record<string, Record<ThemeChoice | "title" | "help", string>> = {
  en: { title: "Theme", help: "Saved on this device and works offline.", light: "Light", dark: "Dark" },
  am: { title: "ገጽታ", help: "በዚህ መሣሪያ ላይ ይቀመጣል፣ ያለ ኢንተርኔትም ይሰራል።", light: "ብሩህ", dark: "ጨለማ" },
  om: { title: "Bifa", help: "Meeshaa kana irratti kuufama, interneetii malees ni hojjeta.", light: "Ifaa", dark: "Dukkana" },
  ar: { title: "المظهر", help: "يُحفظ على هذا الجهاز ويعمل دون إنترنت.", light: "فاتح", dark: "داكن" },
};
const OPTIONS = [{ id: "light", icon: Sun }, { id: "dark", icon: Moon }] as const;

export function ThemePicker() {
  const { lang } = useLang();
  const { theme, setTheme } = useTheme();
  const l = LABELS[lang] ?? LABELS["en"]!;
  return (
    <section className="mt-8">
      <h2 className="font-semibold text-foreground">{l.title}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{l.help}</p>
      <div role="radiogroup" aria-label={l.title} className="grid grid-cols-2 gap-2">
        {OPTIONS.map(({ id, icon: Icon }) => (
          <button key={id} type="button" role="radio" aria-checked={theme === id} onClick={() => setTheme(id)}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border text-sm transition-colors ${theme === id ? "border-primary bg-secondary text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}>
            <Icon size={20} aria-hidden />
            {l[id]}
          </button>
        ))}
      </div>
    </section>
  );
}
