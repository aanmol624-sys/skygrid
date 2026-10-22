import { useEffect, useMemo, useRef, useState } from 'react';
import data from '../../data/schedule.json';
import wbs from '../../data/wbs.json';
import { Icon } from '../ui';

type Row = (typeof data.rows)[number] & { milestone?: boolean; critical?: boolean };
const rows = data.rows as Row[];

export const ROLE_COLORS: Record<string, string> = {
  'Sponsor & Program Director': '#A78BFA',
  'Partnerships Lead': '#F472B6',
  'Regulatory & Engagement Leads': '#2DD4BF',
  'Finance Lead': '#FB923C',
  'Capital & Field Leads': '#818CF8',
  'Technology Lead': '#38BDF8',
  'Academic Lead': '#3DDC97',
  'Safety, Cyber & Operations': '#94A3B8',
};

const T0 = new Date('2026-11-01').getTime();
const T1 = new Date('2030-09-15').getTime();
const pct = (d: string, endOfDay = false) => ((new Date(d).getTime() + (endOfDay ? 86400000 : 0) - T0) / (T1 - T0)) * 100;
const MARKERS = [
  { d: '2030-05-31', label: 'Config freeze · May 31', color: 'var(--innovate)' },
  { d: '2030-08-15', label: 'Internal acceptance · Aug 15', color: 'var(--learn)' },
  { d: '2030-09-01', label: 'Launch · Sep 1', color: 'var(--impact)' },
];
const YEARS = [2027, 2028, 2029, 2030];
const ROW_H = 30;

export default function Gantt() {
  const [critical, setCritical] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [hover, setHover] = useState<{ r: Row; x: number; y: number } | null>(null);
  const [asTable, setAsTable] = useState(false);
  const [trace, setTrace] = useState<{ code: string; rows: string[] } | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  // ?trace=1.4.6 highlights the rows linked to a WBS package
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('trace');
    const pkg = wbs.critical.find((c) => c.code === code);
    if (pkg) setTrace({ code: pkg.code, rows: pkg.trace.gantt });
  }, []);

  const lines = useMemo(() => {
    const out: ({ type: 'phase'; n: number; name: string; period: string } | { type: 'row'; r: Row })[] = [];
    data.phases.forEach((p) => {
      out.push({ type: 'phase', n: p.n, name: p.name, period: p.period });
      rows.filter((r) => r.phase === p.n).forEach((r) => out.push({ type: 'row', r }));
    });
    return out;
  }, []);

  const dim = (r: Row) =>
    (critical && !r.critical) || (role && r.group !== role) || (trace && !trace.rows.includes(r.id));

  // Critical-path polyline through critical items in order
  const critPath = useMemo(() => {
    const pts: string[] = [];
    lines.forEach((l, i) => {
      if (l.type !== 'row' || !l.r.critical) return;
      const y = i * ROW_H + ROW_H / 2;
      pts.push(`${pct(l.r.start)},${y}`, `${pct(l.r.end, !l.r.milestone)},${y}`);
    });
    return pts.join(' ');
  }, [lines]);

  const chartH = lines.length * ROW_H;

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button type="button" onClick={() => setCritical(!critical)} aria-pressed={critical}
          className={`btn btn-sm ${critical ? '' : 'btn-ghost'}`}
          style={critical ? { background: 'var(--danger)', color: '#fff' } : undefined}>
          <Icon name="alert" size={15} /> {critical ? 'Critical path on' : 'Show critical path'}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAsTable(!asTable)} aria-pressed={asTable}>
          <Icon name={asTable ? 'gantt' : 'table'} size={15} /> {asTable ? 'View as Gantt' : 'View as table'}
        </button>
        <a className="btn btn-ghost btn-sm" href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/downloads/UFV-SkyGrid-Gantt.png`} download><Icon name="download" size={15} /> Gantt PNG</a>
        <a className="btn btn-ghost btn-sm" href={`${import.meta.env.BASE_URL.replace(/\/$/, '')}/downloads/UFV-SkyGrid-Gantt.pdf`} download><Icon name="download" size={15} /> Gantt PDF</a>
        {trace && (
          <button type="button" className="btn btn-sm" style={{ background: 'var(--impact)', color: 'var(--on-impact)' }} onClick={() => setTrace(null)}>
            Tracing WBS {trace.code} ✕
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-5" role="group" aria-label="Show only one accountable role’s work">
        <span className="eyebrow mr-1">Show only:</span>
        <button type="button" onClick={() => setRole(null)} aria-pressed={!role}
          className={`pill ${!role ? 'pill-proposed' : 'pill-illustrative'}`} style={{ fontSize: '.68rem' }}>All roles</button>
        {Object.entries(ROLE_COLORS).map(([g, c]) => (
          <button key={g} type="button" onClick={() => setRole(role === g ? null : g)} aria-pressed={role === g}
            className="pill" style={{ fontSize: '.68rem', border: `1px solid ${role === g ? c : 'var(--line-strong)'}`, color: role === g ? c : 'var(--muted)', background: role === g ? `color-mix(in srgb, ${c} 14%, transparent)` : 'transparent' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: c }} /> {g}
          </button>
        ))}
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="tbl min-w-[760px]">
            <thead><tr><th>ID</th><th>Activity / milestone</th><th>Timing</th><th>Completes</th><th>Accountable role</th><th>Predecessor</th></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} style={{ opacity: dim(r) ? 0.35 : 1 }}><td className="mono">{r.id}</td><td>{r.name}{r.critical && <span className="text-danger mono text-xs ml-2">CP</span>}</td><td className="mono whitespace-nowrap">{r.timing}</td><td className="mono whitespace-nowrap">{r.completes}</td><td>{r.role}</td><td className="mono">{r.pred}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Desktop Gantt */}
          <div className="hidden md:block card p-4 reticle overflow-x-auto">
            <div ref={hostRef} className="min-w-[900px] relative" onMouseLeave={() => setHover(null)}>
              {/* Marker legend */}
              <div className="flex flex-wrap justify-end gap-4 mb-3">
                {MARKERS.map((m) => <span key={m.d} className="mono text-[.68rem] flex items-center gap-1.5" style={{ color: m.color }}><span className="w-4 border-t-2 border-dashed" style={{ borderColor: m.color }} />{m.label}</span>)}
                <span className="mono text-[.68rem] flex items-center gap-1.5 text-impact"><span className="w-2.5 h-2.5 rotate-45 bg-[var(--impact)]" />Milestone M1–M7</span>
              </div>
              {/* Year axis */}
              <div className="grid grid-cols-[260px_1fr] border-b border-line pb-2 mb-1">
                <span className="eyebrow">Activity</span>
                <div className="relative h-5">
                  {YEARS.map((y) => (
                    <span key={y} className="absolute mono text-xs text-muted -translate-x-1/2" style={{ left: `${pct(`${y}-01-01`)}%` }}>{y}</span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-[260px_1fr]">
                {/* labels */}
                <div>
                  {lines.map((l, i) => l.type === 'phase' ? (
                    <div key={`p${l.n}`} className="flex items-center gap-2 pr-2" style={{ height: ROW_H }}>
                      <span className="mono text-[.65rem] text-impact whitespace-nowrap">PHASE {l.n}</span>
                      <span className="text-xs font-semibold truncate">{l.name}</span>
                    </div>
                  ) : (
                    <div key={l.r.id} className="flex items-center gap-2 pr-2 transition-opacity" style={{ height: ROW_H, opacity: dim(l.r) ? 0.3 : 1 }}>
                      <span className="mono text-[.68rem] text-muted w-6 shrink-0 text-right">{l.r.id}</span>
                      <span className={`text-[.8rem] truncate ${l.r.milestone ? 'font-semibold' : ''}`} title={l.r.name}>{l.r.name}</span>
                    </div>
                  ))}
                </div>
                {/* bars */}
                <div className="relative" style={{ height: chartH }}>
                  {YEARS.map((y) => <div key={y} className="absolute top-0 bottom-0 border-l border-line" style={{ left: `${pct(`${y}-01-01`)}%` }} />)}
                  {lines.map((l, i) => l.type === 'phase' && (
                    <div key={`pb${l.n}`} className="absolute inset-x-0" style={{ top: i * ROW_H, height: ROW_H, background: 'color-mix(in srgb, var(--text) 3%, transparent)' }} />
                  ))}
                  {MARKERS.map((m) => (
                    <div key={m.d} className="absolute top-0 bottom-0 z-[1]" style={{ left: `${pct(m.d)}%`, borderLeft: `2px dashed ${m.color}` }}>
                                          </div>
                  ))}
                  {critical && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-[3]" viewBox={`0 0 100 ${chartH}`} preserveAspectRatio="none" aria-hidden="true">
                      <polyline points={critPath} fill="none" stroke="var(--danger)" strokeWidth="3" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 4px var(--danger))' }} strokeLinejoin="round" />
                    </svg>
                  )}
                  {lines.map((l, i) => {
                    if (l.type !== 'row') return null;
                    const r = l.r;
                    const c = ROLE_COLORS[r.group];
                    const top = i * ROW_H;
                    const left = pct(r.start);
                    const showHover = (e: React.MouseEvent | React.FocusEvent) => {
                      const host = hostRef.current!.getBoundingClientRect();
                      const b = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      setHover({ r, x: b.left - host.left + b.width / 2, y: b.top - host.top });
                    };
                    const common = {
                      tabIndex: 0,
                      onMouseEnter: showHover, onFocus: showHover, onBlur: () => setHover(null),
                      'aria-label': `${r.id} ${r.name}: ${r.timing}, ${r.role}, predecessor ${r.pred}`,
                    };
                    return r.milestone ? (
                      <div key={r.id} {...common} className="absolute z-[4] transition-opacity outline-none" style={{ left: `${left}%`, top: top + ROW_H / 2 - 8, opacity: dim(r) ? 0.2 : 1 }}>
                        <div className="w-4 h-4 rotate-45 -translate-x-1/2 rounded-[2px]" style={{ background: 'var(--impact)', boxShadow: '0 0 12px var(--impact)', outline: critical && r.critical ? '2px solid var(--danger)' : undefined }} />
                        <span className="absolute left-3 -top-0.5 mono text-[.62rem] font-bold text-impact whitespace-nowrap">{r.id}</span>
                      </div>
                    ) : (
                      <div key={r.id} {...common} className="absolute rounded-md z-[2] transition-all outline-none focus-visible:ring-2 ring-[var(--impact)]"
                        style={{
                          left: `${left}%`, width: `${pct(r.end, true) - left}%`, top: top + 6, height: ROW_H - 12,
                          background: `color-mix(in srgb, ${c} 70%, transparent)`, opacity: dim(r) ? 0.15 : 1,
                          boxShadow: (critical && r.critical) || trace?.rows.includes(r.id) ? `0 0 0 2px ${trace ? 'var(--impact)' : 'var(--danger)'}, 0 0 14px ${trace ? 'var(--impact)' : 'var(--danger)'}` : undefined,
                        }} />
                    );
                  })}
                </div>
              </div>
              {hover && (
                <div className="absolute z-20 glass rounded-lg p-3 text-sm pointer-events-none shadow-2xl w-64" style={{ left: Math.max(0, Math.min(hover.x - 128, (hostRef.current?.offsetWidth ?? 900) - 260)), top: hover.y + 34, background: 'var(--surface-solid)' }}>
                  <p className="font-semibold"><span className="mono text-muted mr-1">{hover.r.id}</span>{hover.r.name}</p>
                  <p className="mono text-xs mt-1.5">{hover.r.timing} · completes {hover.r.completes}</p>
                  <p className="text-xs mt-1 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: ROLE_COLORS[hover.r.group] }} />{hover.r.role}</p>
                  <p className="text-xs text-muted mt-1">Predecessor: <span className="mono">{hover.r.pred}</span></p>
                  {hover.r.critical && <p className="text-xs text-danger mt-1 mono">On provisional critical path</p>}
                </div>
              )}
            </div>
          </div>

          {/* Mobile: vertical milestone timeline */}
          <ol className="md:hidden relative border-l-2 border-line ml-3 space-y-4">
            {data.phases.map((p) => (
              <li key={p.n} className="pl-5 relative">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2" style={{ borderColor: 'var(--innovate)', background: 'var(--bg)' }} />
                <p className="mono text-xs text-impact">PHASE {p.n} · {p.period}</p>
                <p className="font-semibold">{p.name}</p>
                <ul className="mt-2 space-y-1">
                  {rows.filter((r) => r.phase === p.n).map((r) => (
                    <li key={r.id} className={`text-sm flex gap-2 ${dim(r) ? 'opacity-30' : ''}`}>
                      {r.milestone ? <span className="w-2.5 h-2.5 rotate-45 mt-1.5 shrink-0" style={{ background: 'var(--impact)' }} /> : <span className="w-2.5 h-2.5 rounded-sm mt-1.5 shrink-0" style={{ background: ROLE_COLORS[r.group] }} />}
                      <span><span className="mono text-muted text-xs mr-1">{r.id}</span>{r.name} <span className="mono text-xs text-muted">· {r.timing}</span></span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
