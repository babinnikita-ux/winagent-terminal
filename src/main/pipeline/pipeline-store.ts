import fs from 'fs';
import path from 'path';
import { PipelineRun, pipelineRunSchema } from './schemas';

/** App-data persistence for resumable pipeline metadata. */
export class PipelineStore {
  constructor(private readonly rootDirectory: string) {}

  save(run: PipelineRun): PipelineRun {
    const validRun = pipelineRunSchema.parse(run);
    const target = this.getPath(validRun.id);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(validRun, null, 2), 'utf8');
    fs.renameSync(temporary, target);
    return validRun;
  }

  get(runId: string): PipelineRun | null {
    const target = this.getPath(runId);
    if (!fs.existsSync(target)) return null;
    try {
      return pipelineRunSchema.parse(JSON.parse(fs.readFileSync(target, 'utf8')) as unknown);
    } catch {
      return null;
    }
  }

  list(): PipelineRun[] {
    const directory = this.getRunsDirectory();
    if (!fs.existsSync(directory)) return [];
    return fs.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .flatMap((entry) => {
        const run = this.get(path.basename(entry.name, '.json'));
        return run ? [run] : [];
      })
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  private getRunsDirectory(): string {
    return path.join(this.rootDirectory, 'runs');
  }

  private getPath(runId: string): string {
    return path.join(this.getRunsDirectory(), `${runId}.json`);
  }
}
