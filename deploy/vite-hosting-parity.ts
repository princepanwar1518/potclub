import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import type { Plugin } from 'vite'
import { SECURITY_HEADERS } from './security-headers.ts'
import { SPA_ROUTES } from './spa-routes.ts'

/**
 * 0. Generates dist/sw.js from deploy/sw-template.js with the exact list of built files to precache.
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
      if (!existsSync(index)) return
      copyFileSync(index, resolve(outDir, '404.html'))
      writeServiceWorker(outDir)
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

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? listFiles(full) : [full]
  })
}

/** Precache the app shell, every hashed asset and the icons; version = hash of that file list's contents. */
function writeServiceWorker(outDir: string): void {
  const files = listFiles(outDir)
    .map((f) => '/' + relative(outDir, f).split('\\').join('/'))
    .filter((p) => p === '/index.html' || p.startsWith('/assets/') || p.startsWith('/icons/') || p === '/manifest.webmanifest')
    .sort()
  const hash = createHash('sha256')
  for (const f of files) hash.update(f).update(readFileSync(join(outDir, f)))
  const template = readFileSync(resolve(import.meta.dirname, 'sw-template.js'), 'utf8')
  const sw = template.replace("'__VERSION__'", JSON.stringify(hash.digest('hex').slice(0, 12))).replace('__PRECACHE__', JSON.stringify(files))
  writeFileSync(join(outDir, 'sw.js'), sw)
}
