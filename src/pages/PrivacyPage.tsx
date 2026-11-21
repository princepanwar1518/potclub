import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { Card } from '../components/ui/primitives'
import { brand, pageTitle } from '../config/brand'
import { usePageMeta } from '../lib/usePageMeta'

/**
 * Privacy policy for the web app and the Android/iOS apps (the stores require a public URL).
 * It must describe what the code actually does: today the game runs entirely on the device, with
 * no accounts, servers, analytics, ads or tracking. Update this page before adding any of those.
 */
export const PRIVACY_UPDATED = '22 November 2026'

export function PrivacyPage() {
  usePageMeta({
    title: pageTitle('Privacy policy'),
    description: `How ${brand.name ?? 'this app'} handles your data: game progress stays on your device; no accounts, ads or tracking.`,
  })
  const name = brand.name ?? 'This app'

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <Card className="space-y-6 p-6 sm:p-8">
          <header className="space-y-2">
            <h1 className="font-display text-3xl font-bold">Privacy policy</h1>
            <p className="text-sm text-muted">Last updated {PRIVACY_UPDATED}</p>
          </header>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold [text-shadow:none]">The short version</h2>
            <p>
              {name} is a free game played with play coins that have no cash value. Your game runs on your own device. We do
              not ask you to create an account, and we do not collect, sell or share personal data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold [text-shadow:none]">What is stored, and where</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Your game progress (play-coin balance, groups, picks, history) and your settings (sound, spend limits,
                time-outs) are saved in your device's local app storage so the game continues where you left off.
              </li>
              <li>This data never leaves your device. Uninstalling the app, or clearing site data in your browser, deletes it.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold [text-shadow:none]">What we do not do</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>No accounts, sign-in, phone numbers or email addresses.</li>
              <li>No payments, bank details, deposits or withdrawals. Play coins cannot be bought, sold or cashed out.</li>
              <li>No advertising, analytics, tracking or third-party SDKs that collect data.</li>
              <li>No access to your contacts, photos, location, camera or microphone.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold [text-shadow:none]">Age</h2>
            <p>
              {name} is intended for adults (18+). It is not directed at children, and we do not knowingly collect data from
              anyone.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold [text-shadow:none]">Changes and contact</h2>
            <p>If this changes (for example, if online accounts are added), this page will be updated before the change ships.</p>
            {brand.supportEmail ? (
              <p>
                Questions:{' '}
                <a className="font-bold text-violet underline decoration-2 underline-offset-4" href={`mailto:${brand.supportEmail}`}>
                  {brand.supportEmail}
                </a>
              </p>
            ) : null}
          </section>
        </Card>
      </main>
      <SiteFooter />
    </>
  )
}
