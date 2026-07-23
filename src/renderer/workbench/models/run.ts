import type { WorkbenchAgentId } from './chat';
import type { WorkflowStepStatus } from './workflow';

export type RunStatus = 'running' | 'complete' | 'failed' | 'awaiting-approval';

export interface RunTimelineEntry {
  id: string;
  label: string;
  at: string;
  status: WorkflowStepStatus | RunStatus;
}

export interface RunArtifact {
  id: string;
  name: string;
  type: 'summary' | 'diff' | 'report';
  detail: string;
}

export interface RunModel {
  id: string;
  workflowId: string;
  workflowName: string;
  project: string;
  status: RunStatus;
  startedAt: string;
  duration: string;
  agents: WorkbenchAgentId[];
  changedFiles: number;
  tests: 'passed' | 'failed' | 'not-run';
  timeline: RunTimelineEntry[];
  artifacts: RunArtifact[];
  approvals: string[];
  summary: string;
}
