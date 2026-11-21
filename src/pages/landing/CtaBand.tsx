import { ArrowRight, PartyPopper } from 'lucide-react'
import { ButtonLink } from '../../components/ui/Button'
import { Container } from '../../components/ui/primitives'

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="pb-16 sm:pb-20">
      <Container>
        <div className="relative isolate overflow-hidden rounded-panel bg-band-gradient px-6 py-12 text-center shadow-float sm:px-12 sm:py-14">
          <span aria-hidden="true" className="absolute -top-14 -left-10 -z-10 size-40 rounded-full bg-cp-magenta/20 blur-2xl" />
          <span aria-hidden="true" className="absolute -right-8 -bottom-16 -z-10 size-44 rounded-full bg-cp-cyan/20 blur-2xl" />
          <PartyPopper aria-hidden="true" className="mx-auto size-8 text-cp-yellow drop-shadow-[0_0_10px_rgb(255_215_0/0.6)]" />
          <h2 id="cta-title" className="glitch mt-3 text-3xl sm:text-4xl">
            Your next group is waiting
          </h2>
          <p className="mx-auto mt-3 max-w-md text-ink">
            Join when it feels right, set a limit if you need one, and enjoy the little bit of live-draw magic.
          </p>
          <ButtonLink to="/dashboard" variant="white" className="mt-7">
            Start playing <ArrowRight aria-hidden="true" className="size-4" />
          </ButtonLink>
        </div>
      </Container>
    </section>
  )
}
