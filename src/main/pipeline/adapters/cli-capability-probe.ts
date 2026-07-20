import fs from 'fs';
import path from 'path';
import { ProcessSupervisor } from '../process-supervisor';
import { PipelineProvider, pipelineProviderSchema } from '../schemas';
import { resolveOfficialCliLaunch } from './cli-launch-resolver';

export type CapabilityReason = 'RUNTIME_NOT_FOUND' | 'UNSUPPORTED_VERSION' | 'PROCESS_CRASH' | 'TIMEOUT';

export interface CliCapability {
  provider: PipelineProvider;
  available: boolean;
  executable?: string;
  version?: string;
  auth: 'unknown';
  reason?: CapabilityReason;
  details: string;
}

function executableCandidates(command: string): string[] {
  if (path.extname(command)) return [command];
  return process.platform === 'win32' ? [command, `${command}.cmd`, `${command}.exe`, `${command}.bat`] : [command];
}

export function findExecutable(command: string, environment: NodeJS.ProcessEnv = process.env): string | undefined {
  if (path.isAbsolute(command)) return fs.existsSync(command) ? command : undefined;
  const pathValue = environment.PATH ?? environment.Path ?? '';
  for (const directory of pathValue.split(path.delimiter).filter(Boolean)) {
    for (const candidate of executableCandidates(command)) {
      const resolved = path.join(directory, candidate);
      if (fs.existsSync(resolved)) return resolved;
    }
  }
  return undefined;
}

export function classifyCapabilityOutput(output: string): CapabilityReason | undefined {
  return /no longer supported|unsupported(?:\s+version)?|migrate to antigravity/i.test(output)
    ? 'UNSUPPORTED_VERSION'
    : undefined;
}

/** Only locates a local official CLI and invokes `--version`; it never probes credentials. */
export class CliCapabilityProbe {
  constructor(private readonly supervisor = new ProcessSupervisor(), private readonly environment: NodeJS.ProcessEnv = process.env) {}

  async probe(providerInput: PipelineProvider): Promise<CliCapability> {
    const provider = pipelineProviderSchema.parse(providerInput);
    const launch = resolveOfficialCliLaunch(provider, this.environment);
    const executable = launch?.executable;
    if (!executable) {
      return { provider, available: false, auth: 'unknown', reason: 'RUNTIME_NOT_FOUND', details: 'Официальный CLI не найден в PATH.' };
    }

    const invocation = this.supervisor.start({ executable, args: [...launch.argsPrefix, '--version'], cwd: process.cwd(), timeoutMs: 10_000, env: this.environment });
    const result = await invocation.result;
    const output = `${result.stdout}\n${result.stderr}`.trim();
    const classified = classifyCapabilityOutput(output);
    if (classified) {
      return { provider, available: false, executable, auth: 'unknown', reason: classified, details: output || 'Версия CLI не поддерживается.' };
    }
    if (result.reason === 'timeout') {
      return { provider, available: false, executable, auth: 'unknown', reason: 'TIMEOUT', details: 'Проверка версии CLI превысила лимит времени.' };
    }
    if (result.reason !== 'completed') {
      return { provider, available: false, executable, auth: 'unknown', reason: 'PROCESS_CRASH', details: output || 'Не удалось запустить CLI.' };
    }
    return { provider, available: true, executable, version: output, auth: 'unknown', details: 'CLI обнаружен. Авторизация проверяется только при запуске этапа.' };
  }
}
