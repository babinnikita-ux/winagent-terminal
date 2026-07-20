import { ProcessCommand, SupervisedProcess } from '../process-supervisor';
import { PipelineProvider, PipelineStage, StageResult } from '../schemas';
import { CliCapability } from './cli-capability-probe';

export interface AgentExecutionRequest {
  runId: string;
  stage: PipelineStage;
  cwd: string;
  prompt: string;
}

/** Adapter contract; provider implementations are added in later checkpoints. */
export interface AgentAdapter {
  readonly provider: PipelineProvider;
  probe(): Promise<CliCapability>;
  buildCommand(request: AgentExecutionRequest): ProcessCommand;
  parseResult(output: string, request: AgentExecutionRequest): StageResult;
  execute(request: AgentExecutionRequest): SupervisedProcess;
}
