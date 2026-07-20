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
import { createPipelineRun } from '../../src/main/pipeline/pipeline-state-machine';
import { PipelineStore } from '../../src/main/pipeline/pipeline-store';
import { ProcessCommand, SupervisedProcess } from '../../src/main/pipeline/process-supervisor';
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
});
