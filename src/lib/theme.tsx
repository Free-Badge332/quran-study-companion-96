import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getValue, setValue } from "./offline-store";

export type ThemeChoice = "light" | "dark";
export const THEME_KEY = "preference:theme";
/** Synchronous mirror so the first paint uses the saved theme (no flash). Device storage stays the source of truth. */
export const THEME_MIRROR = "quran-theme";
/** Light is the app default. Anything saved that isn't "dark" (including the old "system") shows light. */
export const DEFAULT_THEME: ThemeChoice = "light";

export const isThemeChoice = (v: unknown): v is ThemeChoice => v === "light" || v === "dark";

/** Dark-mode background shades. "forest" is the default and needs no attribute. */
export const DARK_SHADES = [
  { id: "forest", bg: "oklch(0.155 0.016 175)", card: "oklch(0.21 0.025 168)", muted: "oklch(0.25 0.025 168)" },
  { id: "deep", bg: "oklch(0.12 0.014 175)", card: "oklch(0.17 0.02 170)", muted: "oklch(0.21 0.02 170)" },
  { id: "night", bg: "oklch(0.15 0.025 255)", card: "oklch(0.2 0.03 255)", muted: "oklch(0.24 0.03 255)" },
  { id: "charcoal", bg: "oklch(0.17 0.005 60)", card: "oklch(0.22 0.008 60)", muted: "oklch(0.26 0.008 60)" },
  { id: "warm", bg: "oklch(0.16 0.02 80)", card: "oklch(0.215 0.025 80)", muted: "oklch(0.255 0.025 80)" },
] as const;
export type DarkShade = (typeof DARK_SHADES)[number]["id"];
export const DARK_SHADE_KEY = "preference:dark-shade";
export const DARK_SHADE_MIRROR = "quran-dark-shade";
export const isDarkShade = (v: unknown): v is DarkShade => DARK_SHADES.some((s) => s.id === v);

/** Inline script for <head>: applies the mirrored theme before the app loads. Runs fully offline. */
export const THEME_BOOT_SCRIPT = `try{var d=localStorage.getItem("${THEME_MIRROR}")==="dark";var r=document.documentElement;r.classList.toggle("dark",d);var s=localStorage.getItem("${DARK_SHADE_MIRROR}");if(s&&s!=="forest")r.setAttribute("data-shade",s)}catch(e){}`;

type Ctx = {
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  darkShade: DarkShade;
  /** Applies the shade live; persist=false previews without saving. */
  setDarkShade: (s: DarkShade, persist?: boolean) => void;
};
const ThemeCtx = createContext<Ctx>({ theme: DEFAULT_THEME, setTheme: () => {}, darkShade: "forest", setDarkShade: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(DEFAULT_THEME);
  const [darkShade, setDarkShadeState] = useState<DarkShade>("forest");
  useEffect(() => {
    void getValue<ThemeChoice>(THEME_KEY).then((saved) => { if (isThemeChoice(saved)) setThemeState(saved); }).catch(() => {});
    void getValue<DarkShade>(DARK_SHADE_KEY).then((saved) => { if (isDarkShade(saved)) setDarkShadeState(saved); }).catch(() => {});
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (darkShade === "forest") root.removeAttribute("data-shade");
    else root.setAttribute("data-shade", darkShade);
  }, [darkShade]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  const setTheme = (t: ThemeChoice) => {
    setThemeState(t);
    try { localStorage.setItem(THEME_MIRROR, t); } catch { /* mirror is optional */ }
    void setValue(THEME_KEY, t).catch(() => window.dispatchEvent(new Event("quran-storage-error")));
  };
  const setDarkShade = (s: DarkShade, persist = true) => {
    setDarkShadeState(s);
    if (!persist) return;
    try { localStorage.setItem(DARK_SHADE_MIRROR, s); } catch { /* mirror is optional */ }
    void setValue(DARK_SHADE_KEY, s).catch(() => window.dispatchEvent(new Event("quran-storage-error")));
  };
  return <ThemeCtx.Provider value={{ theme, setTheme, darkShade, setDarkShade }}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);
