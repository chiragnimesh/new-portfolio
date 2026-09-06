import { About } from './components/About'
import { Contact } from './components/Contact'
import { Footer } from './components/Footer'
import { Hero } from './components/Hero'
import { Metrics } from './components/Metrics'
import { Rail } from './components/Rail'
import { Recognition } from './components/Recognition'
import { Retrieval } from './components/Retrieval'
import { Stack } from './components/Stack'
import { Timeline } from './components/Timeline'
import { useHoverless, useNarrow, useReducedMotion } from './hooks/useReducedMotion'
import { useSmoothScroll } from './hooks/useSmoothScroll'

export default function App() {
  const reduced = useReducedMotion()
  const narrow = useNarrow(640)
  const hoverless = useHoverless()
  // Freeze the scenes when motion is unwelcome or the device is small.
  const still = reduced || narrow
  // Touch animates happily but can never hover. The scenes keep moving there
  // and simply stop offering the interactions they cannot deliver.
  const canHover = !still && !hoverless

  useSmoothScroll(!reduced)

  return (
    <>
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded focus:bg-signal focus:px-4 focus:py-2 focus:text-void"
      >
        Skip to content
      </a>

      <Rail />

      <div
        className="gridfield pointer-events-none fixed inset-0 -z-20 opacity-[0.35]"
        aria-hidden="true"
      />

      <main>
        <Hero still={still} canHover={canHover} />
        <Metrics />
        <About />
        <Retrieval still={still} canHover={canHover} />
        <Timeline />
        <Stack />
        <Recognition />
        <Contact />
      </main>

      <Footer />
    </>
  )
}
