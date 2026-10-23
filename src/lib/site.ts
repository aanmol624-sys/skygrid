// Shared helpers and site-wide settings.

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix an internal path with the GitHub Pages base path. */
export const u = (path: string) => `${BASE}/${path.replace(/^\//, '')}`;

export const LAUNCH_DATE = '2030-09-01T00:00:00-07:00';

// ============================================================================
// YOUTUBE_URL — paste the pitch video link between the quotes below.
// Any normal YouTube link works (youtube.com/watch?v=…, youtu.be/…, /shorts/…).
// Leave it empty to show the "Video coming soon" message instead.
// ============================================================================
export const YOUTUBE_URL = 'https://youtu.be/4PArW3fAcjc';

/** Extracts the video ID from any common YouTube link format. */
const youtubeId = (url: string) =>
  url.trim().match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/)?.[1] ?? '';

/** Embed URL derived from YOUTUBE_URL ('' until a valid link is pasted). */
export const PITCH_VIDEO_EMBED_URL = youtubeId(YOUTUBE_URL) ? `https://www.youtube-nocookie.com/embed/${youtubeId(YOUTUBE_URL)}?rel=0` : '';

/** Pitch outline shown under the video. */
export const PITCH_OUTLINE = [
  ['0:00–0:30', 'Hook: what UFV SkyGrid is', 'Armaan'],
  ['0:30–1:40', 'How we got here: from a $100M question to SkyGrid', 'Armaan'],
  ['1:40–3:30', 'What we noticed: the problem, and why the Fraser Valley', 'Armaan'],
  ['3:30–4:15', 'Our idea: four connected components', 'Armaan'],
  ['4:15–5:05', 'How it solves the problem: one farm problem, end to end', 'Armaan'],
  ['5:05–6:15', 'How it creates value and earns beyond the $100M', 'Armaan'],
  ['6:15–8:25', 'Making the $100M work hardest: budget, 14 deliverables, charter', 'Armaan'],
  ['8:25–9:40', 'Stakeholders and the hiring plan', 'Armaan'],
  ['9:40–11:20', 'WBS, the five gates and kill points, Gantt to September 1, 2030', 'Armaan'],
  ['11:20–12:40', 'Risk register, cost and change control', 'Armaan'],
  ['12:40–13:30', 'Competitive research: why SkyGrid isn’t just another drone lab', 'Armaan'],
  ['13:30–14:10', 'KPIs: how we’ll know it worked', 'Armaan'],
  ['14:10–15:00', 'The team and the ask: “Sharks, who’s in?”', 'Armaan'],
] as const;

export const PROPOSED_NOTE =
  'PROPOSED / TEAM DESIGN: Numbers such as the three-site target, eight-partner target, five-program target, budget allocation, change thresholds, risk scores, and KPI targets are SkyGrid planning choices created by the team. They are not presented as commitments made by UFV, government, regulators, or external partners.';

export const TEAM_ANALYSIS_NOTE =
  'TEAM ANALYSIS: a qualitative model developed by the assignment team, not a published ranking or external dataset.';

export const PILLAR = {
  learn: { label: 'Learn', var: 'var(--learn)' },
  innovate: { label: 'Innovate', var: 'var(--innovate)' },
  impact: { label: 'Impact', var: 'var(--impact)' },
  safe: { label: 'Safe & Sustain', var: 'var(--muted)' },
} as const;

export type Pillar = keyof typeof PILLAR;

export const NAV = [
  { label: 'The Product', href: 'product' },
  {
    label: 'The Plan',
    children: [
      { label: 'Charter', href: 'plan/charter', icon: 'doc', desc: 'Written as an authorization document rather than another marketing paragraph.' },
      { label: 'Stakeholders', href: 'plan/stakeholders', icon: 'people', desc: 'Who can authorize SkyGrid, who can stop it, who must deliver it, who bears risk, and who receives the benefits?' },
      { label: 'WBS', href: 'plan/wbs', icon: 'tree', desc: 'Deliverable-oriented breakdown, 1.1–1.9.' },
      { label: 'Delivery & Gates', href: 'plan/delivery', icon: 'gate', desc: 'Each major investment stage must earn permission to proceed.' },
      { label: 'Schedule / Gantt', href: 'plan/schedule', icon: 'gantt', desc: 'Sequence, duration, dependencies, milestones, and accountability.' },
    ],
  },
  {
    label: 'The Investment',
    children: [
      { label: '$100M Budget', href: 'investment', icon: 'coin', desc: 'The $100M is an authorization ceiling, not a spending target.' },
      { label: 'Cost Control', href: 'investment#cost-control', icon: 'ladder', desc: 'Funding is progressively released through stage gates instead of fully committed at project start.' },
      { label: 'Change Control', href: 'investment/change-control', icon: 'lock', desc: 'Change is expected; uncontrolled change is not.' },
      { label: 'Sustainability', href: 'investment#sustainability', icon: 'cycle', desc: 'Essential safety, academic, maintenance, or staffing obligations are not made dependent on speculative commercial revenue.' },
    ],
  },
  { label: 'Risk & Safety', href: 'risk' },
  {
    label: 'Why SkyGrid',
    children: [
      { label: 'Research & Regulation', href: 'why/research', icon: 'search', desc: 'The convergence of UFV’s educational priorities, the Fraser Valley’s industrial structure, and a changing Canadian autonomous-aviation environment.' },
      { label: 'Competitors', href: 'why/competitors', icon: 'compass', desc: 'The proposed advantage is the configuration, not exclusive technology.' },
      { label: 'Success & KPIs', href: 'why/success', icon: 'target', desc: 'Finishing SkyGrid is not the same as succeeding with SkyGrid.' },
    ],
  },
  { label: 'Team', href: 'team' },
] as const;

export const CHAPTERS = [
  { id: 'hook', label: 'The Hook', pillar: 'innovate' },
  { id: 'why-now', label: 'Why Now', pillar: 'impact' },
  { id: 'idea', label: 'The Idea', pillar: 'innovate' },
  { id: 'loop', label: 'How It Works', pillar: 'learn' },
  { id: 'plan', label: 'The Plan', pillar: 'innovate' },
  { id: 'money', label: 'The Money', pillar: 'impact' },
  { id: 'risk', label: 'What Could Go Wrong', pillar: 'impact' },
  { id: 'different', label: 'Why Different', pillar: 'innovate' },
  { id: 'kpis', label: 'How We’ll Know', pillar: 'learn' },
  { id: 'ask', label: 'The Ask', pillar: 'impact' },
] as const;
