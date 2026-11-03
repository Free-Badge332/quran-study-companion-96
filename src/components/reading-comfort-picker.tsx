import { useQuery } from "@tanstack/react-query";
import { useLang } from "@/lib/lang";
import { usePreference } from "@/lib/preferences";
import { fetchChapter } from "@/lib/quran";
import {
  ARABIC_SIZE_MAX,
  ARABIC_SIZE_MIN,
  LINE_SPACING_MAX,
  LINE_SPACING_MIN,
  TRANSLATION_SIZE_MAX,
  TRANSLATION_SIZE_MIN,
  arabicTextStyle,
  translationTextStyle,
} from "@/lib/reading-size";

type ComfortLabels = Record<
  "title" | "help" | "arabicSize" | "spacing" | "translationSize" | "reset",
  string
>;
const LABELS: Record<string, ComfortLabels> = {
  en: {
    title: "Reading comfort",
    help: "Set the Arabic text and the translation to different sizes. Changes save automatically and apply everywhere.",
    arabicSize: "Arabic text size",
    spacing: "Line spacing",
    translationSize: "Translation text size",
    reset: "Reset",
  },
  am: {
    title: "የንባብ ምቾት",
    help: "የአረብኛውን ጽሑፍ እና የትርጉሙን ጽሑፍ ለየብቻ ያስተካክሉ። ለውጦች ራሳቸው ይቀመጣሉ።",
    arabicSize: "የአረብኛ ጽሑፍ መጠን",
    spacing: "የመስመር ክፍተት",
    translationSize: "የትርጉም ጽሑፍ መጠን",
    reset: "ዳግም አስጀምር",
  },
  om: {
    title: "Miraanii dubbii",
    help: "Guddina barreeffama Arabaa fi hiikaa adda addaan sirreessi. Jijjiiramni ofumaan kuufama.",
    arabicSize: "Guddina barreeffama Arabaa",
    spacing: "Daangaa sararaa",
    translationSize: "Guddina barreeffama hiikaa",
    reset: "Deebisii",
  },
  ar: {
    title: "راحة القراءة",
    help: "اضبط النص العربي. تُحفظ التغييرات تلقائيًا وتطبق في كل مكان.",
    arabicSize: "حجم النص العربي",
    spacing: "تباعد الأسطر",
    translationSize: "حجم النص المترجم",
    reset: "إعادة ضبط",
  },
};

const SAMPLE = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾";

export function ReadingComfortPicker() {
  const { lang } = useLang();
  const l = LABELS[lang] ?? LABELS["en"]!;
  const [size, setSize] = usePreference("font-size", 1);
  const [leading, setLeading] = usePreference("line-spacing", 1);
  const [translationSize, setTranslationSize] = usePreference("translation-font-size", 1);
  const changed = size !== 1 || leading !== 1 || translationSize !== 1;
  // Arabic has no translation of its own, so there is nothing to size there.
  const showTranslation = lang !== "ar";
  // Show the reader a real line from the Quran rather than invented sample text.
  const sample = useQuery({
    queryKey: ["chapter", "1", lang],
    queryFn: () => fetchChapter("1", lang),
    staleTime: Infinity,
  });
  const translationSample = sample.data?.verses[0]?.translation;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-foreground">{l.title}</h2>
        {changed && (
          <button
            type="button"
            onClick={() => {
              setSize(1);
              setLeading(1);
              setTranslationSize(1);
            }}
            className="rounded-lg border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-muted"
          >
            {l.reset}
          </button>
        )}
      </div>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{l.help}</p>

      <div dir="rtl" className="mb-4 rounded-xl border border-border bg-card p-4 shadow-soft">
        <p
          className="min-w-0 [overflow-wrap:anywhere] text-center font-arabic text-foreground"
          style={arabicTextStyle(size, leading)}
        >
          {SAMPLE}
        </p>
      </div>

      <label className="mb-3 block text-sm text-foreground">
        <span className="mb-1 flex justify-between">
          <span>{l.arabicSize}</span>
          <span className="text-muted-foreground">{Math.round(size * 100)}%</span>
        </span>
        <input
          type="range"
          min={ARABIC_SIZE_MIN}
          max={ARABIC_SIZE_MAX}
          step={0.05}
          value={size}
          onChange={(e) => setSize(+e.target.value)}
          aria-label={l.arabicSize}
          className="w-full accent-primary"
        />
      </label>
      <label className="block text-sm text-foreground">
        <span className="mb-1 flex justify-between">
          <span>{l.spacing}</span>
          <span className="text-muted-foreground">{Math.round(leading * 100)}%</span>
        </span>
        <input
          type="range"
          min={LINE_SPACING_MIN}
          max={LINE_SPACING_MAX}
          step={0.05}
          value={leading}
          onChange={(e) => setLeading(+e.target.value)}
          aria-label={l.spacing}
          className="w-full accent-primary"
        />
      </label>

      {showTranslation && (
        <div className="mt-6 border-t border-border pt-4">
          <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-soft">
            {translationSample ? (
              <p className="min-w-0 break-words text-foreground" style={translationTextStyle(translationSize)}>
                {translationSample}
              </p>
            ) : (
              <div className="h-6 w-full animate-pulse rounded bg-muted" />
            )}
          </div>
          <label className="block text-sm text-foreground">
            <span className="mb-1 flex justify-between">
              <span>{l.translationSize}</span>
              <span className="text-muted-foreground">{Math.round(translationSize * 100)}%</span>
            </span>
            <input
              type="range"
              min={TRANSLATION_SIZE_MIN}
              max={TRANSLATION_SIZE_MAX}
              step={0.05}
              value={translationSize}
              onChange={(e) => setTranslationSize(+e.target.value)}
              aria-label={l.translationSize}
              className="w-full accent-primary"
            />
          </label>
        </div>
      )}
    </section>
  );
}
