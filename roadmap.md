# Offline mobile conversion
# Phase 3 reliable download manager
- [x] Extend durable metadata and queue with pause/resume/retry/cancel and interruption recovery.
- [x] Validate recordings, prevent duplicates, enforce downloaded-only playback, and support deletion/storage reporting.
- [x] Add Downloads screen, multi-surah queue, filters, and selected-ayah downloads.
- [x] Test browser flows, restart recovery, offline playback, failures, and non-destructive migrations; report device-only limitations.
- [x] Phase 3 tests: 50 pass; device-only checks (reboot, low storage on phone) need a real phone.
# Phase 4 reciter library
- [x] Downloaded Quran section on home; Reciters page with search, Ethiopian/International tabs, favourites, recent, preferred, attribution, quality, per-surah downloads.
- [x] 55 tests pass; browser: download from reciter page, home shows it, offline playback with zero network requests.
- [ ] Ethiopian reciters: none verified; need rights-holder permission + downloadable files (see docs/reciter-research.md).
- [ ] Verified biographies: need citable sources.
- [ ] EveryAyah redistribution licence: licence page offline; confirm with VerseByVerseQuran.
- [ ] Phase 5: blocked until explicit user approval.
# Android presentation refinement
- [x] Audit all 17 screens at 360px: no sideways overflow; fixed oversized ﷺ overlapping hadith English text.
- [x] Onboarding is exactly two pages (Welcome, Offline setup); completion saved in device storage.
- [x] New Quran emblem: launcher, round, adaptive + monochrome icons, splash (incl. Android 12+), favicon.
- [x] 46 tests pass; browser checks done.
- [ ] APK build + on-phone check of icon/splash/airplane mode: needs Android Studio on your computer.

# Offline mobile conversion tasks
- [x] Bundle all Quran text, current translations, and fonts with verified completeness.
- [x] Add native SQLite and web IndexedDB storage, safe imports, migration, and durable progress/preferences.
- [x] Integrate persistent audio downloads, offline playback, retry, cancellation, and deletion.
- [x] Configure local Capacitor Android/iOS builds and document build requirements.
- [x] Verify 22 tests plus real browser download, offline playback, offline search, bookmark restart, and saved preferences.
- [ ] Compile local mobile web assets and sync native packages: separate mobile build was not executed in this build-restricted environment; run documented build:mobile and cap sync commands.
- [ ] Run APK and fresh-install airplane-mode/device storage tests: Android SDK/JDK/emulator unavailable here.
- [ ] Run iOS build/device tests: macOS/Xcode/CocoaPods unavailable here.
# Task 2
- [x] New home screen, mobile bottom navigation (Home, Quran, Azkar, Prayer, More) with grouped sub-pages.
- [x] Azkar with daily counters, Duas, Ramadan & prayer times with fasting tracker.
- [ ] Lectures and Community pages (waiting on an approved list of trusted sources).
# Offline-first requirement
- [x] Islamic icons bundled; Light/Dark theme saved on device, verified with internet blocked.
- [ ] Airplane-mode tests on a real Android phone (cannot run here; needs your device).
# Android audit (uploaded brief)
- [x] Phone build bundles everything locally (no hosted site, no remote fonts); 28 tests pass.
- [x] Android back button, status bar colours, refresh on resume.
- [ ] Gradle APK build + airplane-mode device tests: needs Android Studio/JDK on your computer.
# Android errors and Quran phone width
- [x] Fix surah-list horizontal overflow; all 114 rows and Arabic names fit at 320, 393, 412, 768, and 1280px; search and chapter opening verified.
- [x] Isolate native content failures from user storage; use bundled JSON when Quran SQLite cannot open, without replacing user data.
- [x] Fit Quran controls and verse text within phone widths; add chapter retry.
- [x] 31 regression tests pass; browser verifies reading at 320–1280px, bookmark reload, verse search, and offline cached reading.
- [ ] Confirm the reported SQLite opening failure on the installed Android app: requires a rebuilt APK and device logs; Android SDK/device unavailable here.
# Offline-readiness audit (uploaded brief)
- [x] Airplane-mode simulation on the built mobile bundle: zero external requests, zero console errors; home, surah list, chapter reader, azkar, hadith, settings all render offline.
- [x] Full audio cycle verified: real download of surah 112 verse 1, app restart, offline playback from local storage with pause, resume, and seek; undownloaded verses show an honest "not downloaded" message with disabled download buttons.
- [x] Bookmark survives app restart offline; offline indicator shows "Offline · Quran available".
- [x] Native packaging confirmed: SQLite plugin unzips bundled quran.zip from public/assets/databases; INTERNET permission present; no remote server in Capacitor config.
- [x] 31 tests pass; mobile build succeeds (39 MB fully bundled).
- [ ] Physical-device items: fresh-install SQLite migration, phone-restart persistence, interruption handling during real calls/audio focus, Gradle APK build — need Android Studio + a phone.
# Call interruptions + Android native-feel audit
- [x] Calls pause recitation; auto-resume on return only if paused under 10 min ago; lock-screen play/pause resume in place.
- [x] Edge-to-edge margins, status bar sync, back button (keyboard → overlay → history → minimize), keyboard focus scrolling, pressed states, old-WebView notice.
- [x] 41 tests pass; mobile build and Android sync succeed.
- [ ] Phone-only checks: real calls, lock-screen controls, gesture navigation, keyboard, Gradle APK — need Android Studio + phone.
- [ ] Background playback with screen off needs a native foreground media service (not available in installed plugins).
# First-launch tour
- [x] Welcome, offline setup with optional short-surah downloads, honest permissions (Qibla needs no location), start; resumes where left.
# Professional Android audit (brief 3)
- [x] Remove "Quran stored on this device" label; offline notice + storage errors kept; phone build offline-tested.
- [ ] Lectures/Community: waiting on approved trusted sources.
- [x] Qibla screen: offline compass from saved city (More → Qibla); live heading needs a phone sensor.
- [ ] APK build + device tests: need Android Studio and a phone.
# Play Store brief (5 phases, approval after each)
- [x] Phase 1 audit: blockers reported.
- [ ] Phase 1 fixes: waiting on user approval.
- [ ] Phases 2–5: sleep timer/player, download manager, verified reciters, release QA.
# Phase 1 Android release foundation (brief 6)
- [x] Audit, permissions (added approximate location for prayer times), narrowed file sharing, keys git-ignored, privacy page, RELEASE.md (Windows).
- [ ] Gradle build + device tests: need Android Studio and a phone. Support email for privacy page: needed from user.
- [ ] Phase 2: waiting on approval.
# UI/UX design system + digital Tasbih (uploaded brief)
- [x] Shared tokens (motion, elevation, counter surfaces) and card utilities; dialogs use the theme scrim.
- [x] Digital Tasbih counter in every Azkar item (count, target, remaining, undo, confirmed reset, saved per day) and a new Tasbih screen with 7 dhikr phrases and targets.
- [x] 67 tests pass; phone-size browser check of tap, undo, reload persistence, reset confirmation, light and dark.
- [x] Ramadan page: crescent header, live suhoor/iftar countdown, daily worship checklist (saved per day), Quran goal, quick links.
- [ ] Polish pass for Quran reader, Hadith, Settings: next pass.
- [ ] Amharic and Afaan Oromoo wording for the new counter: needs a native speaker's review.
# Android-native brief (Qibla GPS + privacy)
- [x] Qibla uses phone location (explained before asking), shows accuracy, retry/errors, city fallback; compass calibration hint and landscape correction; precise-location permission added.
- [x] Same location feeds prayer times; Privacy Policy linked in More and updated (location, audio servers, deleting data).
- [x] 79 tests pass; browser check with a simulated Addis Ababa location (5°, ±25 m) and Privacy link.
- [ ] Live compass, GPS and back button on a real phone: needs Android Studio + phone.
# Android location permission + smaller Tasbih
- [x] Native Android location permission (precise or approximate), explained first; declined → ask again; permanently declined → Open Android Settings. Plugins synced into the Android project.
- [x] Tasbih counter ~20% shorter, same design; all controls visible at 360×640 and 412×915; 82 tests pass.
- [ ] Granted/denied/permanently-denied on a real phone: needs Android Studio + phone.
# Play Store readiness (uploaded master prompt)
- [x] App polish: smaller Tasbih counter; app ID set to com.ezadin.quranstudycompanion; Privacy Policy reachable from More.
- [ ] Play Store setup (signing, .aab/APK build): needs Android Studio + your signing key on your computer.
- [ ] Store listing text, Data safety, screenshots: next step when you ask.

# Separate text sizes for Arabic and translation
- [x] Independent sliders for Arabic Quran text and translation on the chapter page and in Settings → Reading comfort; each saved on device, applied to verses and Bismillah; 86 tests pass.
