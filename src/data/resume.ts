/** Every value on this page comes from here. One source of truth. */

import type { MarkKey } from './marks'

export const identity = {
  name: 'Chirag',
  role: 'Backend Engineer',
  location: 'Bangalore, India',
  email: 'chinim591@gmail.com',
  phone: '+91 86308 75515',
  github: 'https://github.com/chiragnimesh',
  githubHandle: 'chiragnimesh',
  linkedin: 'https://www.linkedin.com/in/chirag-ab16791a7',
  linkedinHandle: 'chirag-ab16791a7',
}

export const hero = {
  standfirst: 'Senior software engineer at Capgemini, building for Comcast.',
  lead: 'I own the microservices that carry a purchase from cart to confirmed buy. Then I built the retrieval system that answers questions about how the whole organisation spends its time.',
  since: 'Shipping since Feb 2024',
}

/** The line at the top of the CV. It says in one breath what the rest of the
 *  page takes six sections to say, which is exactly what a question box needs. */
export const summary = {
  title: 'Software Engineer',
  text: 'Software engineer working in scalable backend and full-stack development: Java, Spring Boot, Quarkus and React, with microservices, REST APIs and GraphQL federation. Hands-on with AI too — RAG pipelines on Azure OpenAI and Qdrant — and a track record of production-ready systems delivered in an Agile team.',
}

/** The ruled instrument strip under the hero. Values are measured, not rounded up. */
export const metrics = [
  { value: '10+', label: 'microservices owned in production', tone: 'signal' },
  { value: '50,000+', label: 'Jira records indexed for retrieval', tone: 'ember' },
  { value: '60–70%', label: 'less time managers spend on lookups', tone: 'ember' },
  { value: '3+', label: 'service domains moved off the monolith', tone: 'signal' },
] as const

export const about = {
  heading: 'What I actually do',
  body: [
    'Most of my work lives behind an API boundary. A request arrives at a federated GraphQL gateway, fans out across ten or more Spring Boot and Quarkus services, touches a cart, prices an offer, reserves entitlement, and comes back as a completed purchase. My job is making that path fast, observable, and hard to break.',
    'The other half is newer. I had no Python and no AI background when I started the internal chatbot. I learned retrieval-augmented generation by building one, shipped it, and it won an award inside Capgemini. It now answers questions that used to mean opening a dashboard per person.',
  ],
  facts: [
    { k: 'Currently', v: 'Backend Developer, Capgemini — client: Comcast' },
    { k: 'Based in', v: 'Bangalore, India' },
    { k: 'Depth in', v: 'Java, Spring Boot, Quarkus, GraphQL federation' },
    { k: 'Also fluent', v: 'React, RAG pipelines, vector search' },
  ],
}

/* ── Flagship: the internal RAG chatbot ──────────────────────────────── */

export const chatbot = {
  kicker: 'Awarded at Capgemini',
  heading: 'A chatbot that reads 50,000 Jira records so nobody has to',
  body: [
    'Managers were opening one dashboard per person to answer a single question: where is the effort going? I replaced that with a question box.',
    'A nightly job pulls Jira issues, worklogs and utilisation records, embeds them with Azure OpenAI, and writes the vectors into Qdrant. A question gets embedded the same way, the nearest records come back by cosine similarity, and the model answers using only those records as context.',
  ],
  pipeline: [
    { step: 'Sync', detail: 'Nightly pull of Jira issues, worklogs and capacity records' },
    { step: 'Embed', detail: 'Azure OpenAI embeddings, chunked per record' },
    { step: 'Store', detail: 'Qdrant collection, cosine distance, payload-filtered' },
    { step: 'Retrieve', detail: 'Top-k nearest neighbours for the embedded question' },
    { step: 'Answer', detail: 'Grounded generation over the retrieved records only' },
  ],
  demoNote:
    'A reconstruction of the retrieval step. The production bot runs on internal Jira data, so the records here are stand-ins. A typed question searches my résumé instead — ranked by TF-IDF in your browser, answered only from the records that come back.',
}

/** Size of the reconstructed corpus, and how many neighbours one question pulls
 *  back. The scene draws these and the panel quotes them, so they live here. */
export const POINTS = 1800
export const TOP_K = 26

/** Clusters in the reconstructed embedding space, and what lives in each. */
export const clusters = [
  { id: 0, name: 'worklogs', tint: '#FFB454', centre: [-1.85, 0.35, -0.55] },
  { id: 1, name: 'utilisation', tint: '#38E0D0', centre: [1.95, 1.05, 0.6] },
  { id: 2, name: 'sprint scope', tint: '#8B9DFF', centre: [0.2, -1.8, 1.05] },
  { id: 3, name: 'defects', tint: '#FF7A7A', centre: [-0.75, 1.9, 1.95] },
] as const

export const queries = [
  {
    q: 'Where did the cart squad log effort last sprint?',
    cluster: 0,
    hits: [
      { id: 'CART-2841', kind: 'worklog', meta: '18h 30m', text: 'offer-application refactor' },
      { id: 'CART-2799', kind: 'worklog', meta: '12h 00m', text: 'cart merge race condition' },
      { id: 'CART-2856', kind: 'worklog', meta: '9h 15m', text: 'federation schema review' },
    ],
    answer:
      'The cart squad logged 39h 45m across three items. Most of it went to the offer-application refactor, with the rest split between a cart merge race condition and a schema review.',
  },
  {
    q: 'Who is running under 70% utilisation this month?',
    cluster: 1,
    hits: [
      { id: 'UTL-0442', kind: 'capacity', meta: '61%', text: '90h booked of 148h' },
      { id: 'UTL-0455', kind: 'capacity', meta: '66%', text: '100h booked of 152h' },
      { id: 'UTL-0431', kind: 'capacity', meta: '68%', text: '109h booked of 160h' },
    ],
    answer:
      'Three people are below the 70% line, between 61% and 68%. All three have capacity booked against a single epic, which is the usual sign that work has not been distributed yet.',
  },
  {
    q: 'What slipped out of sprint 41?',
    cluster: 2,
    hits: [
      { id: 'BUY-1180', kind: 'story', meta: '8 pts', text: 'carried into sprint 42' },
      { id: 'OFR-0913', kind: 'story', meta: '5 pts', text: 'carried into sprint 42' },
      { id: 'BUY-1174', kind: 'story', meta: '3 pts', text: 'closed late, day 9' },
    ],
    answer:
      'Thirteen points carried into sprint 42, from both the buy and offer domains. One three-point story closed on day nine rather than slipping, so the real carry-over is two items.',
  },
  {
    q: 'Any open defects on the purchase flow?',
    cluster: 3,
    hits: [
      { id: 'DEF-3307', kind: 'defect', meta: 'major', text: 'duplicate charge on retry' },
      { id: 'DEF-3299', kind: 'defect', meta: 'minor', text: 'stale price after offer expiry' },
      { id: 'DEF-3312', kind: 'defect', meta: 'minor', text: 'empty cart returns 500' },
    ],
    answer:
      'Three defects are open. One is major: a retry can produce a duplicate charge. The other two are minor and both sit at the boundary between pricing and cart state.',
  },
] as const

/* ── Career as a trace waterfall: real spans on one shared time axis ──── */

export const axis = { from: [2019, 8] as const, to: [2026, 9] as const }

export type Span = {
  id: string
  lane: 'work' | 'build' | 'study'
  title: string
  org: string
  place: string
  from: readonly [number, number]
  to: readonly [number, number] | 'now'
  tone: 'signal' | 'ember' | 'quiet'
  stack: string[]
  points: string[]
}

export const spans: Span[] = [
  {
    id: 'comcast',
    lane: 'work',
    title: 'Backend Developer',
    org: 'Capgemini — client: Comcast',
    place: 'Bangalore',
    from: [2024, 10],
    to: 'now',
    tone: 'signal',
    stack: ['Spring Boot', 'Quarkus', 'GraphQL', 'Apollo Federation', 'Azure OpenAI', 'Qdrant'],
    points: [
      'Own and maintain 10+ microservices covering the end-to-end entertainment content purchase flow: cart management, offer application, and the final buy transaction.',
      'Designed GraphQL endpoints behind Apollo Federation so clients select exactly the fields they need, cutting payload size and removing per-client endpoint work.',
      'Migrated legacy monolithic APIs into microservices across 3+ service domains, so each domain deploys on its own schedule.',
      'Built the internal AI chatbot on RAG, Azure OpenAI and Qdrant with no prior Python or AI experience, using GitHub Copilot to move quickly. It queries 50,000+ Jira records, synced daily, and surfaces per-employee effort and utilisation metrics on demand.',
      'The chatbot replaced per-person dashboard lookups for managers across the organisation, cutting that work by 60–70% and putting org-wide visibility in one place.',
    ],
  },
  {
    id: 'capgemini-fs',
    lane: 'work',
    title: 'Full Stack Developer',
    org: 'Capgemini',
    place: 'Bangalore',
    from: [2024, 2],
    to: [2024, 10],
    tone: 'signal',
    stack: ['React.js', 'Spring Boot', 'GraphQL', 'Hibernate', 'Stream API'],
    points: [
      'Built features end to end: responsive React interfaces on the front, Spring Boot REST APIs behind them.',
      'Integrated GraphQL with Apollo Federation across distributed services for unified data access.',
      'Worked in Hibernate for ORM-based persistence and the Java Stream API for functional data processing.',
    ],
  },
  {
    id: 'admissions',
    lane: 'build',
    title: 'Online Admission Management System',
    org: 'Full-stack project',
    place: 'Self-directed',
    from: [2024, 2],
    to: [2024, 7],
    tone: 'ember',
    stack: ['Java', 'Spring Boot', 'React.js', 'SQL'],
    points: [
      'A React student portal for submitting applications, uploading documents, and tracking status in real time.',
      'A Java and SQL backend behind it, plus an admin dashboard for reviewing applications, managing users, and pulling reports.',
    ],
  },
  {
    id: 'anpr',
    lane: 'build',
    title: 'Face & Number Plate Recognition for Car Parking',
    org: 'Published at IEEE Conference',
    place: 'KIET',
    from: [2022, 9],
    to: [2023, 4],
    tone: 'ember',
    stack: ['MATLAB', 'Image Processing'],
    points: [
      'Automated parking detection from face and number-plate recognition, coordinated with hydraulic lift management.',
      'Written up and published at an IEEE conference in 2023.',
    ],
  },
  {
    id: 'kiet',
    lane: 'study',
    title: 'B.Tech, Electronics & Communication Engineering',
    org: 'KIET Group of Institutions',
    place: 'Ghaziabad',
    from: [2019, 8],
    to: [2023, 6],
    tone: 'quiet',
    stack: [],
    points: ['Four years of ECE, which is where the signal-processing work came from.'],
  },
]

/* ── Total experience, derived from the spans above ───────────────────── */

/** Month names for every date on the page, so only one list of them exists. */
export const MONTH = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

export const monthYear = (d: readonly [number, number]) => `${MONTH[d[1]]} ${d[0]}`

const asMonths = (d: readonly [number, number]) => d[0] * 12 + d[1]

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`

/**
 * How long I have been paid to write software: from the first month of the
 * earliest `work` span to this one. Derived rather than typed, so the figure
 * on the page is right every month without anyone editing it.
 */
export const experience = (() => {
  const from = spans
    .filter((s) => s.lane === 'work')
    .map((s) => s.from)
    .reduce((a, b) => (asMonths(b) < asMonths(a) ? b : a))

  const now = new Date()
  const months = (now.getFullYear() - from[0]) * 12 + (now.getMonth() + 1 - from[1])
  const years = Math.floor(months / 12)
  const rest = months % 12
  // How anyone actually says it out loud: the nearest whole year, with the
  // approach or the overshoot named rather than rounded away.
  const near = Math.max(1, Math.round(months / 12))
  const round = plural(near, 'year')
  const rounded =
    rest === 0 ? round : months < near * 12 ? `coming up on ${round}` : `${round} and counting`

  return {
    from,
    months,
    /** Exact, for anywhere the rounded figure would be doing too much work. */
    exact: rest ? `${plural(years, 'year')} ${plural(rest, 'month')}` : plural(years, 'year'),
    /** Rounded, phrased honestly about which side of the year it sits on. */
    rounded,
    /** For the fact list, where it has to stand on its own. */
    label: `${rounded.charAt(0).toUpperCase()}${rounded.slice(1)}, from ${monthYear(from)}`,
  }
})()

/** `about.facts` with the derived total in front. The page reads this list, so
 *  the number of years is never typed anywhere by hand. */
export const facts = [{ k: 'Experience', v: experience.label }, ...about.facts]

/* ── Hero mesh: the shape of the purchase flow ────────────────────────── */

/** A node is one moving part of the flow, named by what it runs on. */
export type Node = {
  id: string
  pos: [number, number, number]
  kind: 'gateway' | 'service' | 'store' | 'ai'
  label: string
  mark: MarkKey
}

export const meshNodes: Node[] = [
  { id: 'graphql-gateway', pos: [0.9, 0.2, 0.7], kind: 'gateway', label: 'GraphQL', mark: 'graphql' },
  { id: 'cart-service', pos: [-1.9, 1.6, -0.4], kind: 'service', label: 'Spring Boot', mark: 'springboot' },
  { id: 'offer-service', pos: [-1.1, -1.7, 0.1], kind: 'service', label: 'Java', mark: 'java' },
  { id: 'buy-service', pos: [2.7, -0.2, -0.5], kind: 'service', label: 'Quarkus', mark: 'quarkus' },
  { id: 'catalog-service', pos: [-2.6, -0.6, -2.0], kind: 'service', label: 'Hibernate', mark: 'hibernate' },
  { id: 'pricing-service', pos: [1.2, -2.6, 0.6], kind: 'service', label: 'Apollo Federation', mark: 'apollo' },
  { id: 'entitlement-svc', pos: [3.5, -1.8, 0.9], kind: 'service', label: 'REST + Swagger', mark: 'swagger' },
  { id: 'payment-service', pos: [4.5, 1.7, -0.3], kind: 'service', label: 'Git', mark: 'git' },
  { id: 'session-service', pos: [-0.2, 2.7, -1.5], kind: 'service', label: 'React', mark: 'react' },
  { id: 'postgres', pos: [1.9, 2.9, 1.0], kind: 'store', label: 'PostgreSQL', mark: 'postgres' },
  { id: 'qdrant', pos: [4.2, 0.9, 1.8], kind: 'store', label: 'Qdrant', mark: 'qdrant' },
  { id: 'jira-rag-bot', pos: [3.0, 2.1, 2.5], kind: 'ai', label: 'Azure OpenAI', mark: 'openai' },
]

/** Index pairs into meshNodes. Traffic runs along these. */
export const meshEdges: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 8], [1, 4], [1, 2],
  [2, 5], [3, 5], [3, 6], [3, 7], [6, 9], [5, 9],
  [8, 1], [11, 10], [11, 0], [10, 9], [4, 2], [7, 6],
]

/* ── Stack ────────────────────────────────────────────────────────────── */

export const stack = [
  { group: 'Languages', items: ['Java', 'JavaScript', 'SQL', 'HTML', 'CSS'] },
  {
    group: 'Backend',
    items: ['Spring Boot', 'Quarkus', 'Hibernate', 'GraphQL', 'Apollo Federation', 'Stream API', 'REST API design'],
  },
  { group: 'Frontend', items: ['React.js'] },
  {
    group: 'AI & retrieval',
    items: ['RAG', 'Azure OpenAI', 'LLMs', 'Embeddings', 'Qdrant', 'GitHub Copilot'],
  },
  { group: 'Data', items: ['MySQL', 'PostgreSQL', 'Qdrant'] },
  {
    group: 'Tooling',
    items: ['Git', 'Maven', 'Postman', 'IntelliJ IDEA', 'SonarQube', 'Swagger UI', 'Bruno'],
  },
  { group: 'Ways of working', items: ['Agile', 'Scrum', 'Microservices'] },
]

/* ── Recognition ──────────────────────────────────────────────────────── */

export const recognition = [
  {
    title: 'IEEE research publication',
    detail: 'Face & Number Plate Recognition for Autonomous Car Parking',
    year: '2023',
    tone: 'ember',
  },
  {
    title: 'Innovative Idea Winner',
    detail: 'Self-rechargeable car concept',
    year: '',
    tone: 'signal',
  },
  {
    title: 'Award for the internal AI chatbot',
    detail: 'Recognised at Capgemini for the RAG assistant over Jira data',
    year: '',
    tone: 'ember',
  },
]

export const certifications = [
  'Cisco Cyber Security Essentials',
  'AWS Academy — Artificial Intelligence',
  'Coursera — Java',
]

export const contact = {
  heading: 'Open to backend and AI engineering work',
  body: 'The fastest way to reach me is email. I read LinkedIn too, just more slowly.',
}
