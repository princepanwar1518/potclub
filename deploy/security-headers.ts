/**
 * Single source of truth for the static site's HTTP security headers.
 * Used by `vite preview` (so the production build is tested under the real policy) and
 * checked against vercel.json by deploy/deploy-config.test.ts so the two cannot drift.
 *
 * CSP notes:
 *  - No inline scripts or styles are emitted by the build; React sets style attributes via the
 *    CSSOM, which CSP does not block.
 *  - `connect-src 'self'` assumes the API is served same-origin under /api (see docs/DEPLOYMENT.md).
 *    If the API lives on another origin, add it here AND in vercel.json.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

export const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
}
