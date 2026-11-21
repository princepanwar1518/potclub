import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './app/router'
import './index.css'
import { isNativeBuild } from './lib/platform'
import { registerServiceWorker } from './lib/pwa'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root is missing from index.html')
}

if (isNativeBuild) {
  // Loaded only in the Android/iOS build; the web bundle never fetches it.
  void import('./native/bootstrap').then(({ startNative }) => startNative(router)).catch(() => undefined)
} else {
  registerServiceWorker()
}

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
