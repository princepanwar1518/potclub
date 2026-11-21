/** Registers the service worker in production builds only (dev uses Vite's live modules). */
export function registerServiceWorker(): void {
  // Skipped in the framed preview build: those hosts do not allow service workers.
  if (!import.meta.env.PROD || import.meta.env.VITE_ROUTER === 'memory' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      /* Offline support is optional; the app works without it. */
    })
  })
}

/** True when running as an installed app (home-screen icon), on iOS or Android. */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}

/** iPhone/iPad Safari, where installing is done from the Share menu (no programmatic prompt). */
export function isIosSafari(ua: string = navigator.userAgent): boolean {
  const iOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && typeof document !== 'undefined' && 'ontouchend' in document)
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  return iOS && !otherBrowser
}
