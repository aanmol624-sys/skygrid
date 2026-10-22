import { useEffect, useState } from 'react';
import wbs from '../../data/wbs.json';
import data from '../../data/risks.json';
import { ChartOrTable, Icon } from '../ui';

type Risk = (typeof data.risks)[number] & { safety?: boolean };
const risks = data.risks as Risk[];

// Cell colour by P×I score
const cellColor = (s: number) =>
  s >= 16 ? 'var(--danger)' : s >= 10 ? 'var(--impact)' : s >= 5 ? 'var(--innovate)' : 'var(--learn)';
const isCritical = (r: Risk) => r.rating === 'Critical';

export default function HeatMap({ compact = false }: { compact?: boolean }) {
  const [sel, setSel] = useState<Risk | null>(compact ? null : risks.find((r) => r.id === 'R3')!);
  const [traced, setTraced] = useState<string[]>([]);
  // ?trace=<WBS code> highlights the risks linked to that work package
  useEffect(() => {
    if (compact) return;
    const pkg = wbs.critical.find((c) => c.code === new URLSearchParams(location.search).get('trace'));
    if (pkg) { setTraced(pkg.trace.risks); setSel(risks.find((r) => r.id === pkg.trace.risks[0])!); }
  }, []);

  const grid = (
    <div className={`grid ${compact ? '' : 'lg:grid-cols-[minmax(0,1fr)_320px]'} gap-6`}>
      <div className="reticle">
        <div className="flex">
          <div className="flex items-center justify-center w-6 shrink-0">
            <span className="mono text-[.65rem] text-muted -rotate-90 whitespace-nowrap">IMPACT →</span>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-5 gap-1" role="grid" aria-label="Risk heat map, probability by impact">
              {[5, 4, 3, 2, 1].map((i) =>
                [1, 2, 3, 4, 5].map((p) => {
                  const inCell = risks.filter((r) => r.p === p && r.i === i);
                  const s = p * i;
                  return (
                    <div key={`${p}-${i}`} role="gridcell" aria-label={`Probability ${p}, impact ${i}, score ${s}${inCell.length ? `: ${inCell.map((r) => r.id).join(', ')}` : ''}`}
                      className="relative rounded-md flex flex-wrap content-center justify-center gap-1 p-1"
                      style={{ aspectRatio: compact ? '1.4' : '1.25', background: `color-mix(in srgb, ${cellColor(s)} ${8 + s * 1.4}%, transparent)`, border: '1px solid var(--line)' }}>
                      <span className="absolute top-1 left-1.5 mono text-[.55rem] text-muted">{s}</span>
                      {inCell.map((r) => (
                        <button key={r.id} type="button" onClick={() => setSel(r)}
                          aria-label={`${r.id}: ${r.risk}. Score ${r.score} ${r.rating}`}
                          className={`mono font-semibold rounded-full grid place-items-center transition-transform hover:scale-110 ${isCritical(r) ? 'pulse-red' : ''}`}
                          style={{
                            width: compact ? 30 : 36, height: compact ? 30 : 36, fontSize: compact ? '.6rem' : '.68rem',
                            background: isCritical(r) ? 'var(--danger)' : 'var(--surface-solid)',
                            color: isCritical(r) ? '#fff' : 'var(--text)',
                            border: `2px solid ${sel?.id === r.id ? 'var(--text)' : isCritical(r) ? 'var(--danger)' : 'var(--line-strong)'}`,
                            outline: traced.includes(r.id) ? '3px solid var(--impact)' : undefined, outlineOffset: 3,
                          }}>
                          {r.safety ? <span className="relative grid place-items-center"><Icon name="shield" size={compact ? 26 : 30} stroke={1.3} className="absolute opacity-50" />{r.id}</span> : r.id}
                        </button>
                      ))}
                    </div>
                  );
                }),
              )}
            </div>
            <div className="grid grid-cols-5 gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((p) => <span key={p} className="mono text-[.65rem] text-muted text-center">{p}</span>)}
            </div>
            <p className="mono text-[.65rem] text-muted text-center mt-1">PROBABILITY →</p>
          </div>
        </div>
      </div>
      {!compact && (
        <aside className="card p-5 self-start" aria-live="polite">
          {sel ? (
            <>
              <div className="flex items-center gap-2">
                <span className="mono text-lg font-bold">{sel.id}</span>
                <span className="pill" style={{ color: isCritical(sel) ? 'var(--danger)' : 'var(--impact)', border: '1px solid currentColor' }}>{sel.score} {sel.rating}</span>
              </div>
              <p className="font-semibold text-lg mt-2 leading-snug">{sel.risk}</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div><dt className="eyebrow">P × I</dt><dd className="mono">{sel.p} × {sel.i} = {sel.score}</dd></div>
                <div><dt className="eyebrow">Owner</dt><dd>{sel.owner}</dd></div>
                <div><dt className="eyebrow">Primary response</dt><dd>{sel.response}</dd></div>
              </dl>
              {sel.safety && (
                <p className="mt-4 text-sm p-3 rounded-lg flex gap-2" style={{ background: 'color-mix(in srgb, var(--learn) 12%, transparent)' }}>
                  <Icon name="shield" size={18} className="shrink-0 text-learn" /> Safety-critical risks receive mandatory controls regardless of arithmetic score.
                </p>
              )}
            </>
          ) : <p className="text-muted text-sm">Select a risk on the map to see its owner and response.</p>}
        </aside>
      )}
    </div>
  );

  if (compact) return grid;

  const table = (
    <table className="tbl">
      <thead><tr><th>ID</th><th>Risk</th><th>P</th><th>I</th><th>Score</th><th>Owner</th></tr></thead>
      <tbody>{risks.map((r) => <tr key={r.id}><td className="mono">{r.id}</td><td>{r.risk}</td><td className="mono">{r.p}</td><td className="mono">{r.i}</td><td className="mono">{r.score} {r.rating}</td><td>{r.owner}</td></tr>)}</tbody>
    </table>
  );
  return <ChartOrTable chart={grid} table={table} label="heat map" />;
}
