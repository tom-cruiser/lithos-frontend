interface LithosMarkProps {
  className?: string
}

/** Faceted gem/mountain glyph — the same mark used for the favicon. */
export function LithosMark({ className = 'h-7 w-7' }: LithosMarkProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="6" className="fill-stone-100/10" />
      <path
        d="M16 5 L26 12 L22 27 H10 L6 12 Z"
        className="fill-lithos-500/20 stroke-lithos-400"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path
        d="M16 5 L16 27 M6 12 L26 12 M16 5 L22 27 M16 5 L10 27"
        className="stroke-lithos-400/55"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}
