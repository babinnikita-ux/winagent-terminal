import { describe, expect, it } from 'vitest';
import { ClaudeAdapter } from '../../src/main/pipeline/adapters/claude-adapter';
import { createPipelineRun } from '../../src/main/pipeline/pipeline-state-machine';

const RUN = createPipelineRun({
  id: '55555555-5555-4555-8555-555555555555',
  repositoryPath: 'C:\\Projects\\fixture',
  task: 'Тест',
  autonomyMode: 'safe',
  executionMode: 'strict',
  useWorktree: true,
  now: '2026-07-20T10:00:00.000Z',
});

describe('Claude adapter', () => {
  const adapter = new ClaudeAdapter();

  it('uses print-mode JSONL and permanent plan permissions', () => {
    const command = adapter.buildCommand({ runId: RUN.id, stage: RUN.stages[2], cwd: RUN.repositoryPath, prompt: 'Предложи архитектуру.' });
    expect(command.args).toEqual(['--print', '--output-format', 'stream-json', '--permission-mode', 'plan', '--verbose']);
    expect(command.stdin).toBe('Предложи архитектуру.');
  });

  it('rejects a Codex writer stage before a process can start', () => {
    expect(() => adapter.buildCommand({ runId: RUN.id, stage: RUN.stages[3], cwd: RUN.repositoryPath, prompt: 'Измени файл.' })).toThrow('read-only');
  });

  it('parses Claude final stream event', () => {
    const result = adapter.parseResult('{"type":"result","result":"Архитектура готова","session_id":"claude-1"}\n', {
      runId: RUN.id,
      stage: RUN.stages[2],
      cwd: RUN.repositoryPath,
      prompt: 'Предложи архитектуру.',
    });
    expect(result).toMatchObject({ provider: 'claude', summary: 'Архитектура готова', sessionId: 'claude-1' });
  });
});
