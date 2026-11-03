import type { CSSProperties, ReactNode, SVGProps } from "react";

/**
 * Custom Islamic icon library. Lucide-compatible props (size, strokeWidth, className)
 * so these swap in anywhere a Lucide icon is used.
 *
 * Colour: the main line uses currentColor. Accent details use the --gold design token
 * (see styles.css `.ii-accent`). Pass tone="mono" to draw everything in currentColor,
 * e.g. when the icon sits on a gold surface.
 */
export type IslamicIconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  strokeWidth?: number | string;
  title?: string;
  tone?: "duo" | "mono";
};

function make(name: string, paths: ReactNode) {
  function Icon({ size = 24, strokeWidth = 1.75, title, className, tone = "duo", style, ...rest }: IslamicIconProps) {
    const s: CSSProperties | undefined =
      tone === "mono" ? { ...style, ["--icon-accent" as string]: "currentColor" } : style;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        className={className ? `ii ${className}` : "ii"}
        style={s}
        {...rest}
      >
        {title ? <title>{title}</title> : null}
        {paths}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

/** Accent group: drawn in gold (theme-aware) unless tone="mono". */
const A = ({ children }: { children: ReactNode }) => <g className="ii-accent">{children}</g>;

const STAR8 = "M12 2.3l.75 1.45 1.45.75-1.45.75L12 6.7l-.75-1.45-1.45-.75 1.45-.75Z";

export const QuranIcon = make("QuranIcon", (
  <>
    <path d="M12 9C10 7.5 7 7 4 7.5V16c3-.4 6 0 8 1.5 2-1.5 5-1.9 8-1.5V7.5C17 7 14 7.5 12 9Z" />
    <path d="M12 9v8.5" />
    <path d="m6 21.5 6-4 6 4" />
    <A><path d={STAR8} /></A>
  </>
));

export const HadithIcon = make("HadithIcon", (
  <>
    <path d="M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12" />
    <path d="M5 5v15" />
    <A>
      <path d="M10 14v-3.5a2 2 0 0 1 4 0V14Z" />
      <path d="M12 6v1.2" />
    </A>
  </>
));

export const TasbihIcon = make("TasbihIcon", (
  <>
    <circle cx="12" cy="3.6" r="1.3" />
    <circle cx="16.6" cy="5.4" r="1.3" />
    <circle cx="18.5" cy="9.8" r="1.3" />
    <circle cx="16.4" cy="14.1" r="1.3" />
    <circle cx="7.4" cy="5.4" r="1.3" />
    <circle cx="5.5" cy="9.8" r="1.3" />
    <circle cx="7.6" cy="14.1" r="1.3" />
    <A>
      <path d="M8.8 15.2 12 17.2l3.2-2" />
      <path d="M12 17.2v1.8" />
      <path d="M10.5 22 12 19l1.5 3Z" />
    </A>
  </>
));

export const AzkarIcon = TasbihIcon;

export const TasbihCounterIcon = make("TasbihCounterIcon", (
  <>
    <circle cx="10" cy="3.5" r="1.2" />
    <circle cx="14.2" cy="5.2" r="1.2" />
    <circle cx="5.8" cy="5.2" r="1.2" />
    <circle cx="4" cy="9.5" r="1.2" />
    <circle cx="5.8" cy="13.8" r="1.2" />
    <circle cx="10" cy="15.5" r="1.2" />
    <A>
      <rect x="14" y="12.5" width="7.5" height="9" rx="2" />
      <path d="M17.75 15v4M15.75 17h4" />
    </A>
  </>
));

const HANDS = (
  <>
    <path d="M3.5 11.5c0 4.7 3.8 8.5 8.5 8.5s8.5-3.8 8.5-8.5" />
    <path d="M3.5 11.5 6.5 13M20.5 11.5 17.5 13" />
    <path d="M7 15c1.6.9 3.3 1 5 0 1.7 1 3.4.9 5 0" />
    <path d="M12 15v5" />
  </>
);

export const DuaIcon = make("DuaIcon", (
  <>
    {HANDS}
    <A><path d="M12 3v3.5M7.5 5l1.3 2M16.5 5l-1.3 2" /></A>
  </>
));

export const DailyDuaIcon = make("DailyDuaIcon", (
  <>
    {HANDS}
    <A><path d="M12 3.2l.85 1.65 1.65.85-1.65.85L12 8.2l-.85-1.65-1.65-.85 1.65-.85Z" /></A>
  </>
));

export const MosqueIcon = make("MosqueIcon", (
  <>
    <path d="M7 12.5c0-2.8 2.5-4.4 5-6 2.5 1.6 5 3.2 5 6" />
    <path d="M6.5 21v-8.5h11V21" />
    <path d="M10 21v-3a2 2 0 0 1 4 0v3" />
    <path d="M3.5 21V10M2.8 10h1.4l-.7-2.5ZM20.5 21V10M19.8 10h1.4l-.7-2.5Z" />
    <path d="M2 21h20" />
    <A><path d="M12.6 2.4a1.6 1.6 0 1 0 1 2.7 1.3 1.3 0 0 1-1-2.7Z" /><path d="M12 5.2v1.3" /></A>
  </>
));

export const PrayerTimesIcon = make("PrayerTimesIcon", (
  <>
    <path d="M2.5 21v-6.5c0-2.4 2.4-4 4.8-5.5 2.4 1.5 4.8 3.1 4.8 5.5" />
    <path d="M7.3 6.5V9" />
    <path d="M2 21h9" />
    <path d="M5.8 21v-2.5a1.5 1.5 0 0 1 3 0V21" />
    <A>
      <circle cx="17" cy="15.5" r="5" />
      <path d="M17 13v2.5l1.7 1.1" />
    </A>
  </>
));

export const PrayerMatIcon = make("PrayerMatIcon", (
  <>
    <rect x="5" y="2.5" width="14" height="17" rx="1.5" />
    <path d="M8.5 16.5V10a3.5 3.5 0 0 1 7 0v6.5Z" />
    <path d="M6 22v-1M9 22v-1M12 22v-1M15 22v-1M18 22v-1" />
    <A><path d="M12 5.2v1.4" /></A>
  </>
));

export const WorshipIcon = make("WorshipIcon", (
  <>
    <path d="M4.5 21V11a7.5 7.5 0 0 1 15 0v10" />
    <path d="M8.5 21v-8.5a3.5 3.5 0 0 1 7 0V21" />
    <path d="M3 21h18" />
    <A>
      <path d="M12 1.8v1.7" />
      <path d="M12 12v1.3M10.9 13.3h2.2l-.4 1.8h-1.4Z" />
    </A>
  </>
));

export const QiblaIcon = make("QiblaIcon", (
  <>
    <circle cx="12" cy="12" r="9.5" />
    <path d="M12 2.5v1.5M21.5 12H20M12 21.5V20M2.5 12H4" />
    <path d="M12 5 14 12l-2 7-2-7Z" />
    <path d="M12 5 14 12h-4Z" fill="currentColor" />
    <A><rect x="10.6" y="10.6" width="2.8" height="2.8" rx=".3" fill="var(--icon-accent, var(--gold))" /></A>
  </>
));

export const RamadanIcon = make("RamadanIcon", (
  <>
    <path d="M12.5 4a8.5 8.5 0 1 0 7.5 12.5A7 7 0 0 1 12.5 4Z" />
    <A>
      <path d="M17.5 2v2" />
      <path d="M16 6.5 17.5 4 19 6.5" />
      <path d="M16 6.5h3v3.8a1.5 1.5 0 0 1-3 0Z" />
      <path d="M17.5 11.8v1" />
    </A>
  </>
));

export const SuhoorIcon = make("SuhoorIcon", (
  <>
    <path d="M7 18a5 5 0 0 1 10 0" />
    <path d="M2 18h20M5 21.5h14" />
    <path d="M12 9.5v2M6.3 12.3l1.2 1.2M17.7 12.3l-1.2 1.2" />
    <A><path d="M18.4 2.8a2.6 2.6 0 1 0 2.3 3.9 2.1 2.1 0 0 1-2.3-3.9Z" /></A>
  </>
));

export const IftarIcon = make("IftarIcon", (
  <>
    <path d="M4 18a5 5 0 0 1 10 0" />
    <path d="M2 18h20M5 21.5h14" />
    <path d="M9 9v3.2m0 0 1.6-1.6M9 12.2l-1.6-1.6" />
    <A>
      <path d="M18.5 3.5V5" />
      <path d="M17 7 18.5 5 20 7" />
      <path d="M17 7h3v4.5a1.5 1.5 0 0 1-3 0Z" />
      <path d="M18.5 13v1" />
    </A>
  </>
));

export const LecturesIcon = make("LecturesIcon", (
  <>
    <path d="M2.5 6.5c2.3-1 5-1 7.5.5v12.5c-2.5-1.5-5.2-1.5-7.5-.5Z" />
    <path d="M10 7c1.2-.7 2.5-1 3.8-1.1" />
    <A>
      <circle cx="17" cy="13.5" r="4.8" />
      <path d="m15.8 11.6 3 1.9-3 1.9Z" fill="var(--icon-accent, var(--gold))" />
    </A>
  </>
));

export const RecitationIcon = make("RecitationIcon", (
  <>
    <path d="M2.5 8.5c1.7-.6 3.4-.5 5 .6v8.4c-1.6-1.1-3.3-1.2-5-.6Z" />
    <A><path d="M11 10.5v3M14 7v10M17 9v6M20 11v2" /></A>
  </>
));

export const ZakatIcon = make("ZakatIcon", (
  <>
    <path d="M2 15h3l5 1.5a1.5 1.5 0 0 1 0 3H7.5" />
    <path d="M10 19.5h4.5l6-3a1.5 1.5 0 0 0-1.5-2.5l-4 1.5" />
    <path d="M2 21h3v-7H2" />
    <A>
      <circle cx="14" cy="7" r="4.5" />
      <path d="M15.2 5.1a2.1 2.1 0 1 0 0 3.8 2.4 2.4 0 0 1 0-3.8Z" />
    </A>
  </>
));

export const DailyHadithIcon = make("DailyHadithIcon", (
  <>
    <path d="M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12" />
    <path d="M5 5v15" />
    <path d="M8.5 11.5h6.5M8.5 14.5h4" />
    <A><path d="M11 3v5.5l1.5-1 1.5 1V3" /></A>
  </>
));

export const DailyAyahIcon = make("DailyAyahIcon", (
  <>
    <path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5Z" />
    <path d="M12 6.5v13" />
    <path d="M5.5 9h4M5.5 12h4M14.5 9h2" />
    <A>
      <circle cx="17" cy="13" r="2.2" />
      <path d="M17 9.6v.8M17 15.6v.8M13.6 13h.8M19.6 13h.8" />
    </A>
  </>
));

export const BookmarkIcon = make("BookmarkIcon", (
  <>
    <path d="M6.5 3h11v18L12 17l-5.5 4Z" />
    <A><path d="M12 6.8l.7 1.4 1.4.7-1.4.7L12 11l-.7-1.4-1.4-.7 1.4-.7Z" /></A>
  </>
));

export const DownloadIcon = make("DownloadIcon", (
  <>
    <path d="M12 3v11m0 0 4-4m-4 4-4-4" />
    <path d="M4 15.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" />
  </>
));

export const DownloadedIcon = make("DownloadedIcon", (
  <>
    <path d="M12 3v9m0 0 3.5-3.5M12 12 8.5 8.5" />
    <path d="M4 15.5V18a2 2 0 0 0 2 2h6" />
    <A><circle cx="18" cy="17.5" r="4" /><path d="m16.3 17.5 1.2 1.2 2.3-2.4" /></A>
  </>
));

export const PrayerReminderIcon = make("PrayerReminderIcon", (
  <>
    <path d="M6 16.5V11.5a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
    <path d="M10 21a2 2 0 0 0 4 0" />
    <A><path d="M12.7 1.9a1.8 1.8 0 1 0 1.3 3 1.4 1.4 0 0 1-1.3-3Z" /></A>
  </>
));

export const ReadingProgressIcon = make("ReadingProgressIcon", (
  <>
    <path d="M12 2.5a9.5 9.5 0 1 1-9.5 9.5" />
    <A><path d="M2.5 12A9.5 9.5 0 0 1 12 2.5" strokeDasharray="1.5 2.5" /></A>
    <path d="M12 9c-1-.7-2.4-1-4-.8v6.5c1.6-.2 3 .1 4 .8 1-.7 2.4-1 4-.8V8.2c-1.6-.2-3 .1-4 .8Z" />
  </>
));

export const OfflineIcon = make("OfflineIcon", (
  <>
    <ellipse cx="11" cy="5" rx="7" ry="2.5" />
    <path d="M4 5v12c0 1.4 3.1 2.5 7 2.5" />
    <path d="M18 5v5" />
    <path d="M4 11c0 1.4 3.1 2.5 7 2.5" />
    <A><path d="m16 15 5 5M21 15l-5 5" /></A>
  </>
));

export type IslamicIcon = ReturnType<typeof make>;
export type IconUse = "nav" | "card" | "action";

/** Catalogue used by the /icons preview page. */
export const ICON_CATALOG: { name: string; Icon: IslamicIcon; use: IconUse[] }[] = [
  { name: "Quran", Icon: QuranIcon, use: ["nav", "card"] },
  { name: "Hadith", Icon: HadithIcon, use: ["card"] },
  { name: "Azkar / Tasbih", Icon: TasbihIcon, use: ["nav", "card"] },
  { name: "Tasbih counter", Icon: TasbihCounterIcon, use: ["card", "action"] },
  { name: "Dua", Icon: DuaIcon, use: ["card"] },
  { name: "Daily dua", Icon: DailyDuaIcon, use: ["card"] },
  { name: "Lectures", Icon: LecturesIcon, use: ["nav", "card"] },
  { name: "Recitation", Icon: RecitationIcon, use: ["card", "action"] },
  { name: "Ramadan", Icon: RamadanIcon, use: ["card"] },
  { name: "Suhoor", Icon: SuhoorIcon, use: ["card"] },
  { name: "Iftar", Icon: IftarIcon, use: ["card"] },
  { name: "Prayer times", Icon: PrayerTimesIcon, use: ["nav", "card"] },
  { name: "Qibla", Icon: QiblaIcon, use: ["card", "action"] },
  { name: "Mosque", Icon: MosqueIcon, use: ["card"] },
  { name: "Zakat", Icon: ZakatIcon, use: ["card"] },
  { name: "Worship", Icon: WorshipIcon, use: ["nav", "card"] },
  { name: "Prayer mat", Icon: PrayerMatIcon, use: ["card"] },
  { name: "Daily hadith", Icon: DailyHadithIcon, use: ["card"] },
  { name: "Daily ayah", Icon: DailyAyahIcon, use: ["card"] },
  { name: "Bookmark", Icon: BookmarkIcon, use: ["card", "action"] },
  { name: "Download", Icon: DownloadIcon, use: ["action"] },
  { name: "Downloaded", Icon: DownloadedIcon, use: ["action"] },
  { name: "Prayer reminder", Icon: PrayerReminderIcon, use: ["card", "action"] },
  { name: "Reading progress", Icon: ReadingProgressIcon, use: ["card"] },
  { name: "Offline", Icon: OfflineIcon, use: ["action"] },
];

export const ISLAMIC_ICONS = Object.fromEntries(ICON_CATALOG.map((c) => [c.name, c.Icon])) as Record<string, IslamicIcon>;
