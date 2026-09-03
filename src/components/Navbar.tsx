import type { ReactNode } from 'react'
import { Crown, LogOut } from 'lucide-react'
import { LithosMark } from '@/components/LithosMark'
import { useAuth } from '@/context/AuthContext'
import { BADGE_EMBER_GLOW, BUTTON_PRIMARY, BUTTON_SECONDARY, GLASS_PILL_GROUP } from '@/lib/glass'

const NAV_LINKS = ['Method', 'Case Studies', 'Contact']

interface NavbarProps {
  className?: string
  /** Extra content rendered between the nav links and the auth controls —
   * e.g. Module1Hero's "MODULE 01" badge. Keeps this component reusable
   * across pages that need one extra piece of header context without
   * teaching it about any specific page. */
  endSlot?: ReactNode
}

/**
 * The site header, auth-aware: a "Sign In" trigger when logged out, or the
 * signed-in identity (name, email, an "Admin Portal" badge when applicable)
 * plus "Log Out" when logged in. All of it reads from AuthContext directly
 * rather than taking user/auth props, since every page that mounts this
 * already sits under the single app-wide AuthProvider.
 */
export function Navbar({ className = '', endSlot }: NavbarProps) {
  const { user, isAuthenticated, isAdmin, openAuthModal, logout } = useAuth()

  return (
    <header className={`flex items-center justify-between gap-4 py-4 ${className}`}>
      <div className="flex shrink-0 items-center gap-2.5">
        <LithosMark />
        <span className="text-sm font-semibold tracking-[0.28em] text-white">LITHOS</span>
      </div>

      <nav className={`${GLASS_PILL_GROUP} hidden md:flex`}>
        {NAV_LINKS.map((link) => (
          <a
            key={link}
            href="#"
            className="rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {link}
          </a>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-3">
        {endSlot}

        {isAuthenticated && user ? (
          <>
            {isAdmin && (
              <span className={`${BADGE_EMBER_GLOW} hidden sm:inline-flex`}>
                <Crown className="h-3.5 w-3.5" strokeWidth={2} />
                Admin Portal
              </span>
            )}
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-white/40">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className={`${BUTTON_SECONDARY} inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold`}
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              Log Out
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={openAuthModal}
            className={`${BUTTON_PRIMARY} inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold`}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}
