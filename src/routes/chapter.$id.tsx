import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, Pause, Play, ChevronLeft, ChevronRight, Repeat, Download, Check, RefreshCw, Repeat1, SkipBack, SkipForward, Star, ListMusic, Loader2 } from "lucide-react";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const REPEATS = [1, 2, 3, 5, 10];
import { CHAPTER_LIST, READERS, fetchChapter, stripTashkeel, toArabicNumber, type Chapter } from "@/lib/quran";
import { useLang } from "@/lib/lang";
import { addReadingSeconds, isBookmarked, markVerseRead, toggleBookmark, useProgress } from "@/lib/progress";

import { Button } from '@/components/ui/button';
import { RECITERS, isSurahReciter, reciterById } from '@/lib/reciters';
import { SurahPlayer } from '@/components/surah-player';
import { ReciterPicker } from '@/components/reciter-picker';
import { AudioDownloads } from '@/components/audio-downloads';
import { usePreference } from '@/lib/preferences';
import { ARABIC_SIZE_MAX, ARABIC_SIZE_MIN, TRANSLATION_SIZE_MAX, TRANSLATION_SIZE_MIN, arabicTextStyle, translationTextStyle } from '@/lib/reading-size';
import { resolveAudio, audioKey, enqueueRecitations, markAudioInvalid, useOfflineAudio } from '@/lib/offline-audio';
import { Capacitor } from '@capacitor/core';
import { SleepTimerControl } from '@/components/sleep-timer-control';
import { sleepTimer } from '@/lib/sleep-timer';
import { nativeMediaStop, nativeMediaUpdate, onNativeMediaAction } from '@/lib/native-media';
import { addRecent, toggleFavorite, type RecentPlay } from '@/lib/playback-history';
import { clearMediaSession, isSystemInterruption, setMediaActionHandlers, setMediaPlaybackState, setNowPlaying, shouldAutoResume } from '@/lib/media-session';

type Search = { mode?: "learning" | "reading" | undefined; play?: 1 | undefined; source?: 'downloaded' | undefined; verse?: number | undefined; reciter?: string | undefined };

export const Route = createFileRoute("/chapter/$id")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s["mode"] === "reading" ? "reading" : undefined,
    play: s["play"] === 1 || s["play"] === "1" ? 1 : undefined,
    source: s['source'] === 'downloaded' ? 'downloaded' : undefined,
    reciter: typeof s['reciter'] === 'string' && RECITERS.some(r => r.id === s['reciter']) ? s['reciter'] : undefined,
    verse: Number.isInteger(Number(s['verse'])) && Number(s['verse']) > 0 ? Number(s['verse']) : undefined,
  }),
  head: ({ params }) => {
    const c = CHAPTER_LIST.find((x) => String(x.id) === params.id);
    const title = c ? `Surah ${c.transliterationName} (${c.name.en}) — My Quran` : "Surah — My Quran";
    const description = c ? `Read and listen to Surah ${c.transliterationName}, ${c.totalVerses} verses, with translation.` : "Read the Quran.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ChapterPage,
});

function ChapterPage() {
  const { id } = Route.useParams();
  const { mode, play: autoplay, source, verse: initialVerse, reciter: linkedReciter } = Route.useSearch();
  const navigate = useNavigate();
  const { lang, t } = useLang();
  const [savedReader, setReader] = usePreference("reciter", READERS[0]?.id ?? "Alafasy_128kbps");
  const [override, setOverride] = useState(linkedReciter);
  const reader = override ?? savedReader;
  const verseReader = isSurahReciter(reader) ? (READERS[0]?.id ?? 'Alafasy_128kbps') : reader;
  const [speed, setSpeed] = usePreference("speed", 1);
  const [repeat, setRepeat] = usePreference("repeat", 1);
  const [repeatMode, setRepeatMode] = usePreference<RepeatMode>("repeat-mode", "off");
  const [continuous, setContinuous] = usePreference("continuous", true);
  const [favorites, setFavorites] = usePreference<string[]>("reciter-favorites", []);
  const [size, setSize] = usePreference("font-size", 1);
  const [leading] = usePreference("line-spacing", 1);
  const [translationSize, setTranslationSize] = usePreference("translation-font-size", 1);
  const [q, setQ] = useState("");
  const meta = CHAPTER_LIST.find((c) => String(c.id) === id);
  const query = useQuery({ queryKey: ["chapter", id, lang], queryFn: () => fetchChapter(id, lang), staleTime: Infinity, gcTime: 60000, retry: 1 });
  const num = Number(id);

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") addReadingSeconds(15);
    }, 15000);
    return () => clearInterval(t);
  }, []);

  if (!meta) return <p className="p-10 text-center text-muted-foreground">{t("surahNotFound")}</p>;

  if (mode === "reading") {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto bg-background">
        <Link to="/chapter/$id" params={{ id }} search={{ source }} aria-label={t("learning")}
          className="fixed left-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-card/80 text-primary shadow-soft backdrop-blur">
          <ChevronLeft size={22} />
        </Link>
        <div className="px-2 py-3">
          <p className="mb-2 text-center font-arabic text-3xl text-primary">{meta.name.ar}</p>
          {query.isPending && <div className="h-64 animate-pulse rounded-xl bg-muted" />}
          {query.isError && <p role="alert" className="text-center text-destructive">{t("loadError")}</p>}
          {query.data && <Reading chapter={query.data} size={size} leading={leading} translationSize={translationSize} full />}
        </div>
      </div>
    );
  }


  return (
    <main className="mx-auto w-full min-w-0 max-w-4xl px-3 pb-24 sm:px-4">
      <div className="py-8 text-center">
        <p className="font-arabic text-5xl text-primary">{meta.name.ar}</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">{meta.transliterationName}</h1>
        <p className="text-muted-foreground">
          {meta.name[lang]} · {meta.totalVerses} {t("verses")}
        </p>
      </div>

      <div className="mb-6 grid min-w-0 grid-cols-2 items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-soft sm:flex sm:flex-wrap sm:justify-center">
        <div className="col-span-2 flex min-w-0 justify-self-center rounded-full bg-muted p-1">
          <Link to="/chapter/$id" params={{ id }} search={{ source }} className={tab(true)}>{t("learning")}</Link>
          <Link to="/chapter/$id" params={{ id }} search={{ mode: "reading", source }} className={tab(false)}>{t("reading")}</Link>
        </div>
        <div className="col-span-2 flex min-w-0 items-center gap-2">
          <div className="min-w-0 flex-1">
            <ReciterPicker value={reader} onChange={(id) => { setOverride(undefined); setReader(id); }} />
          </div>
          <Button variant="ghost" size="icon" type="button" className="min-h-11 min-w-11 shrink-0" aria-pressed={favorites.includes(reader)}
            aria-label={favorites.includes(reader) ? "Remove reciter from favourites" : "Add reciter to favourites"}
            onClick={() => setFavorites(toggleFavorite(favorites, reader))}>
            <Star size={18} className={favorites.includes(reader) ? "fill-gold text-gold" : "text-muted-foreground"} />
          </Button>
        </div>
        <select aria-label={t("speed")} value={speed} onChange={(e) => setSpeed(+e.target.value)} className="min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm">
          {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select>
        <select aria-label="Repeat each verse" value={repeat} onChange={(e) => setRepeat(+e.target.value)} className="min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm">
          {REPEATS.map((r) => <option key={r} value={r}>{r === 1 ? t("noRepeat") : t("repeatN", { n: r })}</option>)}
        </select>
        <Button variant="outline" type="button"
          aria-label={`Repeat: ${repeatMode === "ayah" ? "this verse" : repeatMode === "surah" ? "whole surah" : "off"}`}
          onClick={() => setRepeatMode(repeatMode === "off" ? "ayah" : repeatMode === "ayah" ? "surah" : "off")}
          className={`flex min-h-11 min-w-0 items-center gap-1 whitespace-normal rounded-md border px-2 py-2 text-sm ${repeatMode !== "off" ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground"}`}>
          {repeatMode === "ayah" ? <Repeat1 size={14} /> : <Repeat size={14} />}
          {repeatMode === "ayah" ? "Repeat verse" : repeatMode === "surah" ? t("loopSurah") : "Repeat off"}
        </Button>
        <Button variant="outline" type="button" aria-pressed={continuous} onClick={() => setContinuous(!continuous)}
          className={`flex min-h-11 min-w-0 items-center gap-1 whitespace-normal rounded-md border px-2 py-2 text-sm ${continuous ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background text-muted-foreground"}`}>
          <ListMusic size={14} /> Continue to next surah
        </Button>
        <SleepTimerControl chapter={num} />
        <select aria-label="Audio source" value={source ?? 'auto'} onChange={e => void navigate({ to: '/chapter/$id', params: { id }, search: { mode, source: e.target.value === 'downloaded' ? 'downloaded' : undefined } })} className="col-span-2 min-h-11 min-w-0 rounded-md border border-input bg-background px-2 py-1.5 text-sm">
          <option value="auto">Saved audio or online</option><option value="downloaded">Downloaded only</option>
        </select>
        <label className="col-span-2 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 text-sm text-muted-foreground sm:flex">
          {t("arabicSize")}
          <input aria-label={t("arabicSize")} className="min-w-0 w-full sm:w-32" type="range" min={ARABIC_SIZE_MIN} max={ARABIC_SIZE_MAX} step={0.1} value={size} onChange={(e) => setSize(+e.target.value)} />
        </label>
        {lang !== "ar" && (
          <label className="col-span-2 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-2 text-sm text-muted-foreground sm:flex">
            {t("translationSize")}
            <input aria-label={t("translationSize")} className="min-w-0 w-full sm:w-32" type="range" min={TRANSLATION_SIZE_MIN} max={TRANSLATION_SIZE_MAX} step={0.1} value={translationSize} onChange={(e) => setTranslationSize(+e.target.value)} />
          </label>
        )}
        {(
          <input aria-label={t("searchVerses")} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("searchVerses")} className="col-span-2 min-w-0 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm sm:w-auto" />
        )}
      </div>

      {isSurahReciter(reader) ? <div className="mb-6"><SurahPlayer reader={reader} chapter={num} downloadedOnly={source === 'downloaded'} /></div> : <AudioDownloads reader={reader} chapter={num} count={meta.totalVerses} />}

      {query.isPending && <div className="h-64 animate-pulse rounded-xl bg-muted" />}
      {query.isError && <div role="alert" className="space-y-3 text-center"><p className="text-destructive">{t("loadError")}</p><Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={16} />{t("retry")}</Button></div>}
      {query.data && (<Learning key={`${id}-${verseReader}-${source}`} chapter={query.data} size={size} leading={leading} translationSize={translationSize} reader={verseReader} q={q} speed={speed} repeat={repeat} repeatMode={repeatMode} autoplay={autoplay === 1} continuous={continuous} source={source} initialVerse={initialVerse} />)}

      <nav className="mt-10 flex justify-between">
        {num > 1 ? (
          <Link to="/chapter/$id" params={{ id: String(num - 1) }} search={{ mode, source }} className="flex min-h-11 items-center gap-1 py-2 text-primary"><ChevronLeft size={18} /> {t("previous")}</Link>
        ) : <span />}
        {num < 114 && (
          <Link to="/chapter/$id" params={{ id: String(num + 1) }} search={{ mode, source }} className="flex min-h-11 items-center gap-1 py-2 text-primary">{t("next")} <ChevronRight size={18} /></Link>
        )}
      </nav>
    </main>
  );
}

const tab = (active: boolean) =>
  `inline-flex items-center rounded-full px-4 py-2.5 min-h-11 text-sm font-medium transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`;

function Bismillah({ id, size, translationSize, plain = false }: { id: number; size: number; translationSize: number; plain?: boolean }) {
  if (id === 1 || id === 9) return null;
  if (plain) return <img src="/imgs/bsm-allah.svg" alt="Bismillah" className="mx-auto mb-4 max-w-full object-contain dark:invert" style={{ height: `${3 * size}rem` }} />;
  return (
    <div className="mb-6 text-center" dir="ltr">
      <img src="/imgs/bsm-allah.svg" alt="Bismillah" className="mx-auto max-w-full object-contain dark:invert" style={{ height: `${3.5 * size}rem` }} />
      <p className="mt-3 text-sm italic text-muted-foreground">Bismi Allahi alrrahmani alrraheemi</p>
      <p className="mt-1 text-foreground/85" style={translationTextStyle(translationSize)}>In the name of Allah, the Entirely Merciful, the Especially Merciful</p>
    </div>
  );
}

type RepeatMode = "off" | "ayah" | "surah";

function Learning({ chapter, size, leading, translationSize, reader, q, speed, repeat, repeatMode, autoplay, continuous, source, initialVerse }: { chapter: Chapter; size: number; leading: number; translationSize: number; reader: string; q: string; speed: number; repeat: number; repeatMode: RepeatMode; autoplay: boolean; continuous: boolean; source?: 'downloaded' | undefined; initialVerse?: number | undefined }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [pct, setPct] = useState(0);
  const [time, setTime] = useState({ at: 0, dur: 0 });
  const [loading, setLoading] = useState(false);
  const progress = useProgress();
  const { t } = useLang();
  const navigate = useNavigate();
  const offline = useOfflineAudio();
  const [recent, setRecent] = usePreference<RecentPlay[]>("recent-plays", []);
  const recentRef = useRef(recent);
  recentRef.current = recent;
  const [audioError, setAudioError] = useState('');
  const request = useRef(0);
  const release = useRef<() => void>(() => {});
  // Phone-call / audio-focus interruption tracking.
  const interrupted = useRef<number | null>(null);
  const currentVerse = useRef<number | null>(null);
  const interruptedVerse = useRef<number | null>(null);
  const userPause = useRef(false);
  const playingRef = useRef<number | null>(null);
  playingRef.current = playing;
  const reciterName = READERS.find(r => r.id === reader)?.name ?? reader;
  const title = (vid: number) => `${chapter.transliteration} · ${chapter.id}:${vid}`;

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) markVerseRead(chapter.id, Number((e.target as HTMLElement).dataset["verse"]));
        }),
      { threshold: 0.6 },
    );
    document.querySelectorAll("[data-verse]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [chapter.id, q]);

  useEffect(() => {
    const h = window.location.hash;
    if (h) document.getElementById(h.slice(1))?.scrollIntoView({ block: "center" });
  }, [chapter.id]);
  const s = stripTashkeel(q.trim().toLowerCase());
  const verses = chapter.verses.filter(
    (v) => !s || stripTashkeel(v.text).includes(s) || v.translation?.toLowerCase().includes(s) || v.transliteration.toLowerCase().includes(s),
  );

  const opts = useRef({ speed, repeat, repeatMode, continuous });
  opts.current = { speed, repeat, repeatMode, continuous };
  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => () => { request.current++; audio.current?.pause(); release.current(); clearMediaSession(); nativeMediaStop(); }, []);

  const pauseNow = () => {
    request.current++;
    userPause.current = true;
    interrupted.current = null;
    audio.current?.pause();
    setPlaying(null);
    setMediaPlaybackState('paused');
    sleepTimer.playbackPaused();
    if (currentVerse.current !== null) nativeMediaUpdate({ title: title(currentVerse.current), artist: reciterName, playing: false, position: audio.current?.currentTime, duration: audio.current?.duration });
  };
  const stopAll = () => {
    pauseNow();
    if (audio.current) audio.current.volume = 1;
    setMediaPlaybackState('none');
  };
  const resumeInPlace = () => {
    const el = audio.current;
    const vid = currentVerse.current;
    if (el && el.paused && !el.ended && vid !== null) {
      ++request.current; // pauseNow bumped the token; re-arm handlers for this element
      userPause.current = false;
      void play(vid, 1, true, el.currentTime);
    } else if (vid !== null) void play(vid, 1, true);
  };
  const step = (dir: 1 | -1) => {
    const vid = currentVerse.current ?? chapter.verses[0]?.id ?? 1;
    const target = chapter.verses.find(v => v.id === vid + dir);
    if (target) { void play(target.id, 1, true); return; }
    if (dir === 1 && chapter.id < 114) void navigate({ to: "/chapter/$id", params: { id: String(chapter.id + 1) }, search: { play: 1, source } });
    if (dir === -1 && chapter.id > 1) void navigate({ to: "/chapter/$id", params: { id: String(chapter.id - 1) }, search: { source } });
  };
  const actions = useRef({ play: resumeInPlace, pause: pauseNow, next: () => step(1), previous: () => step(-1) });
  actions.current = { play: resumeInPlace, pause: pauseNow, next: () => step(1), previous: () => step(-1) };

  // Android foreground-service controls (notification, lock screen, audio focus).
  useEffect(() => onNativeMediaAction((a) => actions.current[a]()), []);
  // Sleep timer reached zero (volume already faded by timeupdate).
  useEffect(() => sleepTimer.onExpire(() => { stopAll(); }), []);
  // Arrived via "next surah" during continuous playback.
  useEffect(() => { const verse = chapter.verses.find(v => v.id === initialVerse) ?? chapter.verses[0]; if (autoplay && verse) void play(verse.id, 1, true); }, []);

  // Resume safely when a system interruption (phone call, audio-focus loss) ends.
  useEffect(() => {
    const resume = () => {
      const a = audio.current;
      if (!shouldAutoResume(interrupted.current, a)) { interrupted.current = null; return; }
      interrupted.current = null;
      const vid = interruptedVerse.current;
      void a?.play().then(() => {
        if (vid !== null) setPlaying(vid);
        setMediaPlaybackState('playing');
      }).catch(() => { setMediaPlaybackState('paused'); });
    };
    const onVisibility = () => { if (document.visibilityState === 'visible') resume(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', resume);
    let removeAppListener: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      void import('@capacitor/app').then(({ App }) =>
        App.addListener('resume', resume).then(h => { removeAppListener = () => void h.remove(); }),
      );
    }
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', resume);
      removeAppListener?.();
    };
  }, []);

  const onSurahEnd = () => {
    if (sleepTimer.surahEnded(chapter.id)) return; // expiry listener stops playback
    if (opts.current.repeatMode === "surah" && chapter.verses[0]) { void play(chapter.verses[0].id, 1, true); return; }
    if (opts.current.continuous && chapter.id < 114) {
      void navigate({ to: "/chapter/$id", params: { id: String(chapter.id + 1) }, search: { play: 1, source } });
      return;
    }
    setPlaying(null); release.current(); setMediaPlaybackState('none'); nativeMediaStop();
  };

  const play = async (vid: number, count = 1, restart = false, resumeAt?: number) => {
    if (count === 1 && playing === vid && !restart) { pauseNow(); return; }
    const token = ++request.current;
    userPause.current = false;
    interrupted.current = null;
    currentVerse.current = vid;
    setCurrent(vid);
    setAudioError('');
    let a: HTMLAudioElement;
    if (resumeAt !== undefined && audio.current) {
      a = audio.current;
    } else {
      audio.current?.pause();
      setPlaying(null);
      release.current();
      setPct(0);
      setTime({ at: 0, dur: 0 });
      setLoading(true);
      try {
        const recording = await resolveAudio(reader, chapter.id, vid, source ?? 'auto');
        if (token !== request.current) { recording.release(); return; }
        release.current = recording.release;
        a = new Audio(recording.url);
      } catch (error) {
        if (token === request.current) { setLoading(false); setPlaying(null); setAudioError(error instanceof Error ? error.message : t("audioRetry")); }
        return;
      }
    }
    try {
      a.playbackRate = opts.current.speed;
      a.volume = sleepTimer.check();
      a.onended = () => {
        if (token !== request.current) return;
        if (opts.current.repeatMode === "ayah" || count < opts.current.repeat) { void play(vid, count + 1, true); return; }
        const next = chapter.verses.find(v => v.id === vid + 1);
        if (next) void play(next.id, 1, true);
        else onSurahEnd();
      };
      a.ontimeupdate = () => {
        if (token !== request.current) return;
        setPct(a.duration ? (a.currentTime / a.duration) * 100 : 0);
        setTime({ at: a.currentTime, dur: Number.isFinite(a.duration) ? a.duration : 0 });
        // Background-safe sleep timer check + fade-out.
        const v = sleepTimer.check();
        if (token === request.current) a.volume = v;
      };
      a.onerror = () => { if (token === request.current) { setLoading(false); setPlaying(null); setAudioError(t("audioError")); setMediaPlaybackState('none'); if (a.error?.code === 3 || a.error?.code === 4) void markAudioInvalid(audioKey(reader, chapter.id, vid)); } };
      a.onpause = () => {
        // A pause we did not request and that is not the natural end of the
        // track means the system took audio focus (phone call, other app).
        if (!isSystemInterruption({ superseded: token !== request.current, ended: a.ended, userInitiated: userPause.current })) return;
        interrupted.current = Date.now();
        interruptedVerse.current = vid;
        setPlaying(null);
        setMediaPlaybackState('paused');
        sleepTimer.playbackPaused();
        nativeMediaUpdate({ title: title(vid), artist: reciterName, playing: false, position: a.currentTime, duration: a.duration });
      };
      // The system (or lock-screen control) resumed the element itself.
      a.onplay = () => {
        if (token !== request.current) return;
        interrupted.current = null;
        userPause.current = false;
        setPlaying(vid);
        setMediaPlaybackState('playing');
        sleepTimer.playbackResumed();
      };
      // Verse-by-verse reciters: recite A'udhu billah (only if this reciter recorded it), then the Bismillah, before verse 1.
      const starting = resumeAt === undefined && count === 1 && vid === chapter.verses[0]?.id;
      const prerolls: (() => Promise<{ url: string; release: () => void }>)[] = [];
      const istiadha = reciterById(reader)?.istiadhaUrl;
      if (starting && istiadha && source !== 'downloaded') prerolls.push(async () => ({ url: istiadha, release: () => {} }));
      if (starting && chapter.id !== 1 && chapter.id !== 9) prerolls.push(() => resolveAudio(reader, 1, 1, source ?? 'auto'));
      for (const next of prerolls) {
        try {
          const b = await next();
          if (token !== request.current) { b.release(); return; }
          const pre = new Audio(b.url);
          pre.playbackRate = opts.current.speed;
          pre.volume = sleepTimer.check();
          audio.current = pre;
          await new Promise<void>((done) => { pre.onended = () => done(); pre.onerror = () => done(); void pre.play().then(() => { setLoading(false); setPlaying(vid); }).catch(() => done()); });
          b.release();
          if (token !== request.current) return;
        } catch { /* Pre-roll unavailable (e.g. offline, not downloaded): continue. */ }
      }
      audio.current = a;
      if (resumeAt !== undefined) a.currentTime = resumeAt;
      await a.play();
      setLoading(false);
      if (token !== request.current) { a.pause(); return; }
      setPlaying(vid);
      sleepTimer.playbackResumed();
      markVerseRead(chapter.id, vid);
      setRecent(addRecent(recentRef.current, { reader, chapter: chapter.id, verse: vid, at: Date.now() }));
      // Lock-screen / media-notification controls.
      setNowPlaying({ title: title(vid), artist: reciterName, album: 'My Quran' });
      setMediaPlaybackState('playing');
      nativeMediaUpdate({ title: title(vid), artist: reciterName, playing: true, position: a.currentTime, duration: a.duration });
      setMediaActionHandlers({
        onPlay: () => actions.current.play(),
        onPause: () => actions.current.pause(),
        onNext: () => actions.current.next(),
        onPrevious: () => actions.current.previous(),
      });
      if (resumeAt === undefined) {
        const el = document.getElementById(`v-${vid}`);
        if (el) el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      }
    } catch (error) {
      if (token === request.current) { setLoading(false); setPlaying(null); setAudioError(error instanceof Error ? error.message : t("audioRetry")); }
    }
  };

  const seek = (seconds: number) => {
    const a = audio.current;
    if (!a || !Number.isFinite(a.duration)) return;
    a.currentTime = Math.min(Math.max(0, seconds), a.duration);
    setTime({ at: a.currentTime, dur: a.duration });
  };
  const togglePlay = () => {
    if (playing !== null) pauseNow();
    else if (current !== null) resumeInPlace();
    else if (chapter.verses[0]) void play(chapter.verses[0].id, 1, true);
  };

  // Tap a verse: jump the recitation to the very beginning of that verse.
  const seekTo = (vid: number) => { void play(vid, 1, true); };

  return (

    <div className="flex flex-col gap-4">
      <PlayerBar chapterId={chapter.id} verse={current} total={chapter.verses.length} playing={playing !== null} loading={loading} at={time.at} dur={time.dur}
        onToggle={togglePlay} onPrev={() => step(-1)} onNext={() => step(1)} onSeek={seek} />
      {audioError && <p role="alert" className="text-center text-sm text-destructive">{audioError}</p>}
      {!s && <Bismillah id={chapter.id} size={size} translationSize={translationSize} />}
      {verses.length === 0 && <p className="text-center text-muted-foreground">{t("noVerses")}</p>}
      {verses.map((v) => {
        const on = playing === v.id;
        const downloaded = offline.records.some(r => r.key === audioKey(reader,chapter.id,v.id) && r.status === "downloaded");
        return (
        <article id={`v-${v.id}`} data-verse={v.id} key={v.id} aria-current={on ? "true" : undefined} role="button" tabIndex={0} aria-label={`Verse ${v.id}. Activate to play from the beginning.`} onClick={() => seekTo(v.id)} onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seekTo(v.id); } }} className={`relative min-w-0 scroll-mt-24 cursor-pointer overflow-hidden rounded-xl border p-3 shadow-soft transition-all duration-300 sm:p-6 ${on ? "border-primary bg-primary/10 ring-2 ring-primary/40" : "border-border bg-card hover:border-primary/50 hover:bg-primary/5"}`}>
          {on && (
            <div className="absolute inset-x-0 top-0 h-1 bg-primary/20">
              <div className="h-full bg-primary transition-[width] duration-200 ease-linear" style={{ width: `${pct}%` }} />
            </div>
          )}
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:gap-6" dir="rtl">
            <p className={`min-w-0 [overflow-wrap:anywhere] font-arabic transition-colors ${on ? "text-primary" : "text-foreground"}`} style={arabicTextStyle(size, leading)}>
              {v.text}
            </p>
            <span className="shrink-0 text-sm text-primary">{chapter.id}:{v.id}</span>
          </div>
          <p className="mt-3 break-words text-sm italic text-muted-foreground">{v.transliteration}</p>
          {!v.translation && <p className="mt-2 text-xs text-muted-foreground">{t("noTranslation")}</p>}
          {v.translation && <p className={`mt-2 break-words ${on ? "text-foreground" : "text-foreground/85"}`} style={translationTextStyle(translationSize)}>{v.translation}</p>}
          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3" role="group" aria-label="Verse actions" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={() => void play(v.id)} className="flex min-h-11 items-center gap-2 text-sm text-primary" aria-label={`Play verse ${v.id}`}>
              {playing === v.id ? <Pause size={16} /> : <Play size={16} />} {playing === v.id ? t("pause") : t("listen")}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleBookmark(chapter.id, v.id, v.text)} className="flex min-h-11 items-center gap-2 text-sm text-primary" aria-label={`Bookmark verse ${v.id}`}>

              {isBookmarked(progress, chapter.id, v.id) ? <><BookmarkCheck size={16} /> {t("saved")}</> : <><Bookmark size={16} /> {t("save")}</>}
            </Button>
            <Button variant="ghost" size="sm" aria-label={`Download verse ${v.id}`} className="min-h-11" disabled={downloaded || offline.records.some(r => r.key === audioKey(reader,chapter.id,v.id) && ['queued','downloading'].includes(r.status)) || !offline.online} onClick={() => void enqueueRecitations(reader, chapter.id, [v.id]).catch(error => setAudioError(String(error)))}>
              {downloaded ? <Check size={16} /> : <Download size={16} />}{downloaded ? t("downloaded") : t("download")}
            </Button>
          </div>
        </article>
        );
      })}
    </div>
  );
}

function Reading({ chapter, size, leading, translationSize, full = false }: { chapter: Chapter; size: number; leading: number; translationSize: number; full?: boolean }) {
  const progress = useProgress();
  const { t } = useLang();
  return (
    <div className={full ? "min-w-0 px-1" : "mushaf min-w-0 rounded-xl border border-border bg-card p-3 shadow-soft sm:p-6 md:p-10"} dir="rtl">
      <Bismillah id={chapter.id} size={size} translationSize={translationSize} plain={full} />
      <p dir="auto" className="mb-3 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Bookmark size={13} aria-hidden /> {t("tapToBookmark")}
      </p>
      <p className="min-w-0 [overflow-wrap:anywhere] font-arabic text-justify text-foreground" style={{ ...arabicTextStyle(size, leading, 2.1, 3.6), textAlignLast: "center" }}>
        {chapter.verses.map((v) => {
          const marked = isBookmarked(progress, chapter.id, v.id);
          return (
            <span key={v.id} className={marked ? "rounded-md bg-gold/15" : undefined}>
              {v.text}{" "}
              <button
                type="button"
                onClick={() => toggleBookmark(chapter.id, v.id, v.text)}
                aria-pressed={marked}
                aria-label={`${marked ? t("saved") : t("save")} ${chapter.id}:${v.id}`}
                className={`mx-1 inline-flex items-center gap-0.5 rounded-full px-1 align-baseline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${marked ? "text-gold" : "text-primary hover:bg-primary/10"}`}
              >
                ﴿{toArabicNumber(v.id)}﴾
                {marked && <BookmarkCheck size={14} aria-hidden className="shrink-0" />}
              </button>
            </span>
          );
        })}
      </p>
    </div>
  );
}

function fmt(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  return `${m}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

function PlayerBar({ chapterId, verse, total, playing, loading, at, dur, onToggle, onPrev, onNext, onSeek }: { chapterId: number; verse: number | null; total: number; playing: boolean; loading: boolean; at: number; dur: number; onToggle: () => void; onPrev: () => void; onNext: () => void; onSeek: (s: number) => void }) {
  return (
    <div role="region" aria-label="Recitation player" className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 order-last rounded-2xl border border-gold/40 bg-card/95 p-3 shadow-soft backdrop-blur md:bottom-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Previous verse" onClick={onPrev}><SkipBack size={20} /></Button>
        <Button size="icon" className="min-h-12 min-w-12 rounded-full" aria-label={playing ? "Pause" : "Play"} onClick={onToggle} disabled={loading}>
          {loading ? <Loader2 size={22} className="animate-spin" /> : playing ? <Pause size={22} /> : <Play size={22} />}
        </Button>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-label="Next verse" onClick={onNext}><SkipForward size={20} /></Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {verse === null ? "Tap play to start" : `${chapterId}:${verse}`}
            <span className="text-muted-foreground"> · {verse ?? 0}/{total}</span>
          </p>
          <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
            <span>{fmt(at)}</span>
            <input type="range" aria-label="Seek within verse" min={0} max={dur || 0} step={0.1} value={Math.min(at, dur || 0)} disabled={!dur}
              onChange={(e) => onSeek(+e.target.value)} className="min-w-0 flex-1 accent-primary" />
            <span>{fmt(dur)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
