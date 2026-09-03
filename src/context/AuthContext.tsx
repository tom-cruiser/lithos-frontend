import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type UserRole = 'user' | 'admin'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

/**
 * The two mock identities the whole auth system runs on. There is no
 * backend behind this app yet, so `loginWithDummyData` — and the AuthModal's
 * "quick testing" buttons and the AdminGuard bypass, all downstream of it —
 * just swaps in one of these two fixed records rather than calling out to
 * anything. Exported (not module-private) so AuthModal can match a
 * typed-in email against the same two records instead of hardcoding its own
 * copies of them.
 */
export const DUMMY_USERS: Record<UserRole, AuthUser> = {
  user: { id: 'usr_01', email: 'explorer@lithos.com', name: 'Sarah Connor', role: 'user' },
  admin: { id: 'adm_01', email: 'admin@lithos.com', name: 'Girijambo', role: 'admin' },
}

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  isAuthModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  /** Signs in as one of the two DUMMY_USERS records — the only way this
   * prototype ever authenticates anyone. Also closes the auth modal, so
   * every "log in" trigger (the modal's own buttons, AdminGuard's bypass)
   * doesn't need to remember to do that itself. */
  loginWithDummyData: (role: UserRole) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Memoized so consumers that only read e.g. `isAdmin` don't re-render on
  // every provider render for an unrelated reason — the same reasoning as
  // the rest of this app's context-shaped state, of which this is the first.
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'admin',
      isAuthModalOpen,
      openAuthModal: () => setIsAuthModalOpen(true),
      closeAuthModal: () => setIsAuthModalOpen(false),
      loginWithDummyData: (role) => {
        setUser(DUMMY_USERS[role])
        setIsAuthModalOpen(false)
      },
      logout: () => setUser(null),
    }),
    [user, isAuthModalOpen],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** Throws outside an AuthProvider rather than silently returning a stub —
 * a missing provider is a wiring bug, not a valid "logged out" state, and
 * failing loudly at the call site is far easier to trace than chasing a
 * `user` that's mysteriously always null three components later. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
