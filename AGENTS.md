<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
# Rules
- Quran text is bundled as a read-only native SQLite database and chapter JSON for web IndexedDB; regenerate complete pinned datasets with scripts/prepare-quran.py so reading requires no external content requests.
- Keep mutable user data in a separate versioned SQLite database on native and IndexedDB on web; migrations must never replace user databases or delete legacy storage.
- Recitations use persistent app-private native files and browser IndexedDB blobs; resolve saved files before streaming and block missing streams offline.
- Download jobs are durable per-ayah records with serialized mutations and a single abortable queue; surah resume keeps completed ayahs and restarts only interrupted ayahs to avoid relying on source Range support.
- Audio integrity uses portable SHA-256 plus MP3 signature and byte-length checks before saving and local playback; additive download_details metadata preserves legacy SQLite rows.
- Keep the existing TanStack Start web build unchanged; the independent mobile Vite entry reuses the same generated TanStack Router tree and bundles assets to Capacitor webDir.
- Device storage initializes through a single shared promise; serialize progress writes and migrate legacy localStorage only once to prevent races and loss.
- Open native user storage independently from read-only Quran content; use packaged chapter JSON if the content database cannot open or is incomplete, so content failures never block saves or require external text requests.
- Theme choice is saved in device storage (preference:theme) with a localStorage mirror read by an inline head script so the first paint has no flash; device storage stays the source of truth.
- Islamic feature icons come from src/components/icons/islamic.tsx (currentColor line + gold accent via the --gold token, tone="mono" to flatten); ordinary UI actions stay Lucide, so icons stay offline and theme-aware.
- Chapter pages always show Hafs text for every reciter (user choice); non-Hafs riwayah data under public/quran/riwayat/ and RiwayahText stay bundled but are not rendered on chapter pages.
- Counting UI (Azkar items and /tasbih) goes through src/components/tasbih-counter.tsx with rules in src/lib/tasbih.ts; only the round button counts, and reset always confirms, so taps elsewhere never change a count.
- Shared surfaces, motion and counter colours are tokens/utilities in src/styles.css (surface-card, bg-counter-shell, lcd-screen, counter-button); reuse them instead of per-screen styles.
