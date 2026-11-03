import { useEffect, useState, type ComponentType } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Download, Menu, Mic2, Settings, ShieldCheck } from "lucide-react";
import { BookmarkIcon, DuaIcon, HadithIcon, LecturesIcon, MosqueIcon, QiblaIcon, TasbihIcon } from "@/components/icons/islamic";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { MsgKey } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

type To = "/hadith" | "/lectures" | "/community" | "/tasbih" | "/duas" | "/qibla" | "/reciters" | "/downloads" | "/bookmarks" | "/statistics" | "/settings" | "/privacy";
type Item = { to: To; label: MsgKey | string; icon: ComponentType<{ size?: number }> };

// Everything that used to live on the More page, grouped by purpose.
const GROUPS: { title: MsgKey | string; items: Item[] }[] = [
  { title: "groupLearn", items: [
    { to: "/hadith", label: "navHadith", icon: HadithIcon },
    { to: "/lectures", label: "navLectures", icon: LecturesIcon },
    { to: "/community", label: "navCommunity", icon: MosqueIcon },
  ] },
  { title: "groupWorship", items: [
    { to: "/tasbih", label: "tasbihTitle", icon: TasbihIcon },
    { to: "/duas", label: "navDuas", icon: DuaIcon },
    { to: "/qibla", label: "navQibla", icon: QiblaIcon },
  ] },
  { title: "Audio", items: [
    { to: "/reciters", label: "Reciters", icon: Mic2 },
    { to: "/downloads", label: "Downloads", icon: Download },
  ] },
  { title: "groupYou", items: [
    { to: "/bookmarks", label: "navBookmarks", icon: BookmarkIcon },
    { to: "/statistics", label: "navStats", icon: BarChart3 },
    { to: "/settings", label: "navSettings", icon: Settings },
    { to: "/privacy", label: "Privacy Policy", icon: ShieldCheck },
  ] },
];

export function MoreDrawer() {
  const { t } = useLang();
  const tr = (k: string) => { try { const v = t(k as MsgKey); return v && v !== k ? v : k; } catch { return k; } };
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  // Close whenever the page changes (selecting an item or browser back).
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
      <SheetContent side="left" className="flex w-[86vw] max-w-sm flex-col gap-0 overflow-y-auto border-border bg-background p-0">
        <div className="flex items-center gap-3 border-b border-border px-5 pb-4 pt-[calc(1.25rem+var(--safe-top,0px))]">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary"><img src="/logo.png" alt="" className="h-7 w-7" /></span>
          <div className="min-w-0">
            <SheetTitle className="font-display text-xl text-primary">{tr("appName")}</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">{tr("moreTitle")}</SheetDescription>
          </div>
        </div>
        <nav aria-label={tr("navMore")} className="flex-1 px-3 py-4 pb-[calc(1rem+var(--safe-bottom,0px))]">
          {GROUPS.map((g, i) => (
            <section key={g.title} className={i > 0 ? "mt-4 border-t border-border pt-4" : ""}>
              <h2 className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{tr(g.title)}</h2>
              <ul className="space-y-0.5">
                {g.items.map(({ to, label, icon: Icon }) => {
                  const on = path === to || path.startsWith(to + "/");
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={() => setOpen(false)}
                        aria-current={on ? "page" : undefined}
                        className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${on ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"}`}
                      >
                        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${on ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}><Icon size={19} /></span>
                        <span className="flex-1 truncate">{tr(label)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
