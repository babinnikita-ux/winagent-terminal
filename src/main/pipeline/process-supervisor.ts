import { ChildProcess, spawn } from 'child_process';
import { buildCliEnvironment, redactSecrets } from './redaction';

export type ProcessExitReason = 'completed' | 'cancelled' | 'timeout' | 'process_crash';

export interface ProcessCommand {
  executable: string;
  args: string[];
  cwd: string;
  stdin?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs?: number;
  maxOutputBytes?: number;
}

export interface ProcessResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  reason: ProcessExitReason;
  stdout: string;
  stderr: string;
  outputTruncated: boolean;
}

export interface SupervisedProcess {
  readonly pid: number | undefined;
  readonly result: Promise<ProcessResult>;
  cancel(): void;
}

const DEFAULT_MAX_OUTPUT_BYTES = 512 * 1024;
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;

function appendBounded(current: string, chunk: string, maxBytes: number): { value: string; truncated: boolean } {
  const available = Math.max(0, maxBytes - Buffer.byteLength(current));
  if (available === 0) return { value: current, truncated: chunk.length > 0 };
  const slice = Buffer.from(chunk).subarray(0, available).toString('utf8');
  return { value: current + slice, truncated: slice.length < chunk.length };
}

function terminateProcessTree(child: ChildProcess): void {
  if (!child.pid) return;
  // Terminate the direct child first. `taskkill` can be denied by endpoint
  // protection, but that must not leave the pipeline waiting forever.
  child.kill('SIGTERM');
  if (process.platform === 'win32') {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], { shell: false, windowsHide: true, stdio: 'ignore' });
    killer.on('error', () => { /* the direct child was already terminated */ });
    return;
  }
}

/** Owns one non-shell CLI process, bounded/redacted output and its process tree. */
export class ProcessSupervisor {
  start(command: ProcessCommand): SupervisedProcess {
    if (!command.executable.trim()) throw new Error('CLI executable must not be empty.');
    if (!command.cwd.trim()) throw new Error('CLI working directory must not be empty.');

    const maxOutputBytes = command.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
    const timeoutMs = command.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let child: ChildProcess;
    let cancelled = false;
    let timedOut = false;
    let stdout = '';
    let stderr = '';
    let outputTruncated = false;

    const result = new Promise<ProcessResult>((resolve) => {
      try {
        child = spawn(command.executable, command.args, {
          cwd: command.cwd,
          env: { ...buildCliEnvironment(), ...buildCliEnvironment(command.env) },
          shell: false,
          windowsHide: true,
          stdio: 'pipe',
        });
      } catch {
        resolve({ exitCode: null, signal: null, reason: 'process_crash', stdout, stderr, outputTruncated });
        return;
      }

      const append = (target: 'stdout' | 'stderr', raw: Buffer | string) => {
        const value = redactSecrets(raw.toString());
        const next = appendBounded(target === 'stdout' ? stdout : stderr, value, maxOutputBytes);
        if (target === 'stdout') stdout = next.value;
        else stderr = next.value;
        outputTruncated ||= next.truncated;
      };
      child.stdout?.on('data', (chunk: Buffer) => append('stdout', chunk));
      child.stderr?.on('data', (chunk: Buffer) => append('stderr', chunk));
      child.on('error', (error: Error) => append('stderr', error.message));

      if (command.stdin !== undefined) child.stdin?.end(command.stdin);
      else child.stdin?.end();

      const timer = setTimeout(() => {
        timedOut = true;
        terminateProcessTree(child);
      }, timeoutMs);
      child.on('close', (exitCode: number | null, signal: NodeJS.Signals | null) => {
        clearTimeout(timer);
        const reason: ProcessExitReason = timedOut
          ? 'timeout'
          : cancelled
            ? 'cancelled'
            : exitCode === 0
              ? 'completed'
              : 'process_crash';
        resolve({ exitCode, signal, reason, stdout, stderr, outputTruncated });
      });
    });

    return {
      get pid() { return child?.pid; },
      result,
      cancel: () => {
        if (!child || cancelled) return;
        cancelled = true;
        terminateProcessTree(child);
      },
    };
  }
}
