import { useNavigate } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { CHAPTER_LIST } from "@/lib/quran";
import { reciterById } from "@/lib/reciters";
import { usePreference } from "@/lib/preferences";
import type { RecentPlay } from "@/lib/playback-history";
import { useLang } from "@/lib/lang";

/** Latest recitation the user played, with a one-tap resume. Hidden until something was played. */
export function RecentlyPlayed() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [recent] = usePreference<RecentPlay[]>("recent-plays", []);
  const [, setReader] = usePreference<string>("reciter", "");
  const last = recent[0];
  const meta = last ? CHAPTER_LIST.find((c) => c.id === last.chapter) : undefined;
  if (!last || !meta) return null;
  const reciter = reciterById(last.reader);
  return (
    <section aria-labelledby="recently-played" className="surface-card flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <h2 id="recently-played" className="text-xs text-muted-foreground">{t("recentlyPlayed")}</h2>
        <p className="truncate font-semibold text-foreground">{meta.transliterationName} · {t("verseN", { n: last.verse })}</p>
        <p className="truncate text-xs text-muted-foreground">{reciter?.name ?? last.reader}</p>
      </div>
      <button
        type="button"
        aria-label={`${t("resumeListening")}: ${meta.transliterationName}`}
        onClick={() => { setReader(last.reader); void navigate({ to: "/chapter/$id", params: { id: String(last.chapter) } }); }}
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-soft transition active:scale-95"
      >
        <Play size={20} className="translate-x-0.5" />
      </button>
    </section>
  );
}
