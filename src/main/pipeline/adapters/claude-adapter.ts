import { ProcessSupervisor, SupervisedProcess } from '../process-supervisor';
import { PipelineStage, StageResult } from '../schemas';
import { AgentAdapter, AgentExecutionRequest } from './agent-adapter';
import { CliCapability, CliCapabilityProbe } from './cli-capability-probe';
import { prepareOfficialCliCommand } from './cli-launch-resolver';

interface ClaudeAdapterOptions {
  executable?: string;
  supervisor?: ProcessSupervisor;
  capabilityProbe?: CliCapabilityProbe;
}

interface ClaudeJsonEvent {
  type?: string;
  result?: string;
  message?: { content?: string | Array<{ text?: string }> };
  session_id?: string;
}

function messageText(message: ClaudeJsonEvent['message']): string | undefined {
  if (!message) return undefined;
  if (typeof message.content === 'string') return message.content;
  return message.content?.map((part) => part.text ?? '').join('') || undefined;
}

/** Claude is permanently a read-only researcher/architect/reviewer in this pipeline. */
export class ClaudeAdapter implements AgentAdapter {
  readonly provider = 'claude' as const;
  private readonly executable: string;
  private readonly supervisor: ProcessSupervisor;
  private readonly capabilityProbe: CliCapabilityProbe;

  constructor(options: ClaudeAdapterOptions = {}) {
    this.executable = options.executable ?? 'claude';
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
        '--print',
        '--output-format', 'stream-json',
        '--permission-mode', 'plan',
        '--verbose',
      ],
      cwd: request.cwd,
      // Claude Code supports text prompts on stdin in print mode. Arguments
      // remain fixed, so task text can never become an executable command.
      stdin: request.prompt,
    };
  }

  parseResult(output: string, request: AgentExecutionRequest): StageResult {
    this.assertReadOnlyStage(request.stage);
    const events = output.split('\n').filter(Boolean).map((line) => {
      try {
        return JSON.parse(line) as ClaudeJsonEvent;
      } catch {
        throw new Error('MALFORMED_OUTPUT: Claude вернул невалидный JSONL.');
      }
    });
    const completion = [...events].reverse().find((event) => event.type === 'result');
    if (!completion) throw new Error('MALFORMED_OUTPUT: в JSONL Claude отсутствует финальный результат.');
    const summary = completion.result ?? messageText(completion.message) ?? 'Этап Claude завершён.';
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
      sessionId: completion.session_id,
      startedAt: now,
      finishedAt: now,
    };
  }

  execute(request: AgentExecutionRequest): SupervisedProcess {
    return this.supervisor.start(prepareOfficialCliCommand(this.provider, this.buildCommand(request)));
  }

  private assertReadOnlyStage(stage: PipelineStage): void {
    if (stage.provider !== this.provider || stage.writeAccess) {
      throw new Error('Claude adapter can execute only its dedicated read-only stages.');
    }
  }
}
