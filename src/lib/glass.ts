/**
 * Shared class strings for the dark-glassmorphism design system. Centralized
 * here (rather than repeated per-component) so the handful of glass
 * "primitives" — panel, badge, pill group, the two button variants — stay
 * visually identical everywhere they're used and only need updating once.
 */

/** Cards & containers — e.g. the stat panel. */
export const GLASS_PANEL = 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl shadow-black/50'

/** Small floating labels — e.g. the category kicker. */
export const GLASS_BADGE =
  'bg-white/10 backdrop-blur-md border border-white/15 text-white/80 text-xs px-4 py-1.5 rounded-full'

/** A container that merges several controls into one continuous frosted pill — e.g. the nav. */
export const GLASS_PILL_GROUP =
  'bg-white/10 backdrop-blur-2xl border border-white/15 rounded-full p-1.5 flex items-center'

/** The one bright, solid, unmissable action on the page. */
export const BUTTON_PRIMARY =
  'bg-white text-black shadow-lg shadow-white/20 hover:scale-105 active:scale-95 transition-all duration-200'

/** Lower-emphasis actions that still read as part of the glass system. */
export const BUTTON_SECONDARY =
  'bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white transition-all duration-200'

/** A deliberately loud, orange "privileged action" button — reserved for
 * triggers that grant or require admin access (quick-login-as-admin, the
 * AdminGuard bypass), so that color stays a meaningful signal instead of
 * just another accent. */
export const BUTTON_EMBER =
  'bg-ember text-white shadow-lg shadow-ember/30 hover:scale-105 hover:bg-ember/90 active:scale-95 transition-all duration-200'

/** A small glowing pill for status you want to be noticed — e.g. the
 * Navbar's "Admin Portal" badge. */
export const BADGE_EMBER_GLOW =
  'inline-flex items-center gap-1.5 rounded-full border border-ember/40 bg-ember/10 px-3 py-1.5 text-xs font-semibold text-ember shadow-[0_0_16px_rgba(232,112,42,0.4)]'
