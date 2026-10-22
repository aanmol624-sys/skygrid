// React versions of the shared badges, for use inside islands.
import { ICONS } from '../lib/icons';
import { PROPOSED_NOTE, TEAM_ANALYSIS_NOTE } from '../lib/site';

export function Icon({ name, size = 20, className = '', stroke = 1.7 }: { name: string; size?: number; className?: string; stroke?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name] ?? ICONS.doc} />
    </svg>
  );
}

export function Cite({ ids, label }: { ids: string[]; label: string }) {
  return (
    <button type="button" className="chip-cite" data-cite={ids.join(',')} aria-label={`Source: ${label}`}>({label})</button>
  );
}

export function Proposed({ label = 'Proposed' }: { label?: string }) {
  return (
    <span className="pill pill-proposed tip" tabIndex={0} aria-label={`${label}. ${PROPOSED_NOTE}`}>
      {label}
      <span className="tip-body" role="tooltip">{PROPOSED_NOTE}</span>
    </span>
  );
}

export function TeamAnalysis() {
  return (
    <span className="pill pill-team tip" tabIndex={0}>
      Team analysis
      <span className="tip-body" role="tooltip">{TEAM_ANALYSIS_NOTE}</span>
    </span>
  );
}

/** "View as table" toggle wrapper for charts (accessibility requirement). */
import { useState, type ReactNode } from 'react';
export function ChartOrTable({ chart, table, label = 'chart' }: { chart: ReactNode; table: ReactNode; label?: string }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <div>
      <div className="flex justify-end mb-3">
        <button type="button" className="btn btn-ghost btn-sm" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>
          <Icon name={asTable ? 'chart' : 'table'} size={15} /> {asTable ? `View as ${label}` : 'View as table'}
        </button>
      </div>
      {asTable ? <div className="overflow-x-auto">{table}</div> : chart}
    </div>
  );
}
