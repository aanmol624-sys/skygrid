import { useState } from 'react';
import wbs from '../../data/wbs.json';
import schedule from '../../data/schedule.json';
import budget from '../../data/budget.json';
import risks from '../../data/risks.json';
import { Icon } from '../ui';

const PILLAR: Record<string, string> = { learn: 'var(--learn)', innovate: 'var(--innovate)', impact: 'var(--impact)' };
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
type Crit = (typeof wbs.critical)[number];

export default function Wbs() {
  const [open, setOpen] = useState<string | null>('1.4');
  const [pkg, setPkg] = useState<Crit | null>(null);
  const [tracing, setTracing] = useState(false);
  const critical = new Map(wbs.critical.map((c) => [c.code, c]));

  const selectPkg = (c: Crit | undefined) => { setPkg(c ?? null); setTracing(false); };

  return (
    <div className="grid xl:grid-cols-[minmax(0,1fr)_380px] gap-6">
      <div>
        {/* Root */}
        <div className="flex justify-center">
          <div className="rounded-xl px-6 py-3 text-center border-2" style={{ borderColor: 'var(--innovate)', background: 'color-mix(in srgb, var(--innovate) 14%, transparent)', boxShadow: '0 0 40px -12px var(--innovate)' }}>
            <p className="mono text-xs text-innovate">{wbs.root.code}</p>
            <p className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>{wbs.root.name}</p>
          </div>
        </div>
        <div className="mx-auto w-px h-6 bg-line-strong" />
        <div className="border-t border-line-strong mx-[5%]" />
        {/* Branches */}
        <ul className="mt-4 space-y-2" role="tree" aria-label="SkyGrid work breakdown structure">
          {wbs.branches.map((b) => {
            const isOpen = open === b.code;
            const hasCrit = b.packages.some((_, i) => critical.has(`${b.code}.${i + 1}`));
            return (
              <li key={b.code} role="treeitem" aria-expanded={isOpen} className="card overflow-hidden" style={{ borderLeft: `3px solid ${PILLAR[b.pillar]}` }}>
                <button type="button" onClick={() => setOpen(isOpen ? null : b.code)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-[color-mix(in_srgb,var(--text)_4%,transparent)]">
                  <span className="mono font-semibold w-10" style={{ color: PILLAR[b.pillar] }}>{b.code}</span>
                  <span className="font-semibold flex-1">{b.name}</span>
                  {hasCrit && <span className="mono text-[.62rem] text-impact hidden sm:inline">★ critical inside</span>}
                  <span className="mono text-xs text-muted">{b.packages.length} WP</span>
                  <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}><Icon name="arrow" size={16} /></span>
                </button>
                {isOpen && (
                  <ul role="group" className="px-4 pb-4 grid sm:grid-cols-2 gap-2">
                    {b.packages.map((p, i) => {
                      const code = `${b.code}.${i + 1}`;
                      const c = critical.get(code);
                      return (
                        <li key={code} role="treeitem">
                          {c ? (
                            <button type="button" onClick={() => selectPkg(c)}
                              className="w-full text-left rounded-lg p-3 flex gap-3 items-start transition-all"
                              style={{ border: '1px solid var(--impact)', background: 'color-mix(in srgb, var(--impact) 10%, transparent)', boxShadow: pkg?.code === code ? '0 0 0 2px var(--impact), 0 0 24px -4px var(--impact)' : '0 0 18px -8px var(--impact)' }}>
                              <span className="mono text-xs text-impact pt-0.5">{code}</span>
                              <span className="text-sm font-semibold flex-1">{p}</span>
                              <span className="text-impact text-xs">★</span>
                            </button>
                          ) : (
                            <div className="rounded-lg p-3 flex gap-3 border border-line">
                              <span className="mono text-xs text-muted pt-0.5">{code}</span>
                              <span className="text-sm">{p}</span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Drawer */}
      <aside className="xl:sticky xl:top-24 self-start card p-5" aria-live="polite">
        {!pkg ? (
          <div>
            <p className="eyebrow">WBS dictionary</p>
            <p className="mt-2 text-sm text-muted">The 8 critical work packages (Table 6) glow amber <span className="text-impact">★</span>. Open a branch and select one to see its acceptance evidence, dependency and trace.</p>
            <ul className="mt-4 space-y-1.5">
              {wbs.critical.map((c) => (
                <li key={c.code}>
                  <button type="button" className="text-sm flex gap-2 hover:text-impact text-left" onClick={() => { setOpen(c.code.split('.').slice(0, 2).join('.')); selectPkg(c); }}>
                    <span className="mono text-impact">{c.code}</span>{c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="mono text-impact">{pkg.code} ★ critical</p>
                <p className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>{pkg.name}</p>
              </div>
              <button type="button" onClick={() => setPkg(null)} aria-label="Close" className="text-muted hover:text-text"><Icon name="x" size={18} /></button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="eyebrow">Acceptance evidence</dt><dd className="mt-1">{pkg.evidence}</dd></div>
              <div><dt className="eyebrow">Primary dependency</dt><dd className="mt-1 mono text-[.82rem]">{pkg.dependency}</dd></div>
            </dl>
            <button type="button" onClick={() => setTracing(!tracing)} className="btn btn-primary btn-sm mt-5 w-full justify-center" aria-pressed={tracing}>
              <Icon name="target" size={15} /> {tracing ? 'Hide trace' : 'Trace across schedule, budget & risk'}
            </button>
            {tracing && <Trace pkg={pkg} />}
          </div>
        )}
      </aside>
    </div>
  );
}

function Trace({ pkg }: { pkg: Crit }) {
  const T0 = new Date('2026-11-01').getTime(), T1 = new Date('2030-09-15').getTime();
  const p = (d: string) => ((new Date(d).getTime() - T0) / (T1 - T0)) * 100;
  const rows = schedule.rows.filter((r) => pkg.trace.gantt.includes(r.id));
  const lines = budget.allocations.filter((a) => pkg.trace.budget.includes(a.id));
  const rk = risks.risks.filter((r) => pkg.trace.risks.includes(r.id));
  return (
    <div className="mt-5 space-y-5">
      <section>
        <p className="eyebrow flex items-center gap-1.5"><Icon name="gantt" size={14} /> Gantt rows</p>
        <div className="relative h-3 mt-2 rounded bg-[color-mix(in_srgb,var(--text)_6%,transparent)]">
          {rows.map((r) => (
            <div key={r.id} className="absolute top-0 h-full rounded" style={{ left: `${p(r.start)}%`, width: `${Math.max(1.2, p(r.end) - p(r.start))}%`, background: 'var(--impact)', boxShadow: '0 0 10px var(--impact)' }} />
          ))}
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {rows.map((r) => <li key={r.id}><span className="mono text-muted mr-1.5">{r.id}</span>{r.name} <span className="mono text-xs text-muted">· {r.timing}</span></li>)}
        </ul>
        <a className="link-deeper mt-2" href={`${base}/plan/schedule?trace=${pkg.code}#gantt`}>Highlight in Gantt →</a>
      </section>
      <section>
        <p className="eyebrow flex items-center gap-1.5"><Icon name="coin" size={14} /> Budget line</p>
        <div className="flex h-3 mt-2 rounded overflow-hidden">
          {budget.allocations.map((a) => (
            <div key={a.id} style={{ width: `${(a.amount / 85) * 100}%`, background: pkg.trace.budget.includes(a.id) ? 'var(--impact)' : 'color-mix(in srgb, var(--text) 10%, transparent)', borderRight: '1px solid var(--bg)' }} title={a.area} />
          ))}
        </div>
        <ul className="mt-2 space-y-1 text-sm">
          {lines.map((a) => <li key={a.id}><span className="mono text-impact mr-1.5">${a.amount}M</span>{a.area}</li>)}
        </ul>
        <a className="link-deeper mt-2" href={`${base}/investment?trace=${pkg.code}#budget`}>Highlight in budget →</a>
      </section>
      <section>
        <p className="eyebrow flex items-center gap-1.5"><Icon name="alert" size={14} /> Risk</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {rk.map((r) => <li key={r.id}><span className="mono font-semibold mr-1.5" style={{ color: r.rating === 'Critical' ? 'var(--danger)' : 'var(--impact)' }}>{r.id}</span>{r.risk} <span className="mono text-xs text-muted">· {r.score} {r.rating}</span></li>)}
        </ul>
        <a className="link-deeper mt-2" href={`${base}/risk?trace=${pkg.code}#heatmap`}>Highlight in risk register →</a>
      </section>
      <p className="text-[.7rem] text-muted">Trace links are a team mapping using the same WBS codes across schedule, budget and risk.</p>
    </div>
  );
}
