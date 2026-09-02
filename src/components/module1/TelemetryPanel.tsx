import type { LucideIcon } from 'lucide-react'
import { Gauge, Layers, Satellite } from 'lucide-react'
import { GLASS_PANEL } from '@/lib/glass'

interface TelemetryControlData {
  id: string
  icon: LucideIcon
  /** cyan = a live/streaming instrument reading; ember = a verified, static
   * classification. Not decorative — it's how a glance tells "this number
   * is updating" from "this label was confirmed once and filed." */
  accent: 'cyan' | 'ember'
  label: string
  /** The card's one big readout — a number+unit or a classification string. */
  primary: string
  /** A smaller reading shown beside primary — e.g. a secondary sensor value. */
  secondary?: string
  /** A live-status line rendered with a pulsing dot. Omitted for controls
   * that report a fact rather than a stream. */
  status?: string
  /** A small provenance/verification pill — omitted for pure telemetry. */
  tag?: string
}

const TELEMETRY_CONTROLS: TelemetryControlData[] = [
  {
    id: 'depth',
    icon: Gauge,
    accent: 'cyan',
    label: 'Core Sampling Depth',
    primary: '420 meters',
    secondary: '12.4 MPa',
    status: 'Active Telemetry',
  },
  {
    id: 'formation',
    icon: Layers,
    accent: 'ember',
    label: 'Formation Classification',
    primary: 'BRACKISH SEDIMENT / SHALE',
    tag: 'ISO-14688 Veri-Geolocated',
  },
  {
    id: 'satellite',
    icon: Satellite,
    accent: 'cyan',
    label: 'Satellite Frequency',
    primary: '54 MHz',
    status: 'Telemetry Active • Low-Earth Orbit',
  },
]

const ACCENT_CLASSES = {
  cyan: {
    chip: 'bg-cyan-glow/10 text-cyan-glow',
    dot: 'bg-cyan-glow',
    tag: 'border-cyan-glow/30 bg-cyan-glow/10 text-cyan-glow',
  },
  ember: {
    chip: 'bg-ember/10 text-ember',
    dot: 'bg-ember',
    tag: 'border-ember/30 bg-ember/10 text-ember',
  },
} as const

function TelemetryCard({ control }: { control: TelemetryControlData }) {
  const Icon = control.icon
  const accent = ACCENT_CLASSES[control.accent]

  return (
    <div className={`${GLASS_PANEL} flex min-w-[15rem] flex-1 flex-col gap-4 px-6 py-5`}>
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accent.chip}`}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/50">{control.label}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{control.primary}</span>
        {control.secondary && <span className="text-sm text-white/40">{control.secondary}</span>}
      </div>

      {control.status && (
        <div className="flex items-center gap-1.5 text-xs text-white/60">
          <span className={`h-1.5 w-1.5 rounded-full ${accent.dot} animate-pulse`} />
          {control.status}
        </div>
      )}

      {control.tag && (
        <div className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[11px] font-medium tracking-wide ${accent.tag}`}>
          {control.tag}
        </div>
      )}
    </div>
  )
}

interface TelemetryPanelProps {
  className?: string
}

/** The three live-instrument readouts under the Module 01 hero — depth,
 * formation, and satellite link — rendered as glass cards sharing one
 * layout but each carrying only the fields its own reading needs (see
 * TelemetryControlData: a classification has no live status dot, telemetry
 * has no verification tag). */
export function TelemetryPanel({ className = '' }: TelemetryPanelProps) {
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {TELEMETRY_CONTROLS.map((control) => (
        <TelemetryCard key={control.id} control={control} />
      ))}
    </div>
  )
}
