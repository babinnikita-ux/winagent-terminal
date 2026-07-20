import { describe, expect, it } from 'vitest';
import { CodexAdapter } from '../../src/main/pipeline/adapters/codex-adapter';
import { createPipelineRun } from '../../src/main/pipeline/pipeline-state-machine';

const RUN_ID = '44444444-4444-4444-8444-444444444444';
const RUN = createPipelineRun({
  id: RUN_ID,
  repositoryPath: 'C:\\Projects\\fixture',
  task: 'Тест',
  autonomyMode: 'safe',
  executionMode: 'strict',
  useWorktree: true,
  now: '2026-07-20T10:00:00.000Z',
});

describe('Codex adapter', () => {
  it('uses JSONL, stdin and explicit read-only sandbox for a coordinator', () => {
    const command = new CodexAdapter().buildCommand({ runId: RUN_ID, stage: RUN.stages[0], cwd: RUN.repositoryPath, prompt: 'Составь brief.' });
    expect(command.args).toEqual(['exec', '--json', '--sandbox', 'read-only', '-']);
    expect(command.stdin).toBe('Составь brief.');
  });

  it('uses workspace-write only for the two Codex writer stages', () => {
    const command = new CodexAdapter().buildCommand({ runId: RUN_ID, stage: RUN.stages[3], cwd: RUN.repositoryPath, prompt: 'Внеси изменение.' });
    expect(command.args).toContain('workspace-write');
  });

  it('parses a final Codex JSONL event and rejects malformed output', () => {
    const adapter = new CodexAdapter();
    const request = { runId: RUN_ID, stage: RUN.stages[0], cwd: RUN.repositoryPath, prompt: 'Составь brief.' };
    expect(adapter.parseResult('{"type":"task_complete","summary":"Brief готов","session_id":"session-1"}\n', request)).toMatchObject({ summary: 'Brief готов', sessionId: 'session-1' });
    expect(() => adapter.parseResult('{bad-json}\n', request)).toThrow('MALFORMED_OUTPUT');
  });

  it('parses the current Codex CLI item.completed agent message', () => {
    const adapter = new CodexAdapter();
    const request = { runId: RUN_ID, stage: RUN.stages[0], cwd: RUN.repositoryPath, prompt: 'Составь brief.' };
    const output = [
      '{"type":"thread.started","thread_id":"thread-1"}',
      '{"type":"item.completed","item":{"id":"item-1","type":"agent_message","text":"Brief задачи готов."}}',
      '{"type":"turn.completed"}',
    ].join('\n');
    expect(adapter.parseResult(output, request)).toMatchObject({
      summary: 'Brief задачи готов.',
      nextStageContext: 'Brief задачи готов.',
    });
  });
});
