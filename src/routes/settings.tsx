import { createFileRoute } from "@tanstack/react-router";
import { useLang } from "@/lib/lang";
import { LanguageOptions } from "@/components/language-picker";
import { ThemePicker } from "@/components/theme-picker";
import { DarkShadePicker } from "@/components/dark-shade-picker";
import { ReadingComfortPicker } from "@/components/reading-comfort-picker";
import { DeveloperContact } from "@/components/developer-contact";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — My Quran" },
      { name: "description", content: "Choose your language: Afaan Oromoo, Amharic, English and more." },
      { property: "og:title", content: "Settings — My Quran" },
      { property: "og:description", content: "Choose your language: Afaan Oromoo, Amharic, English and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-md px-4 pb-24">
      <h1 className="py-8 text-center font-display text-4xl text-foreground">{t("settingsTitle")}</h1>
      <h2 className="font-semibold text-foreground">{t("language")}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{t("languageHelp")}</p>
      <LanguageOptions />
      <ThemePicker />
      <DarkShadePicker />
      <ReadingComfortPicker />
      <DeveloperContact />
    </main>
  );
}
