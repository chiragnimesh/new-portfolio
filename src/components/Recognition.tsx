import { certifications, recognition } from '../data/resume'
import { Section } from './Section'

export function Recognition() {
  return (
    <Section id="recognition" heading="Recognition">
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <ul className="border-t border-line">
          {recognition.map((r) => (
            <li key={r.title} className="flex gap-5 border-b border-line py-5">
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                  r.tone === 'ember' ? 'bg-ember' : 'bg-signal'
                }`}
                aria-hidden="true"
              />
              <span className="flex flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-medium text-bright">{r.title}</span>
                  {r.year && <span className="data">{r.year}</span>}
                </span>
                <span className="max-w-[52ch] text-sm text-body">{r.detail}</span>
              </span>
            </li>
          ))}
        </ul>

        <div className="self-start">
          <h3 className="text-sm font-medium text-bright">Certifications</h3>
          <ul className="mt-4 border-t border-line">
            {certifications.map((c) => (
              <li key={c} className="border-b border-line py-3 text-sm text-body">
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  )
}
