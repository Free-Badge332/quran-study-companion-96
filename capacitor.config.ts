import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.ezadin.quranstudycompanion',
  appName: 'My Quran',
  webDir: 'dist-mobile',
  server: { androidScheme: 'https' },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    CapacitorSQLite: { iosDatabaseLocation: 'Library/CapacitorDatabase', androidIsEncryption: false, iosIsEncryption: false },
    StatusBar: { overlaysWebView: false },
    // Capacitor 8: keep content clear of status and navigation bars on Android 15+ edge-to-edge.
    SystemBars: { insetsHandling: 'css' },
  },
};
export default config;
