import { lazy, Suspense } from 'react'
import { ArrowRight, Compass, Layers } from 'lucide-react'
import { LithosMark } from '@/components/LithosMark'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, GLASS_BADGE, GLASS_PANEL, GLASS_PILL_GROUP } from '@/lib/glass'

// three.js + @react-three/drei add well over 200kB gzipped — none of it is
// on the critical path for the headline/CTAs, so it's split into its own
// chunk and loaded async instead of blocking first paint of the text hero.
const CoreSampleScene = lazy(() =>
  import('@/components/three/CoreSampleScene').then((module) => ({ default: module.CoreSampleScene })),
)

const NAV_LINKS = ['Method', 'Case Studies', 'Contact']

const STATS = [
  { value: '1,200+', label: 'Sites surveyed' },
  { value: '86', label: 'Countries mapped' },
  { value: '99.4%', label: 'Model fidelity' },
]

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* hero-fade, deliberately NOT hero-zoom, on the element wrapping the
          R3F <Canvas>: hero-zoom's transform:scale() distorts what
          getBoundingClientRect reports for width/height while it's running,
          and a pure CSS transform never fires ResizeObserver (it doesn't
          change the layout box, only the painted one) — so R3F's one-time
          initial size measurement gets stuck permanently reading ~10-12%
          oversized, and the canvas silently overflows/clips against this
          section's overflow-hidden forever after. Confirmed by inspecting
          the live canvas rect during development: 1408x880 inside a
          1280x800 parent. hero-fade's translateY doesn't affect measured
          width/height, only position, so it's safe here. */}
      <Suspense fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_50%,#2a1f1a_0%,#100f0d_55%,#0a0a0a_100%)]" />}>
        <CoreSampleScene className="absolute inset-0 hero-anim hero-fade" />
      </Suspense>

      {/* Cinematic vignette. The vertical pass matches the brief's spec
          exactly (bottom-heavy black, fading toward transparent). The
          horizontal pass is an addition this layout needs that a centered
          media-player composition wouldn't: our text column sits on the
          left over a right-offset 3D object, so it gets its own darkening
          for contrast independent of the vertical one. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent" />

      {/*
        pointer-events-none here is load-bearing: this wrapper's flex box
        spans the entire hero (min-h-screen, max-w-7xl) even where there's no
        visible content, and would otherwise silently swallow every
        mouse/touch move before it reaches the <Canvas> beneath — R3F reads
        the pointer from events on the canvas element itself, so without this
        the 3D core sample would never react to the cursor at all. Only the
        actually-clickable elements opt back in with pointer-events-auto.
      */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pointer-events-none lg:px-8">
        {/* Top bar */}
        <header className="hero-anim hero-fade flex items-center justify-between py-8">
          <div className="flex items-center gap-2.5">
            <LithosMark />
            <span className="text-sm font-semibold tracking-[0.28em] text-white">LITHOS</span>
          </div>
          <nav className={`${GLASS_PILL_GROUP} pointer-events-auto hidden md:flex`}>
            {NAV_LINKS.map((link) => (
              <a
                key={link}
                href="#"
                className="rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link}
              </a>
            ))}
          </nav>
        </header>

        {/* Primary content */}
        <div className="flex flex-1 flex-col justify-center py-16">
          <div className={`${GLASS_BADGE} hero-anim hero-fade hero-delay-1 inline-flex w-fit items-center gap-2 tracking-[0.2em] uppercase`}>
            <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
            Geological survey &amp; mineral intelligence
          </div>

          <h1 className="hero-anim hero-reveal hero-delay-2 mt-6 max-w-3xl text-4xl font-normal leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            The ground remembers <span className="font-playfair italic">everything.</span>
          </h1>

          <p className="hero-anim hero-fade hero-delay-3 mt-6 max-w-xl text-base font-light leading-relaxed text-white/50 sm:text-lg">
            Lithos fuses satellite spectroscopy, subsurface modeling, and a century of field
            data to turn raw terrain into decisions you can excavate, build, and invest on.
          </p>

          <div className="hero-anim hero-fade hero-delay-4 mt-10 flex flex-wrap items-center gap-4">
            <a href="#" className={`${BUTTON_PRIMARY} group pointer-events-auto inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold`}>
              Request a site survey
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </a>
            <a href="#" className={`${BUTTON_SECONDARY} pointer-events-auto inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold`}>
              <Compass className="h-4 w-4" strokeWidth={2} />
              Explore the method
            </a>
          </div>
        </div>

        {/* Stat panel — a floating glass card rather than a full-width
            border-separated row, matching the "glass card" component
            language rather than the previous flat divider treatment. */}
        <div className={`${GLASS_PANEL} hero-anim hero-fade hero-delay-5 pointer-events-auto mb-10 inline-flex w-fit flex-wrap items-center gap-x-8 gap-y-3 px-8 py-5`}>
          {STATS.map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2.5">
              <span className="text-2xl font-semibold text-white">{stat.value}</span>
              <span className="text-sm text-white/50">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
