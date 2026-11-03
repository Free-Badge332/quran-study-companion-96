import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Settings } from "lucide-react";
import { LANGUAGES, type Lang } from "@/lib/quran";
import { useLang } from "@/lib/lang";
import { MoreDrawer } from "@/components/more-drawer";

export function SiteHeader() {
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const path = useLocation({ select: (l) => l.pathname });
  // Tab-bar destinations are roots; every other page gets an Android-style back arrow.
  const isRoot = ["/", "/quran", "/azkar", "/ramadan", "/more"].includes(path.replace(/\/$/, "") || "/");
  const goBack = () => { if (window.history.length > 1) router.history.back(); else void router.navigate({ to: "/" }); };
  return (
    <header className="app-header sticky z-30 border-b border-border bg-background/95 backdrop-blur">
      <div className="app-header-inner mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1 py-2 sm:flex sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-center gap-1">
        {!isRoot && (
          <button type="button" onClick={goBack} aria-label="Back" className="-ml-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-foreground hover:bg-secondary">
            <ArrowLeft size={22} />
          </button>
        )}
        <MoreDrawer />
        <Link to="/" className="flex min-h-11 min-w-0 items-center gap-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary"><img src="/logo.png" alt="" className="h-6 w-6" /></span>
          <span className="truncate font-display text-xl text-primary">{t("appName")}</span>
        </Link>
        </div>
        <nav className="ml-auto flex min-w-0 items-center gap-5 text-sm">
          {/* Phones use the bottom tab bar; text links only appear on wider screens. */}
          <Link to="/quran" className="hidden truncate text-muted-foreground transition-colors hover:text-foreground md:inline" activeProps={{ className: "text-primary font-semibold" }}>{t("navQuran")}</Link>
          <Link to="/azkar" className="hidden truncate text-muted-foreground transition-colors hover:text-foreground md:inline" activeProps={{ className: "text-primary font-semibold" }}>{t("navAzkar")}</Link>
          <Link to="/ramadan" className="hidden truncate text-muted-foreground transition-colors hover:text-foreground md:inline" activeProps={{ className: "text-primary font-semibold" }}>{t("navPrayer")}</Link>
          <Link to="/hadith" className="hidden truncate text-muted-foreground transition-colors hover:text-foreground md:inline" activeProps={{ className: "text-primary font-semibold" }}>{t("navHadith")}</Link>
          <Link to="/settings" aria-label={t("navSettings")} title={t("navSettings")} className="grid h-11 w-11 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary" activeProps={{ className: "text-primary" }}><Settings size={19} /></Link>
        </nav>
        <select
          aria-label={t("language")}
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className="hidden min-h-10 min-w-0 max-w-32 rounded-lg border border-input bg-card px-2 py-1.5 text-sm text-foreground sm:block"
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
