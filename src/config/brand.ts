/**
 * Brand settings. The name appears in the header, footer and page titles.
 * No logo yet: set `logoSrc` (e.g. '/brand/logo.svg' placed in /public/brand) when one exists.
 * The installed-app name lives in public/manifest.webmanifest and index.html (keep them in sync;
 * src/brand.test.ts checks this).
 */
export interface BrandConfig {
  name: string | null
  logoSrc: string | null
  /** Accessible label for the home link when no name is set. */
  homeLabel: string
}

export const brand: BrandConfig = {
  name: 'PotClub',
  logoSrc: null,
  homeLabel: 'Home',
}

/** Page-title helper: "Dashboard · Brand" when a brand exists, otherwise just the page name. */
export function pageTitle(page: string): string {
  return brand.name ? `${page} · ${brand.name}` : page
}
