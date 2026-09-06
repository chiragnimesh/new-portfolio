/**
 * A small retrieval engine over the résumé, running in the browser.
 *
 * The production bot embeds with Azure OpenAI and searches Qdrant; neither
 * belongs in a static page, and a page that asked for an API key to answer a
 * question would be worse than one that could not answer at all. So this is the
 * same shape at a smaller scale: TF-IDF vectors, cosine similarity, top-k, and
 * an answer assembled only out of what came back.
 */

import { CHUNKS, type Chunk } from '../data/knowledge'

/** Words that carry no signal in a corpus this small. */
const STOP = new Set(
  'a about an and any are as at be been but by can could did do does for from had has have he her him his how i if in into is it its me my of on or our she should so than that the their them then there these they this to too us was we were what when where which who whom why will with would you your yours'.split(
    ' ',
  ),
)

/** Enough of a stem that "services" and "service" are the same term. */
function stem(word: string) {
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

function tokenize(text: string) {
  const out: string[] = []
  for (const raw of text.toLowerCase().split(/[^a-z0-9+#]+/)) {
    if (raw.length < 2 || STOP.has(raw)) continue
    const t = stem(raw)
    if (t.length < 2 || STOP.has(t)) continue
    out.push(t)
  }
  return out
}

/** A question and a résumé rarely name the same thing the same way. Keys are
 *  stemmed, because expansion happens after tokenising. */
const SYNONYM: Record<string, string[]> = {
  ai: ['rag', 'llm', 'openai', 'embedding', 'chatbot', 'retrieval'],
  ml: ['ai', 'rag', 'llm', 'embedding', 'model'],
  llm: ['openai', 'model', 'generation', 'azure'],
  bot: ['chatbot', 'rag', 'jira', 'assistant'],
  chatbot: ['rag', 'jira', 'qdrant', 'openai'],
  api: ['rest', 'graphql', 'endpoint', 'swagger', 'service'],
  endpoint: ['api', 'rest', 'graphql'],
  database: ['sql', 'postgresql', 'mysql', 'qdrant', 'hibernate', 'store'],
  db: ['sql', 'postgresql', 'mysql', 'qdrant'],
  sql: ['postgresql', 'mysql', 'hibernate'],
  microservice: ['service', 'spring', 'quarkus', 'domain', 'monolith'],
  monolith: ['migrated', 'microservice', 'domain'],
  backend: ['spring', 'quarkus', 'java', 'service', 'api'],
  frontend: ['react', 'javascript', 'css', 'html', 'interface'],
  ui: ['react', 'frontend', 'interface'],
  cloud: ['azure', 'aws'],
  vector: ['qdrant', 'embedding', 'similarity', 'cosine'],
  search: ['retrieval', 'vector', 'similarity', 'qdrant'],
  experience: ['capgemini', 'comcast', 'developer', 'role', 'year', 'total'],
  year: ['experience', 'total', 'since', 'long'],
  total: ['experience', 'year', 'overall'],
  long: ['experience', 'year', 'since'],
  fresher: ['experience', 'year', 'junior', 'level'],
  senior: ['experience', 'year', 'level', 'seniority'],
  summary: ['profile', 'overview', 'engineer', 'software'],
  education: ['btech', 'kiet', 'engineering', 'electronic', 'ghaziabad'],
  degree: ['btech', 'engineering', 'kiet'],
  college: ['kiet', 'btech', 'ghaziabad'],
  university: ['kiet', 'btech'],
  school: ['kiet', 'btech'],
  hire: ['contact', 'email', 'open', 'available'],
  test: ['sonarqube', 'postman', 'bruno', 'swagger'],
  project: ['admission', 'recognition', 'parking', 'chatbot'],
  team: ['agile', 'scrum', 'squad'],
  client: ['comcast', 'capgemini'],
}

type Doc = { chunk: Chunk; weight: Map<string, number>; norm: number }

/** Built once, at module load: fifty-odd chunks is nothing to index. */
const INDEX = (() => {
  const df = new Map<string, number>()
  const counted = CHUNKS.map((chunk) => {
    const tf = new Map<string, number>()
    const body = `${chunk.text} ${chunk.hit} ${chunk.group} ${(chunk.tags ?? []).join(' ')}`
    for (const t of tokenize(body)) tf.set(t, (tf.get(t) ?? 0) + 1)
    for (const t of tf.keys()) df.set(t, (df.get(t) ?? 0) + 1)
    return { chunk, tf }
  })

  const n = counted.length
  const idf = (t: string) => Math.log((n + 1) / ((df.get(t) ?? 0) + 1)) + 1

  const docs: Doc[] = counted.map(({ chunk, tf }) => {
    const weight = new Map<string, number>()
    let sum = 0
    for (const [t, count] of tf) {
      // Sub-linear: a word used four times in one chunk is not four times the
      // evidence that the chunk is about it.
      const w = (1 + Math.log(count)) * idf(t)
      weight.set(t, w)
      sum += w * w
    }
    return { chunk, weight, norm: Math.sqrt(sum) || 1 }
  })

  return { docs, idf }
})()

export const CORPUS_SIZE = CHUNKS.length

/** An expanded term is a guess about what was meant, so it counts for less. */
const EXPANDED = 0.45

/** Below this the best match is a coincidence of common words, and saying so is
 *  worth more than answering the wrong question confidently. */
const FLOOR = 0.1

export type Hit = { id: string; kind: string; meta: string; text: string }

export type Answer = {
  question: string
  hits: Hit[]
  answer: string
  /** How many chunks cleared the floor. The panel quotes it. */
  matched: number
  grounded: boolean
}

const NOTHING =
  'That is not in the résumé I indexed. Ask me about the purchase-flow services, GraphQL federation, the Jira chatbot, my stack, the projects, my education, or how to reach me.'

/** Share of b's terms that already appear in a. Keeps a stitched answer from
 *  saying the same thing twice in two voices. */
function overlap(a: string, b: string) {
  const seen = new Set(tokenize(a))
  const terms = tokenize(b)
  if (!terms.length) return 1
  let same = 0
  for (const t of terms) if (seen.has(t)) same++
  return same / terms.length
}

/** Grounded the way the real bot is: the answer is the retrieved records,
 *  stitched in rank order. Nothing is invented on top of them. */
function compose(ranked: { doc: Doc; score: number }[]) {
  const parts: string[] = []
  let length = 0

  for (const { doc, score } of ranked) {
    if (parts.length && score < ranked[0].score * 0.62) break
    const text = doc.chunk.text.trim()
    if (parts.some((p) => overlap(p, text) > 0.55)) continue
    parts.push(text)
    length += text.length
    if (parts.length >= 3 || length > 300) break
  }

  return parts.join(' ')
}

export function ask(question: string): Answer {
  const terms = new Map<string, number>()
  for (const t of tokenize(question)) {
    terms.set(t, 1)
    for (const synonym of SYNONYM[t] ?? []) {
      const s = stem(synonym)
      terms.set(s, Math.max(terms.get(s) ?? 0, EXPANDED))
    }
  }

  const query = new Map<string, number>()
  let norm = 0
  for (const [t, boost] of terms) {
    const w = boost * INDEX.idf(t)
    query.set(t, w)
    norm += w * w
  }
  norm = Math.sqrt(norm) || 1

  const ranked = INDEX.docs
    .map((doc) => {
      let dot = 0
      for (const [t, w] of query) dot += w * (doc.weight.get(t) ?? 0)
      return { doc, score: dot / (norm * doc.norm) }
    })
    .filter((r) => r.score > 0.02)
    .sort((a, b) => b.score - a.score)

  const matched = ranked.filter((r) => r.score >= FLOOR)
  if (!matched.length) return { question, hits: [], answer: NOTHING, matched: 0, grounded: false }

  const hits = matched.slice(0, 3).map(({ doc }) => ({
    id: doc.chunk.id,
    kind: doc.chunk.group,
    meta: doc.chunk.meta,
    text: doc.chunk.hit,
  }))

  return { question, hits, answer: compose(matched), matched: matched.length, grounded: true }
}


