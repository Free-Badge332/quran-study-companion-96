import { useState } from "react";
import { Check, ChevronDown, Search, Star, X } from "lucide-react";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { usePreference } from "@/lib/preferences";
import { sortReciters, toggleFavorite } from "@/lib/playback-history";
import { CATEGORY_LABEL, RECITERS, reciterById, searchReciters, type ReciterCategory } from "@/lib/reciters";

type Tab = ReciterCategory | "all" | "favorites";
const TABS: [Tab, string][] = [
  ["all", "All"],
  ["favorites", "Favourites"],
  ["ethiopian", CATEGORY_LABEL.ethiopian],
  ["sudanese", CATEGORY_LABEL.sudanese],
  ["international", CATEGORY_LABEL.international],
];

/** Android-style bottom sheet: drag handle, search, favourites, thumb-sized rows. */
export function ReciterPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [favorites, setFavorites] = usePreference<string[]>("reciter-favorites", []);
  const current = reciterById(value);
  const list = sortReciters(searchReciters(RECITERS, query, tab, favorites), favorites);

  return (
    <Drawer open={open} onOpenChange={setOpen} shouldScaleBackground={false}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="min-h-11 w-full min-w-0 justify-between gap-2 px-3" aria-label={`Reciter: ${current?.name ?? value}. Change reciter`}>
          <span className="min-w-0 truncate text-left">
            <span className="block truncate text-sm font-medium text-foreground">{current?.name ?? value}</span>
            <span className="block truncate text-xs font-normal text-muted-foreground">{current ? `${current.riwayah} · ${current.kind === "surah" ? "Whole surah" : "Verse by verse"}` : ""}</span>
          </span>
          <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85dvh] rounded-t-2xl pb-[max(0.5rem,var(--safe-bottom))]">
        <DrawerHeader className="shrink-0 gap-1 px-4 pb-2 pt-1 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <DrawerTitle>Choose a reciter</DrawerTitle>
              <DrawerDescription>Your choice is saved on this device.</DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="min-h-11 min-w-11 shrink-0" aria-label="Close reciter list">
                <X size={18} />
              </Button>
            </DrawerClose>
          </div>
        </DrawerHeader>
        <div className="shrink-0 px-4">
          <label className="flex min-h-11 items-center gap-2 rounded-lg border border-input bg-background px-3">
            <Search size={16} className="shrink-0 text-muted-foreground" />
            <input aria-label="Search reciters" placeholder="Search name or riwayah" value={query}
              onChange={(e) => setQuery(e.target.value)} enterKeyHint="search"
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none" />
          </label>
        </div>
        <div role="tablist" aria-label="Reciter groups" className="-mx-1 flex shrink-0 gap-2 overflow-x-auto px-4 py-2">
          {TABS.map(([id, label]) => (
            <Button key={id} role="tab" aria-selected={tab === id} size="sm" variant={tab === id ? "default" : "outline"} className="shrink-0" onClick={() => setTab(id)}>{label}</Button>
          ))}
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain px-4">
          {list.map((r) => {
            const fav = favorites.includes(r.id);
            return (
              <li key={r.id} className="flex items-center gap-1">
                <button type="button" onClick={() => { onChange(r.id); setOpen(false); }} aria-label={`Select ${r.name}`} aria-current={r.id === value} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{r.name}</span>
                    <span className="block truncate font-arabic text-base text-primary">{r.arabicName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.riwayah} · {r.kind === "surah" ? "Whole surah" : "Verse by verse"}</span>
                  </span>
                  {r.id === value && <Check size={18} className="shrink-0 text-primary" />}
                </button>
                <Button variant="ghost" size="icon" className="min-h-11 min-w-11" aria-pressed={fav} aria-label={`${fav ? "Remove" : "Add"} ${r.name} ${fav ? "from" : "to"} favourites`} onClick={() => setFavorites(toggleFavorite(favorites, r.id))}>
                  <Star size={18} className={fav ? "fill-gold text-gold" : "text-muted-foreground"} />
                </Button>
              </li>
            );
          })}
        </ul>
        {!list.length && (
          <p className="shrink-0 px-4 py-6 text-center text-sm text-muted-foreground">
            {tab === "favorites" ? "Tap the star next to a reciter to add a favourite." : "No reciters match."}
          </p>
        )}
      </DrawerContent>
    </Drawer>
  );
}
