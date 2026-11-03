import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { isFavorite, toggleFavorite, useHadithFavorites, type Hadith } from "@/lib/hadith";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";

const COLLECTION_NAMES: Record<string, string> = { bukhari: "Sahih al-Bukhari", muslim: "Sahih Muslim" };

export function HadithCard({ collection, hadith, bookName, compact }: { collection: string; hadith: Hadith; bookName?: string; compact?: boolean }) {
  const { lang, t } = useLang();
  const favs = useHadithFavorites();
  const fav = isFavorite(favs, collection, hadith.n);
  const showEnglish = lang !== "ar";
  const missing = lang === "am" || lang === "om" || lang === "fr" || lang === "tr" || lang === "ru";
  return (
    <article className="min-w-0 rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-sm">
        <Link
          to="/hadith/$collection/n/$number"
          params={{ collection, number: String(hadith.n) }}
          className="inline-flex min-h-11 min-w-0 items-center [overflow-wrap:anywhere] font-semibold text-primary"
        >
          {COLLECTION_NAMES[collection] ?? collection} · {t("hadithNo")} {hadith.n}
        </Link>
        <Button variant="ghost" size="icon"
          onClick={() => void toggleFavorite(collection, hadith)}
          aria-label={fav ? t("removeFavorite") : t("addFavorite")}
          aria-pressed={fav}
          title={fav ? t("removeFavorite") : t("addFavorite")}
          className="shrink-0 text-muted-foreground"
        >
          <Heart size={18} className={fav ? "fill-primary text-primary" : ""} />
        </Button>
      </div>
      {hadith.ar && (
        <p dir="rtl" lang="ar" className={`mt-3 min-w-0 [overflow-wrap:anywhere] font-arabic leading-loose text-foreground ${compact ? "line-clamp-4 text-xl" : "text-2xl"}`}>
          {hadith.ar}
        </p>
      )}
      {showEnglish && hadith.en && (
        <>
          {missing && !compact && <p className="mt-4 text-xs italic text-muted-foreground">{t("hadithTranslationMissing")}</p>}
          <p lang="en" className={`mt-3 [overflow-wrap:anywhere] leading-relaxed text-foreground ${compact ? "line-clamp-4" : ""}`}>{withHonorifics(hadith.en)}</p>
        </>
      )}
      <dl className="mt-4 grid min-w-0 gap-2 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
        <div><dt className="inline">{t("bookLabel")}: </dt><dd className="inline">{hadith.book}{bookName ? ` · ${bookName}` : ""}</dd></div>
        <div><dt className="inline">{t("hadithNo")}: </dt><dd className="inline">{hadith.book}.{hadith.inBook}</dd></div>
        <div>
          <dt className="inline">{t("gradeLabel")}: </dt>
          <dd className="inline">{hadith.grades.length ? hadith.grades.map((g) => `${g.grade} (${g.by})`).join(", ") : t("sahihCollection")}</dd>
        </div>
      </dl>
    </article>
  );
}

/** Keep the ﷺ ligature inline: fallback fonts draw it oversized and it overlaps nearby lines. */
function withHonorifics(text: string) {
  return text.split(/([\uFDFA\uFDFB])/).map((part, i) =>
    i % 2 ? <span key={i} lang="ar" className="inline-block align-middle font-arabic text-[0.6em] leading-none">{part}</span> : part,
  );
}
