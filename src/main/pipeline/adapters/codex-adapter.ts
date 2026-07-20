import { classifyProcessFailure } from '../failure-classifier';
import { ProcessSupervisor, SupervisedProcess } from '../process-supervisor';
import { PipelineFailureCode, PipelineProvider, StageResult } from '../schemas';
import { AgentAdapter, AgentExecutionRequest } from './agent-adapter';
import { CliCapability, CliCapabilityProbe } from './cli-capability-probe';
import { prepareOfficialCliCommand } from './cli-launch-resolver';

export interface SubscriptionPreflight {
  provider: PipelineProvider;
  ready: boolean;
  auth: 'authenticated' | 'required' | 'unknown';
  reason?: PipelineFailureCode;
  details: string;
}

interface CodexAdapterOptions {
  executable?: string;
  supervisor?: ProcessSupervisor;
  capabilityProbe?: CliCapabilityProbe;
}

interface CodexJsonEvent {
  type?: string;
  message?: string;
  summary?: string;
  session_id?: string;
  sessionId?: string;
}

/** Official local Codex CLI adapter. It never uses API-key or proxy configuration. */
export class CodexAdapter implements AgentAdapter {
  readonly provider = 'codex' as const;
  private readonly executable: string;
  private readonly supervisor: ProcessSupervisor;
  private readonly capabilityProbe: CliCapabilityProbe;

  constructor(options: CodexAdapterOptions = {}) {
    this.executable = options.executable ?? 'codex';
    this.supervisor = options.supervisor ?? new ProcessSupervisor();
    this.capabilityProbe = options.capabilityProbe ?? new CliCapabilityProbe(this.supervisor);
  }

  probe(): Promise<CliCapability> {
    return this.capabilityProbe.probe(this.provider);
  }

  async preflight(cwd: string): Promise<SubscriptionPreflight> {
    const capability = await this.probe();
    if (!capability.available) {
      return {
        provider: this.provider,
        ready: false,
        auth: 'unknown',
        reason: capability.reason ?? 'RUNTIME_NOT_FOUND',
        details: capability.details,
      };
    }

    // `codex login status` reports account readiness without exposing a token.
    const invocation = this.supervisor.start({ executable: capability.executable ?? this.executable, args: ['login', 'status'], cwd, timeoutMs: 10_000 });
    const result = await invocation.result;
    if (result.reason === 'completed') {
      return { provider: this.provider, ready: true, auth: 'authenticated', details: 'Подписочная авторизация Codex подтверждена CLI.' };
    }
    const reason = classifyProcessFailure(result);
    return {
      provider: this.provider,
      ready: false,
      auth: reason === 'AUTH_REQUIRED' ? 'required' : 'unknown',
      reason,
      details: result.stderr || result.stdout || 'Codex не подтвердил подписочную авторизацию.',
    };
  }

  buildCommand(request: AgentExecutionRequest) {
    this.assertRequest(request);
    return {
      executable: this.executable,
      args: [
        'exec',
        '--json',
        '--sandbox', request.stage.writeAccess ? 'workspace-write' : 'read-only',
        '-',
      ],
      cwd: request.cwd,
      stdin: request.prompt,
    };
  }

  parseResult(output: string, request: AgentExecutionRequest): StageResult {
    const events = output.split('\n').filter(Boolean).map((line) => {
      try {
        return JSON.parse(line) as CodexJsonEvent;
      } catch {
        throw new Error('MALFORMED_OUTPUT: Codex вернул невалидный JSONL.');
      }
    });
    const completed = [...events].reverse().find((event) => event.type === 'task_complete' || event.type === 'result');
    if (!completed) throw new Error('MALFORMED_OUTPUT: в JSONL Codex отсутствует финальный результат.');
    const now = new Date().toISOString();
    return {
      schemaVersion: 1,
      runId: request.runId,
      stageId: request.stage.id,
      provider: this.provider,
      status: 'success',
      summary: completed.summary ?? completed.message ?? 'Этап Codex завершён.',
      findings: [],
      artifacts: [],
      nextStageContext: completed.summary ?? completed.message ?? '',
      sessionId: completed.session_id ?? completed.sessionId,
      startedAt: now,
      finishedAt: now,
    };
  }

  execute(request: AgentExecutionRequest): SupervisedProcess {
    return this.supervisor.start(prepareOfficialCliCommand(this.provider, this.buildCommand(request)));
  }

  private assertRequest(request: AgentExecutionRequest): void {
    if (request.stage.provider !== this.provider) throw new Error('Codex adapter cannot execute a non-Codex stage.');
    if (!request.cwd.trim() || !request.prompt.trim()) throw new Error('Codex stage requires a working directory and prompt.');
  }
}
