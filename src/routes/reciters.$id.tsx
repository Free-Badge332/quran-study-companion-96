import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Download, ExternalLink, Pause, Play, Star } from "lucide-react";
import { ReciterPlayer } from "@/components/reciter-player";
import { Button } from "@/components/ui/button";
import { CHAPTER_LIST } from "@/lib/quran";
import { usePreference } from "@/lib/preferences";
import { toggleFavorite } from "@/lib/playback-history";
import { enqueueRecitations, initializeAudio, useOfflineAudio } from "@/lib/offline-audio";
import { downloadedSurahs, isFullSurah, reciterById } from "@/lib/reciters";

export const Route = createFileRoute("/reciters/$id")({
  loader: ({ params }) => { const r = reciterById(params.id); if (!r) throw notFound(); return r; },
  head: ({ loaderData }) => ({ meta: [
    { title: loaderData ? `${loaderData.name} — Reciters — My Quran` : "Reciter — My Quran" },
    { name: "description", content: loaderData ? `Listen to and download ${loaderData.name}'s recitation offline, with source attribution.` : "Quran reciter." },
    { property: "og:title", content: loaderData ? `${loaderData.name} — My Quran` : "Reciter — My Quran" },
    { property: "og:description", content: "Quran recitation with source, audio quality and offline downloads." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ReciterPage,
});

function ReciterPage() {
  const r = Route.useLoaderData();
  const { records, online } = useOfflineAudio();
  const [preferred, setPreferred] = usePreference("reciter", r.id);
  const [favorites, setFavorites] = usePreference<string[]>("reciter-favorites", []);
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [nowPlaying, setNowPlaying] = useState<number | null>(null);
  useEffect(() => { void initializeAudio().catch(() => {}); }, []);
  const saved = new Map(downloadedSurahs(records.filter((x) => x.reader === r.id)).map((d) => [d.chapter, d]));
  const fav = favorites.includes(r.id);
  const surahs = CHAPTER_LIST.filter((c) => `${c.id} ${c.transliterationName} ${c.name.ar}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <main className={`mx-auto max-w-4xl px-4 ${nowPlaying ? "pb-44" : "pb-24"}`}>
      <header className="py-4">
        <h1 className="font-display text-3xl text-foreground">{r.name}</h1>
        <p className="font-arabic text-2xl text-primary">{r.arabicName}</p>
        <p className="mt-1 text-sm text-muted-foreground">{r.style} · {r.quality} · {r.riwayah}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {preferred === r.id ? <span className="flex min-h-9 items-center gap-1 text-sm text-primary"><Check size={16} />Your preferred reciter</span>
            : <Button size="sm" onClick={() => setPreferred(r.id)}>Make preferred</Button>}
          <Button variant="outline" size="sm" aria-pressed={fav} onClick={() => setFavorites(toggleFavorite(favorites, r.id))}><Star size={16} className={fav ? "fill-gold text-gold" : ""} />{fav ? "Favourite" : "Add to favourites"}</Button>
        </div>
      </header>

      <section className="space-y-2 border-y border-border py-4 text-sm">
        <h2 className="font-medium text-foreground">Source & attribution</h2>
        <p className="text-muted-foreground">Recordings: <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary">{r.source} <ExternalLink size={12} /></a></p>
        <p className="text-muted-foreground">{r.licensing}</p>
        <h2 className="pt-2 font-medium text-foreground">Biography</h2>
        <p className="text-muted-foreground">{r.bio ? <>{r.bio.text} <span className="text-xs">({r.bio.citation})</span></> : "A verified biography is not available yet."}</p>
      </section>

      <section className="py-5">
        <h2 className="mb-3 font-medium text-foreground">Surahs</h2>
        <input aria-label="Search surahs" placeholder="Search surah" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3 min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground" />
        {error && <p role="alert" className="mb-2 text-sm text-destructive">{error}</p>}
        <ul className="divide-y divide-border">
          {surahs.map((c) => {
            const d = saved.get(c.id); const full = !!d && isFullSurah(d, c.totalVerses); const active = nowPlaying === c.id;
            return (
              <li key={c.id} className="flex items-center gap-2 py-2">
                <Button variant={active ? "default" : "outline"} size="icon" className="min-h-11 min-w-11 rounded-full" disabled={!full && !online} aria-label={`${active ? "Stop" : "Play"} ${c.transliterationName}`} onClick={() => setNowPlaying(active ? null : c.id)}>{active ? <Pause size={16} /> : <Play size={16} />}</Button>
                <Link to="/chapter/$id" params={{ id: String(c.id) }} search={full ? { source: "downloaded", reciter: r.id } : { reciter: r.id }} onClick={() => setPreferred(r.id)} className="min-w-0 flex-1 py-1">
                  <span className="block font-medium text-foreground">{c.id}. {c.transliterationName}</span>
                  <span className="block text-xs text-muted-foreground">{full ? `Downloaded · ${((d?.bytes ?? 0) / 1048576).toFixed(1)} MB` : d ? `${d.count}/${c.totalVerses} ayahs saved` : online ? `${c.totalVerses} ayahs · stream` : "Not downloaded"}</span>
                </Link>
                {full ? <Check size={18} aria-label="Downloaded" className="text-primary" />
                  : <Button variant="ghost" size="icon" className="min-h-11 min-w-11" disabled={!online} aria-label={`Download ${c.transliterationName}`}
                      onClick={() => { setError(""); void enqueueRecitations(r.id, c.id, Array.from({ length: c.totalVerses }, (_, i) => i + 1)).catch((e) => setError(e instanceof Error ? e.message : "Download failed.")); }}><Download size={16} /></Button>}
              </li>
            );
          })}
        </ul>
      </section>
      {nowPlaying && <ReciterPlayer reader={r.id} chapter={nowPlaying} onChapter={setNowPlaying} onClose={() => setNowPlaying(null)} />}
    </main>
  );
}
