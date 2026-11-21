import { Coins, TrendingUp, Trophy, Users, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { CoinAmount } from '../../components/ui/CoinAmount'
import { Card, IconChip, type Tone } from '../../components/ui/primitives'
import { playerStats } from '../../domain/rules'
import { formatNumber } from '../../lib/format'
import { cn } from '../../lib/cn'
import { useDemo } from '../../state/context'

interface Stat {
  label: string
  value: ReactNode
  icon: LucideIcon
  tone: Tone
  valueClass: string
  hint: string
}

export function StatCards() {
  const { state, status } = useDemo()
  const s = playerStats(state, state.currentPlayerId)
  const stats: Stat[] = [
    { label: 'Balance', value: <CoinAmount value={s.balance} />, icon: Coins, tone: 'mint', valueClass: 'text-mint-600', hint: 'No cash value' },
    { label: 'Wins', value: formatNumber(s.wins), icon: Trophy, tone: 'amber', valueClass: 'text-amber-600', hint: `of ${formatNumber(s.games)} games` },
    { label: 'Winnings', value: <CoinAmount value={s.winnings} />, icon: TrendingUp, tone: 'mint', valueClass: 'text-mint-600', hint: 'Total prizes' },
    { label: 'Games', value: formatNumber(s.games), icon: Users, tone: 'lilac', valueClass: 'text-indigo', hint: `${formatNumber(s.totalEntries)} used` },
  ]

  return (
    <section aria-label="Your stats" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {stats.map((st) => (
        <Card key={st.label} className="flex items-start justify-between gap-2 p-4 sm:p-5">
          <div className="min-w-0">
            <h2 className="font-sans text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{st.label}</h2>
            {status === 'loading' ? (
              <div className="mt-2 h-8 w-20 skeleton" />
            ) : (
              <p className={cn('mt-1 font-display text-2xl leading-tight font-semibold break-words sm:text-3xl', st.valueClass)}>{st.value}</p>
            )}
            <p className="mt-0.5 text-xs text-muted">{st.hint}</p>
          </div>
          <IconChip tone={st.tone} className="hidden sm:inline-flex">
            <st.icon className="size-[18px]" />
          </IconChip>
        </Card>
      ))}
    </section>
  )
}
