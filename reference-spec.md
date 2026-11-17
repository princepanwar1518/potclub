# Reference spec — https://lottomax-efhymcxn.manus.space/

Captured 2026-11-17 via Chrome (desktop 1920×1031). Client-rendered SPA (WebFetch returns only meta),
built/hosted on Manus. The reference's name/logo must NOT be reproduced (user supplies branding later).

## Routes
| Route | Purpose |
|---|---|
| `/` | Marketing landing |
| `/dashboard` | Player app (tabs) |
| `/admin` | Admin dashboard — reachable by a guest via header button (security bug) |
| `#how-it-works` | In-page anchor on landing |

## Design tokens (computed styles)
- Fonts: **Fredoka 600** (headings), **DM Sans 400/500/600/700** (body). Body 16px / 24px.
- Body bg `oklch(0.985 0.015 90)` (warm cream) with faint dotted pattern + soft pastel radial glows (peach top-left, lavender, mint bottom-right).
- Text `oklch(0.255 0.035 285)`; heading colour `rgb(63,49,95)`; border `oklch(0.89 0.035 285)`.
- H1 72px/70.56px w600; line 2 gradient text `linear-gradient(to right, #6D5AE6 0%, #AF55C9 50%, #F06E87 100%)`.
- H2 36px/40px w600. H3 Fredoka ~18–20px.
- Primary button: gradient `105deg #6D5AE6 → #A653D7`, white, radius 16px, padding 0 16px, shadow `0 9px 18px rgba(109,90,230,.24)`.
- Secondary button: bg `rgba(255,255,255,.75)`, text `#5B3B9B`, 1px border `rgba(116,79,177,.2)`, radius 16px, padding 0 28px.
- Header: sticky, bg `rgba(255,255,255,.8)` (blur), shadow `0 8px 25px rgba(97,68,142,.06)`.
- Cards: white, ~20px radius, thin lavender border, soft shadow; pastel icon chips (lavender, pink, amber, mint).
- CTA band: horizontal gradient indigo `#6D5AE6` → pink `#E8618C`, ~24px radius, two decorative translucent circles (top-left lavender, bottom-right coral).
- `prefers-reduced-motion` rules present.

## Landing `/` (page height 1938px)
1. Sticky header: logo (lightning icon tile + wordmark) · "How it works" · "Play now →" (pill, gradient).
2. Hero (600px), 2 columns: eyebrow pill "Instant groups. Live surprises."; H1 "Pick a number. / Enjoy the moment."; paragraph; buttons "Find my group →" + "See the simple steps"; trust row (heart "Player-first controls", check "Clear, server-checked play").
   Right: tilted stat card — "LIVE GROUPS", big "4 open", "Ready for a few more lucky picks", two sub-cards "Prize pools ₹18,50,000" and "Group sizes 5–20", mint→cyan button "Explore open groups →", caption "Your guest player space is ready."
3. `#how-it-works` (526px): eyebrow "EASY AS 1, 2, 3, 4", H2 "A happy little ritual, every time", sub; 4 step cards (01 Choose your crew / 02 Pick your lucky number / 03 Take a quick look / 04 Enjoy the reveal) each with number + pastel icon chip.
4. 3 feature cards (258px): Full group, instant draw · Designed for fair play · Happy, safe control.
5. CTA band: party icon, "Your next group is waiting", sub, white button "Start playing →".
6. Footer: wordmark left; right "Play responsibly. Must be 18+ to participate." + underlined link.

## Dashboard `/dashboard`
- Header: logo · balance chip (₹9,900) · "Player #600001" · Live dot · mute-sounds button · admin gear.
- 4 stat cards: Balance (wallet icon, green) · Wins (trophy, amber) · Winnings (trend, green) · Games (users, violet).
- Tabs: Available Groups · Draw History · Wallet · Play Safely · Leaderboard · Alerts.
- Available Groups: "Quick Play" banner (5P/10P/15P/20P chips) + grid (3 cols) of group cards: title, "Open" badge, Entry fee, Prize pool, players progress bar x/n, "Join Group" gradient button.
- Draw History: list of draws (size badge, date, winner, prize).
- Wallet: transaction list (+/− rows), Deposit (preset ₹500/₹1,000/₹5,000), Withdraw, Invite & Earn (referral code, apply code).
- Play Safely: hourly/daily spend + daily loss limits; time-out (24h/3d/7d); self-exclude (7d/30d/6m).
- Leaderboard: Top Winners rank list. Alerts: enable browser alerts + empty state.

## Admin `/admin`
Stats (Total revenue ₹12,180, draws 5, players 215, active groups 4); tabs Platform Config / Recent Draws / Users; config rows Platform Fee 12%, Min deposit ₹200, Max withdrawal ₹100,000, Maintenance mode toggle.

## Defects found in reference (numbers shown)
1. **Guest can open `/admin`** and see Update/Enable Maintenance controls — authz bug (critical).
2. **Prize pool overstated by the 12% fee**: cards show pool = fee × size (₹20,000×10 = ₹2,00,000) but history pays ₹440 on a 5×₹100 = ₹500 pool → 500×0.88 = 440. True 10P pool = ₹1,76,000.
3. **Games counter wrong**: shows 1, wallet lists 3 game entries (₹20,000, ₹100, ₹50,000).
4. Balance check: deposits 5,000+20,000+55,000 = 80,000 − entries 70,100 = **₹9,900 ✓** (ledger consistent). But balance < cheapest open entry (₹20,000) and Join buttons are not disabled.
5. **Draw history unsorted**: Aug 15, May 16, Oct 30, Nov 13, Nov 16 (neither asc nor desc).
6. **Leaderboard broken**: all 10 rows ₹0 and empty win count ("wins"), while history shows Player #31 won ₹50,000 ×2 and #540002 won ₹440 ×2 — neither listed.
7. Hero card first paints "0 open / ₹0" before data loads (no skeleton).
8. Number format inconsistent: "₹100,000" (admin) vs "₹1,00,000" (en-IN) elsewhere.
9. Min deposit ₹200 but no ₹200 preset; no visible validation messaging.
10. No `<meta name="description">`; TTFB 2,298 ms on one sample.
11. Mobile layout not verified (window resize did not apply in the test browser).
