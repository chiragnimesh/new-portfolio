import Lenis from 'lenis'
import { useEffect } from 'react'

/**
 * Momentum scrolling, skipped entirely when reduced motion is requested.
 * Lenis owns the scroll position while it runs, so in-page anchors have to be
 * handed to it rather than left to the browser — otherwise it snaps back.
 */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      wheelMultiplier: 0.95,
    })

    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return
      const link = (event.target as HTMLElement | null)?.closest('a')
      const href = link?.getAttribute('href')
      if (!href?.startsWith('#') || href.length < 2) return
      const target = document.getElementById(href.slice(1))
      if (!target) return
      event.preventDefault()
      lenis.scrollTo(target, { offset: -8 })
      history.replaceState(null, '', href)
    }

    document.addEventListener('click', onClick)

    return () => {
      document.removeEventListener('click', onClick)
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [enabled])
}
