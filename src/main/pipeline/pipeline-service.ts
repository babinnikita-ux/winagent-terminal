import path from 'path';
import { randomUUID } from 'crypto';
import { PipelineEventLog } from './pipeline-events';
import { createPipelineRun } from './pipeline-state-machine';
import { PipelineRun, createPipelineDraftSchema } from './schemas';
import { PipelineStore } from './pipeline-store';

/** Main-process façade used by IPC now and by the runner in later checkpoints. */
export class PipelineService {
  private readonly events: PipelineEventLog;

  constructor(private readonly store: PipelineStore, eventRootDirectory: string) {
    this.events = new PipelineEventLog(eventRootDirectory);
  }

  listRuns(): PipelineRun[] {
    return this.store.list();
  }

  getRun(runId: string): PipelineRun | null {
    return this.store.get(runId);
  }

  createDraft(input: unknown): PipelineRun {
    const request = createPipelineDraftSchema.parse(input);
    if (!path.isAbsolute(request.repositoryPath)) {
      throw new Error('Путь к репозиторию должен быть абсолютным.');
    }
    const run = createPipelineRun({
      id: randomUUID(),
      repositoryPath: path.resolve(request.repositoryPath),
      task: request.task,
      autonomyMode: request.autonomyMode,
      executionMode: request.executionMode,
      useWorktree: request.useWorktree,
    });
    this.store.save(run);
    this.events.append({
      schemaVersion: 1,
      runId: run.id,
      type: 'run_created',
      message: 'Черновик конвейера создан.',
      timestamp: run.createdAt,
    });
    return run;
  }
}
