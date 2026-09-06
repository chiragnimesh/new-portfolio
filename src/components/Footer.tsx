import { identity } from '../data/resume'

export function Footer() {
  return (
    <footer className="border-t border-line py-8">
      <div className="shell flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:pl-24">
        <p className="data text-dim">
          {identity.name} — {identity.role}, {identity.location}
        </p>
        <p className="data text-dim">Built with React, three.js and Tailwind</p>
      </div>
    </footer>
  )
}
