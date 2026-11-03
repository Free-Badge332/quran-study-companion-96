import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";
import { useLang } from "@/lib/lang";
import photo from "@/assets/developer-photo.webp";

export const DEVELOPER_EMAIL = "ezadinbadru55@gmail.com";

const LABELS: Record<string, { title: string; help: string; name: string; email: string; copy: string; copied: string; alt: string }> = {
  en: { title: "About the Developer", help: "Questions, suggestions or corrections are welcome.", name: "Ezadin Badru", email: "Email the developer", copy: "Copy email", copied: "Copied", alt: "Photo of Ezadin Badru, the app developer" },
  am: { title: "ስለ አዘጋጁ", help: "ጥያቄ፣ ሐሳብ ወይም እርማት ካለዎት ያግኙን።", name: "ኢዛዲን ባድሩ", email: "ለአዘጋጁ ኢሜይል ይላኩ", copy: "ኢሜይል ቅዳ", copied: "ተቀድቷል", alt: "የመተግበሪያው አዘጋጅ የኢዛዲን ባድሩ ፎቶ" },
  om: { title: "Waa'ee Qopheessaa", help: "Gaaffii, yaada ykn sirreeffama nuuf ergaa.", name: "Ezadin Badru", email: "Qopheessaaf imeelii ergi", copy: "Imeelii garagalchi", copied: "Garagalfameera", alt: "Suuraa Ezadin Badru, qopheessaa appii" },
  ar: { title: "عن المطوّر", help: "نرحب بالأسئلة والاقتراحات والتصحيحات.", name: "عز الدين بدرو", email: "راسل المطوّر", copy: "نسخ البريد", copied: "تم النسخ", alt: "صورة عز الدين بدرو مطوّر التطبيق" },
};

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}

export function DeveloperContact() {
  const { lang } = useLang();
  const l = LABELS[lang] ?? LABELS["en"]!;
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    if (await copyText(DEVELOPER_EMAIL)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <section className="mt-8" aria-labelledby="developer-title">
      <h2 id="developer-title" className="font-semibold text-foreground">{l.title}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{l.help}</p>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <img src={photo} alt={l.alt} width={64} height={64} loading="lazy"
            className="size-16 shrink-0 rounded-full border-2 border-gold object-cover" />
          <div className="min-w-0">
            <p className="font-display text-xl text-foreground">{l.name}</p>
            <a href={`mailto:${DEVELOPER_EMAIL}`} className="block truncate text-sm text-primary underline-offset-4 hover:underline">
              {DEVELOPER_EMAIL}
            </a>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <a href={`mailto:${DEVELOPER_EMAIL}`} aria-label={`${l.email}: ${DEVELOPER_EMAIL}`}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <Mail size={18} aria-hidden />{l.email}
          </a>
          <button type="button" onClick={() => void onCopy()}
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-foreground transition-colors hover:bg-muted">
            {copied ? <Check size={18} aria-hidden className="text-primary" /> : <Copy size={18} aria-hidden />}
            <span aria-live="polite">{copied ? l.copied : l.copy}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
