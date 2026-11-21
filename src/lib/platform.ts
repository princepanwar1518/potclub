/**
 * Build target. "native" = the bundle shipped inside the Android/iOS app (npm run build:native).
 * A build-time constant, so web-only code (service worker, install prompt) is dropped from the
 * native bundle and native-only code (src/native) is never loaded on the web.
 */
export const isNativeBuild: boolean = import.meta.env.VITE_PLATFORM === 'native'
