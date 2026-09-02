import { lazy, Suspense } from 'react'
import { LithosMark } from '@/components/LithosMark'
import { BUTTON_PRIMARY } from '@/lib/glass'

// Same reasoning as elsewhere in this app: three.js + @react-three/drei add
// well over 200kB gzipped, none of it on the critical path for first paint,
// so it's split into its own chunk instead of blocking the page.
const World3D = lazy(() => import('@/components/World3D').then((module) => ({ default: module.World3D })))

const NAV_LINKS = ['Method', 'Case Studies', 'Contact']

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
 * The stage: a solid black backdrop, the glowing wireframe/glass-sphere
 * scene (untouched — see World3D.tsx), a vignette, and one floating navbar.
 * The rest of the viewport is deliberately bare — no central cards, text
 * overlays, telemetry, sliders, or playback controls — so the 3D scene stays
 * the sole focal point.
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
      <Suspense fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#0f1a24_0%,#0a1420_55%,#050709_100%)]" />}>
        <World3D className="hero-anim hero-fade" />
      </Suspense>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/80" />

      <header className="hero-anim hero-fade absolute left-1/2 top-6 z-10 -translate-x-1/2">
        <div className={`${NAVBAR} flex items-center gap-8`}>
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
    </section>
  )
}
