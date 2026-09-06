import { useEffect, useState } from 'react'

/** True when the visitor has asked the OS for less motion. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

/** True below the given breakpoint. Used to drop 3D cost on small screens. */
export function useNarrow(px = 768) {
  const [narrow, setNarrow] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < px
  })

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${px - 1}px)`)
    const onChange = () => setNarrow(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [px])

  return narrow
}

/**
 * True when the primary pointer cannot hover, which in practice means touch.
 * Asked as the negative on purpose: a browser that does not understand the
 * query answers "no", and keeps the hover interactions it probably supports.
 */
export function useHoverless() {
  const [hoverless, setHoverless] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(hover: none)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(hover: none)')
    const onChange = () => setHoverless(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return hoverless
}
