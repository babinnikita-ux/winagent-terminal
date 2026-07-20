import { describe, expect, it } from 'vitest';
import { GeminiAdapter } from '../../src/main/pipeline/adapters/gemini-adapter';
import { createPipelineRun } from '../../src/main/pipeline/pipeline-state-machine';

const RUN = createPipelineRun({
  id: '66666666-6666-4666-8666-666666666666',
  repositoryPath: 'C:\\Projects\\fixture',
  task: 'Тест',
  autonomyMode: 'safe',
  executionMode: 'strict',
  useWorktree: true,
  now: '2026-07-20T10:00:00.000Z',
});

describe('Gemini adapter', () => {
  const adapter = new GeminiAdapter();

  it('runs its sole stage in native read-only plan mode with stdin', () => {
    const command = adapter.buildCommand({ runId: RUN.id, stage: RUN.stages[1], cwd: RUN.repositoryPath, prompt: 'Проведи исследование.' });
    expect(command.args).toEqual(['--output-format', 'stream-json', '--approval-mode', 'plan']);
    expect(command.stdin).toBe('Проведи исследование.');
  });

  it('cannot execute a Codex writer stage', () => {
    expect(() => adapter.buildCommand({ runId: RUN.id, stage: RUN.stages[3], cwd: RUN.repositoryPath, prompt: 'Измени код.' })).toThrow('read-only');
  });

  it('parses the final stream result', () => {
    const result = adapter.parseResult('{"type":"result","response":"Исследование готово","sessionId":"gemini-1"}\n', {
      runId: RUN.id,
      stage: RUN.stages[1],
      cwd: RUN.repositoryPath,
      prompt: 'Проведи исследование.',
    });
    expect(result).toMatchObject({ provider: 'gemini', summary: 'Исследование готово', sessionId: 'gemini-1' });
  });
});
