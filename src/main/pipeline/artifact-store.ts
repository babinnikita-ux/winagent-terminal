import fs from 'fs';
import path from 'path';
import { PipelineEvent, StageResult, pipelineEventSchema, stageResultSchema } from './schemas';

export const STAGE_ARTIFACT_NAMES = {
  coordinator: '01-task-brief.md',
  researcher: '02-research.md',
  architect: '03-architecture.md',
  implementer: '04-implementation.md',
  reviewer: '05-review.md',
  fixer: '06-fixes.md',
  finalizer: 'FINAL.md',
} as const;

/** Portable, user-visible artifacts; never stores secrets or credentials. */
export class ArtifactStore {
  private readonly runDirectory: string;

  constructor(repositoryPath: string, runId: string) {
    if (!path.isAbsolute(repositoryPath)) throw new Error('Путь репозитория должен быть абсолютным.');
    if (!/^[0-9a-f-]{36}$/i.test(runId)) throw new Error('Некорректный идентификатор run.');
    this.runDirectory = path.join(path.resolve(repositoryPath), '.winagent', 'runs', runId);
  }

  initialize(userRequest: string): void {
    fs.mkdirSync(path.join(this.runDirectory, 'logs'), { recursive: true });
    this.writeText('00-user-request.md', `${userRequest.trim()}\n`);
  }

  writeStageArtifact(result: StageResult): string {
    const valid = stageResultSchema.parse(result);
    const fileName = STAGE_ARTIFACT_NAMES[valid.stageId];
    const findings = valid.findings.length === 0
      ? 'Нет.'
      : valid.findings.map((finding) => `- **${finding.severity}** — ${finding.title}: ${finding.details}`).join('\n');
    this.writeText(fileName, `# ${valid.stageId}\n\n${valid.summary}\n\n## Findings\n\n${findings}\n\n## Контекст следующего этапа\n\n${valid.nextStageContext}\n`);
    return path.join(this.runDirectory, fileName);
  }

  appendEvent(event: PipelineEvent): void {
    const valid = pipelineEventSchema.parse(event);
    const eventPath = path.join(this.runDirectory, 'events.jsonl');
    fs.mkdirSync(this.runDirectory, { recursive: true });
    fs.appendFileSync(eventPath, `${JSON.stringify(valid)}\n`, 'utf8');
  }

  writeLog(name: 'stdout.log' | 'stderr.log', content: string): string {
    const target = path.join(this.runDirectory, 'logs', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, 'utf8');
    return target;
  }

  getRunDirectory(): string {
    return this.runDirectory;
  }

  private writeText(fileName: string, content: string): void {
    const target = path.join(this.runDirectory, fileName);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, content, 'utf8');
    fs.renameSync(temporary, target);
  }
}
