/**
 * Brand settings. The name appears in the header, footer and page titles.
 * Logo assets live in /public/brand: the cinematic mark (scripts/brand/build_cinematic.py +
 * render_icons.py) and the vector wordmark (scripts/brand/build_logo.py).
 * The installed-app name lives in public/manifest.webmanifest and index.html (keep them in sync;
 * src/brand.test.ts checks this).
 */
export interface BrandConfig {
  name: string | null
  logoSrc: string | null
  /** Wordmark image; when set it replaces the text name chip (the name stays the accessible label). */
  wordmarkSrc: string | null
  /** Public support/privacy contact. Required by the app stores; shown on /privacy when set. */
  supportEmail: string | null
  /** Accessible label for the home link when no name is set. */
  homeLabel: string
}

export const brand: BrandConfig = {
  name: 'PotClub',
  logoSrc: '/brand/potclub-mark.webp',
  wordmarkSrc: '/brand/potclub-wordmark.svg',
  supportEmail: null, // TODO(store): set before submitting to Google Play / App Store
  homeLabel: 'Home',
}

/** Page-title helper: "Dashboard · Brand" when a brand exists, otherwise just the page name. */
export function pageTitle(page: string): string {
  return brand.name ? `${page} · ${brand.name}` : page
}
