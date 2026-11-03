import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { MsgKey } from "@/lib/i18n";
import { LANGUAGES, type Lang } from "@/lib/quran";
import { useLang } from "@/lib/lang";

type To = "/" | "/quran" | "/azkar" | "/ramadan" | "/hadith" | "/lectures" | "/community" | "/tasbih" | "/duas" | "/qibla" | "/reciters" | "/downloads" | "/bookmarks" | "/statistics" | "/settings" | "/privacy";
type Item = { to: To; label: MsgKey | string };

// Text-only menu, grouped by purpose. Everything from the old More page lives here.
const GROUPS: { title: MsgKey | string; items: Item[] }[] = [
  { title: "groupLearn", items: [
    { to: "/hadith", label: "navHadith" },
    { to: "/lectures", label: "navLectures" },
    { to: "/community", label: "navCommunity" },
  ] },
  { title: "groupWorship", items: [
    { to: "/tasbih", label: "tasbihTitle" },
    { to: "/duas", label: "navDuas" },
    { to: "/qibla", label: "navQibla" },
  ] },
  { title: "Audio", items: [
    { to: "/reciters", label: "Reciters" },
    { to: "/downloads", label: "Downloads" },
  ] },
  { title: "groupYou", items: [
    { to: "/bookmarks", label: "navBookmarks" },
    { to: "/statistics", label: "navStats" },
    { to: "/settings", label: "navSettings" },
    { to: "/privacy", label: "Privacy Policy" },
  ] },
];

export function MoreDrawer() {
  const { t, lang, setLang } = useLang();
  const tr = (k: string) => { try { const v = t(k as MsgKey); return v && v !== k ? v : k; } catch { return k; } };
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { setOpen(false); }, [path]);

  // Android hardware back button closes the drawer instead of leaving the page.
  useEffect(() => {
    if (!open) return;
    let remove: (() => void) | undefined;
    let cancelled = false;
    void import("@capacitor/core").then(({ Capacitor }) => {
      if (!Capacitor.isNativePlatform()) return;
      return import("@capacitor/app").then(({ App }) =>
        App.addListener("backButton", () => setOpen(false)).then((h) => {
          if (cancelled) void h.remove(); else remove = () => void h.remove();
        }),
      );
    }).catch(() => {});
    return () => { cancelled = true; remove?.(); };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" aria-label={tr("navMore")} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-foreground transition-colors hover:bg-secondary">
          <Menu size={22} />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="drawer-panel flex w-[82vw] max-w-xs flex-col gap-0 border-border bg-background p-0">
        <div className="flex items-center justify-between px-6 pb-5 pt-[calc(1.5rem+var(--safe-top,0px))]">
          <div className="min-w-0">
            <SheetTitle className="font-display text-2xl leading-tight text-primary">{tr("appName")}</SheetTitle>
            <SheetDescription className="mt-0.5 text-xs text-muted-foreground">{tr("moreTitle")}</SheetDescription>
          </div>
        </div>
        <nav aria-label={tr("navMore")} className="flex-1 overflow-y-auto px-3 pb-4">
          {GROUPS.map((g) => (
            <section key={g.title} className="border-t border-border/70 py-3 first:border-t-0 first:pt-0">
              <h2 className="px-3 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{tr(g.title)}</h2>
              <ul>
                {g.items.map(({ to, label }) => {
                  const on = path === to || path.startsWith(to + "/");
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={() => setOpen(false)}
                        aria-current={on ? "page" : undefined}
                        className={`drawer-link ${on ? "drawer-link-active" : ""}`}
                      >
                        {tr(label)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
        <div className="border-t border-border px-6 py-4 pb-[calc(1rem+var(--safe-bottom,0px))]">
          <label className="block text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground" htmlFor="drawer-lang">{tr("language")}</label>
          <select
            id="drawer-lang"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="mt-2 min-h-11 w-full rounded-xl border border-input bg-card px-3 text-sm text-foreground"
          >
            {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>
      </SheetContent>
    </Sheet>
  );
}
