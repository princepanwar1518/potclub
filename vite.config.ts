import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { SECURITY_HEADERS } from './deploy/security-headers.ts'
import { hostingParity } from './deploy/vite-hosting-parity.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), hostingParity()],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  server: {
    // API runs separately in development (see server/README.md); proxy keeps it same-origin like production.
    proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } },
  },
  preview: {
    headers: { ...SECURITY_HEADERS },
  },
})
