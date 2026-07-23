import type { WorkflowStep } from '../models/workflow';

interface WorkflowInspectorProps {
  step: WorkflowStep | undefined;
  onUpdate(patch: Partial<WorkflowStep>): void;
}

export default function WorkflowInspector({ step, onUpdate }: WorkflowInspectorProps) {
  if (!step) return <aside className="workflow-inspector"><div className="workbench-empty">Select a step to inspect its mock properties.</div></aside>;
  return (
    <aside className="workflow-inspector" aria-label="Workflow step inspector">
      <p>Inspector</p><h2>{step.title}</h2>
      <label>Title<input value={step.title} onChange={(event) => onUpdate({ title: event.target.value })} /></label>
      <label>Executor<select value={step.executor} onChange={(event) => onUpdate({ executor: event.target.value as WorkflowStep['executor'] })}><option value="claude">Claude</option><option value="codex">Codex</option><option value="local">Local</option><option value="human">Human</option><option value="parallel">Parallel</option></select></label>
      <label>Input<textarea value={step.input} onChange={(event) => onUpdate({ input: event.target.value })} /></label>
      <label>Expected output<textarea value={step.expectedOutput} onChange={(event) => onUpdate({ expectedOutput: event.target.value })} /></label>
      <p className="workflow-inspector__hint">Mock properties only. This inspector does not execute commands or agents.</p>
    </aside>
  );
}
