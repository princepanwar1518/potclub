import type { RouteObject } from 'react-router'
import { RouteErrorPage } from '../pages/RouteErrorPage'
import { RouteFallback } from '../pages/RouteFallback'
import { AppRoot } from './AppRoot'

/**
 * Route table shared by the browser router and tests.
 * Pages are code-split so the landing page does not ship dashboard/admin code.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppRoot />,
    errorElement: <RouteErrorPage />,
    hydrateFallbackElement: <RouteFallback />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('../pages/LandingPage')).LandingPage }) },
      { path: 'dashboard', lazy: async () => ({ Component: (await import('../pages/DashboardPage')).DashboardPage }) },
      // The demo operator console is web-only; the store apps ship the player experience.
      ...(import.meta.env.VITE_PLATFORM === 'native'
        ? []
        : [{ path: 'admin', lazy: async () => ({ Component: (await import('../pages/AdminPage')).AdminPage }) }]),
      { path: 'privacy', lazy: async () => ({ Component: (await import('../pages/PrivacyPage')).PrivacyPage }) },
      { path: '*', lazy: async () => ({ Component: (await import('../pages/NotFoundPage')).NotFoundPage }) },
    ],
  },
]
