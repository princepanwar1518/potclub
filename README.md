# PotClub — frontend (demo)

Vite + React 19 + strict TypeScript + Tailwind CSS v4. Retro desktop theme (90s OS windows) — role tokens in `src/index.css`. **Demo build:** play money, simulated players, no backend.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:5173 |
| `npm run check` | Lint (oxlint) → strict type check → tests (Vitest) → production build |
| `npm run build` / `npx vite preview` | Production build / serve `dist` on :4173 |

## Structure

- `src/domain` — types, pure business rules (prize = pool − platform fee, join eligibility, history, leaderboard), seed data
- `src/state` — reducer and `DemoProvider` (mock server actions, draw engine, simulated players, local persistence)
- `src/components` — UI primitives and layout; `src/pages` — landing, dashboard tabs, admin
- `src/config/brand.ts` — set `name` / `logoSrc` to apply branding everywhere

## Before production

This is a frontend only. Admin access, the wallet, limits and draws are enforced in the browser for the demo and **must** be re-implemented server-side with real authentication. See `fix_plan.md → Backend requirements`.
