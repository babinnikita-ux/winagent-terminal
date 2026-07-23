import type { RunModel } from '../models/run';

export default function RunDetail({ run }: { run: RunModel | undefined }) {
  if (!run) return <section className="run-detail"><div className="workbench-empty">Select a mock run to inspect it.</div></section>;
  return (
    <section className="run-detail" aria-label="Run details">
      <header><div><p>{run.status}</p><h1>{run.workflowName}</h1><span>{run.project} · {run.startedAt} · {run.duration}</span></div><div className="run-detail__facts"><span>{run.agents.join(' + ')}</span><span>{run.changedFiles} changed files</span><span>Tests: {run.tests}</span></div></header>
      <div className="run-detail__grid"><section><h2>Timeline</h2>{run.timeline.map((entry) => <div className="run-timeline-entry" key={entry.id}><span className={`status-${entry.status}`} /><div><strong>{entry.label}</strong><small>{entry.at}</small></div></div>)}</section><section><h2>Artifacts</h2>{run.artifacts.map((artifact) => <div className="run-artifact" key={artifact.id}><strong>{artifact.name}</strong><span>{artifact.type}</span><small>{artifact.detail}</small></div>)}</section><section><h2>Approvals</h2>{run.approvals.length ? run.approvals.map((approval) => <p key={approval}>{approval}</p>) : <div className="workbench-empty">No mock approvals.</div>}</section></div>
      <section className="run-detail__summary"><h2>Final summary</h2><p>{run.summary}</p></section>
    </section>
  );
}
