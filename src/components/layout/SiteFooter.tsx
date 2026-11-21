import { Link } from 'react-router'
import { Container } from '../ui/primitives'
import { BrandSlot } from './BrandSlot'

export function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-ink bg-bar">
      <Container className="flex flex-col gap-3 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <BrandSlot />
        <p>
          Play responsibly. Must be 18+ to participate.{' '}
          <Link to="/dashboard?tab=safety" className="font-bold text-violet underline decoration-2 underline-offset-4 hover:text-accent-ink">
            Player controls &amp; safety tools
          </Link>
        </p>
      </Container>
    </footer>
  )
}
