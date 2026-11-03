# My Quran Companion

i want you to clone it and run it https://github.com/ezadin2/MyQuranApp

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c01a6cfc-3687-42ef-a967-aabb308cd476).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Offline mobile app

The existing screens and features are reused by both the hosted TanStack Start app and a separate local Capacitor SPA. Native builds load `dist-mobile`, never a hosted URL. Arabic, transliteration and all six existing translations are bundled: 114 surahs, 6,236 ayahs and 37,416 translated ayahs. The current app did not include tafsir; none has been fabricated. Audio for all three existing reciters remains available from EveryAyah and must be downloaded before airplane-mode playback.

### Build and run

Requirements: Bun or Node 22+, Android Studio, JDK 21, Android SDK 35; for iOS, macOS with Xcode and CocoaPods.

```sh
bun install
bun run build:mobile
bunx cap sync android
bunx cap open android
# In Android Studio, select a device/emulator and Run.
# Or, from android/: ./gradlew assembleDebug

bunx cap sync ios
bunx cap open ios
# Configure your signing team in Xcode, then Run.
```

`bun run build` produces both the hosted web build and local mobile assets. `bun run cap:sync` rebuilds mobile assets and updates both native projects. Never configure `server.url` or `CAPACITOR_SERVER_URL`. The native project folders are included; generated copies of web assets are ignored and recreated by sync. The store app identifier is `com.ezadin.quranstudycompanion` (Java sources keep the internal `com.myquran.companion` namespace).

### Storage and reliability

- `public/assets/databases/quran.zip` contains the complete read-only SQLite content database. Capacitor copies it on first launch with `overwrite: false`. It is compressed only to keep the repository small, not remotely hosted.
- Native bookmarks, reading history, time statistics, last-read position, preferences and download metadata live in the separate `quran_user` SQLite database. Numbered transactional migrations never replace it. Existing `quran-progress-v1` and `quran-lang` localStorage entries are imported once and retained as a recovery copy.
- Web uses IndexedDB for Quran chapters, user data and audio blobs. Local chapter JSON replaces external Quran API requests. On the hosted website, visited chapters and downloaded audio work offline while the page is open; a fresh website load still needs internet for its JavaScript. Only the native package guarantees a cold launch without internet. Browser data is subject to browser storage clearing/eviction; persistence is requested when supported.
- Downloads run one verse at a time, with native progress events and streamed web progress. Native MP3s are written to `.partial` files in persistent private `Directory.Data`, checked, then renamed. Restarting marks unfinished transfers for retry; completed verses are not downloaded again. Retry restarts the incomplete verse rather than implementing byte-range resume.
- Stop aborts the current web request. The native transfer plugin has no cancellation API: Stop finishes the current verse, then stops the queue. Network/read timeouts prevent indefinite waits. Native partial files are cleaned after failures and reused/overwritten on retry.
- Download errors, missing files and save failures are surfaced in the UI. Downloaded audio is resolved before streaming; missing audio is not streamed when offline. Delete controls remove surah audio for the selected reciter and its metadata. Device storage usage is shown per surah/reciter.
- Fonts and icons are bundled. Chapter queries use compound SQLite primary keys, one chapter at a time; short query-cache retention avoids holding the whole Quran. Verse content uses browser rendering containment to reduce offscreen work.

### Regenerate and test

```sh
bun run prepare:quran  # Python 3, internet; verifies exact completeness before generating data
bun test
```

Content sources: pinned `quran-json@3.1.2` plus the existing `amh-muhammedsadiqan` and `orm-ghaliapapurapag` editions from `fawazahmed0/quran-api@1`. Dataset provenance and per-chapter SHA-256 values are in `public/quran/manifest.json`. Check upstream attribution/license requirements before store distribution.

Tests verify all 114 surahs, all 6,236 Arabic ayahs, all six translations, local search, migration preservation, download retry/deduplication, offline playback resolution, deletion and the SQLite archive. Native plugin/device behavior still requires the following acceptance checks on Android and iOS:

1. Install freshly, enable airplane mode before first launch, navigate all surahs and search within a surah.
2. Save a bookmark, change language/speed/reciter, close and relaunch; confirm restoration.
3. Download a surah online, enable airplane mode, listen through verse transitions, repeat and loop.
4. Interrupt a download by disconnecting/closing; retry and verify only missing verses transfer.
5. Simulate insufficient storage; confirm error and preservation of previous downloads/user data.
6. Delete downloaded audio; verify reclaimed storage and clear unavailable-audio feedback offline.

No Android SDK/JDK, emulator or Xcode is available in the Lovable sandbox, so APK compilation and device airplane-mode tests cannot be certified here.
