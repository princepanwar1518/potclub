# PotClub — Android & iOS apps

The store apps are the same React app, bundled on the device and wrapped with
[Capacitor 8](https://capacitorjs.com/). There is no server: everything in `dist-native` ships
inside the app, so it works offline and needs no permissions beyond the template's default.

```
capacitor.config.ts        app id, name, splash/status-bar settings
.env.native                build flag (VITE_PLATFORM=native) used by npm run build:native
src/native/bootstrap.ts    native start-up: Android back button, status bar, splash hide
android/                   Android Studio / Gradle project (commit it)
ios/                       Xcode project (Swift Package Manager, no CocoaPods)
mobile/assets/             icon + splash sources → npm run assets:native
mobile/ios/ExportOptions.plist   App Store export settings used by CI
mobile/store/              screenshots, feature graphic, Play icon (see STORE.md)
.github/workflows/mobile.yml     builds both apps on GitHub
```

What differs from the website in the native build: no service worker, no "install this app"
banner, no `/admin` demo console. Everything else (the game, limits, time-outs, privacy page) is
identical and covered by the same tests.

## Identity (decide before the first upload)

| | Value | Where |
|---|---|---|
| App id / package / bundle id | `com.potclub.app` | `capacitor.config.ts`, `android/app/build.gradle`, Xcode target |
| Name on the home screen | PotClub | `capacitor.config.ts`, `android/app/src/main/res/values/strings.xml`, Info.plist |
| Version | 1.0.0 (build 1) | `android/app/build.gradle`, Xcode `MARKETING_VERSION` |

**The app id can never change after the first upload** to Play or App Store Connect. If you want a
different one (for example one tied to a domain you own), change it in all three places first.

## Everyday commands

```bash
npm run cap:sync        # build the web bundle for native and copy it into android/ and ios/
npm run android:open    # open in Android Studio
npm run ios:open        # open in Xcode (Mac only)
npm run assets:native   # regenerate all icon + splash sizes from mobile/assets
```

Run `npm run cap:sync` after every web change before building an app.

## Android

### On your Windows laptop (Android Studio)
1. Install [Android Studio](https://developer.android.com/studio) (it brings the SDK and Java).
2. In the project folder: `npm install`, then `npm run cap:sync`, then `npm run android:open`.
3. Plug in a phone with USB debugging on (or start an emulator) and press **Run**.
4. For a file to share: **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.

### Release signing (one time)
Create an upload key and keep it safe forever — losing it means you cannot update the app
(Play App Signing can reset the *upload* key, but it is still painful):

```bash
keytool -genkeypair -v -keystore potclub-upload.jks -alias potclub -keyalg RSA -keysize 2048 -validity 10000
```

Local builds: create `android/keystore.properties` (git-ignored):
```
storeFile=C:\\keys\\potclub-upload.jks
storePassword=…
keyAlias=potclub
keyPassword=…
```
then `cd android && gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`.

Every Play upload needs a higher `versionCode`. CI uses the run number automatically; locally set
`POTCLUB_VERSION_CODE` or edit `android/app/build.gradle`.

## iOS

Building an iPhone app needs macOS + Xcode. Without a Mac, use the GitHub workflow (below): it
runs on GitHub's Macs, signs with your Apple account through an API key, and uploads straight to
TestFlight. From TestFlight you install it on your iPhone and submit it for review in App Store
Connect — no Mac needed at any step.

With a Mac: `npm run cap:sync && npm run ios:open`, pick your team under *Signing & Capabilities*,
then **Product → Archive → Distribute App → App Store Connect**.

## Building on GitHub (both apps)

Push this repo to GitHub. `.github/workflows/mobile.yml` then runs on every push:
- **Debug APK** for Android (download from the run's *Artifacts*, install on any phone).
- **iOS simulator build** to prove the Xcode project compiles.

Signed release builds run when you push a tag (`git tag v1.0.0 && git push --tags`) or start the
workflow by hand with **release** ticked. Add these under *Settings → Secrets and variables → Actions*:

| Secret | How to get it |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 potclub-upload.jks` (PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("potclub-upload.jks"))`) |
| `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | from the keytool step |
| `APPLE_TEAM_ID` | developer.apple.com → Membership → Team ID |
| `ASC_KEY_ID`, `ASC_ISSUER_ID` | App Store Connect → Users and Access → Integrations → App Store Connect API → generate a key with the **Admin** role (needed so Xcode can create the distribution certificate) |
| `ASC_KEY_P8_BASE64` | base64 of the downloaded `AuthKey_XXXX.p8` (it can be downloaded only once) |

Outputs: `potclub-android-release` artifact (`.aab` for Play, signed `.apk`), and the iOS build
appears in App Store Connect → TestFlight after processing (10–30 minutes).

Before the first iOS upload, create the app record once in App Store Connect (**My Apps → +**) with
bundle id `com.potclub.app`.

## Not verified in this environment

The workspace that produced these projects cannot reach Google's Maven/Gradle servers and has no
Mac, so the first real Gradle and Xcode builds happen on your machine or on GitHub. What *was*
checked here: the web bundle for native (full test suite, plus a phone-size browser run of the exact
`dist-native` bundle), `cap sync` for both platforms, Gradle script syntax, plist validity and the
workflow YAML. If the first CI run fails, the log will name the step.
