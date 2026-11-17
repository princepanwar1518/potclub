/**
 * Branding is intentionally empty until the owner supplies it.
 * Set `name` and/or `logoSrc` (e.g. '/brand/logo.svg' placed in /public/brand) and every
 * header, footer and page title picks it up. Nothing else needs to change.
 */
export interface BrandConfig {
  name: string | null
  logoSrc: string | null
  /** Accessible label for the home link when no name is set. */
  homeLabel: string
}

export const brand: BrandConfig = {
  name: null,
  logoSrc: null,
  homeLabel: 'Home',
}

/** Page-title helper: "Dashboard · Brand" when a brand exists, otherwise just the page name. */
export function pageTitle(page: string): string {
  return brand.name ? `${page} · ${brand.name}` : page
}
