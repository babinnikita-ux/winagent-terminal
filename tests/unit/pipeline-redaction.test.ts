import { describe, expect, it } from 'vitest';
import { buildCliEnvironment, redactSecrets } from '../../src/main/pipeline/redaction';

describe('pipeline redaction and environment', () => {
  it('redacts known secret shapes before a log leaves main', () => {
    const output = redactSecrets('Authorization: Bearer top-secret api_key=key-123 token=abc');
    expect(output).not.toContain('top-secret');
    expect(output).not.toContain('key-123');
    expect(output).not.toContain('token=abc');
    expect(output).toContain('[REDACTED]');
  });

  it('keeps normal CLI profile locations but excludes API and proxy keys', () => {
    const env = buildCliEnvironment({ PATH: 'C:\\bin', USERPROFILE: 'C:\\User', PROXYAPI_KEY: 'blocked', OPENAI_API_KEY: 'blocked' });
    expect(env).toMatchObject({ PATH: 'C:\\bin', USERPROFILE: 'C:\\User' });
    expect(env.PROXYAPI_KEY).toBeUndefined();
    expect(env.OPENAI_API_KEY).toBeUndefined();
  });
});
