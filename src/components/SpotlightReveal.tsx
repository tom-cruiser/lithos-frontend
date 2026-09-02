import { useState, type CSSProperties, type ImgHTMLAttributes } from 'react'
import { Move } from 'lucide-react'
import { useSpotlightPointer } from '@/hooks/useSpotlightPointer'

export interface SpotlightImage {
  src: string
  alt: string
}

interface SpotlightRevealProps {
  /** Rendered everywhere outside the spotlight. */
  base: SpotlightImage
  /** Only visible inside the cursor/finger-following spotlight. */
  reveal: SpotlightImage
  /** Shown near the first paint until the visitor interacts once. */
  hint?: string
  className?: string
}

const sharedImgProps: ImgHTMLAttributes<HTMLImageElement> = {
  decoding: 'async',
  draggable: false,
}

// Static gradient string — the moving parts are the CSS custom properties it
// reads, updated imperatively by useSpotlightPointer, so this never needs to
// be recomputed or re-parsed per frame.
const maskStyle: CSSProperties = {
  WebkitMaskImage:
    'radial-gradient(circle var(--spotlight-radius) at var(--spotlight-x) var(--spotlight-y), black 0%, black 55%, rgba(0,0,0,0.4) 72%, transparent 100%)',
  maskImage:
    'radial-gradient(circle var(--spotlight-radius) at var(--spotlight-x) var(--spotlight-y), black 0%, black 55%, rgba(0,0,0,0.4) 72%, transparent 100%)',
}

const glowStyle: CSSProperties = {
  backgroundImage:
    'radial-gradient(circle var(--spotlight-radius) at var(--spotlight-x) var(--spotlight-y), rgba(217,119,87,0.55), transparent 70%)',
}

// Self-contained SVG turbulence noise — no network request, adds a tactile,
// premium film-grain finish over the flat photo layers.
const grainStyle: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
}

/**
 * Interactive cursor/touch-following spotlight that blends two overlapping
 * images: `base` renders normally, `reveal` sits on top masked by a radial
 * gradient so only the area under the (LERP-smoothed) pointer shows through.
 *
 * Never touches canvas or `toDataURL` — the mask is a static gradient string
 * driven entirely by CSS custom properties mutated on the container element.
 */
export function SpotlightReveal({ base, reveal, hint = 'Move to reveal', className = 'relative' }: SpotlightRevealProps) {
  const { containerRef, hasInteracted, isPressed } = useSpotlightPointer<HTMLDivElement>()
  const [baseFailed, setBaseFailed] = useState(false)
  const [revealFailed, setRevealFailed] = useState(false)

  return (
    <div
      ref={containerRef}
      // `className` supplies the position utility (defaults to `relative`).
      // It must NOT also be hardcoded here: Tailwind's stylesheet orders
      // `.relative` after `.absolute`, so if both were present the layer
      // would always render `position: relative` regardless of which the
      // caller intended, collapsing an `absolute inset-0` usage to 0 height.
      className={`group isolate overflow-hidden bg-ink [--spotlight-radius:clamp(150px,24vw,320px)] ${
        isPressed ? '[--spotlight-radius:clamp(180px,28vw,380px)]' : ''
      } transition-[--spotlight-radius] duration-500 ease-out ${className}`}
    >
      {/* Base layer — always visible, treated with a cool duotone so the reveal layer's color feels earned. */}
      {baseFailed ? (
        <div
          className="absolute inset-0 bg-[linear-gradient(155deg,#1c1a17_0%,#100f0d_45%,#050505_100%)]"
          aria-hidden="true"
        />
      ) : (
        <img
          {...sharedImgProps}
          src={base.src}
          alt={base.alt}
          loading="eager"
          // react-dom 18's known-DOM-property list predates `fetchPriority`,
          // so setting it camelCase logs an "unrecognized prop" dev warning.
          // The lowercase HTML attribute form still gives the browser the
          // same priority hint without tripping that check.
          {...{ fetchpriority: 'high' }}
          onError={() => setBaseFailed(true)}
          style={{ filter: 'grayscale(0.2) contrast(1.08) brightness(0.6)' }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Reveal layer — full color, only visible through the spotlight mask. */}
      {revealFailed ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,#e8a688_0%,#bd5f42_50%,#3a1f14_100%)]"
          style={maskStyle}
          aria-hidden="true"
        />
      ) : (
        <img
          {...sharedImgProps}
          src={reveal.src}
          alt={reveal.alt}
          loading="eager"
          onError={() => setRevealFailed(true)}
          style={maskStyle}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Warm glow tracing the spotlight edge for extra tactility. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-500 group-hover:opacity-100"
        style={glowStyle}
        aria-hidden="true"
      />

      {/* Gentle breathing hint before the first interaction — position stays centered/static, only opacity moves. */}
      {!hasInteracted && (
        <div className="spotlight-idle pointer-events-none absolute inset-0" aria-hidden="true" />
      )}

      {/* Film grain */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay" style={grainStyle} aria-hidden="true" />

      {/* Discoverability affordance — fades out for good once the visitor has moved the spotlight. */}
      <div
        className={`pointer-events-none absolute bottom-5 right-5 flex items-center gap-2 rounded-full border border-stone-100/15 bg-ink/50 px-3 py-1.5 text-xs text-stone-300 backdrop-blur-sm transition-opacity duration-700 ${
          hasInteracted ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Move className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span>{hint}</span>
      </div>
    </div>
  )
}
