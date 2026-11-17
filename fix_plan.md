# fix_plan.md — single source of truth

Goal: recreate the reference (`reference-spec.md`) in light mode only, without its name/logo, with its defects fixed, production-ready.
Project root: `/home/claude/site` (cloud workspace). No other existing project was found (workspace empty, no device folder connected).

## Tasks (highest priority first)
- [x] 0. Analyse reference site and write `reference-spec.md` (tokens, routes, sections, defects with numbers)
- [x] 1. Scaffold project: Vite 8 + React 19 + strict TypeScript 7 + Tailwind v4 + react-router 7 (lazy routes) + oxlint + Vitest; route shells for `/`, `/dashboard`, `/admin` (secure default, no controls), 404, error boundary; `usePageMeta` (title/description/robots); `npm run check` passes; git init + first commit
- [x] 2. Design tokens + global styles (fonts Fredoka/DM Sans self-hosted via @fontsource, cream bg, dot pattern, pastel glows, buttons, cards); light mode only (`color-scheme: light`)
- [x] 3. Brand-neutral layout: sticky header with generic placeholder slot (NO name/logo), footer with 18+ notice
- [x] 4. Landing: hero + live-groups card (with loading skeleton, fixes defect 7)
- [x] 5. Landing: how-it-works 4 steps, 3 feature cards, CTA band
- [x] 6. Mock data layer (typed, in-memory, deterministic): groups, draws, ledger, leaderboard derived from draws; prize = fee×size×(1−fee%) (fixes 2, 6)
- [x] 7. Dashboard: header chips, 4 stat cards (games count derived from ledger, fixes 3), accessible tabs
- [x] 8. Available Groups tab + Quick Play filter; Join disabled with reason when balance < fee (fixes 4)
- [x] 9. Draw History (sorted newest first, fixes 5), Leaderboard (fixes 6), Alerts tab
- [x] 10. Wallet tab: ledger, deposit (min ₹200 validation, fixes 9), withdraw (≤ balance & max), referral — demo only, no real payments
- [x] 11. Play Safely tab: limits/time-out/self-exclusion with validation, enforced in mock join
- [x] 12. Admin route: NOT linked for players; guarded behind role check (fixes 1); consistent en-IN formatting (fixes 8)
- [x] 13. SEO/a11y: meta description, OG tags, headings, focus states, reduced motion, keyboard tabs (fixes 10)
- [x] 14. Responsive pass at 360/390/768/1024/1440; no horizontal overflow
- [x] 15. Tests (Vitest + Testing Library) for data rules + key UI; Lighthouse/axe check; production build + preview smoke test
- [x] 16. Final report

## Verification log (2026-11-17)
- `npm run check`: oxlint 0 warnings, tsc strict 0 errors, **41/41 tests**, build OK (main JS 337.12 kB / 107.19 kB gzip, CSS 44.09 kB / 8.82 kB gzip).
- Real Chrome (Playwright, `scripts/shoot.py`): 9 routes/tabs × 4 viewports (390/768/1280/1512) = 36 checks, 0 horizontal overflow, 0 console errors/warnings.
- axe-core (wcag2a/aa + best-practice) at 390 and 1280 on all 9 views: 0 violations after fixes (mint-600 → #116b4b, lilac-600 → #5643d4, focusable table scrollers).
- Landing height 1,894 px at 1512 vs reference 1,938 px (−2.3%).
- Throttled mobile (150 ms RTT, 1.6 Mbps, 4× CPU): FCP 1,384 ms, LCP 1,472 ms, CLS 0.000, 193 kB transferred in 10 requests. Lighthouse itself not installed — metrics measured via Performance API.
- End-to-end draw in Chrome: joined → picked card → grace → reveal → balance ₹9,900 + ₹1,76,000 = ₹1,85,900, wins 1, history/alerts updated, 0 console errors.
- Production bundle grep: dev-only "Preview as admin" string absent from dist.

## Backend requirements (cannot be met by a frontend-only demo)
- Real authentication (sessions/JWT), server-side role checks on every admin endpoint, MFA + audit log for admins; serve admin code only to admins.
- Server-authoritative ledger (double-entry, idempotent transactions), group joins with row locking, and draws using a server CSPRNG with an auditable record (commit–reveal or signed results).
- Server enforcement of spend/loss limits, time-outs, self-exclusion, age (18+) and KYC; these checks currently run only in the mock store.
- Payment gateway, withdrawals and tax handling — and a legal opinion first: real-money online games/lotteries are restricted in India (Promotion and Regulation of Online Gaming Act, 2025).
- Host config: return HTTP 404 for unknown routes, security headers (CSP, HSTS, X-Frame-Options), canonical URL + og:image once a domain and branding exist.

## Blocked / needs user
- Branding (name, logo) — user will supply later; keep placeholder slot neutral.
- Real backend/payments are out of scope — mock only. Real-money online lottery/gaming is restricted in India (Promotion and Regulation of Online Gaming Act, 2025); confirm legal basis before any real-money launch.
- Reference mobile layout could not be captured (browser resize had no effect) — design mobile from desktop rules.

## Notes
- Architecture: `src/domain` (types, pure rules, seed — all money maths), `src/state` (reducer, DemoProvider = mock server + draw engine + simulated players, context hooks), `src/components/{ui,layout}`, `src/pages/{landing,dashboard}`, `src/config/brand.ts` (set name/logo here).
- Dashboard tab is in the URL (`?tab=history|wallet|safety|leaderboard|alerts`).
- Admin: `state.role` is never persisted; guests see "Administrator access required". Dev builds show a "Preview as admin (dev only)" button; production builds strip it.
- Simulated bots only fill the first open group the player is in (1 per 1.5 s) and pick cards 1 per 1.5 s; draws settle at grace end or via "reveal now".
- Visual QA needs Python Playwright + /usr/bin/google-chrome: `python3 scripts/shoot.py http://localhost:4173 /tmp/shots / /dashboard`. axe was run with `npm i --no-save axe-core` (not a project dependency).
- Admin "Total players" is 44 (unique players in seed), not the reference's 215 — the reference number could not be derived from visible data.
- Commands: `npm run dev` (5173), `npm run lint` (oxlint), `npm run typecheck` (tsc -b), `npm test` (vitest run), `npm run build`, `npm run check` (all four), `npx vite preview` (4173).
- Linter is **oxlint** (what the current Vite template ships), not ESLint — keeps lint < 1s. Config: `.oxlintrc.json`.
- Strict flags on: strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitReturns, noPropertyAccessFromIndexSignature. Optional props must be typed `x?: T | undefined` if assigned undefined.
- `vitest.config.ts` imports `./vite.config.ts` WITH extension (tsconfig.node uses module nodenext).
- Routes live in `src/app/routes.tsx` (shared by tests via createMemoryRouter). Pages in `src/pages/`. Landing/Dashboard are minimal shells: replace their bodies in tasks 4–11, keep `usePageMeta` calls.
- AdminPage currently ALWAYS shows "Administrator access required" — keep this as the guest fallback when building task 12.
- Favicon is `data:,` (no brand icon); swap when branding arrives.
- Baseline build: main JS 314.01 kB (99.54 kB gzip), CSS 10.44 kB. Track this in later tasks.
- SPA fallback returns HTTP 200 for unknown paths in `vite preview`; the production host must be configured to send 404 status for unknown routes (deployment note for final report).
- Browser-level console check not possible from this workspace (user's Chrome can't reach the sandbox localhost); rely on jsdom tests + curl smoke tests, re-check visually when deployed.
- Reference is a client-rendered SPA; curl from workspace is blocked by egress proxy (403) and WebFetch only sees meta → use Claude in Chrome for any re-inspection.
- Do not click Join/Deposit/Admin "Update" on the reference: it's a live app with shared guest state.
- Fee check: ₹440 payout on 5×₹100 = 12% platform fee, matches admin "Platform Fee 12%".
