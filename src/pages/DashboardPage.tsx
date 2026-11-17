import { Bell, History, LayoutGrid, ShieldCheck, Trophy, Wallet } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { Container } from '../components/ui/primitives'
import { TabList, type TabItem } from '../components/ui/Tabs'
import { pageTitle } from '../config/brand'
import { tabPanelProps } from '../lib/tabs'
import { usePageMeta } from '../lib/usePageMeta'
import { useDemo } from '../state/context'
import { AppHeader } from './dashboard/AppHeader'
import { GroupsTab } from './dashboard/GroupsTab'
import { AlertsTab, HistoryTab, LeaderboardTab } from './dashboard/HistoryTabs'
import { MyGroups } from './dashboard/MyGroups'
import { SafetyTab } from './dashboard/SafetyTab'
import { StatCards } from './dashboard/StatCards'
import { WalletTab } from './dashboard/WalletTab'

type TabKey = 'groups' | 'history' | 'wallet' | 'safety' | 'leaderboard' | 'alerts'
const TAB_KEYS: readonly TabKey[] = ['groups', 'history', 'wallet', 'safety', 'leaderboard', 'alerts']

function isTabKey(v: string | null): v is TabKey {
  return v !== null && (TAB_KEYS as readonly string[]).includes(v)
}

const panels: Record<TabKey, () => React.JSX.Element> = {
  groups: GroupsTab,
  history: HistoryTab,
  wallet: WalletTab,
  safety: SafetyTab,
  leaderboard: LeaderboardTab,
  alerts: AlertsTab,
}

export function DashboardPage() {
  usePageMeta({
    title: pageTitle('Dashboard'),
    description: 'Open groups, live draws, draw history, wallet, play-safety controls and leaderboard.',
    noIndex: true,
  })
  const { state } = useDemo()
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const active: TabKey = isTabKey(raw) ? raw : 'groups'
  const unread = state.notifications.filter((n) => !n.read).length

  const tabs: TabItem<TabKey>[] = [
    { key: 'groups', label: 'Available Groups', icon: <LayoutGrid aria-hidden="true" className="size-4" /> },
    { key: 'history', label: 'Draw History', icon: <History aria-hidden="true" className="size-4" /> },
    { key: 'wallet', label: 'Wallet', icon: <Wallet aria-hidden="true" className="size-4" /> },
    { key: 'safety', label: 'Play Safely', icon: <ShieldCheck aria-hidden="true" className="size-4" /> },
    { key: 'leaderboard', label: 'Leaderboard', icon: <Trophy aria-hidden="true" className="size-4" /> },
    { key: 'alerts', label: 'Alerts', icon: <Bell aria-hidden="true" className="size-4" />, badge: unread },
  ]

  const Panel = panels[active]

  return (
    <>
      <AppHeader />
      <main id="main">
        <Container className="space-y-6 py-6 sm:py-8">
          <h1 className="sr-only">Player dashboard</h1>
          <p className="rounded-xl border border-amber-600/15 bg-amber-50/70 px-3 py-2 text-center text-xs text-amber-600 sm:text-sm">
            Play coins only — coins are free, have no cash value and can't be bought or cashed out. Other players are simulated.
          </p>
          {state.config.maintenance ? (
            <p role="status" className="rounded-xl border border-danger/20 bg-pink-50 px-3 py-2 text-center text-sm text-danger">
              Paid groups are paused for maintenance. Your balance and history are safe.
            </p>
          ) : null}
          <StatCards />
          <MyGroups />
          <TabList
            items={tabs}
            active={active}
            idBase="dash"
            label="Dashboard sections"
            onChange={(key) => setParams(key === 'groups' ? {} : { tab: key }, { replace: true })}
          />
          <div {...tabPanelProps('dash', active)} className="outline-none">
            <Panel />
          </div>
        </Container>
      </main>
    </>
  )
}
