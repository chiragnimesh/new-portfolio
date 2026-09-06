import { contact, identity } from '../data/resume'

const links = [
  { label: 'GitHub', value: identity.githubHandle, href: identity.github, external: true },
  { label: 'LinkedIn', value: identity.linkedinHandle, href: identity.linkedin, external: true },
  { label: 'Phone', value: identity.phone, href: `tel:${identity.phone.replace(/\s/g, '')}` },
]

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-8 border-t border-line py-20 lg:py-28">
      <div className="shell lg:pl-24">
        <h2 className="max-w-[24ch] text-[length:var(--text-title)] font-medium">
          {contact.heading}
        </h2>
        <p className="mt-5 max-w-[52ch] text-lg">{contact.body}</p>

        <a
          href={`mailto:${identity.email}`}
          className="group mt-10 inline-flex max-w-full items-baseline gap-3 border-b border-line-lit pb-2 transition-colors hover:border-signal"
        >
          <span className="truncate text-[length:clamp(1.35rem,4.4vw,2.6rem)] leading-tight font-medium tracking-[-0.03em] text-bright transition-colors group-hover:text-signal">
            {identity.email}
          </span>
        </a>

        <dl className="mt-12 grid gap-x-8 gap-y-5 sm:grid-cols-3">
          {links.map((l) => (
            <div key={l.label} className="flex flex-col gap-1 border-t border-line pt-3">
              <dt className="data">{l.label}</dt>
              <dd>
                <a
                  href={l.href}
                  {...(l.external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                  className="text-sm text-bright transition-colors hover:text-signal"
                >
                  {l.value}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
