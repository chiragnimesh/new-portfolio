import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { POINTS, TOP_K, chatbot, clusters, queries } from '../data/resume'
import { CORPUS_SIZE, ask, type Answer } from '../lib/ask'
import { Section } from './Section'

// three.js is most of the payload, and none of it is needed to read the page.
const VectorSpace = lazy(() =>
  import('../three/VectorSpace').then((m) => ({ default: m.VectorSpace })),
)

type Phase = 'idle' | 'embed' | 'search' | 'hits' | 'answer'

const STEPS: { phase: Phase; at: number }[] = [
  { phase: 'embed', at: 0 },
  { phase: 'search', at: 340 },
  { phase: 'hits', at: 820 },
  { phase: 'answer', at: 1180 },
]

function useTypewriter(text: string, run: boolean, instant: boolean) {
  const [shown, setShown] = useState('')

  useEffect(() => {
    if (!run) {
      setShown('')
      return
    }
    if (instant) {
      setShown(text)
      return
    }
    setShown('')
    let i = 0
    const id = setInterval(() => {
      i = Math.min(i + 2, text.length)
      setShown(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, 14)
    return () => clearInterval(id)
  }, [text, run, instant])

  return shown
}

export function Retrieval({ still, canHover }: { still: boolean; canHover: boolean }) {
  const [active, setActive] = useState<number | null>(null)
  // A typed question searches the résumé instead of the reconstructed Jira
  // corpus, so the two answers cannot both be on screen at once.
  const [asked, setAsked] = useState<Answer | null>(null)
  const [draft, setDraft] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const timers = useRef<number[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (active === null && asked === null) {
      setPhase('idle')
      return
    }
    if (still) {
      setPhase('answer')
      return
    }
    for (const s of STEPS) {
      timers.current.push(window.setTimeout(() => setPhase(s.phase), s.at))
    }
    return () => timers.current.forEach(clearTimeout)
  }, [active, asked, still])

  const canned = active === null ? null : queries[active]
  const shown = canned
    ? {
        hits: canned.hits as readonly { id: string; kind: string; meta: string; text: string }[],
        answer: canned.answer,
        scanned: `${POINTS.toLocaleString()} vectors`,
        retrieved: `${TOP_K} nearest retrieved, top 3 shown`,
      }
    : asked
      ? {
          hits: asked.hits,
          answer: asked.answer,
          scanned: `${CORPUS_SIZE} chunks of résumé`,
          retrieved: asked.grounded
            ? `${asked.matched} of ${CORPUS_SIZE} chunks retrieved, top ${asked.hits.length} shown`
            : 'nothing cleared the similarity floor',
        }
      : null

  const typed = useTypewriter(shown?.answer ?? '', phase === 'answer', still)
  const showHits = phase === 'hits' || phase === 'answer'

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const question = draft.trim()
    if (!question) return
    setActive(null)
    setAsked(ask(question))
    setDraft('')
  }

  return (
    <Section
      id="retrieval"
      heading={chatbot.heading}
      aside={
        <span className="inline-flex items-center gap-2 rounded-full border border-ember/35 bg-ember/8 px-3.5 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-ember" aria-hidden="true" />
          <span className="text-xs text-ember">{chatbot.kicker}</span>
        </span>
      }
    >
      <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          {chatbot.body.map((p) => (
            <p key={p.slice(0, 20)} className="max-w-[58ch] text-lg leading-[1.7]">
              {p}
            </p>
          ))}
          <ol className="mt-2 flex flex-col">
            {chatbot.pipeline.map((s, i) => (
              <li key={s.step} className="relative flex gap-4 pb-5 last:pb-0">
                {i < chatbot.pipeline.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute top-6 bottom-0 left-[0.6875rem] w-px bg-line"
                  />
                )}
                <span className="relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line-lit bg-base text-[0.65rem] text-ember">
                  {i + 1}
                </span>
                <span className="flex flex-col gap-0.5 pt-0.5">
                  <span className="text-sm font-medium text-bright">{s.step}</span>
                  <span className="text-sm text-dim">{s.detail}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-surface/60">
          <div className="relative h-[19rem] border-b border-line sm:h-[23rem]">
            <Suspense fallback={null}>
              <VectorSpace
                active={active}
                pulse={asked !== null}
                still={still}
                canHover={canHover}
              />
            </Suspense>

            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-3.5">
              <span className="data text-dim">
                {POINTS.toLocaleString()} vectors in {clusters.length} clusters
              </span>
              {canHover && <span className="data text-dim">drag to rotate</span>}
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap gap-x-4 gap-y-1 p-3.5">
              {clusters.map((c) => (
                <span key={c.name} className="data flex items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: c.tint }}
                    aria-hidden="true"
                  />
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4">
            <p className="text-sm text-dim">Ask it something a manager would ask.</p>

            <div className="flex flex-wrap gap-2">
              {queries.map((item, i) => {
                const on = active === i
                return (
                  <button
                    key={item.q}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setAsked(null)
                      setActive(on ? null : i)
                    }}
                    className={`rounded-full border px-3.5 py-2 text-left text-[0.8rem] leading-tight transition-colors ${
                      on
                        ? 'border-ember bg-ember/12 text-ember'
                        : 'border-line-lit text-body hover:border-body hover:text-bright'
                    }`}
                  >
                    {item.q}
                  </button>
                )
              })}
            </div>

            <form onSubmit={submit} className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={160}
                placeholder="Or ask me anything about my work"
                aria-label="Ask a question about my work"
                className="min-w-0 flex-1 rounded-full border border-line-lit bg-raised/50 px-3.5 py-2 text-[0.8rem] text-bright transition-colors placeholder:text-dim focus:border-signal"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="rounded-full border border-signal/50 bg-signal/10 px-4 py-2 text-[0.8rem] text-signal transition-colors hover:bg-signal/20 disabled:border-line disabled:bg-transparent disabled:text-dim"
              >
                Ask
              </button>
            </form>

            <div className="min-h-[13.5rem] border-t border-line pt-3" aria-live="polite">
              {shown === null ? (
                <p className="text-sm text-dim">
                  Pick a question, or type your own, and watch the nearest records light up in the
                  space above.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {asked && <p className="text-xs text-dim">{asked.question}</p>}
                  <p className="data text-signal">
                    {phase === 'embed'
                      ? 'embedding question…'
                      : phase === 'search'
                        ? `searching ${shown.scanned}…`
                        : shown.retrieved}
                  </p>

                  <ul className="flex flex-col gap-px">
                    {shown.hits.map((h, i) => (
                      <li
                        key={h.id}
                        className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3 bg-raised/50 px-2.5 py-2 transition-opacity duration-300"
                        style={{
                          opacity: showHits ? 1 : 0,
                          transitionDelay: `${i * 90}ms`,
                        }}
                      >
                        <span className="data text-ember">{h.id}</span>
                        <span className="flex flex-wrap items-baseline gap-x-2 text-xs">
                          <span className="text-bright">{h.text}</span>
                          <span className="data text-dim">
                            {h.kind} {h.meta}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>

                  {phase === 'answer' && (
                    <p
                      className={`text-sm leading-relaxed text-bright ${
                        typed.length < shown.answer.length ? 'caret' : ''
                      }`}
                    >
                      {typed}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="border-t border-line px-4 py-3 text-xs leading-relaxed text-dim">
            {chatbot.demoNote}
          </p>
        </div>
      </div>
    </Section>
  )
}
