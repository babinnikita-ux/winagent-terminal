import { useEffect, useMemo, useState } from 'react';
import { useWorkbenchStore } from '../store';
import type { WorkflowStep } from '../models/workflow';
import WorkflowInspector from './WorkflowInspector';
import WorkflowStepList from './WorkflowStepList';

export default function WorkflowMode() {
  const store = useWorkbenchStore();
  const workflow = useMemo(() => store.workflows.find((candidate) => candidate.id === store.selectedWorkflowId), [store.workflows, store.selectedWorkflowId]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(workflow?.steps[0]?.id ?? null);
  useEffect(() => setSelectedStepId(workflow?.steps[0]?.id ?? null), [workflow?.id]);
  const selectedStep = workflow?.steps.find((step) => step.id === selectedStepId);
  const update = (patch: Partial<WorkflowStep>) => { if (workflow && selectedStep) store.updateWorkflowStep(workflow.id, selectedStep.id, patch); };

  return (
    <section className="workbench-mode workbench-mode--workflow" aria-label="Workflow mode">
      <header className="workbench-mode__heading"><div><p>Linear mock editor</p><h1>Compose a reviewable path</h1></div><button type="button" className="workbench-button--accent" onClick={() => store.createWorkflow()}>New workflow</button></header>
      <div className="workflow-layout">
        <aside className="workflow-library" aria-label="Mock workflows"><h2>Workflows</h2>{store.workflows.map((item) => <button key={item.id} type="button" className={item.id === workflow?.id ? 'is-selected' : ''} onClick={() => store.selectWorkflow(item.id)}><strong>{item.name}</strong><span>{item.steps.length} steps</span></button>)}</aside>
        <div className="workflow-editor">
          {workflow && <><header className="workflow-editor__header"><div><h2>{workflow.name}</h2><p>{workflow.description}</p></div><div><button type="button" onClick={() => store.addWorkflowStep(workflow.id)}>Add step</button><button type="button" className="workbench-button--accent" onClick={() => store.runWorkflow(workflow.id)}>Run mock</button></div></header>
          <WorkflowStepList steps={workflow.steps} selectedStepId={selectedStepId} onSelect={setSelectedStepId} onReorder={(stepId, targetId) => store.reorderWorkflowStep(workflow.id, stepId, targetId)} onToggle={(step) => store.updateWorkflowStep(workflow.id, step.id, { enabled: !step.enabled, status: step.enabled ? 'disabled' : 'pending' })} onDuplicate={(stepId) => store.duplicateWorkflowStep(workflow.id, stepId)} onDelete={(stepId) => { store.deleteWorkflowStep(workflow.id, stepId); if (selectedStepId === stepId) setSelectedStepId(null); }} />
          </>}
        </div>
        <WorkflowInspector step={selectedStep} onUpdate={update} />
      </div>
    </section>
  );
}
