import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '../ui/Button'
import { Container } from '../ui/primitives'
import { BrandSlot } from './BrandSlot'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cp-black/85 shadow-header backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandSlot />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <a
            href="#how-it-works"
            className="rounded-btn px-3 py-2 text-xs font-bold tracking-wider text-ink uppercase transition hover:bg-cp-green/10 hover:text-cp-green"
          >
            How it works
          </a>
          <ButtonLink to="/dashboard" size="sm" className="px-4">
            Play now <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </nav>
      </Container>
    </header>
  )
}
