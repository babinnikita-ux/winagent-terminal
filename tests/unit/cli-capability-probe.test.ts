import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { classifyCapabilityOutput, findExecutable } from '../../src/main/pipeline/adapters/cli-capability-probe';
import { resolveOfficialCliLaunch } from '../../src/main/pipeline/adapters/cli-launch-resolver';

describe('CLI capability probe', () => {
  it('does not treat Antigravity migration output as an available Gemini runtime', () => {
    expect(classifyCapabilityOutput('This client is no longer supported. Migrate to Antigravity.')).toBe('UNSUPPORTED_VERSION');
  });

  it('finds only an explicit executable from PATH', () => {
    expect(findExecutable('definitely-missing-winagent-cli', { PATH: process.cwd() })).toBeUndefined();
  });

  it('uses native Windows CLI files instead of npm shell shims', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'winagent-cli-launch-'));
    const localAppData = path.join(root, 'local');
    const appData = path.join(root, 'roaming');
    const nodeDirectory = path.join(root, 'node');
    const codex = path.join(localAppData, 'OpenAI', 'Codex', 'bin', 'fixture', 'codex.exe');
    const claude = path.join(appData, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe');
    const bundle = path.join(appData, 'npm', 'node_modules', '@google', 'gemini-cli', 'bundle', 'gemini.js');
    const node = path.join(nodeDirectory, 'node.exe');
    try {
      for (const file of [codex, claude, bundle, node]) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, '', 'utf8');
      }
      const environment = { APPDATA: appData, LOCALAPPDATA: localAppData, PATH: nodeDirectory };
      expect(resolveOfficialCliLaunch('codex', environment)).toMatchObject({ executable: codex, argsPrefix: [] });
      expect(resolveOfficialCliLaunch('claude', environment)).toMatchObject({ executable: claude, argsPrefix: [] });
      expect(resolveOfficialCliLaunch('gemini', environment)).toMatchObject({ executable: node, argsPrefix: [bundle] });
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
