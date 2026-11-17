import { SiteFooter } from '../components/layout/SiteFooter'
import { SiteHeader } from '../components/layout/SiteHeader'
import { pageTitle } from '../config/brand'
import { usePageMeta } from '../lib/usePageMeta'
import { CtaBand } from './landing/CtaBand'
import { Hero } from './landing/Hero'
import { Features, HowItWorks } from './landing/HowItWorks'

export function LandingPage() {
  usePageMeta({
    title: pageTitle('Pick a number, enjoy the moment — instant group draws'),
    description:
      'Join a 5, 10, 15 or 20-player group, pick a unique card and watch the live draw the moment the group fills. Spend limits, time-outs and self-exclusion built in.',
  })

  return (
    <>
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Features />
        <CtaBand />
      </main>
      <SiteFooter />
    </>
  )
}
