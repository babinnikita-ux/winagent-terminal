import type { RunModel } from '../models/run';

export const mockRuns: RunModel[] = [
  {
    id: 'run-042',
    workflowId: 'workflow-plan-implement-review',
    workflowName: 'Plan → Implement → Review',
    project: 'WinAgent Terminal',
    status: 'complete',
    startedAt: 'Today, 09:42',
    duration: '4m 18s',
    agents: ['claude', 'codex'],
    changedFiles: 6,
    tests: 'passed',
    timeline: [
      { id: 'timeline-1', label: 'Plan accepted', at: '09:42', status: 'complete' },
      { id: 'timeline-2', label: 'Mock implementation finished', at: '09:45', status: 'complete' },
      { id: 'timeline-3', label: 'Review recorded', at: '09:46', status: 'complete' },
    ],
    artifacts: [
      { id: 'artifact-1', name: 'review-summary.md', type: 'summary', detail: 'Mock review summary' },
      { id: 'artifact-2', name: 'renderer.diff', type: 'diff', detail: '6 mock file changes' },
    ],
    approvals: ['Scope approved before implementation'],
    summary: 'Mock run completed with a documented review and a passing test result.',
  },
  {
    id: 'run-041',
    workflowId: 'workflow-parallel-compare',
    workflowName: 'Parallel Compare',
    project: 'WinAgent Terminal',
    status: 'awaiting-approval',
    startedAt: 'Yesterday, 16:11',
    duration: '1m 06s',
    agents: ['claude', 'codex'],
    changedFiles: 0,
    tests: 'not-run',
    timeline: [{ id: 'timeline-4', label: 'Waiting for a direction', at: '16:12', status: 'blocked' }],
    artifacts: [{ id: 'artifact-3', name: 'comparison.md', type: 'report', detail: 'Two mock proposals' }],
    approvals: ['Select one proposal to continue'],
    summary: 'Mock run is intentionally waiting for a human approval.',
  },
];
