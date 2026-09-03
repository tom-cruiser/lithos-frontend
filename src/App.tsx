import { GlobeHero } from '@/components/GlobeHero'
import { Module1Hero } from '@/components/module1/Module1Hero'
import { AuthModal } from '@/components/AuthModal'

// Module1Hero is stacked below the marketing GlobeHero purely so it has a
// route to render through for now — this app has no router yet. Once real
// module routing exists, this belongs on its own page instead of appended
// here.
//
// AuthModal is mounted once here, at the app root — it renders nothing
// itself unless AuthContext's isAuthModalOpen is true, and every page under
// this one shares the same AuthProvider (see main.tsx), so any "Sign In"
// trigger anywhere opens this same instance rather than each page needing
// its own.
function App() {
  return (
    <>
      <GlobeHero />
      <Module1Hero />
      <AuthModal />
    </>
  )
}

export default App
