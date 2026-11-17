import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './app/router'
import './index.css'
import { registerServiceWorker } from './lib/pwa'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element #root is missing from index.html')
}

registerServiceWorker()

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
