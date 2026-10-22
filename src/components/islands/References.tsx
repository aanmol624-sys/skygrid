import { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import refs from '../../data/references.json';
import { Icon } from '../ui';

const CATS = ['Government', 'UFV', 'PMI', 'Comparators', 'Course'] as const;

export default function References() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const fuse = useMemo(() => new Fuse(refs, { keys: ['apa', 'cite', 'url'], threshold: 0.35, ignoreLocation: true }), []);

  useEffect(() => {
    const h = location.hash;
    if (h === '#search') input.current?.focus();
    if (h.startsWith('#ref-')) {
      setTarget(h.slice(5));
      setTimeout(() => document.getElementById(h.slice(1))?.scrollIntoView({ block: 'center' }), 50);
    }
  }, []);

  const list = (q.trim() ? fuse.search(q).map((r) => r.item) : refs).filter((r) => !cat || r.cat === cat);

  const copy = async (r: (typeof refs)[number]) => {
    const text = `${r.apa}${r.url ? ` ${r.url}` : ''}`;
    try { await navigator.clipboard.writeText(text); } catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    setCopied(r.id); setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div>
      <div className="card p-3 flex items-center gap-3">
        <Icon name="search" size={20} className="text-muted ml-1" />
        <input ref={input} id="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search references (author, title, year, URL)…"
          className="bg-transparent outline-none flex-1 py-1.5 text-base" aria-label="Search references" />
        <span className="mono text-xs text-muted">{list.length}/{refs.length}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label="Filter by category">
        <button type="button" onClick={() => setCat(null)} aria-pressed={!cat} className={`pill ${!cat ? 'pill-proposed' : 'pill-illustrative'}`}>All</button>
        {CATS.map((c) => (
          <button key={c} type="button" onClick={() => setCat(cat === c ? null : c)} aria-pressed={cat === c} className={`pill ${cat === c ? 'pill-proposed' : 'pill-illustrative'}`}>
            {c} <span className="opacity-60">{refs.filter((r) => r.cat === c).length}</span>
          </button>
        ))}
      </div>
      <ol className="mt-6 space-y-2">
        {list.map((r) => (
          <li key={r.id} id={`ref-${r.id}`} className="card p-4 sm:p-5 scroll-mt-28 transition-shadow"
            style={target === r.id ? { borderColor: 'var(--innovate)', boxShadow: '0 0 0 2px var(--innovate)' } : undefined}>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="chip-cite" style={{ cursor: 'default' }}>({r.cite})</span>
              <span className="pill pill-illustrative">{r.cat}</span>
            </div>
            <p className="leading-relaxed pl-8 -indent-8">{r.apa} {r.url && <a href={r.url} target="_blank" rel="noopener" className="text-innovate break-all hover:underline">{r.url}</a>}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => copy(r)}><Icon name="copy" size={14} /> {copied === r.id ? 'Copied!' : 'Copy APA'}</button>
              {r.url && <a className="btn btn-ghost btn-sm" href={r.url} target="_blank" rel="noopener"><Icon name="external" size={14} /> Open source</a>}
            </div>
          </li>
        ))}
        {!list.length && <li className="text-muted p-6 text-center">No references match “{q}”.</li>}
      </ol>
    </div>
  );
}
