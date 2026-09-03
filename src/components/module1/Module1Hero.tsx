import { Layers, Map, Pickaxe } from 'lucide-react'
import { TelemetryPanel } from '@/components/module1/TelemetryPanel'
import { StrataPreview } from '@/components/module1/StrataPreview'
import { BUTTON_PRIMARY, BUTTON_SECONDARY, GLASS_BADGE } from '@/lib/glass'

const LEFT_SUB_TEXT =
  'Every layer of sediment records a chapter of our planet—from ancient seabeds to drifting ash—layered across millions of years beneath us.'

const RIGHT_SUB_TEXT =
  'Interactive telemetry lets you peel back the crust to trace how stones, fossils, and deep time combine to shape the ground beneath your feet.'

/**
 * Module 01 — "Strata & Deep Time Mechanics": the module's own hero, doc
 * page, and landing surface, following the same kicker → headline → lede →
 * CTA → live-data rhythm as the marketing Hero.tsx, but closing on two data
 * surfaces (TelemetryPanel, StrataPreview) instead of a stat strip, since
 * this is a course module rather than a pitch.
 *
 * No 3D canvas here by design — unlike Hero.tsx/GlobeHero.tsx, the backdrop
 * is a pair of soft ember/cyan radial glows over black rather than an
 * external image or a Three.js scene, keeping this module's own weight (and
 * dependency surface) small.
 */
export function Module1Hero() {
  return (
    <section className="relative w-full overflow-hidden bg-black text-white">
      {/* Cinematic basalt-dark backdrop: two soft brand-accent glows over a
          black base, echoing the telemetry panel's ember/cyan pairing
          rather than reaching for an image asset. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(232,112,42,0.12)_0%,transparent_42%),radial-gradient(circle_at_82%_78%,rgba(56,189,248,0.12)_0%,transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />

      {/* pointer-events-none for the same reason as Hero.tsx: this column
          spans the full section even where there's no visible content, so
          only the elements that opt back in (badge, CTAs, telemetry,
          preview) should ever intercept the pointer. */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pointer-events-none lg:px-8">
        <div className="flex flex-1 flex-col justify-center py-12">
          <div className={`${GLASS_BADGE} hero-anim hero-fade hero-delay-1 inline-flex w-fit items-center gap-2 tracking-[0.2em] uppercase`}>
            <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
            Module 01 — Strata &amp; Deep Time Mechanics
          </div>

          <h1 className="hero-anim hero-reveal hero-delay-2 mt-6 max-w-2xl text-5xl leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            <span className="block font-playfair italic">Layers hold</span>
            <span className="block font-semibold">tales of time</span>
          </h1>

          <p className="hero-anim hero-fade hero-delay-3 mt-6 max-w-xl text-lg font-light text-white/70">
            Decoding Earth’s Recorded History Through Sedimentary &amp; Crustal Layers
          </p>

          <div className="hero-anim hero-fade hero-delay-3 mt-8 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
            <p className="text-sm leading-relaxed text-white/50">{LEFT_SUB_TEXT}</p>
            <p className="text-sm leading-relaxed text-white/50">{RIGHT_SUB_TEXT}</p>
          </div>

          <div className="hero-anim hero-fade hero-delay-4 mt-10 flex flex-wrap items-center gap-4">
            <a href="#" className={`${BUTTON_PRIMARY} group pointer-events-auto inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold`}>
              <Pickaxe className="h-4 w-4" strokeWidth={2} />
              Start Digging
            </a>
            <a href="#" className={`${BUTTON_SECONDARY} pointer-events-auto inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold`}>
              <Map className="h-4 w-4" strokeWidth={2} />
              View Strata Map
            </a>
          </div>
        </div>

        <div className="hero-anim hero-fade hero-delay-5 pointer-events-auto mb-10 flex flex-col gap-6">
          <TelemetryPanel />
          <StrataPreview />
        </div>
      </div>
    </section>
  )
}
