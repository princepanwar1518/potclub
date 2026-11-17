import { ArrowRight } from 'lucide-react'
import { ButtonLink } from '../ui/Button'
import { Container } from '../ui/primitives'
import { BrandSlot } from './BrandSlot'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 shadow-header backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <BrandSlot />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-3">
          <a
            href="#how-it-works"
            className="rounded-xl px-3 py-2 text-sm font-medium text-ink/80 transition hover:bg-lilac-50 hover:text-violet"
          >
            How it works
          </a>
          <ButtonLink to="/dashboard" size="sm" className="rounded-full px-4">
            Play now <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </nav>
      </Container>
    </header>
  )
}
