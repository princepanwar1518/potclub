import { createBrowserRouter, createMemoryRouter } from 'react-router'
import { routes } from './routes'

/**
 * Normal builds use real URLs (/dashboard, /admin). The "preview" build (VITE_ROUTER=memory) is for
 * hosts that serve the app inside a frame and do not pass URL paths through, such as a private
 * claude.ai preview page; navigation then stays in memory and always starts at the home page.
 */
export const router =
  import.meta.env.VITE_ROUTER === 'memory' ? createMemoryRouter(routes, { initialEntries: ['/'] }) : createBrowserRouter(routes)
