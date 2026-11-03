# Android release guide (Windows)

App ID `com.ezadin.quranstudycompanion` · name "My Quran" · compile/target SDK 36 · min SDK 24.
Capacitor 8, Android Gradle Plugin 8.13, Gradle 8.14.3.

## Requirements
- Android Studio Otter (2025.2.1) or newer, with Android SDK Platform 36 installed.
- JDK 21 (Android Studio's bundled JBR works). In PowerShell:
  `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`
- Bun (`powershell -c "irm bun.sh/install.ps1 | iex"`) or Node 20+.

## One-time: create an upload key
Run from the project folder. Never commit the key or passwords (`*.jks` and
`keystore.properties` are git-ignored). Back the key up somewhere safe.

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v -keystore android\upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

Create `android\keystore.properties`:
```
storeFile=upload-key.jks
storePassword=YOUR_STORE_PASSWORD
keyAlias=upload
keyPassword=YOUR_KEY_PASSWORD
```
Without this file, release builds are produced unsigned.

## Each release
```powershell
bun install
bun run build:mobile
bunx cap sync android
cd android
.\gradlew.bat clean bundleRelease -PversionCode=2 -PversionName=1.0.1
```
Raise `versionCode` on every upload. Output:
`android\app\build\outputs\bundle\release\app-release.aab`

Optional test APK on a connected phone:
```powershell
.\gradlew.bat assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

## Device checks before upload
- Fresh install in airplane mode: app opens, Quran reads, bookmarks save.
- Back button, status bar, keyboard, gesture navigation.
- Audio download, offline playback, phone-call interruption.
- "Use my location" on the prayer page asks for approximate location.

## Google Play Console
1. Create the app; enroll in Play App Signing (upload the .aab signed with your upload key).
2. Privacy policy URL: `<published site>/privacy`. Contact email ezadinbadru55@gmail.com is already on that page.
3. Data safety: no data collected or shared. Approximate location is processed on device only (not collected).
4. Content rating questionnaire, target audience, ads = none, store listing, screenshots, 512px icon, feature graphic.
5. New personal accounts: closed test with 12+ testers for 14 days before production.
6. Confirm everyayah.com terms allow use of its recitations.
