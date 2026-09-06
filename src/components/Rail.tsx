import { useEffect, useState } from 'react'
import { identity } from '../data/resume'

const stops = [
  { id: 'top', label: 'Top' },
  { id: 'work', label: 'What I do' },
  { id: 'retrieval', label: 'Retrieval' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'stack', label: 'Stack' },
  { id: 'recognition', label: 'Recognition' },
  { id: 'contact', label: 'Contact' },
]

/**
 * Fixed instrument rail. The lit stop is the section you are reading, so the
 * rail doubles as a position readout rather than decoration.
 */
export function Rail() {
  const [at, setAt] = useState('top')

  useEffect(() => {
    const seen = new Map<string, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) seen.set(e.target.id, e.intersectionRatio)
        let best = 'top'
        let ratio = 0
        for (const [id, r] of seen) {
          if (r > ratio) {
            ratio = r
            best = id
          }
        }
        if (ratio > 0) setAt(best)
      },
      { threshold: [0, 0.15, 0.35, 0.6, 0.9] },
    )

    for (const s of stops) {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  return (
    <nav
      aria-label="Sections"
      className="fixed top-0 left-0 z-40 hidden h-dvh w-16 flex-col items-center justify-between border-r border-line bg-base/70 py-6 backdrop-blur-sm lg:flex"
    >
      <a
        href="#top"
        className="data text-signal transition-colors hover:text-bright"
        style={{ writingMode: 'vertical-rl' }}
      >
        {identity.name.toLowerCase()}
      </a>

      <ul className="flex flex-col items-center gap-5">
        {stops.map((s) => {
          const on = at === s.id
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-label={s.label}
                aria-current={on ? 'true' : undefined}
                className="group relative block p-1"
              >
                <span
                  className={`block h-px transition-all duration-300 ${
                    on ? 'w-6 bg-signal' : 'w-3 bg-line-lit group-hover:w-5 group-hover:bg-body'
                  }`}
                />
                <span className="data pointer-events-none absolute top-1/2 left-8 -translate-y-1/2 whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
                  {s.label}
                </span>
              </a>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col items-center gap-4">
        <a
          href={identity.github}
          target="_blank"
          rel="noreferrer noopener"
          className="data hover:text-bright"
          style={{ writingMode: 'vertical-rl' }}
        >
          github
        </a>
        <span className="h-8 w-px bg-line-lit" aria-hidden="true" />
      </div>
    </nav>
  )
}
