import type { WorkbenchAgentId } from './chat';

export type WorkflowStepType =
  | 'agent-task'
  | 'run-command'
  | 'review'
  | 'human-approval'
  | 'parallel'
  | 'condition'
  | 'artifact';

export type WorkflowStepStatus = 'pending' | 'running' | 'complete' | 'blocked' | 'disabled';

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  title: string;
  executor: WorkbenchAgentId | 'local' | 'human' | 'parallel';
  input: string;
  expectedOutput: string;
  status: WorkflowStepStatus;
  enabled: boolean;
}

export interface WorkflowModel {
  id: string;
  name: string;
  description: string;
  project: string;
  steps: WorkflowStep[];
}
