import { describe, expect, it } from 'vitest';
import { stageResultSchema } from '../../src/main/pipeline/schemas';

describe('pipeline schemas', () => {
  const base = {
    schemaVersion: 1,
    runId: '22222222-2222-4222-8222-222222222222',
    stageId: 'coordinator',
    provider: 'codex',
    status: 'success',
    summary: 'Краткий план готов.',
    findings: [],
    artifacts: ['01-task-brief.md'],
    nextStageContext: 'Проверить границы задачи.',
    startedAt: '2026-07-20T10:00:00.000Z',
    finishedAt: '2026-07-20T10:01:00.000Z',
  };

  it('validates the portable StageResult v1 contract', () => {
    expect(stageResultSchema.parse(base)).toMatchObject({ stageId: 'coordinator', provider: 'codex' });
  });

  it('rejects unknown fields and invalid providers', () => {
    expect(stageResultSchema.safeParse({ ...base, provider: 'proxyapi' }).success).toBe(false);
    expect(stageResultSchema.safeParse({ ...base, secret: 'never persist this' }).success).toBe(false);
  });
});
