import type { WorkflowStep } from '../models/workflow';

interface WorkflowStepCardProps {
  step: WorkflowStep;
  isSelected: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSelect(): void;
  onMoveUp(): void;
  onMoveDown(): void;
  onToggle(): void;
  onDuplicate(): void;
  onDelete(): void;
}

export default function WorkflowStepCard({ step, isSelected, canMoveUp, canMoveDown, onSelect, onMoveUp, onMoveDown, onToggle, onDuplicate, onDelete }: WorkflowStepCardProps) {
  return (
    <article className={`workflow-step-card ${isSelected ? 'is-selected' : ''} ${step.enabled ? '' : 'is-disabled'}`} onClick={onSelect}>
      <div className="workflow-step-card__header"><span className={`workflow-step-card__status status-${step.status}`} /><div><span>{step.type}</span><h3>{step.title}</h3></div><button type="button" aria-label={`Toggle ${step.title}`} onClick={(event) => { event.stopPropagation(); onToggle(); }}>{step.enabled ? 'On' : 'Off'}</button></div>
      <p>{step.input}</p><small>{step.executor} · Expected: {step.expectedOutput}</small>
      <div className="workflow-step-card__actions" aria-label={`${step.title} actions`}>
        <button type="button" disabled={!canMoveUp} onClick={(event) => { event.stopPropagation(); onMoveUp(); }}>Up</button>
        <button type="button" disabled={!canMoveDown} onClick={(event) => { event.stopPropagation(); onMoveDown(); }}>Down</button>
        <button type="button" onClick={(event) => { event.stopPropagation(); onDuplicate(); }}>Duplicate</button>
        <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(); }}>Delete</button>
      </div>
    </article>
  );
}
