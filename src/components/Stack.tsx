import { stack } from '../data/resume'
import { Section } from './Section'

/** A spec sheet, not a chip cloud: one row per area, items separated by rules. */
export function Stack() {
  return (
    <Section
      id="stack"
      heading="The tools I reach for"
      aside={
        <p className="data max-w-[28ch] text-dim">
          Ordered by how much of my week each one takes.
        </p>
      }
    >
      <dl className="border-t border-line">
        {stack.map((group) => (
          <div
            key={group.group}
            className="grid gap-2 border-b border-line py-5 md:grid-cols-[13.5rem_1fr] md:gap-6"
          >
            <dt className="text-sm font-medium text-bright">{group.group}</dt>
            <dd className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {group.items.map((item, i) => (
                <span key={item} className="flex items-center gap-3">
                  {i > 0 && <span className="h-3 w-px bg-line-lit" aria-hidden="true" />}
                  <span className="text-[0.95rem] text-body">{item}</span>
                </span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}
