import { useMemo, useState } from 'react'
import { axis, monthYear, spans, type Span } from '../data/resume'
import { Section } from './Section'

const LANE = {
  work: 'Role',
  build: 'Built',
  study: 'Study',
} as const

const TONE = {
  signal: { bar: 'var(--color-signal)', soft: 'rgba(56,224,208,0.16)' },
  ember: { bar: 'var(--color-ember)', soft: 'rgba(255,180,84,0.16)' },
  quiet: { bar: 'var(--color-line-lit)', soft: 'rgba(44,58,92,0.3)' },
} as const

const toMonths = (d: readonly [number, number]) =>
  (d[0] - axis.from[0]) * 12 + (d[1] - axis.from[1])

const TOTAL = toMonths(axis.to)

function place(span: Span) {
  const start = toMonths(span.from)
  const end = span.to === 'now' ? TOTAL : toMonths(span.to)
  return {
    left: (start / TOTAL) * 100,
    width: (Math.max(end - start, 1) / TOTAL) * 100,
    months: Math.max(end - start, 1),
  }
}

const label = (d: readonly [number, number] | 'now') => (d === 'now' ? 'now' : monthYear(d))

function Axis() {
  const years = useMemo(() => {
    const out: { year: number; at: number }[] = []
    for (let y = axis.from[0] + 1; y <= axis.to[0]; y++) {
      out.push({ year: y, at: (toMonths([y, 1]) / TOTAL) * 100 })
    }
    return out
  }, [])

  return (
    <div className="relative h-6 border-b border-line" aria-hidden="true">
      {years.map((y) => (
        <div key={y.year} className="absolute top-0 bottom-0" style={{ left: `${y.at}%` }}>
          <span className="absolute bottom-0 h-2 w-px bg-line-lit" />
          <span className="data absolute bottom-3 -translate-x-1/2 text-dim">{y.year}</span>
        </div>
      ))}
    </div>
  )
}

/** Vertical year gridlines behind the bars, so widths are readable as durations. */
function Grid() {
  const years = useMemo(() => {
    const out: number[] = []
    for (let y = axis.from[0] + 1; y <= axis.to[0]; y++) {
      out.push((toMonths([y, 1]) / TOTAL) * 100)
    }
    return out
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {years.map((at) => (
        <span key={at} className="absolute top-0 bottom-0 w-px bg-line/70" style={{ left: `${at}%` }} />
      ))}
    </div>
  )
}

function Row({
  span,
  open,
  onToggle,
}: {
  span: Span
  open: boolean
  onToggle: () => void
}) {
  const { left, width, months } = place(span)
  const tone = TONE[span.tone]
  const panel = `${span.id}-detail`

  return (
    <div className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panel}
        className="group w-full px-0 py-4 text-left"
      >
        <div className="flex flex-col gap-1.5 md:grid md:grid-cols-[13.5rem_1fr] md:items-center md:gap-6">
          <span className="flex flex-col gap-0.5">
            <span className="flex items-baseline gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full transition-transform group-hover:scale-125"
                style={{ background: tone.bar }}
                aria-hidden="true"
              />
              <span className="text-[0.95rem] leading-snug font-medium text-bright">
                {span.title}
              </span>
            </span>
            <span className="data pl-4">{LANE[span.lane]}</span>
          </span>

          <span className="relative block h-9">
            <Grid />
            <span
              className="absolute top-1/2 flex h-7 -translate-y-1/2 items-center rounded-[3px] px-2.5 transition-all group-hover:brightness-125"
              style={{
                left: `${left}%`,
                width: `${width}%`,
                background: tone.soft,
                borderLeft: `2px solid ${tone.bar}`,
              }}
            >
              <span className="data truncate" style={{ color: tone.bar }}>
                {months}mo
              </span>
            </span>
          </span>
        </div>
      </button>

      {open && (
        <div id={panel} className="pb-7 md:grid md:grid-cols-[13.5rem_1fr] md:gap-6">
          <div className="flex flex-col gap-1 pb-4 md:pb-0">
            <span className="data">
              {label(span.from)} — {label(span.to)}
            </span>
            <span className="data">{span.org}</span>
            <span className="data">{span.place}</span>
          </div>

          <div className="flex flex-col gap-5">
            <ul className="flex flex-col gap-3">
              {span.points.map((p) => (
                <li key={p.slice(0, 24)} className="flex gap-3">
                  <span
                    className="mt-2.5 h-px w-3 shrink-0"
                    style={{ background: TONE[span.tone].bar }}
                    aria-hidden="true"
                  />
                  <span className="max-w-[68ch] text-[0.95rem] leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>

            {span.stack.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {span.stack.map((s) => (
                  <li
                    key={s}
                    className="rounded border border-line bg-raised/60 px-2 py-1 text-xs text-body"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function Timeline() {
  const ordered = useMemo(
    () =>
      [...spans].sort((a, b) => {
        const d = toMonths(b.from) - toMonths(a.from)
        return d !== 0 ? d : a.lane === 'work' ? -1 : 1
      }),
    [],
  )
  const [open, setOpen] = useState<string | null>(ordered[0]?.id ?? null)

  return (
    <Section
      id="timeline"
      heading="Everything, on one time axis"
      aside={
        <p className="data max-w-[30ch] text-dim">
          Bar length is real duration. Open a row for the detail.
        </p>
      }
    >
      <div className="md:grid md:grid-cols-[13.5rem_1fr] md:gap-6">
        <span aria-hidden="true" className="hidden md:block" />
        <Axis />
      </div>

      <div>
        {ordered.map((s) => (
          <Row
            key={s.id}
            span={s}
            open={open === s.id}
            onToggle={() => setOpen(open === s.id ? null : s.id)}
          />
        ))}
      </div>
    </Section>
  )
}
