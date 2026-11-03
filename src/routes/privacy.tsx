import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — My Quran" },
      { name: "description", content: "How My Quran handles your data: everything stays on your device." },
      { property: "og:title", content: "Privacy Policy — My Quran" },
      { property: "og:description", content: "My Quran collects no personal data. Bookmarks and progress stay on your device." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-8 text-foreground">
      <h1 className="text-2xl font-semibold">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated: November 2, 2026</p>
      <div className="mt-6 space-y-5 leading-relaxed">
        <section>
          <h2 className="font-semibold">Summary</h2>
          <p>My Quran does not collect, sell or share personal data. It has no accounts, ads, analytics or tracking.</p>
        </section>
        <section>
          <h2 className="font-semibold">Data stored on your device</h2>
          <p>Bookmarks, reading progress, settings and downloaded recitations are saved only on your device. Uninstalling the app or clearing its data removes them.</p>
        </section>
        <section>
          <h2 className="font-semibold">Internet use</h2>
          <p>The Quran text, translations, hadith, azkar and duas are bundled with the app and work offline. The app connects to the internet only when you play or download a recitation, which is fetched from third-party audio servers (everyayah.com and mp3quran.net). That server may see your IP address as part of a normal web request. The app sends no personal information.</p>
        </section>
        <section>
          <h2 className="font-semibold">Location (optional)</h2>
          <p>If you tap "Use my location" on the Qibla or prayer-times screen, Android asks for your location (precise or approximate — your choice). The app shows how accurate the fix is. Your coordinates are used on your device to calculate the Qibla direction and prayer times and are saved only on your device. They are never sent anywhere. You can pick a city by hand instead.</p>
        </section>
        <section>
          <h2 className="font-semibold">Permissions</h2>
          <p>Internet access, for recitation audio. Location (precise or approximate), only if you choose to use it for Qibla or prayer times. The compass uses the phone's motion sensors, which need no permission. You can turn location off at any time in Android settings.</p>
        </section>
        <section>
          <h2 className="font-semibold">Deleting your data</h2>
          <p>Delete downloads from the Downloads screen, or clear the app's storage in Android settings to remove everything. The app keeps no personal data on any server.</p>
        </section>
        <section>
          <h2 className="font-semibold">Children</h2>
          <p>The app has no accounts, ads or tracking and collects no data from anyone, including children.</p>
        </section>
        <section>
          <h2 className="font-semibold">Changes</h2>
          <p>If these practices change, this page will be updated and the date above revised.</p>
        </section>
        <section>
          <h2 className="font-semibold">Contact</h2>
          <p>Questions about this policy: <a className="text-primary underline" href="mailto:ezadinbadru55@gmail.com">ezadinbadru55@gmail.com</a></p>
        </section>
      </div>
    </main>
  );
}
