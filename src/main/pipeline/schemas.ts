import { z } from 'zod';

export const PIPELINE_SCHEMA_VERSION = 1 as const;

export const pipelineProviderSchema = z.enum(['codex', 'claude', 'gemini']);
export type PipelineProvider = z.infer<typeof pipelineProviderSchema>;

export const pipelineStageIdSchema = z.enum([
  'coordinator',
  'researcher',
  'architect',
  'implementer',
  'reviewer',
  'fixer',
  'finalizer',
]);
export type PipelineStageId = z.infer<typeof pipelineStageIdSchema>;

export const pipelineRunStatusSchema = z.enum([
  'created',
  'preflight',
  'coordinating',
  'researching',
  'architecting',
  'implementing',
  'reviewing',
  'fixing',
  'verifying',
  'completed',
  'paused_auth',
  'paused_quota',
  'paused_approval',
  'paused_user',
  'failed',
  'cancelled',
]);
export type PipelineRunStatus = z.infer<typeof pipelineRunStatusSchema>;

export const pipelineStageStatusSchema = z.enum([
  'pending',
  'running',
  'succeeded',
  'failed',
  'paused',
  'cancelled',
  'skipped',
]);
export type PipelineStageStatus = z.infer<typeof pipelineStageStatusSchema>;

export const stageResultStatusSchema = z.enum(['success', 'failed', 'paused', 'cancelled']);
export type StageResultStatus = z.infer<typeof stageResultStatusSchema>;

export const stageFindingSchema = z.object({
  severity: z.enum(['info', 'warning', 'error', 'critical']),
  title: z.string().min(1).max(500),
  details: z.string().min(1).max(20_000),
  file: z.string().min(1).max(4_000).optional(),
}).strict();

/** Stable, portable result contract written by every pipeline stage. */
export const stageResultSchema = z.object({
  schemaVersion: z.literal(PIPELINE_SCHEMA_VERSION),
  runId: z.string().uuid(),
  stageId: pipelineStageIdSchema,
  provider: pipelineProviderSchema,
  status: stageResultStatusSchema,
  summary: z.string().max(20_000),
  findings: z.array(stageFindingSchema).max(500),
  artifacts: z.array(z.string().min(1).max(4_000)).max(200),
  nextStageContext: z.string().max(40_000),
  sessionId: z.string().min(1).max(1_000).optional(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime(),
}).strict();
export type StageResult = z.infer<typeof stageResultSchema>;

export const pipelineStageSchema = z.object({
  id: pipelineStageIdSchema,
  provider: pipelineProviderSchema,
  writeAccess: z.boolean(),
  status: pipelineStageStatusSchema,
  result: stageResultSchema.optional(),
}).strict();
export type PipelineStage = z.infer<typeof pipelineStageSchema>;

export const pipelineAutonomyModeSchema = z.enum(['safe', 'balanced', 'autonomous']);
export type PipelineAutonomyMode = z.infer<typeof pipelineAutonomyModeSchema>;

export const pipelineExecutionModeSchema = z.enum(['strict', 'best_effort']);
export type PipelineExecutionMode = z.infer<typeof pipelineExecutionModeSchema>;

export const pipelineRunSchema = z.object({
  schemaVersion: z.literal(PIPELINE_SCHEMA_VERSION),
  id: z.string().uuid(),
  repositoryPath: z.string().min(1).max(32_000),
  task: z.string().min(1).max(20_000),
  templateId: z.literal('full-cycle'),
  autonomyMode: pipelineAutonomyModeSchema,
  executionMode: pipelineExecutionModeSchema,
  useWorktree: z.boolean(),
  status: pipelineRunStatusSchema,
  resumeState: pipelineRunStatusSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  stages: z.array(pipelineStageSchema).length(7),
  branch: z.string().min(1).max(500).optional(),
  worktreePath: z.string().min(1).max(32_000).optional(),
  failureReason: z.string().min(1).max(20_000).optional(),
}).strict();
export type PipelineRun = z.infer<typeof pipelineRunSchema>;

export const createPipelineDraftSchema = z.object({
  repositoryPath: z.string().min(1).max(32_000),
  task: z.string().trim().min(1).max(20_000),
  autonomyMode: pipelineAutonomyModeSchema.default('safe'),
  executionMode: pipelineExecutionModeSchema.default('strict'),
  useWorktree: z.boolean().default(true),
}).strict();
export type CreatePipelineDraft = z.input<typeof createPipelineDraftSchema>;

export const pipelineEventSchema = z.object({
  schemaVersion: z.literal(PIPELINE_SCHEMA_VERSION),
  runId: z.string().uuid(),
  type: z.enum(['run_created', 'state_changed', 'stage_changed', 'note']),
  message: z.string().min(1).max(20_000),
  timestamp: z.string().datetime(),
}).strict();
export type PipelineEvent = z.infer<typeof pipelineEventSchema>;
