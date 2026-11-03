import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, ChevronRight, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CHAPTER_LIST } from "@/lib/quran";
import { usePreference } from "@/lib/preferences";
import { toggleFavorite, sortReciters, type RecentPlay } from "@/lib/playback-history";
import { FEATURED_IDS, RECITERS, reciterById, searchReciters, type Reciter } from "@/lib/reciters";

export const Route = createFileRoute("/reciters/")({
  head: () => ({ meta: [
    { title: "Reciters — My Quran" },
    { name: "description", content: "Browse over 170 Quran reciters, save favourites and listen offline." },
    { property: "og:title", content: "Reciters — My Quran" },
    { property: "og:description", content: "Quran reciters with search, favourites and offline listening." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: RecitersPage,
});

type Tab = "all" | "favorites";

function RecitersPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [preferred] = usePreference("reciter", RECITERS[0]?.id ?? "");
  const [favorites, setFavorites] = usePreference<string[]>("reciter-favorites", []);
  const [recent] = usePreference<RecentPlay[]>("recent-plays", []);
  const list = useMemo(() => sortReciters(searchReciters(RECITERS, query, tab, favorites), favorites), [query, tab, favorites]);
  const featured = FEATURED_IDS.map(reciterById).filter((r): r is Reciter => !!r);

  return (
    <main className="mx-auto max-w-4xl px-4 pb-24">
      <header className="pb-4 pt-5">
        <h1 className="font-display text-3xl text-foreground">Reciters</h1>
        <p className="text-sm text-muted-foreground">{RECITERS.length} reciters · your choices stay on this device</p>
      </header>

      <div className="sticky top-[calc(var(--header-height)+var(--safe-top))] z-10 -mx-4 bg-background/95 px-4 pb-3 pt-1 backdrop-blur">
        <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-input bg-card px-4 shadow-soft">
          <Search size={18} className="text-muted-foreground" />
          <input aria-label="Search reciters" placeholder="Search name, Arabic or riwayah" value={query} onChange={(e) => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none" />
        </label>
        <div role="tablist" className="mt-3 flex gap-2">
          {([["all", "All"], ["favorites", `Favourites${favorites.length ? ` (${favorites.length})` : ""}`]] as [Tab, string][]).map(([id, label]) => (
            <Button key={id} role="tab" aria-selected={tab === id} variant={tab === id ? "default" : "outline"} size="sm" className="rounded-full" onClick={() => setTab(id)}>{label}</Button>
          ))}
        </div>
      </div>

      {tab === "all" && !query && (
        <section className="mt-2">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Featured from Sudan</h2>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((r) => (
              <Link key={r.id} to="/reciters/$id" params={{ id: r.id }} className="rounded-2xl border border-border bg-card p-4 shadow-soft hover:border-primary">
                <span className="block font-arabic text-xl text-primary">{r.arabicName}</span>
                <span className="mt-1 block text-sm font-semibold leading-tight text-foreground">{r.name}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{r.riwayah}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ul className="mt-4 divide-y divide-border">
        {list.map((r) => {
          const fav = favorites.includes(r.id);
          return (
            <li key={r.id} className="flex items-center gap-2 py-3">
              <Link to="/reciters/$id" params={{ id: r.id }} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary font-display text-lg text-primary">{r.name.replace(/^Sheikh\s+/i, "").charAt(0)}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">{r.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.arabicName} · {r.riwayah}</span>
                </span>
              </Link>
              {preferred === r.id && <Check size={16} aria-label="Preferred" className="shrink-0 text-primary" />}
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-pressed={fav} aria-label={`${fav ? "Remove" : "Add"} ${r.name} ${fav ? "from" : "to"} favourites`} onClick={() => setFavorites(toggleFavorite(favorites, r.id))}>
                <Star size={18} className={fav ? "fill-gold text-gold" : "text-muted-foreground"} />
              </Button>
              <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
            </li>
          );
        })}
      </ul>
      {!list.length && <p className="py-8 text-center text-sm text-muted-foreground">{tab === "favorites" && !query ? "Tap the star next to a reciter to add a favourite." : "No reciters match."}</p>}

      {recent.length > 0 && tab === "all" && !query && (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-2xl text-foreground">Recently played</h2>
          <ul className="divide-y divide-border">
            {recent.map((p) => (
              <li key={`${p.reader}/${p.chapter}/${p.verse}/${p.at}`}>
                <Link to="/chapter/$id" params={{ id: String(p.chapter) }} search={{ verse: p.verse, reciter: p.reader }} className="flex min-h-11 items-center justify-between gap-3 py-3 text-sm">
                  <span className="truncate text-foreground">{CHAPTER_LIST.find((c) => c.id === p.chapter)?.transliterationName} · {p.chapter}:{p.verse}</span>
                  <span className="truncate text-muted-foreground">{reciterById(p.reader)?.name ?? p.reader}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
