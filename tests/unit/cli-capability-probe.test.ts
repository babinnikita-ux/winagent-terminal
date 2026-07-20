import { describe, expect, it } from 'vitest';
import { classifyCapabilityOutput, findExecutable } from '../../src/main/pipeline/adapters/cli-capability-probe';

describe('CLI capability probe', () => {
  it('does not treat Antigravity migration output as an available Gemini runtime', () => {
    expect(classifyCapabilityOutput('This client is no longer supported. Migrate to Antigravity.')).toBe('UNSUPPORTED_VERSION');
  });

  it('finds only an explicit executable from PATH', () => {
    expect(findExecutable('definitely-missing-winagent-cli', { PATH: process.cwd() })).toBeUndefined();
  });
});
