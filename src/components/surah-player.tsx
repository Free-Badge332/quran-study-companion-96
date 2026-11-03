import { useEffect, useRef, useState } from "react";
import { Check, Download, Loader2, Pause, Play, RotateCcw, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { audioKey, deleteRecording, enqueueRecitations, initializeAudio, markAudioInvalid, resolveAudio, useOfflineAudio } from "@/lib/offline-audio";
import { reciterById, WHOLE_SURAH } from "@/lib/reciters";

const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
const SPEEDS = [0.75, 1, 1.25, 1.5];

/** Player for reciters published as one recording per surah. */
export function SurahPlayer({ reader, chapter, downloadedOnly }: { reader: string; chapter: number; downloadedOnly?: boolean | undefined }) {
  const reciter = reciterById(reader);
  const { records, online } = useOfflineAudio();
  const audio = useRef<HTMLAudioElement>(null);
  const release = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");
  const key = audioKey(reader, chapter, WHOLE_SURAH);
  const record = records.find((r) => r.key === key);
  const saved = record?.status === "downloaded";
  const pending = record && ["queued", "downloading"].includes(record.status);

  useEffect(() => { void initializeAudio().catch(() => {}); }, []);
  // New surah or reciter: drop the previous recording.
  useEffect(() => () => { audio.current?.pause(); release.current(); release.current = () => {}; setReady(false); setPlaying(false); setTime(0); setDuration(0); }, [reader, chapter]);

  async function toggle() {
    const el = audio.current; if (!el) return;
    setError("");
    if (playing) { el.pause(); return; }
    try {
      if (!ready) {
        setLoading(true);
        const rec = await resolveAudio(reader, chapter, WHOLE_SURAH, downloadedOnly ? "downloaded" : "auto");
        release.current(); release.current = rec.release;
        el.src = rec.url; setReady(true);
      }
      el.playbackRate = speed;
      await el.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not play this recitation.");
    } finally { setLoading(false); }
  }
  const seek = (delta: number) => { const el = audio.current; if (el && ready) el.currentTime = Math.max(0, Math.min(el.duration || 0, el.currentTime + delta)); };

  if (!reciter) return null;
  return (
    <section aria-label="Whole surah recitation" className="mb-6 rounded-xl border border-border bg-card p-4 shadow-soft">
      <audio ref={audio} preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={(e) => { setPlaying(false); setLoading(false); if (e.currentTarget.src) { setError(saved ? "The saved file cannot be played. Download it again." : "Could not load this recitation. Check your connection."); if (saved) void markAudioInvalid(key); setReady(false); } }} />
      <div className="flex items-center gap-3">
        <Button size="icon" className="h-12 w-12 shrink-0 rounded-full" aria-label={playing ? "Pause recitation" : "Play recitation"} disabled={loading} onClick={() => void toggle()}>
          {loading ? <Loader2 className="animate-spin" /> : playing ? <Pause /> : <Play />}
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{reciter.name}</p>
          <p className="truncate text-xs text-muted-foreground">{saved ? "Saved on this device" : online ? "Online · not downloaded" : "Offline · not downloaded"} · {reciter.riwayah}</p>
        </div>
        {saved ? (
          <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Delete saved recitation" onClick={() => { if (window.confirm("Delete this saved recitation?")) void deleteRecording(key); }}><Trash2 size={18} /></Button>
        ) : (
          <Button variant="outline" size="icon" className="min-h-11 min-w-11" aria-label="Download whole surah" disabled={!online || !!pending} onClick={() => void enqueueRecitations(reader, chapter, [WHOLE_SURAH]).catch((e) => setError(e instanceof Error ? e.message : "Download failed."))}>
            {pending ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          </Button>
        )}
      </div>
      <input type="range" aria-label="Seek" min={0} max={duration || 0} step={1} value={time} disabled={!ready} onChange={(e) => { if (audio.current) audio.current.currentTime = +e.target.value; }} className="mt-4 w-full accent-primary" />
      <div className="mt-1 flex items-center justify-between gap-2 text-xs tabular-nums text-muted-foreground">
        <span>{fmt(time)}</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Back 10 seconds" disabled={!ready} onClick={() => seek(-10)}><RotateCcw size={18} /></Button>
          <select aria-label="Playback speed" value={speed} onChange={(e) => { setSpeed(+e.target.value); if (audio.current) audio.current.playbackRate = +e.target.value; }} className="min-h-11 rounded-md border border-input bg-background px-2 text-sm text-foreground">
            {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
          <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Forward 10 seconds" disabled={!ready} onClick={() => seek(10)}><RotateCw size={18} /></Button>
        </div>
        <span>{fmt(duration)}</span>
      </div>
      {pending && <progress className="mt-2 h-1 w-full accent-primary" aria-label="Download progress" max={record?.total_bytes ?? 1} value={record?.total_bytes ? record.bytes : undefined} />}
      {saved && <p className="mt-1 flex items-center gap-1 text-xs text-primary"><Check size={12} />Plays without internet</p>}
      {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    </section>
  );
}
