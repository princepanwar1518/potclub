# PotClub — store submission kit

Everything to fill in on Google Play Console and App Store Connect for version 1.0.0. Facts below
describe what the app actually does today; if the app changes (accounts, a server, analytics, ads),
update the privacy page (`src/pages/PrivacyPage.tsx`) and these answers first.

## Blockers to clear before you submit

1. **Support email** — set `supportEmail` in `src/config/brand.ts` (shown on the privacy page). Both
   stores require a contact.
2. **Public privacy policy URL** — both stores need a live web link. The page exists at `/privacy`,
   but the website is not deployed yet. Deploy the web app (for example Vercel with the included
   `vercel.json`) and use `https://<your-domain>/privacy`.
3. **App id** — `com.potclub.app` is permanent after the first upload; confirm it (see README).
4. **Google Play, new personal account** — you must run a **closed test with at least 12 testers
   opted in for 14 days in a row** before you can apply for production. Organization accounts are
   exempt. Start this early.

## Listing text (both stores)

**Name:** PotClub
**Subtitle (iOS, 30 chars):** Pick a card. Feel the draw.
**Short description (Play, 80 chars):** Join a group, pick your lucky card and watch the live draw. Free play coins only.

**Full description:**
> PotClub is a light, social number-draw game. Join a 5, 10, 15 or 20-player group, pick a unique
> card and watch the live draw the moment the group fills.
>
> • Quick Play: choose a group size and jump straight in
> • Pick your lucky number before the timer runs out — or get a random free card
> • Live draw room, draw history and your stats
> • Built-in player controls: spending limits, time-outs and self-exclusion
>
> PotClub uses free play coins only. Coins have no cash value and cannot be bought, sold or cashed
> out. There are no real-money prizes. Other players in a group are simulated. For adults 18+.

**Category:** Games → Casual (Play) / Games → Casual (iOS; secondary: Board)
**Keywords (iOS, 100 chars):** number draw,lucky card,group game,casual,party,draw,cards,social,free play

## Content rating

**Google Play (IARC questionnaire):** category *Game*. Answer **yes** to *simulated gambling*; no
violence, no sexual content, no user-generated content, no user interaction/chat, no location
sharing, no purchases of digital goods. Expect a mature rating that varies by region.

**App Store Connect (age rating):** Chance-Based Activities → **Simulated Gambling: Frequent**;
everything else *None*; no unrestricted web access; no user-generated content. Apple rates frequent
simulated gambling **18+**, which matches the app's own 18+ rule.

Simulated gambling (no real money, coins with no cash value) is allowed on both stores; real-money
gambling is not, and this app has none.

## Data safety (Play) and App Privacy (iOS)

| Question | Answer |
|---|---|
| Does the app collect or share user data? | **No.** Game progress is stored only on the device. |
| Is data encrypted in transit? | Not applicable — nothing is transmitted. |
| Can users request deletion? | Uninstalling the app deletes all data. |
| Tracking (iOS App Tracking Transparency) | **No tracking.** |
| Ads | **No ads.** |
| Target audience (Play) | 18 and over. Not designed for children. |
| In-app purchases | **None.** |
| Export compliance (iOS) | Uses no non-exempt encryption (`ITSAppUsesNonExemptEncryption = NO` is set). |

## Review notes (paste into both stores)

> PotClub is a free casual game played with play coins that have no cash value. There are no
> purchases, no prizes, no withdrawals and no account sign-in. Other players in each group are
> simulated on the device. No login is required to review: open the app → Play now → Quick Play.

## Assets in this folder

| File | Use |
|---|---|
| `store/play-icon-512.png` | Play Console hi-res icon (512×512) |
| `store/feature-graphic-1024x500.png` | Play Console feature graphic |
| `store/screenshots/android-phone/*.png` | Play phone screenshots (1080×2340) |
| `store/screenshots/iphone-6.9/*.png` | App Store 6.9" iPhone screenshots (1290×2796) |

The iOS app icon (1024×1024) is already inside the Xcode project. iPad screenshots are only needed if
you keep iPad support enabled in Xcode; otherwise set the target to iPhone only.

## Release order that works

1. Push to GitHub → download the debug APK from the workflow run → try it on your phone.
2. Create the Play app → upload the signed `.aab` to **Closed testing** → invite 12+ testers → wait 14 days.
3. Create the App Store Connect app → tag `v1.0.0` → the build appears in TestFlight → test → submit for review.
4. After the closed test, apply for Play production access → roll out.
