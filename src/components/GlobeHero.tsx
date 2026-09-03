import { lazy, Suspense } from 'react'
import { ArrowRight, Compass, Layers } from 'lucide-react'
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

/* This navbar's glass recipe (bg-white/5, border-white/10) is a
 * deliberately different translucency than lib/glass.ts's GLASS_PILL_GROUP
 * (bg-white/10, border-white/15) — matching this spec exactly rather than
 * composing/overriding the shared constant. Two Tailwind classes setting the
 * same property don't compose by source order — the stylesheet's own
 * internal order decides the winner — which is exactly how a position-utility
 * bug happened earlier in this app, so variants with different values get
 * their own constant instead of a patched-over shared one. */
const NAVBAR = 'bg-white/5 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3'

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
 * The navbar is positioned to hug its own content (`left-1/2` +
 * `-translate-x-1/2`, not `inset-x-0` + `justify-center`) rather than as a
 * full-width strip with the pill centered inside it. A full-width wrapper
 * would need the pointer-events-none/pointer-events-auto split used
 * elsewhere in this app for exactly this reason — the invisible empty space
 * on either side of the centered pill would otherwise swallow pointer events
 * before they reach the canvas beneath. Sized to its content instead, the
 * navbar's own hit area is just the pill, so nothing extra needs the split.
 */
export function GlobeHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black text-white">
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
        <header className="hero-anim hero-fade flex justify-center py-6">
          <div className={`${NAVBAR} flex items-center gap-8 pointer-events-auto`}>
            <div className="flex items-center gap-2.5">
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
            <a href="#" className={`${BUTTON_PRIMARY} whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold`}>
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
            <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
            Geological survey &amp; mineral intelligence
          </div>

          <h1 className="hero-anim hero-reveal hero-delay-2 mt-6 max-w-xl text-4xl font-normal leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
            The ground remembers <span className="font-playfair italic">everything.</span>
          </h1>

          <p className="hero-anim hero-fade hero-delay-3 mt-6 max-w-lg text-base font-light leading-relaxed text-white/50 sm:text-lg">
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
