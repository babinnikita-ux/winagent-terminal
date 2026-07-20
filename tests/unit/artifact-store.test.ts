import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { ArtifactStore } from '../../src/main/pipeline/artifact-store';

const ROOT = path.join(os.tmpdir(), `winagent-artifacts-${process.pid}`);
const RUN_ID = '77777777-7777-4777-8777-777777777777';

afterEach(() => fs.rmSync(ROOT, { recursive: true, force: true }));

describe('pipeline artifact store', () => {
  it('writes portable user request, stage artifact and JSONL event', () => {
    const store = new ArtifactStore(path.resolve(ROOT), RUN_ID);
    store.initialize('Сделай безопасный run.');
    const file = store.writeStageArtifact({
      schemaVersion: 1,
      runId: RUN_ID,
      stageId: 'coordinator',
      provider: 'codex',
      status: 'success',
      summary: 'Brief готов.',
      findings: [],
      artifacts: [],
      nextStageContext: 'Продолжить.',
      startedAt: '2026-07-20T10:00:00.000Z',
      finishedAt: '2026-07-20T10:01:00.000Z',
    });
    store.appendEvent({ schemaVersion: 1, runId: RUN_ID, type: 'note', message: 'Без секретов.', timestamp: '2026-07-20T10:01:00.000Z' });
    expect(fs.readFileSync(path.join(store.getRunDirectory(), '00-user-request.md'), 'utf8')).toContain('безопасный run');
    expect(fs.readFileSync(file, 'utf8')).toContain('Brief готов');
    expect(fs.readFileSync(path.join(store.getRunDirectory(), 'events.jsonl'), 'utf8')).toContain('Без секретов');
  });
});
