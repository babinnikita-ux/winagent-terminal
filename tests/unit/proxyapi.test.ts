import { describe, expect, it } from 'vitest';
import {
  buildProxyApiEnvironment,
  getCodexProxyConfig,
  getAgentStartupCommand,
  PROXYAPI_KEY_ENV,
  redactSecrets,
} from '../../src/main/proxyapi';

describe('ProxyAPI launch profiles', () => {
  const key = 'proxyapi-test-key-12345';

  it('maps Claude Code to the official Anthropic-compatible endpoint', () => {
    const env = buildProxyApiEnvironment('claude-code', key);
    expect(env[PROXYAPI_KEY_ENV]).toBe(key);
    expect(env.ANTHROPIC_AUTH_TOKEN).toBe(key);
    expect(env.ANTHROPIC_BASE_URL).toBe('https://api.proxyapi.ru/anthropic');
  });

  it('uses PROXYAPI_KEY for Codex without embedding it in its config', () => {
    const env = buildProxyApiEnvironment('codex', key);
    const config = getCodexProxyConfig();
    expect(env).toEqual({ [PROXYAPI_KEY_ENV]: key });
    expect(config).toContain('base_url = "https://api.proxyapi.ru/openai/v1"');
    expect(config).toContain('env_key = "PROXYAPI_KEY"');
    expect(config).not.toContain(key);
  });

  it('redacts API keys and authorization headers in diagnostics', () => {
    const env = { [PROXYAPI_KEY_ENV]: key };
    const output = redactSecrets(`key=${key}; Authorization: Bearer other-secret`, env);
    expect(output).not.toContain(key);
    expect(output).not.toContain('other-secret');
    expect(output).toContain('[REDACTED]');
  });

  it('uses each CLI\'s native interactive resume syntax', () => {
    expect(getAgentStartupCommand('claude-code', true, 'linux')).toBe('claude --resume');
    expect(getAgentStartupCommand('codex', true, 'win32')).toBe('codex.cmd resume');
  });
});
