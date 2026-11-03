import { createFileRoute, Link } from "@tanstack/react-router";
import { BookmarkX } from "lucide-react";
import { CHAPTER_LIST } from "@/lib/quran";
import { useLang } from "@/lib/lang";
import { toggleBookmark, useProgress } from "@/lib/progress";

export const Route = createFileRoute("/bookmarks")({
  head: () => ({
    meta: [
      { title: "Bookmarks — My Quran" },
      { name: "description", content: "Your saved Quran verses, ready to return to." },
      { property: "og:title", content: "Bookmarks — My Quran" },
      { property: "og:description", content: "Your saved Quran verses, ready to return to." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { bookmarks } = useProgress();
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-24">
      <h1 className="py-8 text-center font-display text-4xl text-foreground">{t("bookmarksTitle")}</h1>
      {bookmarks.length === 0 && (
        <p className="text-center text-muted-foreground">
          {t("bookmarksEmpty")}
        </p>
      )}
      <div className="flex flex-col gap-4">
        {bookmarks.map((b) => {
          const c = CHAPTER_LIST.find((x) => x.id === b.chapterId);
          return (
            <article key={`${b.chapterId}-${b.verseId}`} className="rounded-xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/chapter/$id"
                  params={{ id: String(b.chapterId) }}
                  hash={`v-${b.verseId}`}
                  className="font-semibold text-primary"
                >
                  {c?.transliterationName} · {b.chapterId}:{b.verseId}
                </Link>
                <button
                  onClick={() => toggleBookmark(b.chapterId, b.verseId, b.text)}
                  className="flex items-center gap-1 text-sm text-muted-foreground"
                  aria-label={t("removeBookmark")}
                >
                  <BookmarkX size={16} /> {t("remove")}
                </button>
              </div>
              <p dir="rtl" className="mt-3 font-arabic text-2xl leading-loose text-foreground">{b.text}</p>
            </article>
          );
        })}
      </div>
    </main>
  );
}
