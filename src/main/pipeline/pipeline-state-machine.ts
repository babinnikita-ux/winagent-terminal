import {
  PIPELINE_SCHEMA_VERSION,
  PipelineRun,
  PipelineRunStatus,
  PipelineStage,
  PipelineStageId,
  PipelineStageStatus,
  pipelineRunSchema,
} from './schemas';

export const PIPELINE_STAGE_DEFINITIONS: ReadonlyArray<Pick<PipelineStage, 'id' | 'provider' | 'writeAccess'>> = [
  { id: 'coordinator', provider: 'codex', writeAccess: false },
  { id: 'researcher', provider: 'gemini', writeAccess: false },
  { id: 'architect', provider: 'claude', writeAccess: false },
  { id: 'implementer', provider: 'codex', writeAccess: true },
  { id: 'reviewer', provider: 'claude', writeAccess: false },
  { id: 'fixer', provider: 'codex', writeAccess: true },
  { id: 'finalizer', provider: 'codex', writeAccess: false },
];

const ACTIVE_STATUSES = new Set<PipelineRunStatus>([
  'preflight', 'coordinating', 'researching', 'architecting', 'implementing', 'reviewing', 'fixing', 'verifying',
]);
const PAUSED_STATUSES = new Set<PipelineRunStatus>(['paused_auth', 'paused_quota', 'paused_approval', 'paused_user']);
const TERMINAL_STATUSES = new Set<PipelineRunStatus>(['completed', 'failed', 'cancelled']);

const NEXT_STATUS: Partial<Record<PipelineRunStatus, PipelineRunStatus>> = {
  created: 'preflight',
  preflight: 'coordinating',
  coordinating: 'researching',
  researching: 'architecting',
  architecting: 'implementing',
  implementing: 'reviewing',
  reviewing: 'fixing',
  fixing: 'verifying',
  verifying: 'completed',
};

export function isPipelinePaused(status: PipelineRunStatus): boolean {
  return PAUSED_STATUSES.has(status);
}

export function isPipelineTerminal(status: PipelineRunStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function canTransitionPipelineState(current: PipelineRunStatus, next: PipelineRunStatus): boolean {
  if (isPipelineTerminal(current)) return false;
  if (ACTIVE_STATUSES.has(current)) return NEXT_STATUS[current] === next || PAUSED_STATUSES.has(next) || next === 'failed' || next === 'cancelled';
  if (current === 'created') return next === 'preflight' || next === 'cancelled';
  return false;
}

export function transitionPipelineState(run: PipelineRun, next: PipelineRunStatus, now = new Date().toISOString()): PipelineRun {
  if (!canTransitionPipelineState(run.status, next)) {
    throw new Error(`Invalid pipeline transition: ${run.status} → ${next}`);
  }
  const resumeState = isPipelinePaused(next) ? run.status : undefined;
  return pipelineRunSchema.parse({ ...run, status: next, resumeState, updatedAt: now });
}

export function resumePipelineState(run: PipelineRun, now = new Date().toISOString()): PipelineRun {
  if (!isPipelinePaused(run.status) || !run.resumeState || !ACTIVE_STATUSES.has(run.resumeState)) {
    throw new Error(`Run ${run.id} cannot be resumed from ${run.status}`);
  }
  return pipelineRunSchema.parse({ ...run, status: run.resumeState, resumeState: undefined, updatedAt: now });
}

export function canTransitionStageState(current: PipelineStageStatus, next: PipelineStageStatus): boolean {
  const allowed: Record<PipelineStageStatus, PipelineStageStatus[]> = {
    pending: ['running', 'skipped', 'cancelled'],
    running: ['succeeded', 'failed', 'paused', 'cancelled'],
    paused: ['running', 'cancelled'],
    succeeded: [],
    failed: [],
    cancelled: [],
    skipped: [],
  };
  return allowed[current].includes(next);
}

export function transitionStageState(stage: PipelineStage, next: PipelineStageStatus): PipelineStage {
  if (!canTransitionStageState(stage.status, next)) {
    throw new Error(`Invalid stage transition: ${stage.id}: ${stage.status} → ${next}`);
  }
  return { ...stage, status: next };
}

export function createPipelineRun(input: {
  id: string;
  repositoryPath: string;
  task: string;
  autonomyMode: PipelineRun['autonomyMode'];
  executionMode: PipelineRun['executionMode'];
  useWorktree: boolean;
  now?: string;
}): PipelineRun {
  const now = input.now ?? new Date().toISOString();
  return pipelineRunSchema.parse({
    schemaVersion: PIPELINE_SCHEMA_VERSION,
    id: input.id,
    repositoryPath: input.repositoryPath,
    task: input.task,
    templateId: 'full-cycle',
    autonomyMode: input.autonomyMode,
    executionMode: input.executionMode,
    useWorktree: input.useWorktree,
    status: 'created',
    createdAt: now,
    updatedAt: now,
    stages: PIPELINE_STAGE_DEFINITIONS.map((stage) => ({ ...stage, status: 'pending' })),
  });
}

export function stageForRunStatus(status: PipelineRunStatus): PipelineStageId | undefined {
  const stages: Partial<Record<PipelineRunStatus, PipelineStageId>> = {
    coordinating: 'coordinator',
    researching: 'researcher',
    architecting: 'architect',
    implementing: 'implementer',
    reviewing: 'reviewer',
    fixing: 'fixer',
    verifying: 'finalizer',
  };
  return stages[status];
}
