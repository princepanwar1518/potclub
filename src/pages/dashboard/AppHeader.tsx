import { Coins, Settings, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router'
import { BrandSlot } from '../../components/layout/BrandSlot'
import { Container } from '../../components/ui/primitives'
import { balanceOf, playerLabel } from '../../domain/rules'
import { CoinAmount } from '../../components/ui/CoinAmount'
import { useDemo } from '../../state/context'
import { isNativeBuild } from '../../lib/platform'

export function AppHeader() {
  const { state, status, actions } = useDemo()
  const balance = balanceOf(state.ledger, state.currentPlayerId)
  const muted = state.soundMuted

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-bar">
      <Container className="flex h-16 items-center justify-between gap-3">
        <BrandSlot />
        <div className="flex items-center gap-2 sm:gap-3">
          <p className="inline-flex items-center gap-1.5 rounded-btn border-2 border-ink bg-surface-2 px-3 py-1 text-sm font-bold text-ink shadow-[3px_3px_0_#141414]">
            <Coins aria-hidden="true" className="size-4" />
            <span className="sr-only">Balance:</span>
            {status === 'loading' ? <span className="inline-block h-4 w-14 skeleton" /> : <CoinAmount value={balance} />}
          </p>
          <p className="hidden text-sm font-bold text-ink sm:block">{playerLabel(state, state.currentPlayerId)}</p>
          <p className="hidden items-center gap-1 text-xs font-bold text-success sm:inline-flex">
            <span aria-hidden="true" className="size-2.5 animate-pulse rounded-full border-2 border-ink bg-[#2bd96b]" /> Live
          </p>
          <button
            type="button"
            onClick={actions.toggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Unmute draw sounds' : 'Mute draw sounds'}
            title={muted ? 'Unmute draw sounds' : 'Mute draw sounds'}
            className="inline-flex size-9 items-center justify-center rounded-btn border-2 border-transparent text-ink transition hover:border-ink hover:bg-surface-2"
          >
            {muted ? <VolumeX aria-hidden="true" className="size-[18px]" /> : <Volume2 aria-hidden="true" className="size-[18px]" />}
          </button>
          {/* Shown only to admins for convenience. Hiding it is NOT the protection — /admin is guarded itself. */}
          {!isNativeBuild && state.role === 'admin' ? (
            <Link
              to="/admin"
              aria-label="Admin panel"
              title="Admin panel"
              className="inline-flex size-9 items-center justify-center rounded-btn border-2 border-transparent text-ink transition hover:border-ink hover:bg-surface-2"
            >
              <Settings aria-hidden="true" className="size-[18px]" />
            </Link>
          ) : null}
        </div>
      </Container>
    </header>
  )
}
