import type React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { PrayerTimesIcon, QuranIcon, TasbihIcon } from "@/components/icons/islamic";
import { useLang } from "@/lib/lang";
import type { MsgKey } from "@/lib/i18n";

// Four top-level tabs; related pages are grouped under a tab so it stays highlighted.
const TABS: { to: "/" | "/quran" | "/azkar" | "/ramadan" ; label: MsgKey; icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; match: string[] }[] = [
  { to: "/", label: "navHome", icon: Home, match: [] },
  { to: "/quran", label: "navQuran", icon: QuranIcon, match: ["/quran", "/chapter", "/bookmarks"] },
  { to: "/azkar", label: "navAzkar", icon: TasbihIcon, match: ["/azkar", "/duas", "/tasbih"] },
  { to: "/ramadan", label: "navPrayer", icon: PrayerTimesIcon, match: ["/ramadan"] },
];

export function activeTab(path: string) {
  const hit = TABS.find((t) => t.match.some((m) => path === m || path.startsWith(m + "/")));
  return hit?.to ?? (path === "/" ? "/" : undefined);
}

export function BottomNav() {
  const { t } = useLang();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const current = activeTab(path);
  return (
    <nav aria-label="Main" className="app-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ to, label, icon: Icon }) => {
          const on = current === to;
          return (
            <li key={to} className="min-w-0">
              <Link
                to={to}
                aria-current={on ? "page" : undefined}
                className={`flex h-16 min-w-0 flex-col items-center justify-center gap-1 px-0.5 text-[11px] font-medium transition-colors ${on ? "text-primary" : "text-muted-foreground"}`}
              >
                <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors ${on ? "bg-primary/10" : ""}`}>
                  <Icon size={20} strokeWidth={on ? 2.1 : 1.75} />
                </span>
                <span className="w-full truncate text-center">{t(label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
