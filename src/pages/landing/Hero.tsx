import { ArrowRight, CircleCheck, Heart, Sparkles, Zap } from 'lucide-react'
import { groupPrize, openGroups } from '../../domain/rules'
import { GROUP_SIZES } from '../../domain/types'
import { CoinAmount } from '../../components/ui/CoinAmount'
import { formatNumber } from '../../lib/format'
import { useDemo } from '../../state/context'
import { ButtonLink } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/buttonClasses'
import { Container, IconChip } from '../../components/ui/primitives'
import { WindowBar } from '../../components/ui/WindowBar'

function LiveGroupsCard() {
  const { state, status } = useDemo()
  const open = openGroups(state.groups)
  const pools = open.reduce((sum, g) => sum + groupPrize(g), 0)
  const loading = status === 'loading'
  const minSize = Math.min(...GROUP_SIZES)
  const maxSize = Math.max(...GROUP_SIZES)

  return (
    <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:ml-auto">
      <section
        aria-labelledby="live-groups-title"
        aria-busy={loading}
        className="overflow-hidden rounded-panel border-[3px] border-ink bg-surface shadow-float motion-safe:animate-float"
      >
        <WindowBar tone="violet" title={<span id="live-groups-title">Live groups</span>} />
        <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            {loading ? (
              <div className="mt-3 h-10 w-28 skeleton" />
            ) : (
              <p className="font-display text-5xl font-bold text-ink">
                {formatNumber(open.length)} <span className="text-lg text-muted">open</span>
              </p>
            )}
            <p className="mt-1 text-sm text-muted">
              {open.length > 0 || loading ? 'Ready for a few more lucky picks' : 'New groups start as soon as someone joins'}
            </p>
          </div>
          <IconChip tone="lilac">
            <Sparkles className="size-[18px]" />
          </IconChip>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-card border-2 border-ink bg-surface-2 p-3.5">
            <dt className="text-xs font-bold text-muted">Prize pools</dt>
            <dd className="mt-1 font-display text-xl font-bold text-mint-600">
              {loading ? <span className="block h-6 w-24 skeleton" /> : <CoinAmount value={pools} />}
            </dd>
          </div>
          <div className="rounded-card border-2 border-ink bg-surface-2 p-3.5">
            <dt className="text-xs font-bold text-muted">Group sizes</dt>
            <dd className="mt-1 font-display text-xl font-bold text-violet">
              {minSize}–{maxSize}
            </dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] leading-snug text-muted">Play coins only, no cash value. Pools shown after fees.</p>

        <ButtonLink to="/dashboard" variant="mint" className="mt-4 w-full">
          Explore open groups <ArrowRight aria-hidden="true" className="size-4" />
        </ButtonLink>
        </div>
      </section>
      <p className="mt-5 text-center text-xs font-bold text-ink">Your guest player space is ready.</p>
    </div>
  )
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <Container className="grid items-center gap-12 py-14 sm:py-20 lg:min-h-[600px] lg:grid-cols-[1.3fr_1fr] lg:py-16">
        <div className="motion-safe:animate-fade-up">
          <p className="inline-flex items-center gap-1.5 rounded-btn border-2 border-ink bg-warn px-3 py-1 font-display text-sm font-bold text-ink shadow-[3px_3px_0_#141414]">
            <Zap aria-hidden="true" className="size-3.5" /> Instant groups. Live surprises.
          </p>
          <h1 id="hero-title" className="mt-5 text-[2.6rem] leading-[1.02] tracking-tight sm:text-6xl lg:text-[64px]">
            Pick a number.
            <span className="block text-gradient pb-1 lg:whitespace-nowrap">Enjoy the moment.</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted sm:text-lg">
            Join a friendly group, choose your lucky card, and share the excitement as the live draw unfolds when the
            group fills.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink to="/dashboard">
              Find my group <ArrowRight aria-hidden="true" className="size-4" />
            </ButtonLink>
            <a href="#how-it-works" className={buttonClasses('secondary', 'md', 'px-7')}>
              See the simple steps
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <li className="flex items-center gap-1.5">
              <Heart aria-hidden="true" className="size-4 text-pink-600" /> Player-first controls
            </li>
            <li className="flex items-center gap-1.5">
              <CircleCheck aria-hidden="true" className="size-4 text-mint-600" /> Clear rules, random draws
            </li>
          </ul>
        </div>
        <LiveGroupsCard />
      </Container>
    </section>
  )
}
