import path from 'path';
import { randomUUID } from 'crypto';
import { PipelineEventLog } from './pipeline-events';
import { createPipelineRun } from './pipeline-state-machine';
import { PipelineRun, createPipelineDraftSchema } from './schemas';
import { PipelineStore } from './pipeline-store';
import { PipelineRunner } from './pipeline-runner';
import { GitWorkspaceService } from './git-workspace-service';
import { PromptAssembler } from './prompt-assembler';
import { CodexAdapter } from './adapters/codex-adapter';
import { ClaudeAdapter } from './adapters/claude-adapter';
import { GeminiAdapter } from './adapters/gemini-adapter';
import { CliCapability } from './adapters/cli-capability-probe';

/** Main-process façade used by IPC now and by the runner in later checkpoints. */
export class PipelineService {
  private readonly events: PipelineEventLog;
  private readonly runner: PipelineRunner;
  private readonly activeRuns = new Set<string>();

  constructor(private readonly store: PipelineStore, eventRootDirectory: string) {
    this.events = new PipelineEventLog(eventRootDirectory);
    this.runner = new PipelineRunner({
      store,
      git: new GitWorkspaceService(path.join(eventRootDirectory, 'worktrees')),
      promptAssembler: new PromptAssembler(),
      adapters: {
        codex: new CodexAdapter(),
        claude: new ClaudeAdapter(),
        gemini: new GeminiAdapter(),
      },
    });
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

  start(runId: string): PipelineRun {
    const run = this.store.get(runId);
    if (!run) throw new Error('Конвейер не найден.');
    if (run.status !== 'created') throw new Error('Этот конвейер уже был запущен.');
    if (!run.useWorktree) throw new Error('В первом релизе конвейер запускается только в изолированном Git worktree.');
    if (this.activeRuns.has(runId)) return run;
    this.activeRuns.add(runId);
    void this.runner.run(run).finally(() => this.activeRuns.delete(runId));
    return run;
  }

  async getCapabilities(): Promise<CliCapability[]> {
    return Promise.all([
      new CodexAdapter().probe(),
      new ClaudeAdapter().probe(),
      new GeminiAdapter().probe(),
    ]);
  }

  stop(runId: string): boolean {
    return this.runner.cancel(runId);
  }
}
