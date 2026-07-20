import fs from 'fs';
import path from 'path';
import { PipelineStageId, pipelineStageIdSchema } from './schemas';

export interface PromptAssemblyInput {
  stageId: PipelineStageId;
  userTask: string;
  repositoryPath: string;
  priorArtifacts: Array<{ name: string; content: string }>;
}

function defaultPromptRoot(): string {
  if (process.resourcesPath) return path.join(process.resourcesPath, 'pipeline-prompts', 'v1');
  return path.resolve(__dirname, '../../../resources/pipeline-prompts/v1');
}

/** Builds a role prompt while explicitly treating task and artifacts as untrusted data. */
export class PromptAssembler {
  constructor(private readonly promptRoot = defaultPromptRoot()) {}

  assemble(input: PromptAssemblyInput): string {
    const stageId = pipelineStageIdSchema.parse(input.stageId);
    const template = fs.readFileSync(path.join(this.promptRoot, `${stageId}.md`), 'utf8');
    const artifacts = input.priorArtifacts.length === 0
      ? '(нет предыдущих артефактов)'
      : input.priorArtifacts.map((artifact) => `### ${artifact.name}\n\n${artifact.content}`).join('\n\n');
    return template
      .replace('{{REPOSITORY_PATH}}', input.repositoryPath)
      .replace('{{USER_TASK}}', input.userTask)
      .replace('{{PRIOR_ARTIFACTS}}', artifacts);
  }
}
