import type { WorkflowStep } from '../models/workflow';
import WorkflowStepCard from './WorkflowStepCard';

interface WorkflowStepListProps {
  steps: WorkflowStep[];
  selectedStepId: string | null;
  onSelect(id: string): void;
  onReorder(stepId: string, targetStepId: string): void;
  onToggle(step: WorkflowStep): void;
  onDuplicate(id: string): void;
  onDelete(id: string): void;
}

export default function WorkflowStepList({ steps, selectedStepId, onSelect, onReorder, onToggle, onDuplicate, onDelete }: WorkflowStepListProps) {
  return (
    <div className="workflow-step-list" aria-label="Workflow steps">
      {steps.length === 0 ? <div className="workbench-empty">Add a mock step to begin.</div> : steps.map((step, index) => (
        <WorkflowStepCard
          key={step.id}
          step={step}
          isSelected={step.id === selectedStepId}
          canMoveUp={index > 0}
          canMoveDown={index < steps.length - 1}
          onSelect={() => onSelect(step.id)}
          onMoveUp={() => onReorder(step.id, steps[index - 1].id)}
          onMoveDown={() => onReorder(step.id, steps[index + 1].id)}
          onToggle={() => onToggle(step)}
          onDuplicate={() => onDuplicate(step.id)}
          onDelete={() => onDelete(step.id)}
        />
      ))}
    </div>
  );
}
