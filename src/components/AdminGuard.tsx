import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { BUTTON_EMBER, GLASS_PANEL } from '@/lib/glass'

interface AdminGuardProps {
  children: ReactNode
}

/**
 * Wraps admin-only routes/panels: renders `children` once `isAdmin` is true,
 * otherwise renders an "Access Denied" panel in their place. This is a
 * client-side UI gate for a prototype with no backend, not a real
 * authorization boundary — there's nothing server-side here for it to
 * protect against a determined user, which is also why its own bypass
 * button is allowed to just log the visitor in as admin directly.
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { isAdmin, loginWithDummyData } = useAuth()

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <div className={`${GLASS_PANEL} mx-auto flex max-w-md flex-col items-center gap-4 px-8 py-10 text-center`}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ember/10 text-ember">
        <ShieldAlert className="h-7 w-7" strokeWidth={1.75} />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">Access Denied</h3>
        <p className="mt-1.5 text-sm text-white/50">Admin credentials required to view this panel.</p>
      </div>

      <button
        type="button"
        onClick={() => loginWithDummyData('admin')}
        className={`${BUTTON_EMBER} inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold`}
      >
        <ShieldAlert className="h-4 w-4" strokeWidth={2} />
        Log in as System Admin
      </button>
    </div>
  )
}
