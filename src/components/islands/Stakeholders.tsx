import { useState } from 'react';
import data from '../../data/stakeholders.json';
import { Cite, ChartOrTable, TeamAnalysis } from '../ui';

type Group = (typeof data.groups)[number];
const groups = data.groups as Group[];
const LENS: Record<string, { label: string; color: string }> = {
  authorize: { label: 'Can authorize', color: 'var(--learn)' },
  stop: { label: 'Can stop it', color: 'var(--danger)' },
  deliver: { label: 'Delivers it', color: 'var(--innovate)' },
  risk: { label: 'Bears risk', color: 'var(--impact)' },
  benefit: { label: 'Benefits', color: '#A78BFA' },
};

export default function Stakeholders() {
  const [sel, setSel] = useState<Group>(groups.find((g) => g.id === 'regulators')!);
  const [lens, setLens] = useState<string | null>(null);
  const groupOf = (id: string) => groups.find((g) => g.id === id)!;

  const chart = (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
      <div>
        <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Highlight by role">
          <span className="eyebrow mr-1 self-center">Who…</span>
          {Object.entries(LENS).map(([k, v]) => (
            <button key={k} type="button" onClick={() => setLens(lens === k ? null : k)} aria-pressed={lens === k}
              className="pill" style={{ fontSize: '.68rem', color: lens === k ? v.color : 'var(--muted)', border: `1px solid ${lens === k ? v.color : 'var(--line-strong)'}` }}>{v.label}</button>
          ))}
        </div>
        <div className="relative aspect-[4/3] card reticle overflow-hidden" role="group" aria-label="Stakeholder power–interest grid">
          {/* quadrants */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
            {[['Keep satisfied', ''], ['Manage closely', 'var(--impact)'], ['Monitor', ''], ['Keep informed', '']].map(([q, c]) => (
              <div key={q} className="border border-line p-3"><span className="mono text-[.62rem] uppercase tracking-widest" style={{ color: c || 'var(--muted)' }}>{q}</span></div>
            ))}
          </div>
          {data.dots.map((d) => {
            const g = groupOf(d.group);
            const lit = !lens || g.lens.includes(lens);
            const active = sel.id === g.id;
            return (
              <button key={d.label} type="button" onClick={() => setSel(g)}
                className="absolute -translate-x-1/2 translate-y-1/2 group z-[1] focus:z-10 hover:z-10"
                style={{ left: `${d.x * 10}%`, bottom: `${d.y * 10}%`, opacity: lit ? 1 : 0.2 }}
                aria-label={`${d.label} (${g.name})`}>
                <span className="block rounded-full transition-transform group-hover:scale-125"
                  style={{ width: 16, height: 16, background: active ? 'var(--impact)' : lens ? LENS[lens].color : 'var(--innovate)', boxShadow: active ? '0 0 0 3px var(--bg), 0 0 0 5px var(--impact)' : '0 0 0 2px var(--bg)' }} />
                <span className={`absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap text-[.68rem] px-1.5 py-0.5 rounded glass ${active ? '' : 'opacity-0 group-hover:opacity-100 group-focus:opacity-100'}`}>{d.label}</span>
              </button>
            );
          })}
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 mono text-[.6rem] text-muted">INTEREST →</span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 origin-left mono text-[.6rem] text-muted translate-x-2">POWER →</span>
        </div>
        <p className="text-xs text-muted mt-2">Positions change by decision context; power varies by decision, site and operating context.</p>
      </div>
      <aside className="card p-5 self-start" aria-live="polite">
        <p className="eyebrow">Stakeholder</p>
        <p className="text-xl font-bold mt-1" style={{ fontFamily: 'var(--font-display)' }}>{sel.name}</p>
        <div className="flex flex-wrap gap-1 mt-2">{sel.lens.map((l) => <span key={l} className="pill" style={{ fontSize: '.6rem', color: LENS[l].color, border: `1px solid ${LENS[l].color}` }}>{LENS[l].label}</span>)}</div>
        <p className="eyebrow mt-4">Role and influence</p>
        <p className="text-sm mt-1 leading-relaxed">{sel.role} {sel.cite && <Cite ids={sel.cite[0] as string[]} label={sel.cite[1] as string} />}</p>
        <p className="eyebrow mt-4">Engagement rule</p>
        <p className="text-sm mt-1">{sel.rule ?? '—'}</p>
      </aside>
    </div>
  );

  const table = (
    <table className="tbl">
      <thead><tr><th>Stakeholder</th><th>Role and influence</th><th>Engagement rule</th></tr></thead>
      <tbody>{groups.map((g) => <tr key={g.id}><td className="font-semibold">{g.name}</td><td>{g.role}</td><td>{g.rule ?? '—'}</td></tr>)}</tbody>
    </table>
  );

  return (
    <div>
      <div className="mb-4"><TeamAnalysis /></div>
      <ChartOrTable chart={chart} table={table} label="grid" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-8">
        {groups.map((g) => (
          <button key={g.id} type="button" onClick={() => setSel(g)} className="card p-4 text-left hover:border-line-strong"
            style={sel.id === g.id ? { borderColor: 'var(--impact)' } : undefined}>
            <p className="font-semibold text-sm">{g.name}</p>
            <p className="text-xs text-muted mt-1 line-clamp-2">{g.rule ?? g.role}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
