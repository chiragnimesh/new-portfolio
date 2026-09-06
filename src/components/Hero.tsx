import { Suspense, lazy, useState } from 'react'
import { hero, identity, meshEdges, meshNodes, type Node as MeshNode } from '../data/resume'

// The mesh is the backdrop, not the message: the words render on the first
// paint and three.js arrives in its own chunk a moment later.
const ServiceMesh = lazy(() =>
  import('../three/ServiceMesh').then((m) => ({ default: m.ServiceMesh })),
)

function Delay({ ms, children }: { ms: number; children: React.ReactNode }) {
  return (
    <div className="boot" style={{ animationDelay: `${ms}ms` }}>
      {children}
    </div>
  )
}

export function Hero({ still, canHover }: { still: boolean; canHover: boolean }) {
  const [reading, setReading] = useState<MeshNode | null>(null)
  // The mesh sits behind the words, so a pointer over the hero lands on the
  // text column, never on the canvas. The scene reads its events from here.
  const [frame, setFrame] = useState<HTMLElement | null>(null)

  return (
    <header ref={setFrame} id="top" className="relative isolate min-h-dvh overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <Suspense fallback={null}>
          <ServiceMesh
            still={still}
            canHover={canHover}
            eventSource={frame}
            onHover={setReading}
          />
        </Suspense>
      </div>

      {/* Keeps the headline readable wherever the mesh happens to be bright.
          The angled wash works on a wide viewport, where the text sits left and
          the mesh right. A tall narrow one has no such split: the words run over
          the mesh, so it gets an even scrim instead — heaviest under the running
          text, lightest at the top where only the marks are. */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden sm:block"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(102deg, rgba(10,14,26,0.97) 0%, rgba(10,14,26,0.93) 24%, rgba(10,14,26,0.56) 50%, rgba(10,14,26,0) 80%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 sm:hidden"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,14,26,0.40) 0%, rgba(10,14,26,0.74) 26%, rgba(10,14,26,0.80) 62%, rgba(10,14,26,0.94) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40"
        aria-hidden="true"
        style={{ background: 'linear-gradient(to top, #0a0e1a 12%, rgba(10,14,26,0))' }}
      />

      <div className="shell flex min-h-dvh flex-col justify-between pt-10 pb-8 lg:pl-24">
        <Delay ms={60}>
          <div className="flex items-center gap-3">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-signal opacity-70" />
            </span>
            <span className="data text-body">{identity.location}</span>
            <span className="h-px w-6 bg-line-lit" aria-hidden="true" />
            <span className="data">{hero.since}</span>
          </div>
        </Delay>

        <div className="max-w-[64rem] py-14">
          <Delay ms={180}>
            <h1
              className="text-[length:var(--text-display)] leading-[0.86] font-medium text-bright"
              style={{ letterSpacing: '-0.055em' }}
            >
              {identity.name}
            </h1>
          </Delay>

          <Delay ms={320}>
            <p className="mt-6 max-w-[31ch] text-[length:var(--text-lead)] leading-[1.28] font-light text-bright">
              {hero.standfirst}
            </p>
          </Delay>

          <Delay ms={430}>
            <p className="mt-6 max-w-[58ch] text-body">{hero.lead}</p>
          </Delay>

          <Delay ms={540}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${identity.email}`}
                className="rounded-full bg-signal px-6 py-2.5 text-sm font-medium text-void transition-colors hover:bg-bright"
              >
                Email me
              </a>
              <a
                href={identity.github}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-line-lit px-6 py-2.5 text-sm text-bright transition-colors hover:border-signal hover:text-signal"
              >
                GitHub
              </a>
              <a
                href={identity.linkedin}
                target="_blank"
                rel="noreferrer noopener"
                className="rounded-full border border-line-lit px-6 py-2.5 text-sm text-bright transition-colors hover:border-signal hover:text-signal"
              >
                LinkedIn
              </a>
            </div>
          </Delay>
        </div>

        <Delay ms={700}>
          <div className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-baseline sm:justify-between">
            <div className="flex max-w-[52ch] flex-col gap-1.5">
              <p className="text-sm text-dim">
                Behind this text is the purchase flow I work on: {meshNodes.length} services and{' '}
                {meshEdges.length} call paths
                {still ? '.' : ', with live traffic moving between them.'}
              </p>
              {canHover && (
                <p className="data">
                  {reading ? (
                    <>
                      <span className="text-bright">{reading.label}</span>{' '}
                      <span className="text-dim">{reading.id}</span>
                    </>
                  ) : (
                    'point at a node to see what it runs on'
                  )}
                </p>
              )}
            </div>
            <a
              href="#work"
              className="data whitespace-nowrap text-signal transition-colors hover:text-bright"
            >
              Keep scrolling
            </a>
          </div>
        </Delay>
      </div>
    </header>
  )
}
