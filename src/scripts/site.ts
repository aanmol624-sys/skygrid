// Global client behaviour shared by every page.
import Lenis from 'lenis';
import './search';

type Ref = { id: string; cite: string; cat: string; apa: string; url: string | null };

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const base = (document.documentElement.dataset.base || '/').replace(/\/$/, '');

/* ── Theme toggle ── */
document.querySelectorAll('#theme-toggle, [data-theme-toggle]').forEach((b) => b.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('sg-theme', next); } catch { /* storage unavailable */ }
}));

/* ── Smooth scroll ── */
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ anchors: { offset: -72 }, lerp: 0.12 });
  const raf = (t: number) => { lenis!.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  (window as any).__lenis = lenis;
}

/* ── Nav: glass after scroll + progress bar ── */
const nav = document.getElementById('site-nav');
const fill = document.getElementById('progress-fill');
const onScroll = () => {
  const y = window.scrollY;
  nav?.classList.toggle('scrolled', y > 40);
  const max = document.documentElement.scrollHeight - innerHeight;
  if (fill) fill.style.width = `${max > 0 ? (y / max) * 100 : 0}%`;
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Chapter tick marks on the home progress bar
const placeTicks = () => {
  const ticks = document.querySelectorAll<HTMLElement>('[data-tick]');
  if (!ticks.length) return;
  const max = document.documentElement.scrollHeight - innerHeight;
  ticks.forEach((t) => {
    const ch = document.querySelectorAll<HTMLElement>('[data-chapter]')[Number(t.dataset.tick)];
    if (ch && max > 0) t.style.left = `${Math.min(100, (ch.offsetTop / max) * 100)}%`;
  });
};
addEventListener('load', placeTicks);
addEventListener('resize', placeTicks);

/* ── Mega menus: keyboard / touch support (hover handled in CSS) ── */
// Keep each dropdown inside the viewport (16px margin) at any width or zoom level.
const fitMega = (m: HTMLElement) => {
  const panel = m.querySelector<HTMLElement>('.mega-panel')!;
  const box = m.querySelector<HTMLElement>('.mega-box')!;
  const btn = m.getBoundingClientRect();
  const w = box.offsetWidth;
  const left = btn.left + btn.width / 2 - w / 2;
  const vw = document.documentElement.clientWidth;
  const shift = left < 16 ? 16 - left : left + w > vw - 16 ? vw - 16 - (left + w) : 0;
  panel.style.setProperty('--shift', `${shift}px`);
};
document.querySelectorAll<HTMLElement>('.mega').forEach((m) => {
  const btn = m.querySelector('button')!;
  m.addEventListener('mouseenter', () => fitMega(m));
  m.addEventListener('focusin', () => fitMega(m));
  btn.addEventListener('click', () => fitMega(m));
  btn.addEventListener('click', () => {
    const open = !m.classList.contains('open');
    document.querySelectorAll('.mega.open').forEach((o) => o.classList.remove('open'));
    m.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
  });
});
document.addEventListener('click', (e) => {
  if (!(e.target as HTMLElement).closest('.mega')) document.querySelectorAll('.mega.open').forEach((o) => o.classList.remove('open'));
});

/* ── Mobile menu ── */
const menu = document.getElementById('mobile-menu');
const setMenu = (open: boolean) => {
  menu?.classList.toggle('hidden', !open);
  menu?.classList.toggle('flex', open);
  document.getElementById('menu-open')?.setAttribute('aria-expanded', String(open));
  // lock the page behind the menu; the root element owns the scrollbar, so hide it there too
  document.documentElement.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  // pause smooth scrolling of the page behind the menu; the menu itself scrolls natively (data-lenis-prevent)
  if (open) lenis?.stop(); else lenis?.start();
};
document.getElementById('menu-open')?.addEventListener('click', () => { setMenu(true); document.getElementById('menu-close')?.focus(); });
document.getElementById('menu-close')?.addEventListener('click', () => { setMenu(false); document.getElementById('menu-open')?.focus(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && menu && !menu.classList.contains('hidden')) { setMenu(false); document.getElementById('menu-open')?.focus(); }
});
menu?.querySelectorAll('a, [data-open]').forEach((a) => a.addEventListener('click', () => setMenu(false)));

/* ── Modals (native <dialog>) ── */
document.addEventListener('click', (e) => {
  const opener = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
  if (opener) {
    const d = document.getElementById(opener.dataset.open!) as HTMLDialogElement | null;
    if (d) {
      d.querySelectorAll<HTMLIFrameElement>('iframe[data-src]').forEach((f) => { if (!f.src) f.src = f.dataset.src!; });
      d.showModal();
    }
  }
  const closer = (e.target as HTMLElement).closest<HTMLElement>('dialog [data-close]');
  if (closer) (closer.closest('dialog') as HTMLDialogElement).close();
});
document.querySelectorAll<HTMLDialogElement>('dialog.modal').forEach((d) => {
  d.addEventListener('click', (e) => { if (e.target === d) d.close(); });
  d.addEventListener('close', () => d.querySelectorAll<HTMLIFrameElement>('iframe[data-src]').forEach((f) => f.removeAttribute('src')));
});

/* ── Source panel for CITED chips ── */
const refs: Ref[] = JSON.parse(document.getElementById('ref-data')?.textContent || '[]');
const panel = document.getElementById('source-panel');
const scrim = document.getElementById('source-scrim');
const body = document.getElementById('source-body');
let lastFocus: HTMLElement | null = null;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const openSources = (ids: string[], from: HTMLElement) => {
  if (!panel || !body) return;
  lastFocus = from;
  body.innerHTML = ids.map((id) => {
    const r = refs.find((x) => x.id === id);
    if (!r) return `<p class="text-muted">Reference “${esc(id)}” not found.</p>`;
    return `<article class="card p-4">
      <p class="mono text-xs text-innovate mb-2">${esc(r.cite)} · ${esc(r.cat)}</p>
      <p class="text-[.92rem] leading-relaxed">${esc(r.apa)}${r.url ? ` <span class="break-all text-muted">${esc(r.url)}</span>` : ''}</p>
      <div class="flex flex-wrap gap-2 mt-3">
        ${r.url ? `<a class="btn btn-ghost btn-sm" href="${esc(r.url)}" target="_blank" rel="noopener">Open source ↗</a>` : ''}
        <a class="btn btn-ghost btn-sm" href="${base}/evidence#ref-${r.id}">In reference list →</a>
      </div></article>`;
  }).join('');
  panel.hidden = false;
  requestAnimationFrame(() => { panel.classList.add('open'); scrim?.classList.add('open'); });
  (panel.querySelector('[data-close]') as HTMLElement)?.focus();
};
const closeSources = () => {
  panel?.classList.remove('open'); scrim?.classList.remove('open');
  setTimeout(() => { if (panel) panel.hidden = true; }, 300);
  lastFocus?.focus();
};
document.addEventListener('click', (e) => {
  const chip = (e.target as HTMLElement).closest<HTMLElement>('[data-cite]');
  if (chip) { e.preventDefault(); openSources(chip.dataset.cite!.split(','), chip); }
});
panel?.querySelector('[data-close]')?.addEventListener('click', closeSources);
scrim?.addEventListener('click', closeSources);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel?.classList.contains('open')) closeSources(); });

/* ── Reveal on scroll ── */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ── Back to top ── */
document.getElementById('to-top')?.addEventListener('click', () => {
  if (lenis) lenis.scrollTo(0); else scrollTo({ top: 0 });
});

/* ── Count-up numbers ([data-count]) ── */
const counters = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target as HTMLElement;
    counters.unobserve(el);
    const target = Number(el.dataset.count);
    const dec = Number(el.dataset.decimals || 0);
    const fmt = (n: number) => n.toLocaleString('en-CA', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1400);
      el.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach((el) => counters.observe(el));
