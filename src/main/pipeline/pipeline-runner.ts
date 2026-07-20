import { ArtifactStore } from './artifact-store';
import { classifyProcessFailure } from './failure-classifier';
import { GitWorkspaceService } from './git-workspace-service';
import { PromptAssembler } from './prompt-assembler';
import { ProcessResult, SupervisedProcess } from './process-supervisor';
import {
  stageForRunStatus,
  transitionPipelineState,
  transitionStageState,
} from './pipeline-state-machine';
import { PipelineStore } from './pipeline-store';
import { PipelineRun, PipelineStage, PipelineStageId, StageResult } from './schemas';
import { AgentAdapter, AgentExecutionRequest } from './adapters/agent-adapter';

export interface PipelineRunnerDependencies {
  store: PipelineStore;
  git: GitWorkspaceService;
  promptAssembler: PromptAssembler;
  adapters: Record<'codex' | 'claude' | 'gemini', AgentAdapter>;
}

const ACTIVE_STAGE_STATUSES: Record<PipelineStageId, PipelineRun['status']> = {
  coordinator: 'coordinating',
  researcher: 'researching',
  architect: 'architecting',
  implementer: 'implementing',
  reviewer: 'reviewing',
  fixer: 'fixing',
  finalizer: 'verifying',
};

/** Sequential pipeline executor. Its only writer is the Codex adapter in an isolated worktree. */
export class PipelineRunner {
  constructor(private readonly dependencies: PipelineRunnerDependencies) {}

  async run(initial: PipelineRun): Promise<PipelineRun> {
    let run = initial;
    const artifactStore = new ArtifactStore(run.repositoryPath, run.id);
    try {
      artifactStore.initialize(run.task);
      run = this.save(transitionPipelineState(run, 'preflight'));
      const preflight = this.dependencies.git.preflight(run.repositoryPath);
      const worktree = this.dependencies.git.createWorktree(preflight, run.id);
      run = this.save({ ...run, branch: worktree.branch, worktreePath: worktree.path, updatedAt: new Date().toISOString() });

      for (const stage of run.stages) {
        run = await this.runStage(run, stage, artifactStore);
        if (run.status !== ACTIVE_STAGE_STATUSES[stage.id]) return run;
      }
      return this.save(transitionPipelineState(run, 'completed'));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (run.status === 'preflight' || Object.values(ACTIVE_STAGE_STATUSES).includes(run.status)) {
        run = transitionPipelineState(run, 'failed');
      }
      return this.save({ ...run, failureReason: message, updatedAt: new Date().toISOString() });
    }
  }

  private async runStage(run: PipelineRun, sourceStage: PipelineStage, artifactStore: ArtifactStore): Promise<PipelineRun> {
    const activeStatus = ACTIVE_STAGE_STATUSES[sourceStage.id];
    if (stageForRunStatus(activeStatus) !== sourceStage.id) throw new Error(`Stage mapping is invalid for ${sourceStage.id}.`);
    run = this.save(transitionPipelineState(run, activeStatus));
    const runningStage = transitionStageState(sourceStage, 'running');
    run = this.replaceStage(run, runningStage);
    const adapter = this.dependencies.adapters[sourceStage.provider];
    const capability = await adapter.probe();
    if (!capability.available) {
      if (run.executionMode === 'strict') return this.failStage(run, runningStage, capability.reason ?? 'RUNTIME_NOT_FOUND', capability.details);
      return this.skipStage(run, sourceStage, `Провайдер недоступен: ${capability.details}`);
    }
    const prompt = this.dependencies.promptAssembler.assemble({
      stageId: sourceStage.id,
      repositoryPath: run.worktreePath ?? run.repositoryPath,
      userTask: run.task,
      priorArtifacts: [],
    });
    const request: AgentExecutionRequest = { runId: run.id, stage: runningStage, cwd: run.worktreePath ?? run.repositoryPath, prompt };
    const before = this.dependencies.git.snapshot(request.cwd);
    const invocation = adapter.execute(request);
    const process = await invocation.result;
    artifactStore.writeLog('stdout.log', process.stdout);
    artifactStore.writeLog('stderr.log', process.stderr);
    if (process.reason !== 'completed') return this.failStage(run, runningStage, classifyProcessFailure(process), process.stderr || process.stdout);

    let result: StageResult;
    try {
      result = adapter.parseResult(process.stdout, request);
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : String(error);
      return this.failStage(run, runningStage, 'MALFORMED_OUTPUT', details);
    }
    const after = this.dependencies.git.snapshot(request.cwd);
    if (!runningStage.writeAccess && (before.status !== after.status || before.diff !== after.diff)) {
      return this.failStage(run, runningStage, 'GIT_CONFLICT', 'Read-only этап изменил Git-состояние worktree.');
    }
    artifactStore.writeStageArtifact(result);
    return this.replaceStage(run, transitionStageState({ ...runningStage, result }, 'succeeded'));
  }

  private skipStage(run: PipelineRun, stage: PipelineStage, details: string): PipelineRun {
    return this.replaceStage(run, transitionStageState(stage, 'skipped'), details);
  }

  private failStage(run: PipelineRun, stage: PipelineStage, reason: string, details: string): PipelineRun {
    const paused = reason === 'AUTH_REQUIRED' || reason === 'SUBSCRIPTION_LIMIT' || reason === 'PERMISSION_REQUIRED';
    const status = paused
      ? reason === 'AUTH_REQUIRED' ? 'paused_auth' : reason === 'SUBSCRIPTION_LIMIT' ? 'paused_quota' : 'paused_approval'
      : 'failed';
    const nextRun = this.replaceStage(run, transitionStageState(stage, paused ? 'paused' : 'failed'), details);
    return this.save({ ...transitionPipelineState(nextRun, status), failureReason: `${reason}: ${details}`, updatedAt: new Date().toISOString() });
  }

  private replaceStage(run: PipelineRun, stage: PipelineStage, failureReason?: string): PipelineRun {
    const stages = run.stages.map((candidate) => candidate.id === stage.id ? stage : candidate);
    return this.save({ ...run, stages, failureReason, updatedAt: new Date().toISOString() });
  }

  private save(run: PipelineRun): PipelineRun {
    return this.dependencies.store.save(run);
  }
}

export function successfulProcess(output: string): SupervisedProcess {
  const result: ProcessResult = { exitCode: 0, signal: null, reason: 'completed', stdout: output, stderr: '', outputTruncated: false };
  return { pid: undefined, result: Promise.resolve(result), cancel: () => undefined };
}
