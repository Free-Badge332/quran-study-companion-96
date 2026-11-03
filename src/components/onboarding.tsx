import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { HardDrive, WifiOff } from "lucide-react";
import { DownloadIcon, PrayerTimesIcon, QuranIcon, TasbihIcon, BookmarkIcon } from "@/components/icons/islamic";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { SHOW_ONBOARDING_EVENT, loadOnboardingDone, loadOnboardingStep, saveOnboardingDone, saveOnboardingStep } from "@/lib/permissions";
import { AudioDownloads } from "@/components/audio-downloads";
import { usePreference } from "@/lib/preferences";
import { CHAPTER_LIST, READERS } from "@/lib/quran";

const STARTER_SURAHS = [1, 112, 113, 114];

export const ONBOARDING_STEPS = ["Welcome", "Offline setup"] as const;
const STEPS = ONBOARDING_STEPS;

/** First-launch tour, shown after a language is chosen; can be replayed from Settings. */
export function Onboarding() {
  const { needsChoice } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStepState] = useState(0);
  const [savedReader] = usePreference("reciter", READERS[0]?.id ?? "Alafasy_128kbps");
  const reader = READERS.some((r) => r.id === savedReader) ? savedReader : (READERS[0]?.id ?? "Alafasy_128kbps");
  const setStep = (n: number) => { setStepState(n); saveOnboardingStep(n); };

  useEffect(() => {
    let alive = true;
    void loadOnboardingDone().then(async (done) => { if (done) return; const s = await loadOnboardingStep(STEPS.length); if (alive) { setStepState(s); setOpen(true); } });
    const replay = () => { setStep(0); setOpen(true); };
    window.addEventListener(SHOW_ONBOARDING_EVENT, replay);
    return () => { alive = false; window.removeEventListener(SHOW_ONBOARDING_EVENT, replay); };
  }, []);

  if (needsChoice || !open) return null;

  const finish = (to?: "/" | "/settings") => {
    void saveOnboardingDone();
    saveOnboardingStep(0);
    setOpen(false);
    if (to) void navigate({ to });
  };
  const last = step === STEPS.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="ob-title" data-state="open" className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-6">
        <div className="flex items-center justify-between">
          <ol className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
            {STEPS.map((s, i) => (
              <li key={s} aria-current={i === step ? "step" : undefined} className={`h-1.5 rounded-full transition-all ${i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/50" : "w-4 bg-muted"}`}><span className="sr-only">{s}</span></li>
            ))}
          </ol>
          {!last && <Button variant="ghost" size="sm" onClick={() => finish()}>Skip</Button>}
        </div>

        <div className="flex flex-1 flex-col justify-center py-8">
          {step === 0 && (
            <>
              <img src="/logo.png" alt="" className="mb-6 h-16 w-16 rounded-full bg-primary p-2" />
              <h1 id="ob-title" className="font-display text-4xl text-foreground">Your Quran study companion</h1>
              <p className="mt-3 text-muted-foreground">Everything you need for daily study, in one calm place.</p>
              <ul className="mt-6 space-y-3">
                <Feature icon={<QuranIcon size={22} />} title="Read the Quran" text="All 114 surahs with translation and transliteration." />
                <Feature icon={<DownloadIcon size={22} />} title="Listen to recitations" text="Stream verse by verse, or save them for offline listening." />
                <Feature icon={<TasbihIcon size={22} />} title="Azkar and Duas" text="Morning and evening remembrance with counters." />
                <Feature icon={<PrayerTimesIcon size={22} />} title="Prayer times and Ramadan" text="Daily times, suhoor and iftar, and a fasting tracker." />
                <Feature icon={<BookmarkIcon size={22} />} title="Hadith and bookmarks" text="Browse hadith collections and keep your place." />
              </ul>
            </>
          )}
          {step === 1 && (
            <>
              <WifiOff className="mb-6 text-primary" size={40} aria-hidden />
              <h1 id="ob-title" className="font-display text-4xl text-foreground">Works without internet</h1>
              <p className="mt-3 text-muted-foreground">These are already on your device:</p>
              <ul className="mt-4 space-y-2 text-sm text-foreground">
                <li>• Full Quran text, translations and transliteration</li>
                <li>• Azkar, Duas and hadith collections</li>
                <li>• Prayer-time calculation for your chosen city</li>
              </ul>
              <div className="mt-6 rounded-xl border border-border bg-card p-4">
                <p className="flex items-center gap-2 font-semibold text-foreground"><HardDrive size={18} aria-hidden /> Recitations are optional</p>
                <p className="mt-1 text-sm text-muted-foreground">Audio needs internet the first time. Open any surah and tap the download button to keep its recitation on your phone. Downloads stay private to this app — no storage permission needed.</p>
              </div>
              <details className="mt-4 rounded-xl border border-border bg-card p-4">
                <summary className="cursor-pointer font-semibold text-foreground">Download short surahs now (optional)</summary>
                <p className="mt-1 text-sm text-muted-foreground">Uses internet once. You can skip this and download later from any surah.</p>
                <div className="mt-3">
                  {STARTER_SURAHS.map((id) => {
                    const c = CHAPTER_LIST.find((x) => x.id === id);
                    if (!c) return null;
                    return <div key={id}><p className="text-sm font-medium text-foreground">{id}. {c.transliterationName}</p><AudioDownloads reader={reader} chapter={id} count={c.totalVerses} /></div>;
                  })}
                </div>
              </details>
              <p className="mt-4 text-sm text-muted-foreground">No permissions are needed to start. Review privacy any time in Settings.</p>
            </>
          )}
        </div>

        <div className="flex gap-3">
          {step > 0 && <Button variant="outline" className="min-h-12 flex-1" onClick={() => setStep(step - 1)}>Back</Button>}
          {last
            ? <Button className="min-h-12 flex-1" onClick={() => finish("/")}>Get started</Button>
            : <Button className="min-h-12 flex-1" onClick={() => setStep(step + 1)}>Continue</Button>}
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <li className="flex gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary" aria-hidden>{icon}</span>
      <span><span className="block font-semibold text-foreground">{title}</span><span className="block text-sm text-muted-foreground">{text}</span></span>
    </li>
  );
}
