import { Link } from 'react-router'
import { Container } from '../ui/primitives'
import { BrandSlot } from './BrandSlot'

export function SiteFooter() {
  return (
    <footer className="border-t border-line-soft bg-white/70 backdrop-blur">
      <Container className="flex flex-col gap-3 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <BrandSlot />
        <p>
          Play responsibly. Must be 18+ to participate.{' '}
          <Link to="/dashboard?tab=safety" className="font-medium text-violet underline underline-offset-4 hover:text-indigo">
            Player controls &amp; safety tools
          </Link>
        </p>
      </Container>
    </footer>
  )
}
