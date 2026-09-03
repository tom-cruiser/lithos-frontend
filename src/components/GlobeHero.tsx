import { lazy, Suspense } from 'react'
import { ArrowRight, Compass, Orbit } from 'lucide-react'
import { LithosMark } from '@/components/LithosMark'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, GLASS_BADGE, GLASS_PANEL } from '@/lib/glass'

// Same reasoning as elsewhere in this app: three.js + @react-three/drei add
// well over 200kB gzipped, none of it on the critical path for first paint,
// so it's split into its own chunk instead of blocking the page.
const World3D = lazy(() => import('@/components/World3D').then((module) => ({ default: module.World3D })))

const NAV_LINKS = ['Method', 'Case Studies', 'Contact']

const STATS = [
  { value: '1,200+', label: 'Sites surveyed' },
  { value: '86', label: 'Countries mapped' },
  { value: '99.4%', label: 'Model fidelity' },
]

/**
 * The stage: a solid black backdrop, the glowing wireframe/glass-sphere scene
 * (untouched — see World3D.tsx) confined to the right side of the viewport,
 * the marketing copy (badge, headline, CTAs, stat panel — the same content
 * Hero.tsx already established elsewhere, ported here since this is the page
 * that's actually mounted) filling the left, a vignette, and one floating
 * navbar. This is the app's only navbar: Module1Hero below no longer renders
 * its own, so there is exactly one — this one, pinned to the top of this
 * first section.
 *
 * The navbar spans the full content width (matching the max-w-7xl column
 * everything else in this section sits in) with its three groups — logo,
 * links, CTA — pushed to the edges via `justify-between` rather than
 * hugging together in the center. Unlike Hero.tsx's pointer-events warning
 * elsewhere in this app, that's safe here without a pointer-events split:
 * the glass background (NAVBAR) is painted across the *entire* bar, gaps
 * included, so the whole thing being `pointer-events-auto` only ever
 * intercepts clicks over what's visibly rendered as nav surface — there's
 * no invisible dead space stealing hover from the 3D canvas beneath it.
 */
export function GlobeHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black bg-[url('/background.jpeg')] bg-cover bg-center text-white">
      {/* The 3D scene's own container fills its nearest positioned ancestor
          (see World3D's containerClassName) — sizing and positioning *that*
          ancestor, rather than the scene itself, is what shrinks it and
          pushes it to the right. Hidden below lg: at that width there's no
          room for a right-hand scene beside the left copy without either
          overlapping or squeezing the text unreadably, so it drops out and
          the section reads as text-only on small screens. pointer-events-none
          on this wrapper doesn't block the canvas underneath — World3D sets
          pointer-events-auto directly on its own root, which always wins
          over an inherited none from an ancestor. */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block">
        <Suspense fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#0f1a24_0%,#0a1420_55%,#050709_100%)]" />}>
          <World3D className="hero-anim hero-fade" />
        </Suspense>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />
      {/* Extra horizontal darkening so the left-column copy stays readable
          over the scene's glow, matching the same left-column-over-3D
          treatment Hero.tsx uses elsewhere in this app. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent" />

      {/* pointer-events-none for the same reason as Hero.tsx: this column
          spans the full section even where there's no visible content, so
          only the elements that opt back in (nav, CTAs, stat panel) should
          ever intercept the pointer — and, on lg screens, so it doesn't sit
          in front of the 3D canvas stealing hover from it. */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pointer-events-none lg:px-8">
        <header className="hero-anim hero-fade py-6">
          <div className={`${NAVBAR} flex w-full items-center justify-between pointer-events-auto`}>
            <div className="flex shrink-0 items-center gap-2.5">
              <LithosMark className="h-6 w-6" />
              <span className="text-sm font-semibold tracking-[0.28em] text-white">LITHOS</span>
            </div>
            <nav className="hidden items-center gap-6 whitespace-nowrap text-sm text-white/70 md:flex">
              {NAV_LINKS.map((link) => (
                <a key={link} href="#" className="transition-colors hover:text-white">
                  {link}
                </a>
              ))}
            </nav>
            <a href="#" className={`${BUTTON_PRIMARY} shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold`}>
              Request access
            </a>
          </div>
        </header>

        {/* Primary content — confined to roughly the left half on lg screens
            (matching the scene's own 46% on the right) so it never runs
            underneath the canvas; full-width below that, since the scene
            itself is hidden there. */}
        <div className="flex flex-1 flex-col justify-center py-16 lg:max-w-[52%]">
          <div className={`${GLASS_BADGE} hero-anim hero-fade hero-delay-1 inline-flex w-fit items-center gap-2 tracking-[0.2em] uppercase`}>
            <Orbit className="h-3.5 w-3.5" strokeWidth={1.75} />
            Orbit to bedrock
          </div>

          <h1 className="hero-anim hero-reveal hero-delay-2 mt-6 max-w-xl text-4xl font-normal leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Written in rock. <span className="font-playfair italic">Seen from space.</span>
          </h1>

          <p className="hero-anim hero-fade hero-delay-3 mt-6 max-w-md text-base font-light leading-relaxed text-white/50 sm:text-lg">
            Satellite spectroscopy meets subsurface modeling — raw terrain, read as ground truth.
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

        {/* Stat panel — same floating glass card as Hero.tsx, kept at the
            left column's width so it doesn't stretch out under the scene. */}
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
