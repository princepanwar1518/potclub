import { describe, expect, it } from 'vitest'
import { SECURITY_HEADERS } from '../deploy/security-headers.ts'
import { SPA_ROUTES } from '../deploy/spa-routes.ts'
import vercelJson from '../vercel.json'
import { routes } from './app/routes'

interface VercelConfig {
  rewrites: { source: string; destination: string }[]
  headers: { source: string; headers: { key: string; value: string }[] }[]
}

const vercel = vercelJson as VercelConfig

describe('deployment config stays in sync', () => {
  it('vercel.json sends exactly the security headers used by vite preview', () => {
    const global = vercel.headers.find((h) => h.source === '/(.*)')
    expect(Object.fromEntries(global?.headers.map((h) => [h.key, h.value]) ?? [])).toEqual(SECURITY_HEADERS)
  })

  it('rewrites only real SPA routes to index.html (so unknown paths get a 404 status)', () => {
    const rewritten = vercel.rewrites.filter((r) => r.destination === '/index.html').map((r) => r.source)
    expect(['/', ...rewritten].sort()).toEqual([...SPA_ROUTES].sort())
    expect(vercel.rewrites.some((r) => r.source.includes('(.*)') && r.destination === '/index.html')).toBe(false)
  })

  it('SPA_ROUTES matches the router (excluding the catch-all)', () => {
    const children = routes[0]?.children ?? []
    const paths = children.map((c) => (c.index ? '/' : `/${c.path ?? ''}`)).filter((p) => p !== '/*')
    expect(paths.sort()).toEqual([...SPA_ROUTES].sort())
  })

  it('hashed assets are cached immutably and HTML is revalidated', () => {
    const assets = vercel.headers.find((h) => h.source === '/assets/(.*)')
    expect(assets?.headers).toContainEqual({ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' })
    const html = vercel.headers.find((h) => h.source.includes('404.html'))
    expect(html?.headers).toContainEqual({ key: 'Cache-Control', value: 'no-cache' })
  })

  it('CSP forbids inline script and framing', () => {
    const csp = SECURITY_HEADERS['Content-Security-Policy'] ?? ''
    expect(csp).toContain("script-src 'self'")
    expect(csp).not.toContain('unsafe-inline')
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).toContain("frame-ancestors 'none'")
  })
})
