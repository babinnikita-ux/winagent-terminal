#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { normalizeWagentArgs } from './wagent-commands';

const result = spawnSync(process.execPath, [path.join(__dirname, 'wmux.js'), ...normalizeWagentArgs(process.argv.slice(2))], {
  stdio: 'inherit', env: { ...process.env, WINAGENT_CLI: '1' },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
