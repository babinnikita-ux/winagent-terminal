import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AgentAdapter, AgentExecutionRequest } from '../../src/main/pipeline/adapters/agent-adapter';
import { CliCapability } from '../../src/main/pipeline/adapters/cli-capability-probe';
import { GitWorkspaceService } from '../../src/main/pipeline/git-workspace-service';
import { PromptAssembler } from '../../src/main/pipeline/prompt-assembler';
import { PipelineRunner, successfulProcess } from '../../src/main/pipeline/pipeline-runner';
import { createPipelineRun, transitionPipelineState } from '../../src/main/pipeline/pipeline-state-machine';
import { PipelineStore } from '../../src/main/pipeline/pipeline-store';
import { ProcessCommand, ProcessResult, SupervisedProcess } from '../../src/main/pipeline/process-supervisor';
import { PipelineProvider, StageResult } from '../../src/main/pipeline/schemas';

const ROOT = path.join(os.tmpdir(), `winagent-runner-${process.pid}`);
const REPO = path.join(ROOT, 'repo');
const RUN_ID = '99999999-9999-4999-8999-999999999999';

function git(args: string[]): string {
  return execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
}

class FakeAdapter implements AgentAdapter {
  constructor(readonly provider: PipelineProvider, private readonly available = true) {}

  probe(): Promise<CliCapability> {
    return Promise.resolve(this.available
      ? { provider: this.provider, available: true, auth: 'unknown', details: 'fixture' }
      : { provider: this.provider, available: false, auth: 'unknown', reason: 'RUNTIME_NOT_FOUND', details: 'fixture missing' });
  }

  buildCommand(_request: AgentExecutionRequest): ProcessCommand {
    return { executable: 'fixture', args: [], cwd: REPO };
  }

  parseResult(_output: string, request: AgentExecutionRequest): StageResult {
    const now = '2026-07-20T10:00:00.000Z';
    return {
      schemaVersion: 1,
      runId: request.runId,
      stageId: request.stage.id,
      provider: this.provider,
      status: 'success',
      summary: `${request.stage.id} готов`,
      findings: [],
      artifacts: [],
      nextStageContext: '',
      startedAt: now,
      finishedAt: now,
    };
  }

  execute(_request: AgentExecutionRequest): SupervisedProcess {
    return successfulProcess('{"type":"result"}\n');
  }
}

class PausableAdapter extends FakeAdapter {
  constructor(provider: PipelineProvider, private readonly onExecute: () => void) {
    super(provider);
  }

  execute(_request: AgentExecutionRequest): SupervisedProcess {
    let finish: (result: ProcessResult) => void = () => undefined;
    this.onExecute();
    return {
      pid: 1,
      result: new Promise<ProcessResult>((resolve) => { finish = resolve; }),
      cancel: () => finish({ exitCode: null, signal: 'SIGTERM', reason: 'cancelled', stdout: '', stderr: '', outputTruncated: false }),
    };
  }
}

beforeEach(() => {
  fs.mkdirSync(REPO, { recursive: true });
  git(['init', '--initial-branch=main']);
  git(['config', 'user.email', 'test@winagent.local']);
  git(['config', 'user.name', 'WinAgent Test']);
  fs.writeFileSync(path.join(REPO, 'README.md'), '# Fixture\n', 'utf8');
  git(['add', '.']);
  git(['commit', '-m', 'fixture']);
});

afterEach(() => fs.rmSync(ROOT, { recursive: true, force: true }));

describe('PipelineRunner', () => {
  it('runs the full ordered fake pipeline in an isolated worktree', async () => {
    const store = new PipelineStore(path.join(ROOT, 'state'));
    const run = createPipelineRun({ id: RUN_ID, repositoryPath: REPO, task: 'Проверить полный цикл.', autonomyMode: 'safe', executionMode: 'strict', useWorktree: true, now: '2026-07-20T10:00:00.000Z' });
    const runner = new PipelineRunner({
      store,
      git: new GitWorkspaceService(path.join(ROOT, 'worktrees')),
      promptAssembler: new PromptAssembler(path.resolve('resources/pipeline-prompts/v1')),
      adapters: { codex: new FakeAdapter('codex'), claude: new FakeAdapter('claude'), gemini: new FakeAdapter('gemini') },
    });
    const completed = await runner.run(store.save(run));
    expect(completed.status).toBe('completed');
    expect(completed.stages.every((stage) => stage.status === 'succeeded')).toBe(true);
    expect(completed.branch).toBe('winagent/run-99999999');
    expect(fs.existsSync(path.join(REPO, '.winagent', 'runs', RUN_ID, 'FINAL.md'))).toBe(true);
    expect(git(['branch', '--show-current'])).toBe('main');
  });

  it('stops strict mode when one required CLI is missing', async () => {
    const store = new PipelineStore(path.join(ROOT, 'state'));
    const run = createPipelineRun({ id: RUN_ID, repositoryPath: REPO, task: 'Проверить strict.', autonomyMode: 'safe', executionMode: 'strict', useWorktree: true, now: '2026-07-20T10:00:00.000Z' });
    const runner = new PipelineRunner({
      store,
      git: new GitWorkspaceService(path.join(ROOT, 'worktrees')),
      promptAssembler: new PromptAssembler(path.resolve('resources/pipeline-prompts/v1')),
      adapters: { codex: new FakeAdapter('codex'), claude: new FakeAdapter('claude'), gemini: new FakeAdapter('gemini', false) },
    });
    const stopped = await runner.run(store.save(run));
    expect(stopped.status).toBe('failed');
    expect(stopped.failureReason).toContain('RUNTIME_NOT_FOUND');
  });

  it('retries a paused stage only after an explicit resume call', async () => {
    const store = new PipelineStore(path.join(ROOT, 'state'));
    const gitService = new GitWorkspaceService(path.join(ROOT, 'worktrees'));
    const worktree = gitService.createWorktree(gitService.preflight(REPO), RUN_ID);
    let run = createPipelineRun({ id: RUN_ID, repositoryPath: REPO, task: 'Повторить явно.', autonomyMode: 'safe', executionMode: 'strict', useWorktree: true, now: '2026-07-20T10:00:00.000Z' });
    run = transitionPipelineState(run, 'preflight');
    run = { ...run, branch: worktree.branch, worktreePath: worktree.path };
    run = transitionPipelineState(run, 'coordinating');
    run = { ...run, stages: [{ ...run.stages[0], status: 'paused' }, ...run.stages.slice(1)] };
    run = transitionPipelineState(run, 'paused_user');
    const runner = new PipelineRunner({
      store,
      git: gitService,
      promptAssembler: new PromptAssembler(path.resolve('resources/pipeline-prompts/v1')),
      adapters: { codex: new FakeAdapter('codex'), claude: new FakeAdapter('claude'), gemini: new FakeAdapter('gemini') },
    });
    const resumed = await runner.resume(store.save(run));
    expect(resumed.status).toBe('completed');
    expect(resumed.stages.every((stage) => stage.status === 'succeeded')).toBe(true);
  });

  it('pauses the active process and does not continue to the next stage', async () => {
    const store = new PipelineStore(path.join(ROOT, 'state'));
    const run = createPipelineRun({ id: RUN_ID, repositoryPath: REPO, task: 'Поставить на паузу.', autonomyMode: 'safe', executionMode: 'strict', useWorktree: true, now: '2026-07-20T10:00:00.000Z' });
    let signalStarted: () => void = () => undefined;
    const started = new Promise<void>((resolve) => { signalStarted = resolve; });
    const runner = new PipelineRunner({
      store,
      git: new GitWorkspaceService(path.join(ROOT, 'worktrees')),
      promptAssembler: new PromptAssembler(path.resolve('resources/pipeline-prompts/v1')),
      adapters: { codex: new PausableAdapter('codex', signalStarted), claude: new FakeAdapter('claude'), gemini: new FakeAdapter('gemini') },
    });
    const executing = runner.run(store.save(run));
    await started;
    expect(runner.pause(RUN_ID)).toBe(true);
    const paused = await executing;
    expect(paused.status).toBe('paused_user');
    expect(paused.stages[0].status).toBe('paused');
    expect(paused.stages[1].status).toBe('pending');
  });
});
