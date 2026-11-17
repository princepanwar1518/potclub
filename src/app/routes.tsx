import type { RouteObject } from 'react-router'
import { RouteErrorPage } from '../pages/RouteErrorPage'

/**
 * Route table shared by the browser router and tests.
 * Pages are code-split so the landing page does not ship dashboard/admin code.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('../pages/LandingPage')).LandingPage }) },
      { path: 'dashboard', lazy: async () => ({ Component: (await import('../pages/DashboardPage')).DashboardPage }) },
      { path: 'admin', lazy: async () => ({ Component: (await import('../pages/AdminPage')).AdminPage }) },
      { path: '*', lazy: async () => ({ Component: (await import('../pages/NotFoundPage')).NotFoundPage }) },
    ],
  },
]
