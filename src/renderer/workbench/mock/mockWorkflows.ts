import type { WorkflowModel } from '../models/workflow';

export const mockWorkflows: WorkflowModel[] = [
  {
    id: 'workflow-plan-implement-review',
    name: 'Plan → Implement → Review',
    description: 'A linear mock workflow for a scoped renderer change.',
    project: 'WinAgent Terminal',
    steps: [
      { id: 'plan', type: 'agent-task', title: 'Plan the change', executor: 'claude', input: 'Map the affected renderer boundaries.', expectedOutput: 'Short implementation plan', status: 'complete', enabled: true },
      { id: 'implement', type: 'agent-task', title: 'Implement the change', executor: 'codex', input: 'Apply the scoped UI change.', expectedOutput: 'Local diff and tests', status: 'running', enabled: true },
      { id: 'review', type: 'review', title: 'Review the result', executor: 'claude', input: 'Review the diff and risks.', expectedOutput: 'Review notes', status: 'pending', enabled: true },
    ],
  },
  {
    id: 'workflow-parallel-compare',
    name: 'Parallel Compare',
    description: 'Independent mock proposals followed by a comparison.',
    project: 'WinAgent Terminal',
    steps: [
      { id: 'parallel', type: 'parallel', title: 'Compare approaches', executor: 'parallel', input: 'Ask both agents for a solution outline.', expectedOutput: 'Two proposals', status: 'pending', enabled: true },
      { id: 'approval', type: 'human-approval', title: 'Choose direction', executor: 'human', input: 'Select the preferred approach.', expectedOutput: 'Approved direction', status: 'pending', enabled: true },
    ],
  },
  {
    id: 'workflow-test-repair',
    name: 'Test Repair Loop',
    description: 'A mock loop for reproducing, fixing and reviewing a test failure.',
    project: 'WinAgent Terminal',
    steps: [
      { id: 'reproduce', type: 'run-command', title: 'Reproduce failure', executor: 'local', input: 'Run the focused test target.', expectedOutput: 'Failure evidence', status: 'pending', enabled: true },
      { id: 'repair', type: 'agent-task', title: 'Prepare repair', executor: 'codex', input: 'Make the smallest change that addresses the failure.', expectedOutput: 'Patch', status: 'pending', enabled: true },
      { id: 'artifact', type: 'artifact', title: 'Record evidence', executor: 'local', input: 'Collect test result and review notes.', expectedOutput: 'TDD evidence', status: 'pending', enabled: true },
    ],
  },
];
