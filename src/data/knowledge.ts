/** The corpus the question box searches. Every chunk is derived from resume.ts,
 *  so an answer can never claim something the rest of the page does not. */

import {
  about,
  certifications,
  chatbot,
  contact,
  experience,
  hero,
  identity,
  metrics,
  monthYear,
  recognition,
  spans,
  stack,
  summary,
  type Span,
} from './resume'

export type Chunk = {
  /** Quoted in the hit list, the way a retrieved record would be. */
  id: string
  /** Which part of the résumé it came from. */
  group: string
  meta: string
  /** One line, for the hit list. */
  hit: string
  /** The sentences an answer is built out of. */
  text: string
  /** Words a question might reach for that the text itself never uses. */
  tags?: string[]
}

const when = (d: readonly [number, number] | 'now') => (d === 'now' ? 'now' : monthYear(d))

const period = (s: Span) => `${when(s.from)} – ${when(s.to)}`

const list = (items: readonly string[]) =>
  items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`

/** A hit row is one line wide, so a long bullet is cut at a word. */
function clip(text: string, max = 62) {
  if (text.length <= max) return text
  const cut = text.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

const LANE: Record<Span['lane'], string> = { work: 'role', build: 'project', study: 'study' }

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** 'Capgemini — client: Comcast' is one employer, not two. */
const employer = (s: Span) => s.org.split(' — ')[0]

/** Short record keys, so a hit id reads like one and fits the column. */
const KEY: Record<string, string> = {
  comcast: 'CMCST',
  'capgemini-fs': 'CAPFS',
  admissions: 'ADMIT',
  anpr: 'ANPR',
  kiet: 'KIET',
}

/** Stack groups are lists on the page; here they have to read as answers. */
const LEAD: Record<string, string> = {
  Languages: 'The languages I write are',
  Backend: 'On the backend I work in',
  Frontend: 'On the front end I work in',
  'AI & retrieval': 'For AI and retrieval I use',
  Data: 'The data stores I have worked in are',
  Tooling: 'My day-to-day tooling is',
  'Ways of working': 'I work in',
}

const PROFILE: Chunk[] = [
  {
    id: 'WHO-01',
    group: 'profile',
    meta: identity.role.toLowerCase(),
    hit: 'who I am and where I am',
    text: `I am ${identity.name}, a ${identity.role.toLowerCase()} based in ${identity.location}. ${hero.standfirst} ${hero.since}.`,
    tags: ['who', 'yourself', 'introduce', 'name', 'role', 'title', 'based', 'live', 'located', 'city', 'bangalore', 'india', 'remote', 'timezone'],
  },
  {
    id: 'WHO-02',
    group: 'profile',
    meta: 'day to day',
    hit: 'what I own day to day',
    text: hero.lead,
    tags: ['do', 'job', 'own', 'responsible', 'responsibility', 'currently', 'present', 'today'],
  },
  {
    id: 'ARCH-01',
    group: 'architecture',
    meta: 'the request path',
    hit: 'how a request travels',
    text: about.body[0],
    tags: ['architecture', 'design', 'scale', 'latency', 'performance', 'observability', 'monitoring', 'path', 'flow', 'traffic', 'load'],
  },
]

/** "How long have you been doing this?" is the first thing anyone asks, and a
 *  corpus of job headers can only answer it with arithmetic homework. The total
 *  is derived from the spans, so this chunk is right every month. */
const TOTAL: Chunk[] = (() => {
  const work = spans.filter((s) => s.lane === 'work')
  const path = [...work]
    .reverse()
    .map((s) => `${s.title.toLowerCase()} from ${when(s.from)}`)
    .join(', then ')
  const employers = [...new Set(work.map(employer))]

  return [
    {
      id: 'EXP-01',
      group: 'experience',
      meta: `${when(experience.from)} – now`,
      hit: `${experience.exact} of professional experience`,
      text: `${cap(experience.rounded)} of professional experience — ${when(
        experience.from,
      )} to now, ${experience.exact} in total, ${
        employers.length === 1 ? `all of it at ${employers[0]}` : `across ${list(employers)}`
      }: ${path}.`,
      tags: ['experience', 'year', 'total', 'overall', 'long', 'many', 'much', 'since', 'career', 'professional', 'yoe', 'fresher', 'junior', 'senior', 'level', 'seniority', 'engineer', 'software', 'working', 'work'],
    },
    {
      id: 'EXP-02',
      group: 'profile',
      meta: 'the short version',
      hit: `${summary.title.toLowerCase()} — the one-line version`,
      text: summary.text,
      tags: ['summary', 'overview', 'pitch', 'profile', 'yourself', 'introduce', 'strength', 'good', 'best', 'specialise', 'specialisation', 'focus', 'engineer', 'software', 'fullstack', 'full', 'proficient', 'expertise'],
    },
  ]
})()

const AI: Chunk[] = [
  {
    id: 'AI-01',
    group: 'ai',
    meta: 'self-taught',
    hit: 'learning RAG by shipping it',
    text: about.body[1],
    tags: ['python', 'learn', 'self', 'taught', 'new', 'background', 'award', 'awarded', 'prize', 'recognised', 'first'],
  },
  {
    id: 'AI-02',
    group: 'ai',
    meta: 'the problem',
    hit: 'why the chatbot exists',
    text: `${chatbot.heading}. ${chatbot.body[0]}`,
    tags: ['chatbot', 'bot', 'assistant', 'why', 'manager', 'dashboard', 'lookup', 'visibility', 'effort', 'problem'],
  },
  {
    id: 'AI-03',
    group: 'ai',
    meta: 'how it works',
    hit: 'the retrieval pipeline',
    text: chatbot.body[1],
    tags: ['rag', 'retrieval', 'vector', 'similarity', 'cosine', 'embedding', 'llm', 'grounded', 'context', 'nightly', 'sync', 'index'],
  },
  {
    id: 'AI-04',
    group: 'ai',
    meta: `${chatbot.pipeline.length} steps`,
    hit: 'the pipeline, step by step',
    text: `The pipeline runs in ${chatbot.pipeline.length} steps: ${chatbot.pipeline
      .map((s) => `${s.step.toLowerCase()} — ${s.detail.toLowerCase()}`)
      .join('; ')}.`,
    tags: ['pipeline', 'step', 'stage', 'chunk', 'ingest', 'topk', 'neighbour', 'payload', 'collection'],
  },
]

const NUMBERS: Chunk[] = [
  {
    id: 'IMPACT-01',
    group: 'impact',
    meta: `${metrics.length} numbers`,
    hit: 'the numbers behind the work',
    text: `${metrics.map((m) => `${m.value} ${m.label}`).join('; ')}.`,
    tags: ['impact', 'result', 'number', 'metric', 'many', 'much', 'count', 'saved', 'faster', 'productivity', 'measure'],
  },
  {
    id: 'REACH-01',
    group: 'contact',
    meta: 'email first',
    hit: 'how to reach me',
    text: `${contact.heading}. ${contact.body} Email ${identity.email}, phone ${identity.phone}, GitHub ${identity.githubHandle}, LinkedIn ${identity.linkedinHandle}.`,
    tags: ['contact', 'reach', 'email', 'mail', 'phone', 'call', 'hire', 'hiring', 'available', 'availability', 'job', 'opportunity', 'open', 'recruiter', 'interview', 'freelance', 'cv', 'resume', 'looking'],
  },
]

/** One chunk per span, then one per bullet: a bullet is the smallest thing
 *  worth retrieving on its own, exactly as a Jira worklog is in the real bot. */
function fromSpans(): Chunk[] {
  const out: Chunk[] = []
  for (const s of spans) {
    const key = KEY[s.id] ?? s.id.slice(0, 5).toUpperCase()
    const current = s.to === 'now'
    out.push({
      id: `${key}-00`,
      group: LANE[s.lane],
      meta: period(s),
      hit: clip(`${s.title}, ${s.org}`),
      text: `${s.title} at ${s.org}, ${s.place}, ${period(s)}.${
        s.stack.length ? ` The stack: ${list(s.stack)}.` : ''
      }`,
      tags: [
        'when', 'long', 'year', 'experience', 'history', 'timeline', 'worked', 'joined',
        ...(current ? ['current', 'now', 'today', 'present'] : ['past', 'before', 'earlier', 'previous']),
        ...(s.lane === 'study' ? ['education', 'degree', 'college', 'university', 'school', 'studied', 'graduate', 'btech'] : []),
      ],
    })
    s.points.forEach((p, i) => {
      out.push({
        id: `${key}-${String(i + 1).padStart(2, '0')}`,
        group: LANE[s.lane],
        meta: s.title.toLowerCase(),
        hit: clip(p),
        // A project bullet is written as part of a description and leans on it
        // — "a Java and SQL backend behind it" needs to say behind what.
        text: s.lane === 'build' ? `${s.title} — ${p}` : p,
      })
    })
  }
  return out
}

function fromStack(): Chunk[] {
  return stack.map((g, i) => ({
    id: `STACK-${String(i + 1).padStart(2, '0')}`,
    group: 'stack',
    meta: `${g.items.length} items`,
    hit: `${g.group.toLowerCase()} — ${clip(g.items.join(', '), 34)}`,
    text: `${LEAD[g.group] ?? `${g.group}:`} ${list(g.items)}.`,
    tags: ['stack', 'tech', 'technology', 'tool', 'use', 'know', 'familiar', 'skill', 'comfortable', 'proficient', g.group],
  }))
}

function fromRecognition(): Chunk[] {
  const out: Chunk[] = recognition.map((r, i) => ({
    id: `AWARD-${String(i + 1).padStart(2, '0')}`,
    group: 'recognition',
    meta: r.year || 'award',
    hit: clip(r.title),
    text: `${r.title}${r.year ? ` (${r.year})` : ''}: ${r.detail}.`,
    tags: ['award', 'won', 'win', 'winner', 'prize', 'recognition', 'recognised', 'publication', 'published', 'paper', 'research', 'achievement', 'proud'],
  }))
  out.push({
    id: 'CERT-01',
    group: 'recognition',
    meta: `${certifications.length} courses`,
    hit: 'certifications I hold',
    text: `Certifications: ${list(certifications)}.`,
    tags: ['certification', 'certificate', 'certified', 'course', 'training', 'learn'],
  })
  return out
}

export const CHUNKS: Chunk[] = [
  ...PROFILE,
  ...TOTAL,
  ...AI,
  ...NUMBERS,
  ...fromSpans(),
  ...fromStack(),
  ...fromRecognition(),
]
