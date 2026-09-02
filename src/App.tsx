import { GlobeHero } from '@/components/GlobeHero'
import { Module1Hero } from '@/components/module1/Module1Hero'

// Module1Hero is stacked below the marketing GlobeHero purely so it has a
// route to render through for now — this app has no router yet. Once real
// module routing exists, this belongs on its own page instead of appended
// here.
function App() {
  return (
    <>
      <GlobeHero />
      <Module1Hero />
    </>
  )
}

export default App
