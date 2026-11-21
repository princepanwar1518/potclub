import { Coins, Settings, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router'
import { BrandSlot } from '../../components/layout/BrandSlot'
import { Container } from '../../components/ui/primitives'
import { balanceOf, playerLabel } from '../../domain/rules'
import { CoinAmount } from '../../components/ui/CoinAmount'
import { useDemo } from '../../state/context'

export function AppHeader() {
  const { state, status, actions } = useDemo()
  const balance = balanceOf(state.ledger, state.currentPlayerId)
  const muted = state.soundMuted

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cp-black/85 shadow-header backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-3">
        <BrandSlot />
        <div className="flex items-center gap-2 sm:gap-3">
          <p className="inline-flex items-center gap-1.5 rounded-btn border border-cp-cyan/50 bg-mint-50 shadow-[0_0_14px_rgb(0_255_255/0.2)] px-3 py-1 text-sm font-semibold text-mint-600">
            <Coins aria-hidden="true" className="size-4" />
            <span className="sr-only">Balance:</span>
            {status === 'loading' ? <span className="inline-block h-4 w-14 skeleton" /> : <CoinAmount value={balance} />}
          </p>
          <p className="hidden text-sm text-muted sm:block">{playerLabel(state, state.currentPlayerId)}</p>
          <p className="hidden items-center gap-1 text-xs font-medium text-mint-600 sm:inline-flex">
            <span aria-hidden="true" className="size-2 animate-pulse rounded-full bg-mint-600" /> Live
          </p>
          <button
            type="button"
            onClick={actions.toggleMute}
            aria-pressed={muted}
            aria-label={muted ? 'Unmute draw sounds' : 'Mute draw sounds'}
            title={muted ? 'Unmute draw sounds' : 'Mute draw sounds'}
            className="inline-flex size-9 items-center justify-center rounded-btn text-muted transition hover:bg-lilac-50 hover:text-violet"
          >
            {muted ? <VolumeX aria-hidden="true" className="size-[18px]" /> : <Volume2 aria-hidden="true" className="size-[18px]" />}
          </button>
          {/* Shown only to admins for convenience. Hiding it is NOT the protection — /admin is guarded itself. */}
          {state.role === 'admin' ? (
            <Link
              to="/admin"
              aria-label="Admin panel"
              title="Admin panel"
              className="inline-flex size-9 items-center justify-center rounded-btn text-muted transition hover:bg-lilac-50 hover:text-violet"
            >
              <Settings aria-hidden="true" className="size-[18px]" />
            </Link>
          ) : null}
        </div>
      </Container>
    </header>
  )
}
