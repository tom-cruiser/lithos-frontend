import { ArrowRight, Compass, Layers } from 'lucide-react'
import { LithosMark } from '@/components/LithosMark'
import { SpotlightReveal } from '@/components/SpotlightReveal'

const NAV_LINKS = ['Method', 'Case Studies', 'Contact']

const STATS = [
  { value: '1,200+', label: 'Sites surveyed' },
  { value: '86', label: 'Countries mapped' },
  { value: '99.4%', label: 'Model fidelity' },
]

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-ink text-stone-100">
      <SpotlightReveal
        className="absolute inset-0 hero-zoom"
        base={{
          src: 'https://images.unsplash.com/photo-1783894529175-6008f6023d58?auto=format&fit=crop&w=2000&q=80',
          alt: 'Layered sedimentary rock strata cut by a desert canyon',
        }}
        reveal={{
          src: 'https://images.unsplash.com/photo-1609216970211-cc9814865e93?auto=format&fit=crop&w=2000&q=80',
          alt: 'Macro detail of an amethyst crystal cluster',
        }}
        hint="Move to reveal the strata"
      />

      {/* Legibility scrim over the interactive imagery. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-ink/20" />

      {/*
        pointer-events-none here is load-bearing: this wrapper's flex box
        spans the entire hero (min-h-screen, max-w-7xl) even where there's no
        visible content, and would otherwise silently swallow every
        mouse/touch move before it reaches the SpotlightReveal layer beneath.
        Only the actually-clickable elements opt back in with pointer-events-auto.
      */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pointer-events-none lg:px-8">
        {/* Top bar */}
        <header className="hero-anim hero-fade flex items-center justify-between py-8">
          <div className="flex items-center gap-2.5">
            <LithosMark />
            <span className="text-sm font-semibold tracking-[0.28em] text-stone-100">LITHOS</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-stone-300 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link} href="#" className="pointer-events-auto transition-colors hover:text-stone-100">
                {link}
              </a>
            ))}
          </nav>
        </header>

        {/* Primary content */}
        <div className="flex flex-1 flex-col justify-center py-16">
          <p className="hero-anim hero-fade hero-delay-1 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.3em] text-lithos-400">
            <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
            Geological survey &amp; mineral intelligence
          </p>

          <h1 className="hero-anim hero-reveal hero-delay-2 mt-6 max-w-3xl text-5xl font-medium leading-[1.05] tracking-tight text-stone-100 sm:text-6xl lg:text-7xl">
            The ground remembers{' '}
            <span className="font-playfair italic text-lithos-400">everything.</span>
          </h1>

          <p className="hero-anim hero-fade hero-delay-3 mt-6 max-w-xl text-lg leading-relaxed text-stone-300">
            Lithos fuses satellite spectroscopy, subsurface modeling, and a century of field
            data to turn raw terrain into decisions you can excavate, build, and invest on.
          </p>

          <div className="hero-anim hero-fade hero-delay-4 mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#"
              className="group pointer-events-auto inline-flex items-center gap-2 rounded-full bg-lithos-500 px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-lithos-400"
            >
              Request a site survey
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </a>
            <a
              href="#"
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-stone-100/20 px-6 py-3.5 text-sm font-semibold text-stone-100 transition-colors hover:border-stone-100/40 hover:bg-stone-100/5"
            >
              <Compass className="h-4 w-4" strokeWidth={2} />
              Explore the method
            </a>
          </div>
        </div>

        {/* Stat bar */}
        <div className="hero-anim hero-fade hero-delay-5 flex flex-wrap items-center gap-x-10 gap-y-4 border-t border-stone-100/10 py-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2.5">
              <span className="text-2xl font-semibold text-stone-100">{stat.value}</span>
              <span className="text-sm text-stone-400">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
