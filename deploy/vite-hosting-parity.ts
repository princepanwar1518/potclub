import { copyFileSync, existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { SECURITY_HEADERS } from './security-headers.ts'
import { SPA_ROUTES } from './spa-routes.ts'

/**
 * 1. Emits dist/404.html (a copy of index.html) so static hosts can serve the SPA's not-found
 *    page with a real 404 status.
 * 2. Makes `vite preview` behave like the production host: security headers on every response,
 *    known SPA routes → index.html (200), unknown page routes → 404.html (404).
 */
export function hostingParity(): Plugin {
  let outDir = 'dist'
  return {
    name: 'hosting-parity',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html')
      if (existsSync(index)) copyFileSync(index, resolve(outDir, '404.html'))
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v)
        const url = new URL(req.url ?? '/', 'http://localhost')
        const path = url.pathname.replace(/\/+$/, '') || '/'
        const isPageRequest = (req.method === 'GET' || req.method === 'HEAD') && !/\.[a-z0-9]+$/i.test(path)
        if (!isPageRequest) {
          // Missing files must 404 (as on the real host) instead of falling back to HTML.
          if (/\.[a-z0-9]+$/i.test(path) && !existsSync(resolve(outDir, '.' + decodeURIComponent(path)))) {
            res.statusCode = 404
            res.end('Not found')
            return
          }
          return next()
        }
        if (SPA_ROUTES.includes(path)) {
          req.url = '/index.html' + url.search
          return next()
        }
        res.statusCode = 404
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.setHeader('Cache-Control', 'no-cache')
        res.end(readFileSync(resolve(outDir, '404.html')))
      })
    },
  }
}
