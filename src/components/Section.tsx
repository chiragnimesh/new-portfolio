import type { ReactNode } from 'react'

export function Section({
  id,
  heading,
  aside,
  children,
  bleed = false,
}: {
  id: string
  heading: string
  aside?: ReactNode
  children: ReactNode
  bleed?: boolean
}) {
  return (
    <section id={id} className="scroll-mt-8 border-t border-line py-20 lg:py-28">
      <div className={bleed ? '' : 'shell lg:pl-24'}>
        <div className={bleed ? 'shell lg:pl-24' : ''}>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="max-w-[26ch] text-[length:var(--text-title)] font-medium">{heading}</h2>
            {aside ? <div className="shrink-0 md:pb-2">{aside}</div> : null}
          </div>
        </div>
        <div className={bleed ? 'mt-12' : 'mt-12'}>{children}</div>
      </div>
    </section>
  )
}
