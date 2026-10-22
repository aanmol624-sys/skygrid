import { useEffect, useMemo, useState } from 'react';
import data from '../../data/risks.json';
import wbs from '../../data/wbs.json';

type Key = 'id' | 'risk' | 'p' | 'i' | 'score' | 'owner';
const cols: { k: Key; label: string }[] = [
  { k: 'id', label: 'ID' }, { k: 'risk', label: 'Risk' }, { k: 'p', label: 'P' }, { k: 'i', label: 'I' }, { k: 'score', label: 'Score' }, { k: 'owner', label: 'Owner' },
];

export default function RiskTable() {
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 }>({ k: 'score', dir: -1 });
  const [trace, setTrace] = useState<string[] | null>(null);
  useEffect(() => {
    const code = new URLSearchParams(location.search).get('trace');
    const pkg = wbs.critical.find((c) => c.code === code);
    if (pkg) setTrace(pkg.trace.risks);
  }, []);

  const rows = useMemo(() => [...data.risks].sort((a, b) => {
    const x = a[sort.k], y = b[sort.k];
    const cmp = sort.k === 'id' ? Number(String(x).slice(1)) - Number(String(y).slice(1)) : typeof x === 'number' ? (x as number) - (y as number) : String(x).localeCompare(String(y));
    return cmp * sort.dir;
  }), [sort]);

  return (
    <div className="overflow-x-auto card">
      <table className="tbl">
        <thead>
          <tr>
            {cols.map((c) => (
              <th key={c.k} aria-sort={sort.k === c.k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>
                <button type="button" className="uppercase tracking-wider hover:text-text flex items-center gap-1" onClick={() => setSort({ k: c.k, dir: sort.k === c.k ? (sort.dir === 1 ? -1 : 1) : c.k === 'score' ? -1 : 1 })}>
                  {c.label} <span aria-hidden="true">{sort.k === c.k ? (sort.dir === 1 ? '▲' : '▼') : '↕'}</span>
                </button>
              </th>
            ))}
            <th>Primary response</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const lit = trace?.includes(r.id);
            return (
              <tr key={r.id} style={lit ? { background: 'color-mix(in srgb, var(--impact) 14%, transparent)', boxShadow: 'inset 3px 0 0 var(--impact)' } : trace ? { opacity: 0.45 } : undefined}>
                <td className="mono font-semibold">{r.id}</td>
                <td>{r.risk}</td>
                <td className="mono">{r.p}</td>
                <td className="mono">{r.i}</td>
                <td className="mono whitespace-nowrap" style={{ color: r.rating === 'Critical' ? 'var(--danger)' : r.rating === 'High' ? 'var(--impact)' : undefined }}>{r.score} {r.rating}</td>
                <td>{r.owner}</td>
                <td className="text-muted">{r.response}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
