import { Gem } from 'lucide-react'
import { GLASS_PANEL } from '@/lib/glass'

/**
 * Shown in place of the 3D scene when WebGL isn't available (old browsers,
 * some locked-down corporate machines, a lost/failed GPU context) or the
 * scene throws during render. The backdrop deliberately keeps matching the
 * mesh's own rock/crystal palette (that's the atmosphere, not "UI chrome"),
 * but the message itself picks up the glass system so it still reads as
 * this app's design rather than a generic error state.
 */
export function WebGLUnavailable() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_45%,#2a1f1a_0%,#100f0d_55%,#050505_100%)]">
      <div className={`${GLASS_PANEL} flex flex-col items-center gap-3 px-6 py-5`}>
        <Gem className="h-8 w-8 text-white/70" strokeWidth={1.25} />
        <p className="max-w-[14rem] text-center text-xs leading-relaxed text-white/60">
          3D preview unavailable in this browser.
        </p>
      </div>
    </div>
  )
}
