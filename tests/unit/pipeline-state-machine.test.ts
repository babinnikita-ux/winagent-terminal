import { describe, expect, it } from 'vitest';
import {
  canTransitionPipelineState,
  canTransitionStageState,
  createPipelineRun,
  resumePipelineState,
  transitionPipelineState,
  transitionStageState,
} from '../../src/main/pipeline/pipeline-state-machine';

const RUN_ID = '11111111-1111-4111-8111-111111111111';
const NOW = '2026-07-20T10:00:00.000Z';

function draft() {
  return createPipelineRun({
    id: RUN_ID,
    repositoryPath: 'C:\\Projects\\demo',
    task: 'Добавить безопасный конвейер',
    autonomyMode: 'safe',
    executionMode: 'strict',
    useWorktree: true,
    now: NOW,
  });
}

describe('pipeline state machine', () => {
  it('creates the immutable full-cycle stage order', () => {
    const run = draft();
    expect(run.status).toBe('created');
    expect(run.stages.map((stage) => stage.id)).toEqual([
      'coordinator', 'researcher', 'architect', 'implementer', 'reviewer', 'fixer', 'finalizer',
    ]);
    expect(run.stages.filter((stage) => stage.writeAccess).map((stage) => stage.provider)).toEqual(['codex', 'codex']);
  });

  it('allows only ordered execution transitions and terminal exits', () => {
    expect(canTransitionPipelineState('created', 'preflight')).toBe(true);
    expect(canTransitionPipelineState('preflight', 'coordinating')).toBe(true);
    expect(canTransitionPipelineState('coordinating', 'researching')).toBe(true);
    expect(canTransitionPipelineState('coordinating', 'implementing')).toBe(false);
    expect(canTransitionPipelineState('completed', 'preflight')).toBe(false);
  });

  it('stores the exact active state before a pause and resumes it', () => {
    const preflight = transitionPipelineState(draft(), 'preflight', NOW);
    const paused = transitionPipelineState(preflight, 'paused_auth', NOW);
    expect(paused.resumeState).toBe('preflight');
    expect(resumePipelineState(paused, NOW).status).toBe('preflight');
  });

  it('rejects invalid transitions and does not replay completed stages', () => {
    expect(() => transitionPipelineState(draft(), 'implementing', NOW)).toThrow('Invalid pipeline transition');
    expect(canTransitionStageState('pending', 'running')).toBe(true);
    expect(canTransitionStageState('succeeded', 'running')).toBe(false);
    const completed = transitionStageState(draft().stages[0], 'running');
    expect(transitionStageState(completed, 'succeeded').status).toBe('succeeded');
  });
});
