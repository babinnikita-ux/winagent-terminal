import { describe, expect, it } from 'vitest';
import { classifyProcessFailure } from '../../src/main/pipeline/failure-classifier';

describe('pipeline failure classifier', () => {
  it('keeps subscription and authentication failures distinct', () => {
    expect(classifyProcessFailure({ exitCode: 1, signal: null, reason: 'process_crash', stdout: '', stderr: 'Please sign in to continue', outputTruncated: false })).toBe('AUTH_REQUIRED');
    expect(classifyProcessFailure({ exitCode: 1, signal: null, reason: 'process_crash', stdout: '', stderr: 'subscription limit reached', outputTruncated: false })).toBe('SUBSCRIPTION_LIMIT');
  });

  it('prioritizes a supervisor timeout over provider text', () => {
    expect(classifyProcessFailure({ exitCode: null, signal: 'SIGTERM', reason: 'timeout', stdout: '', stderr: 'try again later', outputTruncated: false })).toBe('TIMEOUT');
  });
});
