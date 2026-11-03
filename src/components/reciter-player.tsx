import { useEffect, useRef, useState } from "react";
import { Loader2, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHAPTER_LIST } from "@/lib/quran";
import { resolveAudio } from "@/lib/offline-audio";
import { reciterById, WHOLE_SURAH } from "@/lib/reciters";

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

/** Docked player for a reciter: plays saved files first, streams only when online. */
export function ReciterPlayer({ reader, chapter, onChapter, onClose }: { reader: string; chapter: number; onChapter: (c: number) => void; onClose: () => void }) {
  const reciter = reciterById(reader);
  const meta = CHAPTER_LIST.find((c) => c.id === chapter);
  const audio = useRef<HTMLAudioElement>(null);
  const [verse, setVerse] = useState(reciter?.kind === "surah" ? WHOLE_SURAH : 1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => { setVerse(reciter?.kind === "surah" ? WHOLE_SURAH : 1); }, [chapter, reader]);

  useEffect(() => {
    let release = () => {};
    let cancelled = false;
    setLoading(true); setError(""); setTime(0);
    resolveAudio(reader, chapter, verse).then((r) => {
      if (cancelled) { r.release(); return; }
      release = r.release;
      const el = audio.current; if (!el) return;
      el.src = r.url;
      void el.play().catch(() => setPlaying(false));
    }).catch((e) => { if (!cancelled) { setError(e instanceof Error ? e.message : "Cannot play this surah."); setLoading(false); setPlaying(false); } });
    return () => { cancelled = true; audio.current?.pause(); release(); };
  }, [reader, chapter, verse]);

  const next = () => {
    if (reciter?.kind === "ayah" && meta && verse < meta.totalVerses) setVerse(verse + 1);
    else if (chapter < 114) onChapter(chapter + 1);
    else setPlaying(false);
  };

  if (!reciter || !meta) return null;
  return (
    <div className="player-dock fixed inset-x-0 z-40 border-t border-border bg-card/95 px-4 py-3 shadow-soft backdrop-blur">
      <audio ref={audio} preload="auto"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={next}
        onCanPlay={() => setLoading(false)} onWaiting={() => setLoading(true)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        onError={() => { setError("This recording could not be played."); setLoading(false); }} />
      <div className="mx-auto flex max-w-4xl items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{meta.id}. {meta.transliterationName}{verse > 0 ? ` · ${verse}` : ""}</p>
          <p className="truncate text-xs text-muted-foreground">{error || reciter.name}</p>
        </div>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Previous surah" disabled={chapter <= 1} onClick={() => onChapter(chapter - 1)}><SkipBack size={18} /></Button>
        <Button size="icon" className="min-h-12 min-w-12 rounded-full" aria-label={playing ? "Pause" : "Play"} disabled={!!error}
          onClick={() => { const el = audio.current; if (!el) return; if (el.paused) void el.play().catch(() => {}); else el.pause(); }}>
          {loading && !error ? <Loader2 size={20} className="animate-spin" /> : playing ? <Pause size={20} /> : <Play size={20} />}
        </Button>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Next surah" disabled={chapter >= 114} onClick={() => onChapter(chapter + 1)}><SkipForward size={18} /></Button>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Close player" onClick={onClose}><X size={18} /></Button>
      </div>
      <div className="mx-auto mt-1 flex max-w-4xl items-center gap-2 text-xs tabular-nums text-muted-foreground">
        <span>{fmt(time)}</span>
        <input type="range" aria-label="Seek" min={0} max={duration || 0} step={1} value={time} className="h-1 flex-1 accent-primary"
          onChange={(e) => { if (audio.current) audio.current.currentTime = Number(e.target.value); }} />
        <span>{fmt(duration)}</span>
      </div>
    </div>
  );
}
