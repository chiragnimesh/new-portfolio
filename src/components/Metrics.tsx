import { metrics } from '../data/resume'

/** Ruled instrument strip. Ticks mark the cell boundaries, values sit on them. */
export function Metrics() {
  return (
    <section aria-label="By the numbers" className="border-y border-line bg-surface/40">
      <div className="shell lg:pl-24">
        <dl className="grid grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <div
              key={m.label}
              className={`relative py-8 pr-6 ${
                i % 2 === 1 ? 'border-l border-line pl-6' : ''
              } ${i < 2 ? 'border-b border-line lg:border-b-0' : ''} ${
                i === 2 ? 'lg:border-l lg:border-line lg:pl-6' : ''
              } ${i === 3 ? 'lg:pl-6' : ''}`}
            >
              <span
                aria-hidden="true"
                className={`absolute top-0 left-0 h-2 w-px ${
                  m.tone === 'ember' ? 'bg-ember' : 'bg-signal'
                }`}
              />
              <dd
                className={`text-[length:clamp(1.9rem,4.4vw,3rem)] leading-none font-medium tracking-[-0.04em] ${
                  m.tone === 'ember' ? 'text-ember' : 'text-signal'
                }`}
              >
                {m.value}
              </dd>
              <dt className="mt-3 max-w-[22ch] text-sm leading-snug text-dim">{m.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
