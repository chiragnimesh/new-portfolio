/* Authoring-time only: pulls real brand path data out of simple-icons and
   writes src/data/marks.ts, so no icon package ships in the bundle.

   Run with:  npm i --no-save simple-icons && node scripts/gen-marks.cjs */
const si = require('simple-icons')
const fs = require('fs')

const from = {
  graphql: 'siGraphql',
  java: 'siOpenjdk',
  springboot: 'siSpringboot',
  quarkus: 'siQuarkus',
  hibernate: 'siHibernate',
  apollo: 'siApollographql',
  react: 'siReact',
  swagger: 'siSwagger',
  git: 'siGit',
  postgres: 'siPostgresql',
  openai: 'siOpenai',
}

// Qdrant is not in simple-icons. Rather than approximate its wordmark, this is
// the site's own glyph for a vector index: a query point and its neighbours.
const QDRANT = [
  'M12 1.9a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  'M11.35 7.1h1.3v9.8h-1.3Z',
  'M6.05 13.2 11.6 9l.8 1.04-5.55 4.2Z',
  'M17.95 13.2 12.4 9l-.8 1.04 5.55 4.2Z',
  'M4.1 14.55a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  'M12 18.1a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
  'M19.9 14.55a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
].join('')

const lines = []
lines.push('/**')
lines.push(' * Monochrome technology marks on a 24x24 viewBox, one path each.')
lines.push(' * Path data from simple-icons (CC0). Every mark stays the trademark of its')
lines.push(' * owner and appears here only to name the technology behind a mesh node.')
lines.push(' *')
lines.push(' * Java falls back to the OpenJDK cup and Azure OpenAI to the OpenAI mark,')
lines.push(' * since simple-icons carries no Oracle or Microsoft artwork.')
lines.push(' */')
lines.push('')
lines.push('export const marks = {')
for (const [key, exportName] of Object.entries(from)) {
  const icon = si[exportName]
  if (!icon) throw new Error('simple-icons has no ' + exportName)
  if (icon.path.includes('"')) throw new Error('path contains a double quote: ' + key)
  lines.push('  ' + key + ': \'<path d="' + icon.path + '"/>\',')
}
lines.push('  qdrant: \'<path d="' + QDRANT + '"/>\',')
lines.push('} as const')
lines.push('')
lines.push('export type MarkKey = keyof typeof marks')
lines.push('')

fs.writeFileSync('src/data/marks.ts', lines.join('\n'))
console.log('wrote src/data/marks.ts', fs.statSync('src/data/marks.ts').size, 'bytes')
