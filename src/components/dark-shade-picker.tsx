import { useEffect, useState } from "react";
import { Check, Undo2 } from "lucide-react";
import { useLang } from "@/lib/lang";
import { DARK_SHADES, useTheme, type DarkShade } from "@/lib/theme";

type ShadeLabels = Record<DarkShade | "title" | "help" | "save" | "cancel" | "saved", string>;
const LABELS: Record<string, ShadeLabels> = {
  en: { title: "Dark background", help: "Tap a shade to preview it, then save.", forest: "Forest", deep: "Deep", night: "Night", charcoal: "Charcoal", warm: "Warm", save: "Save", cancel: "Cancel", saved: "Saved" },
  am: { title: "የጨለማ ዳራ", help: "ለመመልከት ይንኩ፣ ከዛ ያስቀምጡ።", forest: "ደን", deep: "ጥልቅ", night: "ሌሊት", charcoal: "ጨጓራ", warm: "ሞቃት", save: "አስቀምጥ", cancel: "ሰርዝ", saved: "ተቀምጧል" },
  om: { title: "Duukaa dukkanaa", help: "Mul'isuuf tuqi, sana booda kuusi.", forest: "Bosona", deep: "Guddoo", night: "Halkan", charcoal: "Coalaa", warm: "Ho'aa", save: "Kuusi", cancel: "Haqi", saved: "Kuufame" },
  ar: { title: "خلفية الوضع الداكن", help: "اضغط على درجة لمعاينتها ثم احفظ.", forest: "غابة", deep: "عميق", night: "ليلي", charcoal: "فحمي", warm: "دافئ", save: "حفظ", cancel: "إلغاء", saved: "تم الحفظ" },
};

export function DarkShadePicker() {
  const { lang } = useLang();
  const { theme, darkShade, setDarkShade } = useTheme();
  const l = LABELS[lang] ?? LABELS["en"]!;
  const [draft, setDraft] = useState<DarkShade | null>(null);
  const [saved, setSaved] = useState<DarkShade>(darkShade);
  const [savedTick, setSavedTick] = useState(false);

  // Keep the saved shade in sync when it loads from device storage (no preview active).
  useEffect(() => { if (draft === null) setSaved(darkShade); }, [darkShade, draft]);

  const dirty = draft !== null && draft !== saved;
  const preview = (s: DarkShade) => { setDraft(s); setDarkShade(s, false); };
  const save = () => { if (draft) { setDarkShade(draft, true); setSaved(draft); } setDraft(null); setSavedTick(true); };
  const cancel = () => { setDarkShade(saved, false); setDraft(null); };

  useEffect(() => {
    if (!savedTick) return;
    const t = setTimeout(() => setSavedTick(false), 2000);
    return () => clearTimeout(t);
  }, [savedTick]);

  if (theme === "light") return null;
  const active = draft ?? saved;
  return (
    <section className="mt-8">
      <h2 className="font-semibold text-foreground">{l.title}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{l.help}</p>
      <div role="radiogroup" aria-label={l.title} className="grid grid-cols-5 gap-2">
        {DARK_SHADES.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={active === s.id} onClick={() => preview(s.id)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 text-xs transition-colors ${active === s.id ? "border-primary bg-secondary text-primary" : "border-border bg-card text-foreground hover:bg-muted"}`}>
            <span aria-hidden className="h-8 w-full rounded-lg border border-border" style={{ background: s.bg }} />
            {l[s.id]}
          </button>
        ))}
      </div>
      {dirty && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={save}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground">
            <Check size={16} aria-hidden /> {l.save}
          </button>
          <button type="button" onClick={cancel}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-sm text-foreground hover:bg-muted">
            <Undo2 size={16} aria-hidden /> {l.cancel}
          </button>
        </div>
      )}
      {savedTick && !dirty && <p className="mt-3 text-sm text-primary">{l.saved}</p>}
    </section>
  );
}
