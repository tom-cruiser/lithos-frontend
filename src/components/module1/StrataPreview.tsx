import { MODULE_1_STRATA_DATA } from '@/data/module1Data'
import { GLASS_PANEL } from '@/lib/glass'

interface StrataPreviewProps {
  className?: string
}

/**
 * A compact teaser for the full "Strata Map" the hero's secondary CTA links
 * out to — not that map itself. Two pieces read from the same
 * MODULE_1_STRATA_DATA array: a core-sample color bar (equal-width segments,
 * ordered surface-to-bedrock — an at-a-glance stack rather than a
 * depth-accurate plot, which is what the real Strata Map is for) and a
 * scannable legend beneath it.
 */
export function StrataPreview({ className = '' }: StrataPreviewProps) {
  return (
    <div className={`${GLASS_PANEL} px-6 py-5 ${className}`}>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-white/50">
        <span>Core Log — Surface to 420m</span>
        <span>{MODULE_1_STRATA_DATA.length} layers logged</span>
      </div>

      <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full border border-white/10">
        {MODULE_1_STRATA_DATA.map((layer) => (
          <span
            key={layer.id}
            className="h-full flex-1 first:rounded-l-full last:rounded-r-full"
            style={{ backgroundColor: layer.colorHex }}
            title={`${layer.name} — ${layer.depthRange}`}
          />
        ))}
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {MODULE_1_STRATA_DATA.map((layer) => (
          <div key={layer.id} className="flex items-center justify-between gap-3">
            <dt className="flex min-w-0 items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/20" style={{ backgroundColor: layer.colorHex }} />
              <span className="truncate text-sm text-white/80">{layer.name}</span>
            </dt>
            <dd className="shrink-0 font-mono text-xs text-white/40">{layer.depthRange}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
