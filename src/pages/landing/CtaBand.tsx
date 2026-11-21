import { ArrowRight, PartyPopper } from 'lucide-react'
import { ButtonLink } from '../../components/ui/Button'
import { Container } from '../../components/ui/primitives'
import { WindowBar } from '../../components/ui/WindowBar'

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="pb-16 sm:pb-20">
      <Container>
        <div className="overflow-hidden rounded-panel bg-band-gradient text-center shadow-float">
          <WindowBar tone="accent" title="Welcome to the system" />
          <div className="px-6 py-10 sm:px-12 sm:py-12">
          <PartyPopper aria-hidden="true" className="mx-auto size-8 text-ink" />
          <h2 id="cta-title" className="mt-3 text-3xl sm:text-4xl">
            Your next group is waiting
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink">
            Join when it feels right, set a limit if you need one, and enjoy the little bit of live-draw magic.
          </p>
          <ButtonLink to="/dashboard" variant="white" className="mt-7">
            Start playing <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
