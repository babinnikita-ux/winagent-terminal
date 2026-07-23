import type { RunModel } from '../models/run';

export default function RunList({ runs, selectedRunId, onSelect }: { runs: RunModel[]; selectedRunId: string | null; onSelect(id: string): void }) {
  return <aside className="run-list" aria-label="Mock run history"><h2>Runs</h2>{runs.map((run) => <button key={run.id} type="button" className={run.id === selectedRunId ? 'is-selected' : ''} onClick={() => onSelect(run.id)}><span className={`run-status run-status--${run.status}`} /> <strong>{run.workflowName}</strong><small>{run.project} · {run.duration}</small></button>)}</aside>;
}
