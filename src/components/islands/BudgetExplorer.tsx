import { useEffect, useMemo, useState } from 'react';
import budget from '../../data/budget.json';
import wbs from '../../data/wbs.json';
import { ChartOrTable, Proposed } from '../ui';

type Alloc = (typeof budget.allocations)[number];
type Rect = Alloc & { x: number; y: number; w: number; h: number };

// Squarified treemap (Bruls et al.) on a 100×60 canvas
function squarify(items: Alloc[], W = 100, H = 60): Rect[] {
  const total = items.reduce((s, a) => s + a.amount, 0);
  const scaled = [...items].sort((a, b) => b.amount - a.amount).map((a) => ({ a, v: (a.amount / total) * W * H }));
  const out: Rect[] = [];
  let x = 0, y = 0, w = W, h = H;
  const worst = (row: number[], side: number) => {
    const s = row.reduce((p, c) => p + c, 0);
    return Math.max(...row.map((r) => Math.max((side * side * r) / (s * s), (s * s) / (side * side * r))));
  };
  let row: typeof scaled = [];
  const layout = (r: typeof scaled) => {
    const s = r.reduce((p, c) => p + c.v, 0);
    if (w >= h) {
      const cw = s / h; let cy = y;
      r.forEach((it) => { const ch = it.v / cw; out.push({ ...it.a, x, y: cy, w: cw, h: ch }); cy += ch; });
      x += cw; w -= cw;
    } else {
      const ch = s / w; let cx = x;
      r.forEach((it) => { const cw = it.v / ch; out.push({ ...it.a, x: cx, y, w: cw, h: ch }); cx += cw; });
      y += ch; h -= ch;
    }
  };
  scaled.forEach((it) => {
    const side = Math.min(w, h);
    if (!row.length || worst([...row.map((r) => r.v), it.v], side) <= worst(row.map((r) => r.v), side)) row.push(it);
    else { layout(row); row = [it]; }
  });
  if (row.length) layout(row);
  return out;
}

const SHADES: Record<string, string> = {
  node: 'var(--innovate)', rpas: 'var(--innovate)', data: 'var(--innovate)', field: 'var(--impact)', partners: 'var(--impact)',
  academic: 'var(--learn)', staff: 'var(--learn)', gov: '#A78BFA', safety: '#2DD4BF', integration: '#94A3B8',
};

export default function BudgetExplorer() {
  const [exploded, setExploded] = useState(false);
  const [hover, setHover] = useState<Alloc | null>(null);
  const [trace, setTrace] = useState<{ code: string; ids: string[] } | null>(null);
  const rects = useMemo(() => squarify(budget.allocations), []);

  useEffect(() => {
    const code = new URLSearchParams(location.search).get('trace');
    const pkg = wbs.critical.find((c) => c.code === code);
    if (pkg) { setTrace({ code: pkg.code, ids: pkg.trace.budget }); setExploded(true); }
  }, []);

  const segs = [
    { k: 'work', label: 'Planned SkyGrid work', amt: 85, c: 'var(--innovate)', click: true },
    { k: 'cont', label: 'Contingency reserve', amt: 10, c: 'var(--learn)' },
    { k: 'mr', label: 'Management reserve', amt: 5, c: 'var(--impact)' },
  ];

  const chart = (
    <div>
      <div className="flex justify-between items-center mb-2 mono text-xs text-muted"><span>CAD $0</span><span className="flex items-center gap-2">$100M maximum authorization <Proposed label="Proposed split" /></span></div>
      <div className="flex h-20 rounded-xl overflow-hidden border border-line-strong">
        {segs.map((s) => (
          <button key={s.k} type="button" disabled={!s.click} onClick={() => setExploded(!exploded)}
            className={`h-full text-left px-4 flex flex-col justify-center relative transition-all ${s.click ? 'cursor-pointer hover:brightness-125' : 'cursor-default'}`}
            style={{ width: `${s.amt}%`, background: `color-mix(in srgb, ${s.c} ${s.click && exploded ? 35 : 22}%, transparent)`, borderRight: '2px solid var(--bg)', boxShadow: s.click ? `inset 4px 0 0 ${s.c}` : `inset 4px 0 0 ${s.c}` }}
            aria-expanded={s.click ? exploded : undefined}
            aria-label={`${s.label}: $${s.amt}M${s.click ? '. Click to break down into 10 allocations' : ''}`}>
            <span className="mono font-semibold text-xl">${s.amt}M</span>
            <span className="text-xs opacity-80 hidden sm:block">{s.label}{s.click && <span className="text-impact"> · {exploded ? 'collapse ↑' : 'click to explode ↓'}</span>}</span>
          </button>
        ))}
      </div>
      <div className="relative mt-2" style={{ width: '95%' }}>
        <div className="h-3 border-x-2 border-b-2 rounded-b-md opacity-60" style={{ borderColor: 'var(--text)' }} />
        <p className="mono text-xs text-center mt-1"><b>$95M</b> cost baseline</p>
      </div>

      <div className={`grid transition-all duration-700 ${exploded ? 'grid-rows-[1fr] opacity-100 mt-6' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <p className="eyebrow">$85M planned-work allocation · 10 cost areas</p>
            {trace && <button type="button" className="pill pill-proposed" onClick={() => setTrace(null)}>Tracing WBS {trace.code} ✕</button>}
          </div>
          <div className="relative w-full reticle" style={{ aspectRatio: '100 / 60' }} onMouseLeave={() => setHover(null)}>
            {rects.map((r) => {
              const lit = !trace || trace.ids.includes(r.id);
              return (
                <button key={r.id} type="button" onMouseEnter={() => setHover(r)} onFocus={() => setHover(r)}
                  className="absolute p-[3px] text-left"
                  style={{ left: `${r.x}%`, top: `${(r.y / 60) * 100}%`, width: `${r.w}%`, height: `${(r.h / 60) * 100}%`, opacity: lit ? 1 : 0.25 }}
                  aria-label={`${r.area}: $${r.amount}M. ${r.purpose}`}>
                  <span className="block w-full h-full rounded-lg p-2 sm:p-3 overflow-hidden transition-all"
                    style={{ background: `color-mix(in srgb, ${SHADES[r.id]} ${hover?.id === r.id ? 38 : 22}%, var(--bg))`, border: `1px solid ${trace?.ids.includes(r.id) ? 'var(--impact)' : `color-mix(in srgb, ${SHADES[r.id]} 50%, transparent)`}`, boxShadow: trace?.ids.includes(r.id) ? '0 0 20px -2px var(--impact)' : undefined }}>
                    <span className="mono font-semibold block text-sm sm:text-xl">${r.amount}M</span>
                    {r.w > 9 && <span className="block text-[.65rem] sm:text-xs leading-tight mt-0.5">{r.area}</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="card p-4 mt-3 min-h-[76px]" aria-live="polite">
            {hover ? (
              <p className="text-sm"><span className="mono text-impact font-semibold mr-2">${hover.amount}M</span><span className="font-semibold">{hover.area}</span> — <span className="text-muted">{hover.purpose}</span></p>
            ) : <p className="text-sm text-muted">Hover or focus a cost area to see its purpose.</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const table = (
    <table className="tbl">
      <thead><tr><th>Cost area</th><th>CAD M</th><th>Purpose</th></tr></thead>
      <tbody>
        {budget.allocations.map((a) => <tr key={a.id}><td className="font-semibold">{a.area}</td><td className="mono">${a.amount}M</td><td>{a.purpose}</td></tr>)}
        <tr><td className="font-bold">Total planned work</td><td className="mono font-bold">$85M</td><td></td></tr>
      </tbody>
    </table>
  );

  return <ChartOrTable chart={chart} table={table} label="chart" />;
}
