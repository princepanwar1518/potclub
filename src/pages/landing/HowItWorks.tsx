import { Clock, ShieldCheck, Target, TrendingUp, Trophy, Users, Zap, type LucideIcon } from 'lucide-react'
import { GRACE_SECONDS, PICK_SECONDS } from '../../domain/rules'
import { Card, Container, Eyebrow, IconChip, type Tone } from '../../components/ui/primitives'

interface Step {
  title: string
  body: string
  icon: LucideIcon
  tone: Tone
}

const steps: Step[] = [
  { title: 'Choose your crew', body: 'Pick a 5, 10, 15, or 20-player group that feels right for you.', icon: Users, tone: 'lilac' },
  {
    title: 'Pick your lucky number',
    body: `When the group fills, everyone gets ${PICK_SECONDS / 60} minutes to choose a unique card.`,
    icon: Target,
    tone: 'pink',
  },
  {
    title: 'Take a quick look',
    body: `There is a ${GRACE_SECONDS}-second grace period to switch your choice before the reveal.`,
    icon: Clock,
    tone: 'amber',
  },
  {
    title: 'Enjoy the reveal',
    body: 'Watch the live shuffle together. The winning card receives the prize pool instantly.',
    icon: Trophy,
    tone: 'mint',
  },
]

const features: Step[] = [
  { title: 'Full group, instant draw', body: 'Your draw begins when the final player joins—no clock-watching required.', icon: Zap, tone: 'amber' },
  { title: 'Designed for fair play', body: 'Chosen cards are unique in each group and the server settles every draw.', icon: ShieldCheck, tone: 'lilac' },
  { title: 'Happy, safe control', body: 'Wallet history, alerts, limits, time-outs, and self-exclusion stay within reach.', icon: TrendingUp, tone: 'mint' },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="py-16 sm:py-20">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <Eyebrow>Easy as 1, 2, 3, 4</Eyebrow>
          <h2 id="how-title" className="mt-3 text-3xl sm:text-4xl">
            A happy little ritual, every time
          </h2>
          <p className="mt-3 text-muted">There are no scheduled waits. The group itself gets the fun started.</p>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title}>
              <Card className="h-full p-5 transition duration-300 hover:-translate-y-1 hover:shadow-float">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-semibold text-muted/70">{String(i + 1).padStart(2, '0')}</span>
                  <IconChip tone={step.tone}>
                    <step.icon className="size-[18px]" />
                  </IconChip>
                </div>
                <h3 className="mt-5 text-[17px]">{step.title}</h3>
                <p className="mt-2 text-sm text-muted">{step.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

export function Features() {
  return (
    <section aria-labelledby="features-title" className="pb-16 sm:pb-20">
      <Container>
        <h2 id="features-title" className="sr-only">
          Why players like it
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {features.map((f) => (
            <li key={f.title}>
              <Card className="flex h-full gap-4 p-6">
                <IconChip tone={f.tone}>
                  <f.icon className="size-[18px]" />
                </IconChip>
                <div>
                  <h3 className="text-base">{f.title}</h3>
                  <p className="mt-1.5 text-sm text-muted">{f.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
