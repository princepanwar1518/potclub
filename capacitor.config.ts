import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Native app shell (Android + iOS) around the same React app.
 *
 * appId is the permanent store identity (Play package name / iOS bundle id). It cannot change after
 * the first upload, so confirm it before then. See mobile/README.md.
 *
 * The web build for native is `npm run build:native` (VITE_PLATFORM=native, output dist-native):
 * everything is bundled into the app, nothing is loaded from a server, and there is no `server.url`.
 */
const config: CapacitorConfig = {
  appId: 'com.potclub.app',
  appName: 'PotClub',
  webDir: 'dist-native',
  backgroundColor: '#120726',
  android: {
    // Never load mixed (http) content; the bundle is fully local.
    allowMixedContent: false,
    // Debugging the WebView is only allowed in debug builds.
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'never',
    backgroundColor: '#120726',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: false, // hidden from src/native/bootstrap.ts once the first screen has rendered
      backgroundColor: '#06030E',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT', // dark icons on the light lavender app bar
      backgroundColor: '#E8DDFF',
    },
  },
}

export default config
