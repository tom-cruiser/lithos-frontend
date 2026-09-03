import { useEffect, useState, type FormEvent } from 'react'
import { Lock, Mail, ShieldCheck, User, X } from 'lucide-react'
import { LithosMark } from '@/components/LithosMark'
import { DUMMY_USERS, useAuth } from '@/context/AuthContext'
import { BUTTON_EMBER, BUTTON_PRIMARY, BUTTON_SECONDARY } from '@/lib/glass'

const INPUT_CLASS =
  'w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-white/30 focus:bg-white/10'

/**
 * The one auth modal for the whole app — mounted once at the App root and
 * driven entirely by AuthContext's `isAuthModalOpen`, rather than owning any
 * open/close state itself. Its form is real UX (typed email/password,
 * inline errors) wrapped around fake auth: submitting matches the email
 * against DUMMY_USERS and logs in as whichever of the two mock profiles
 * matched — there's no backend to actually check a password against, which
 * is why the error copy says so rather than pretending otherwise. The two
 * "quick testing" buttons below skip the form entirely for the same result.
 */
export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, loginWithDummyData } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Scroll lock + Escape-to-close for exactly as long as the modal is open —
  // the two effects here are genuine external-system synchronization
  // (document.body's style, a window-level listener), unlike the form
  // fields below, which reset from the events that actually change them
  // instead of from an effect reacting to isAuthModalOpen.
  useEffect(() => {
    if (!isAuthModalOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Inlined rather than calling the handleClose defined below: that
    // wrapper is a new function every render, which would force this effect
    // to tear down and re-attach its listener on every keystroke. The
    // setState setters are stable across renders, so calling them directly
    // here — plus closeAuthModal, which only changes when isAuthModalOpen
    // itself does — keeps the dependency array both exhaustive and settled.
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setEmail('')
      setPassword('')
      setError(null)
      closeAuthModal()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAuthModalOpen, closeAuthModal])

  if (!isAuthModalOpen) return null

  // Every path that leaves the modal — closing it outright, or logging in —
  // clears the fields, so they never resurface stale on the next open.
  function resetForm() {
    setEmail('')
    setPassword('')
    setError(null)
  }

  function handleClose() {
    resetForm()
    closeAuthModal()
  }

  function handleDummyLogin(role: Parameters<typeof loginWithDummyData>[0]) {
    resetForm()
    loginWithDummyData(role)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedEmail = email.trim().toLowerCase()
    const match = Object.values(DUMMY_USERS).find((candidate) => candidate.email.toLowerCase() === normalizedEmail)

    if (!match) {
      setError('No demo account matches that email — try one of the quick-login options below.')
      return
    }
    if (!password) {
      setError('Enter any password — these are demo accounts, nothing is actually checked.')
      return
    }

    handleDummyLogin(match.role)
  }

  return (
    // The backdrop itself closes the modal on click; the panel stops that
    // click from bubbling back up so interacting with the form doesn't.
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.07] p-8 shadow-2xl shadow-black/60 backdrop-blur-2xl"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2.5">
          <LithosMark />
          <span className="text-sm font-semibold tracking-[0.28em] text-white">LITHOS</span>
        </div>

        <h2 id="auth-modal-title" className="mt-6 text-2xl font-semibold text-white">
          Sign in
        </h2>
        <p className="mt-1 text-sm text-white/50">Access your survey data and saved sites.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" strokeWidth={1.75} />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" strokeWidth={1.75} />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="submit" className={`${BUTTON_PRIMARY} mt-2 rounded-full px-6 py-3 text-sm font-semibold`}>
            Sign In
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
            Quick testing — dummy accounts
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleDummyLogin('user')}
              className={`${BUTTON_SECONDARY} inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold`}
            >
              <User className="h-4 w-4" strokeWidth={2} />
              Login as Regular User (Explorer)
            </button>
            <button
              type="button"
              onClick={() => handleDummyLogin('admin')}
              className={`${BUTTON_EMBER} inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold`}
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              Login as System Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
