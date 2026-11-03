import { createFileRoute, Link } from "@tanstack/react-router";
import type { ComponentType } from "react";
import { BarChart3, ChevronRight, Settings, Download, Mic2, ShieldCheck } from "lucide-react";
import { BookmarkIcon, TasbihIcon, DuaIcon, HadithIcon, LecturesIcon, MosqueIcon, QiblaIcon } from "@/components/icons/islamic";
import { PageTitle } from "@/components/dhikr-list";
import type { MsgKey } from "@/lib/i18n";
import { useLang } from "@/lib/lang";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "More — My Quran" },
      { name: "description", content: "Hadith, duas, lectures, community resources, bookmarks, statistics and settings." },
      { property: "og:title", content: "More — My Quran" },
      { property: "og:description", content: "Everything else in My Quran, in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MorePage,
});

type Entry = { to: "/tasbih" | "/hadith" | "/duas" | "/lectures" | "/community" | "/bookmarks" | "/statistics" | "/settings"; label: MsgKey; icon: ComponentType<{ size?: number }> };
const GROUPS: { title: MsgKey; items: Entry[] }[] = [
  { title: "groupLearn", items: [
    { to: "/hadith", label: "navHadith", icon: HadithIcon },
    { to: "/lectures", label: "navLectures", icon: LecturesIcon },
    { to: "/community", label: "navCommunity", icon: MosqueIcon },
  ] },
  { title: "groupWorship", items: [{ to: "/tasbih", label: "tasbihTitle", icon: TasbihIcon }, { to: "/duas", label: "navDuas", icon: DuaIcon }] },
  { title: "groupYou", items: [
    { to: "/bookmarks", label: "navBookmarks", icon: BookmarkIcon },
    { to: "/statistics", label: "navStats", icon: BarChart3 },
    { to: "/settings", label: "navSettings", icon: Settings },
  ] },
];

function MorePage() {
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-2xl px-4 pb-10">
      <PageTitle title={t("moreTitle")} />
      <Link to="/reciters" className="mb-2 flex min-h-11 items-center gap-4 border-y border-border py-4 text-primary"><Mic2 size={20} /><span className="flex-1 font-medium">Reciters</span><ChevronRight size={18} /></Link>
      <Link to="/downloads" className="mb-2 flex min-h-11 items-center gap-4 border-y border-border py-4 text-primary"><Download size={20} /><span className="flex-1 font-medium">Downloads</span><ChevronRight size={18} /></Link>
      <Link to="/qibla" className="mb-2 flex min-h-11 items-center gap-4 border-y border-border py-4 text-primary"><QiblaIcon size={20} /><span className="flex-1 font-medium">{t("navQibla")}</span><ChevronRight size={18} /></Link>
      <Link to="/privacy" className="mb-6 flex min-h-11 items-center gap-4 border-y border-border py-4 text-primary"><ShieldCheck size={20} /><span className="flex-1 font-medium">Privacy Policy</span><ChevronRight size={18} /></Link>
      <div className="space-y-6">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t(g.title)}</h2>
            <ul className="surface-card divide-y divide-border overflow-hidden">
              {g.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon size={20} /></span>
                    <span className="flex-1 font-medium text-foreground">{t(label)}</span>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
