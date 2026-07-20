import path from 'path';
import { describe, expect, it } from 'vitest';
import { ProcessSupervisor } from '../../src/main/pipeline/process-supervisor';

const FIXTURE = path.resolve('tests/fixtures/pipeline/fake-cli.js');

function start(mode: string, overrides: Partial<Parameters<ProcessSupervisor['start']>[0]> = {}) {
  return new ProcessSupervisor().start({
    executable: process.execPath,
    args: [FIXTURE, mode],
    cwd: process.cwd(),
    timeoutMs: 2_000,
    ...overrides,
  });
}

describe('process supervisor', () => {
  it('runs without a shell and returns a bounded successful stream', async () => {
    const result = await start('success').result;
    expect(result.reason).toBe('completed');
    expect(result.stdout).toContain('"result"');
  });

  it('redacts and bounds stderr', async () => {
    const result = await start('large-stderr', { maxOutputBytes: 120 }).result;
    expect(result.reason).toBe('process_crash');
    expect(result.stderr).not.toContain('should-not-leak');
    expect(Buffer.byteLength(result.stderr)).toBeLessThanOrEqual(120);
    expect(result.outputTruncated).toBe(true);
  });

  it('cancels a timed-out child tree', async () => {
    const result = await start('hang', { timeoutMs: 500 }).result;
    expect(result.reason).toBe('timeout');
  });
});
