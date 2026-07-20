import fs from 'fs';
import path from 'path';
import { PipelineEvent, pipelineEventSchema } from './schemas';

const MAX_EVENT_BYTES = 512 * 1024;

/** Append-only local event log. The pipeline never forwards raw CLI output here. */
export class PipelineEventLog {
  constructor(private readonly rootDirectory: string) {}

  append(event: PipelineEvent): void {
    const validEvent = pipelineEventSchema.parse(event);
    const eventPath = this.getPath(validEvent.runId);
    fs.mkdirSync(path.dirname(eventPath), { recursive: true });
    const line = `${JSON.stringify(validEvent)}\n`;
    const existingSize = fs.existsSync(eventPath) ? fs.statSync(eventPath).size : 0;
    if (existingSize + Buffer.byteLength(line) > MAX_EVENT_BYTES) return;
    fs.appendFileSync(eventPath, line, 'utf8');
  }

  read(runId: string): PipelineEvent[] {
    const eventPath = this.getPath(runId);
    if (!fs.existsSync(eventPath)) return [];
    return fs.readFileSync(eventPath, 'utf8').split('\n').filter(Boolean)
      .flatMap((line) => {
        try {
          const parsed = pipelineEventSchema.safeParse(JSON.parse(line) as unknown);
          return parsed.success ? [parsed.data] : [];
        } catch {
          return [];
        }
      });
  }

  private getPath(runId: string): string {
    return path.join(this.rootDirectory, 'events', `${runId}.jsonl`);
  }
}
