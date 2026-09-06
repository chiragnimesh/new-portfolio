import { about, facts } from '../data/resume'
import { Section } from './Section'

export function About() {
  return (
    <Section id="work" heading={about.heading}>
      <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-20">
        <div className="flex flex-col gap-6">
          {about.body.map((p) => (
            <p key={p.slice(0, 24)} className="max-w-[64ch] text-lg leading-[1.7]">
              {p}
            </p>
          ))}
        </div>

        <dl className="flex flex-col self-start border-t border-line">
          {facts.map((f) => (
            <div key={f.k} className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-line py-4">
              <dt className="data pt-0.5">{f.k}</dt>
              <dd className="text-sm leading-relaxed text-bright">{f.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}
