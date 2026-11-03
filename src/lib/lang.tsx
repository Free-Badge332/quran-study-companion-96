import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { LANGUAGES, type Lang } from "./quran";
import { getValue, setValue } from "./offline-store";
import { translate, type MsgKey } from "./i18n";

type T = (key: MsgKey, vars?: Record<string, string | number>) => string;
type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: T; needsChoice: boolean };
const Ctx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k, v) => translate("en", k, v), needsChoice: false });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [needsChoice, setNeedsChoice] = useState(false);
  useEffect(() => {
    void getValue<Lang>("quran-lang")
      .then((saved) => {
        if (saved && LANGUAGES.some((l) => l.id === saved)) setLangState(saved);
        else setNeedsChoice(true);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    void setValue("quran-lang", l).catch(() => window.dispatchEvent(new Event("quran-storage-error")));
    setLangState(l);
    setNeedsChoice(false);
  };
  const t: T = (k, v) => translate(lang, k, v);
  return <Ctx.Provider value={{ lang, setLang, t, needsChoice }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
