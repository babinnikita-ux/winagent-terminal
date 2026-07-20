import { ProcessSupervisor, SupervisedProcess } from '../process-supervisor';
import { PipelineStage, StageResult } from '../schemas';
import { AgentAdapter, AgentExecutionRequest } from './agent-adapter';
import { CliCapability, CliCapabilityProbe } from './cli-capability-probe';

interface GeminiAdapterOptions {
  executable?: string;
  supervisor?: ProcessSupervisor;
  capabilityProbe?: CliCapabilityProbe;
}

interface GeminiJsonEvent {
  type?: string;
  response?: string;
  message?: string;
  sessionId?: string;
  session_id?: string;
}

/** Gemini remains its own provider: never substitute Antigravity or another CLI. */
export class GeminiAdapter implements AgentAdapter {
  readonly provider = 'gemini' as const;
  private readonly executable: string;
  private readonly supervisor: ProcessSupervisor;
  private readonly capabilityProbe: CliCapabilityProbe;

  constructor(options: GeminiAdapterOptions = {}) {
    this.executable = options.executable ?? 'gemini';
    this.supervisor = options.supervisor ?? new ProcessSupervisor();
    this.capabilityProbe = options.capabilityProbe ?? new CliCapabilityProbe(this.supervisor);
  }

  probe(): Promise<CliCapability> {
    return this.capabilityProbe.probe(this.provider);
  }

  buildCommand(request: AgentExecutionRequest) {
    this.assertReadOnlyStage(request.stage);
    return {
      executable: this.executable,
      args: [
        '--output-format', 'stream-json',
        '--approval-mode', 'plan',
        '--sandbox',
      ],
      cwd: request.cwd,
      // A piped prompt runs Gemini headlessly. Keeping task text off argv avoids
      // command-line leakage and stays safe for long Russian-language briefs.
      stdin: request.prompt,
    };
  }

  parseResult(output: string, request: AgentExecutionRequest): StageResult {
    this.assertReadOnlyStage(request.stage);
    const events = output.split('\n').filter(Boolean).map((line) => {
      try {
        return JSON.parse(line) as GeminiJsonEvent;
      } catch {
        throw new Error('MALFORMED_OUTPUT: Gemini вернул невалидный JSONL.');
      }
    });
    const completion = [...events].reverse().find((event) => event.type === 'result');
    if (!completion) throw new Error('MALFORMED_OUTPUT: в JSONL Gemini отсутствует финальный результат.');
    const summary = completion.response ?? completion.message ?? 'Этап Gemini завершён.';
    const now = new Date().toISOString();
    return {
      schemaVersion: 1,
      runId: request.runId,
      stageId: request.stage.id,
      provider: this.provider,
      status: 'success',
      summary,
      findings: [],
      artifacts: [],
      nextStageContext: summary,
      sessionId: completion.sessionId ?? completion.session_id,
      startedAt: now,
      finishedAt: now,
    };
  }

  execute(request: AgentExecutionRequest): SupervisedProcess {
    return this.supervisor.start(this.buildCommand(request));
  }

  private assertReadOnlyStage(stage: PipelineStage): void {
    if (stage.provider !== this.provider || stage.writeAccess) {
      throw new Error('Gemini adapter can execute only its dedicated read-only stage.');
    }
  }
}
