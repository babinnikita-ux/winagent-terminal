import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { PipelineEventLog } from '../../src/main/pipeline/pipeline-events';
import { PipelineService } from '../../src/main/pipeline/pipeline-service';
import { PipelineStore } from '../../src/main/pipeline/pipeline-store';

const TEST_ROOT = path.join(os.tmpdir(), `winagent-pipeline-${process.pid}`);

afterEach(() => fs.rmSync(TEST_ROOT, { recursive: true, force: true }));

describe('pipeline persistence', () => {
  it('atomically persists and reloads a validated draft', () => {
    const service = new PipelineService(new PipelineStore(TEST_ROOT), TEST_ROOT);
    const run = service.createDraft({
      repositoryPath: path.resolve(TEST_ROOT),
      task: 'Подготовить run без запуска CLI',
    });

    expect(new PipelineStore(TEST_ROOT).get(run.id)).toEqual(run);
    expect(new PipelineStore(TEST_ROOT).list()).toHaveLength(1);
    expect(fs.readdirSync(path.join(TEST_ROOT, 'runs')).some((entry) => entry.endsWith('.tmp'))).toBe(false);
  });

  it('does not revive malformed persisted data', () => {
    const store = new PipelineStore(TEST_ROOT);
    const runsDirectory = path.join(TEST_ROOT, 'runs');
    fs.mkdirSync(runsDirectory, { recursive: true });
    fs.writeFileSync(path.join(runsDirectory, 'not-a-run.json'), '{bad json', 'utf8');
    expect(store.list()).toEqual([]);
  });

  it('keeps event JSONL bounded and ignores malformed rows', () => {
    const events = new PipelineEventLog(TEST_ROOT);
    const runId = '33333333-3333-4333-8333-333333333333';
    events.append({ schemaVersion: 1, runId, type: 'note', message: 'Без секретов.', timestamp: '2026-07-20T10:00:00.000Z' });
    const eventFile = path.join(TEST_ROOT, 'events', `${runId}.jsonl`);
    fs.appendFileSync(eventFile, 'not json\n', 'utf8');
    expect(events.read(runId)).toHaveLength(1);
  });
});
