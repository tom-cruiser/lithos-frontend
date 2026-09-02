import { lazy, Suspense } from 'react'

// Same reasoning as elsewhere in this app: three.js + @react-three/drei add
// well over 200kB gzipped, none of it on the critical path for first paint,
// so it's split into its own chunk instead of blocking the page.
const World3D = lazy(() => import('@/components/World3D').then((module) => ({ default: module.World3D })))

const BASALT_TEXTURE_URL =
  'https://images.unsplash.com/photo-1783894529175-6008f6023d58?auto=format&fit=crop&w=1920&q=80'

/**
 * A deliberately bare stage: dark quarry-rock background, the glowing
 * wireframe/glass-sphere scene, and a vignette — nothing else. No nav, no
 * text, no controls. Earlier versions of this component had a full glass-UI
 * layer (nav, telemetry readout, sliders, media capsule); all of it was
 * removed to match a pristine, purely-visual composition, so there's no
 * pointer-events-none/auto split to maintain here either — with nothing
 * interactive left in the foreground, the whole section can just let every
 * pointer event reach the canvas.
 */
export function GlobeHero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      {/* Basalt texture, blended into the black base rather than shown flat —
          luminosity blending means only the photo's light/dark structure
          shows through, tinted entirely by the black background beneath it. */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: `url(${BASALT_TEXTURE_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />

      <Suspense fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#0f1a24_0%,#0a1420_55%,#050709_100%)]" />}>
        <World3D className="absolute inset-0 hero-anim hero-fade" />
      </Suspense>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
    </section>
  )
}
