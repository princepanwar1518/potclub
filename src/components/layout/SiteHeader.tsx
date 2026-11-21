import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '../ui/Button'
import { Container } from '../ui/primitives'
import { BrandSlot } from './BrandSlot'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-bar">
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandSlot />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <a
            href="#how-it-works"
            className="rounded-btn border-2 border-transparent px-3 py-1.5 font-display text-base font-bold text-ink transition hover:border-ink hover:bg-surface-2"
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
