// Site-wide search (Ctrl+K / "/" / any [data-search] link): pages, sections and APA references.
// The page/section index is generated at build time (src/integrations/search-index.mjs) and
// only downloaded the first time search is opened.
import { ICONS } from '../lib/icons';

type Entry = { type: 'page' | 'section'; path: string; page: string; heading: string; anchor: string; text: string };
type Ref = { id: string; cite: string; cat: string; apa: string; url: string | null };
type Hit = { group: 'Pages' | 'Sections' | 'References'; href: string; title: string; meta: string; snippet: string; icon: string; color: string; score: number };

const base = (document.documentElement.dataset.base || '/').replace(/\/?$/, '/');
const dialog = document.getElementById('search-modal') as HTMLDialogElement | null;
const input = document.getElementById('search-input') as HTMLInputElement | null;
const results = document.getElementById('search-results');
const refs: Ref[] = JSON.parse(document.getElementById('ref-data')?.textContent || '[]');

const LIMITS = { Pages: 5, Sections: 8, References: 6 };
// Short menu name (also searchable, so "team" finds the Team page), icon and colour for each page.
const PAGES: Record<string, [label: string, icon: string, color: string]> = {
  '': ['Home', 'play', 'var(--impact)'], product: ['The Product', 'drone', 'var(--innovate)'], team: ['Team', 'people', 'var(--learn)'],
  'plan/charter': ['Charter', 'doc', 'var(--innovate)'], 'plan/stakeholders': ['Stakeholders', 'people', 'var(--innovate)'], 'plan/wbs': ['WBS', 'tree', 'var(--innovate)'],
  'plan/delivery': ['Delivery & Gates', 'gate', 'var(--innovate)'], 'plan/schedule': ['Schedule / Gantt', 'gantt', 'var(--innovate)'], investment: ['$100M Budget', 'coin', 'var(--impact)'],
  'investment/change-control': ['Change Control', 'lock', 'var(--impact)'], risk: ['Risk & Safety', 'alert', 'var(--danger)'], 'why/research': ['Research & Regulation', 'search', 'var(--learn)'],
  'why/competitors': ['Competitors', 'compass', 'var(--learn)'], 'why/success': ['Success & KPIs', 'target', 'var(--learn)'], evidence: ['Evidence (references)', 'doc', 'var(--muted)'], 'investor-room': ['Investor Room', 'check', 'var(--impact)'],
};
const pageMeta = (path: string) => PAGES[path.replace(/\/$/, '')] ?? ['', 'doc', 'var(--muted)'];

let index: Entry[] | null = null;
let loading: Promise<void> | null = null;
let hits: Hit[] = [];
let active = 0;

// Matching ignores case, accents, colons and apostrophes, so "stolo" finds "Stó:lō" and "isnt" finds "isn’t".
// `map[k]` is the position in the original text of normalised character k, so highlights land on the right letters.
const IGNORED = /[:'’‘̀-ͯ]/;
function normMap(s: string) {
  let n = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    for (const c of s[i].normalize('NFD')) {
      if (IGNORED.test(c)) continue;
      n += c.toLowerCase();
      map.push(i);
    }
  }
  return { n, map };
}
const norm = (s: string) => normMap(s).n;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const svg = (name: string) => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name] ?? ICONS.doc}"/></svg>`;

/** Wraps every query term in <mark>. Works on the original text so accents and case are kept. */
function highlight(text: string, terms: string[]) {
  const { n, map } = normMap(text);
  const marks = new Array(text.length).fill(false);
  terms.forEach((t) => {
    for (let i = n.indexOf(t); i !== -1; i = n.indexOf(t, i + 1)) for (let k = map[i]; k <= map[i + t.length - 1]; k++) marks[k] = true;
  });
  let out = '', open = false;
  for (let i = 0; i < text.length; i++) {
    if (marks[i] !== open) { out += marks[i] ? '<mark>' : '</mark>'; open = marks[i]; }
    out += esc(text[i]);
  }
  return open ? `${out}</mark>` : out;
}

/** A short window of text around the first matching term. */
function snippet(text: string, terms: string[]) {
  const { n, map } = normMap(text);
  const first = Math.min(...terms.map((t) => n.indexOf(t)).filter((i) => i >= 0));
  const at = Number.isFinite(first) ? map[first] : first;
  if (!Number.isFinite(at)) return highlight(text.slice(0, 140), terms) + (text.length > 140 ? '…' : '');
  const start = Math.max(0, text.lastIndexOf(' ', Math.max(0, at - 50)));
  const end = Math.min(text.length, at + 120);
  return (start > 0 ? '…' : '') + highlight(text.slice(start, end).trim(), terms) + (end < text.length ? '…' : '');
}

/** Every term must appear somewhere; title matches outrank body-text matches. */
function score(fields: { text: string; weight: number }[], terms: string[]) {
  const normed = fields.map((f) => ({ n: norm(f.text), w: f.weight }));
  let total = 0;
  for (const t of terms) {
    let best = 0;
    for (const f of normed) {
      const i = f.n.indexOf(t);
      if (i === -1) continue;
      const wordStart = i === 0 || /[^a-z0-9]/.test(f.n[i - 1]);
      best = Math.max(best, f.w * (wordStart ? 1.5 : 1));
    }
    if (!best) return 0;
    total += best;
  }
  return total;
}

function pageHref(e: Entry) { return `${base}${e.path}${e.anchor ? `#${e.anchor}` : ''}`; }

function search(q: string): Hit[] {
  const terms = norm(q).split(/\s+/).filter((t) => t.length > 1 || /\d/.test(t));
  const entries = index ?? [];
  if (!terms.length) {
    return entries.filter((e) => e.type === 'page').map((e) => {
      const [label, icon, color] = pageMeta(e.path);
      return { group: 'Pages', href: pageHref(e), title: esc(label || e.heading), meta: label ? esc(e.heading) : '', snippet: '', icon, color, score: 0 };
    });
  }
  const ranked = entries
    .map((e) => {
      const label = pageMeta(e.path)[0];
      const fields = e.type === 'page'
        ? [{ text: label, weight: 12 }, { text: e.heading, weight: 10 }, { text: e.text, weight: 0.5 }]
        : [{ text: e.heading, weight: 10 }, { text: `${label} ${e.page}`, weight: 3 }, { text: e.text, weight: 1 }];
      return { e, label, s: score(fields, terms) };
    })
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);
  const out: Hit[] = [];
  for (const { e, label, s } of ranked) {
    const group = e.type === 'page' ? 'Pages' : 'Sections';
    if (out.filter((h) => h.group === group).length >= LIMITS[group]) continue;
    const [, icon, color] = pageMeta(e.path);
    out.push(e.type === 'page'
      ? { group, href: pageHref(e), title: highlight(label || e.heading, terms), meta: label ? highlight(e.heading, terms) : '', snippet: snippet(e.text, terms), icon, color, score: s }
      : { group, href: pageHref(e), title: highlight(e.heading, terms), meta: esc(label || e.page), snippet: snippet(e.text, terms), icon, color, score: s });
  }
  refs
    .map((r) => ({ r, s: score([{ text: r.cite, weight: 6 }, { text: r.apa, weight: 3 }, { text: r.url ?? '', weight: 1 }], terms) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, LIMITS.References)
    .forEach(({ r, s }) => out.push({ group: 'References', href: `${base}evidence#ref-${r.id}`, title: highlight(r.cite, terms), meta: esc(r.cat), snippet: highlight(r.apa, terms), icon: 'doc', color: 'var(--innovate)', score: s }));
  // The group holding the single best match comes first, so Enter opens the best result.
  const best: Record<string, number> = {};
  out.forEach((h) => { best[h.group] = Math.max(best[h.group] ?? 0, h.score); });
  const order = ['Pages', 'Sections', 'References'];
  return out.sort((a, b) => (best[b.group] - best[a.group]) || (order.indexOf(a.group) - order.indexOf(b.group)) || (b.score - a.score));
}

function render() {
  if (!results || !input) return;
  if (!index) { results.innerHTML = `<p class="p-6 text-center text-sm text-muted">${loading ? 'Loading search…' : 'Search is unavailable right now.'}</p>`; return; }
  hits = search(input.value);
  active = Math.min(active, Math.max(0, hits.length - 1));
  if (!hits.length) {
    results.innerHTML = `<div class="p-6 text-center"><p class="font-semibold">No results for “${esc(input.value.trim())}”</p><p class="text-sm text-muted mt-1">Try a single keyword such as <em>charter</em>, <em>gate</em>, <em>budget</em> or an author’s name.</p></div>`;
    input.removeAttribute('aria-activedescendant');
    return;
  }
  let html = '', group = '';
  hits.forEach((h, i) => {
    if (h.group !== group) {
      group = h.group;
      html += `<p class="search-group" role="presentation">${input.value.trim() ? group : 'Jump to a page'}</p>`;
    }
    html += `<a href="${h.href}" id="search-hit-${i}" class="search-hit" role="option" aria-selected="${i === active}" data-i="${i}">
      <span class="search-hit-icon" style="--c:${h.color}">${svg(h.icon)}</span>
      <span class="min-w-0 flex-1"><span class="block font-semibold text-sm leading-snug">${h.title}</span>${h.meta ? `<span class="block text-[.7rem] text-muted mono mt-0.5">${h.meta}</span>` : ''}${h.snippet ? `<span class="text-xs text-muted mt-1 leading-relaxed line-clamp-2">${h.snippet}</span>` : ''}</span>
    </a>`;
  });
  results.innerHTML = html;
  input.setAttribute('aria-activedescendant', `search-hit-${active}`);
}

function setActive(i: number) {
  if (!hits.length || !results) return;
  active = (i + hits.length) % hits.length;
  results.querySelectorAll('.search-hit').forEach((el, k) => el.setAttribute('aria-selected', String(k === active)));
  const el = document.getElementById(`search-hit-${active}`);
  el?.scrollIntoView({ block: 'nearest' });
  input?.setAttribute('aria-activedescendant', `search-hit-${active}`);
}

/** Same page: close and scroll to the section. Other page: navigate. */
function go(href: string) {
  const url = new URL(href, location.href);
  if (url.pathname.replace(/\/?$/, '/') === location.pathname.replace(/\/?$/, '/')) {
    dialog?.close();
    const target = url.hash ? document.getElementById(decodeURIComponent(url.hash.slice(1))) : null;
    history.replaceState(null, '', url.hash || url.pathname);
    const lenis = (window as any).__lenis;
    if (lenis) lenis.scrollTo(target ?? 0, { offset: -88 });
    else if (target) target.scrollIntoView({ behavior: 'smooth' });
    else scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    location.href = href;
  }
}

function load() {
  loading ??= fetch(`${base}search-index.json`)
    .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then((data: Entry[]) => { index = data; })
    .catch(() => { index = null; loading = null; })
    .finally(render);
  return loading;
}

export function openSearch(prefill = '') {
  if (!dialog || !input) return;
  if (!dialog.open) dialog.showModal();
  if (prefill) input.value = prefill;
  input.select();
  active = 0;
  render();
  if (!index) load();
}

if (dialog && input && results) {
  input.addEventListener('input', () => { active = 0; render(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); go(hits[active].href); }
  });
  results.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('.search-hit');
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    go(a.href);
  });
  results.addEventListener('mousemove', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLElement>('.search-hit');
    if (a && +a.dataset.i! !== active) setActive(+a.dataset.i!);
  });

  // Search buttons are real links to the reference search, so they still work if this script fails.
  document.addEventListener('click', (e) => {
    const trigger = (e.target as HTMLElement).closest<HTMLElement>('[data-search]');
    if (!trigger || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    openSearch();
  });
  document.addEventListener('keydown', (e) => {
    const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]');
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); openSearch(); }
    else if (e.key === '/' && !typing && !document.querySelector('dialog[open]')) { e.preventDefault(); openSearch(); }
  });
  // Warm the index when the pointer heads for a search button.
  document.querySelectorAll('[data-search]').forEach((b) => b.addEventListener('pointerenter', () => load(), { once: true }));
}
