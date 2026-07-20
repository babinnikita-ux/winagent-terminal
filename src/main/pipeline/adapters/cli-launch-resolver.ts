import fs from 'fs';
import path from 'path';
import type { ProcessCommand } from '../process-supervisor';
import { PipelineProvider } from '../schemas';

export interface CliLaunch {
  executable: string;
  argsPrefix: string[];
}

function pathEntries(environment: NodeJS.ProcessEnv): string[] {
  return (environment.PATH ?? environment.Path ?? '').split(path.delimiter).filter(Boolean);
}

function findWindowsExecutable(command: string, environment: NodeJS.ProcessEnv): string | undefined {
  if (path.isAbsolute(command)) return path.extname(command).toLowerCase() === '.exe' && fs.existsSync(command) ? command : undefined;
  for (const directory of pathEntries(environment)) {
    const candidate = path.join(directory, `${command}.exe`);
    if (fs.existsSync(candidate)) return candidate;
  }
  return undefined;
}

function newestNamedFile(root: string, name: string): string | undefined {
  if (!fs.existsSync(root)) return undefined;
  const matches: Array<{ path: string; modified: number }> = [];
  const pending = [root];
  while (pending.length > 0) {
    const directory = pending.pop()!;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) pending.push(candidate);
      else if (entry.isFile() && entry.name.toLowerCase() === name.toLowerCase()) {
        matches.push({ path: candidate, modified: fs.statSync(candidate).mtimeMs });
      }
    }
  }
  return matches.sort((left, right) => right.modified - left.modified)[0]?.path;
}

/** npm .cmd/.ps1 shims cannot be spawned with shell:false, so use native CLI files. */
export function resolveOfficialCliLaunch(provider: PipelineProvider, environment: NodeJS.ProcessEnv = process.env): CliLaunch | undefined {
  if (process.platform !== 'win32') return { executable: provider, argsPrefix: [] };

  const appData = environment.APPDATA;
  const localAppData = environment.LOCALAPPDATA;
  if (provider === 'codex') {
    const executable = localAppData
      ? newestNamedFile(path.join(localAppData, 'OpenAI', 'Codex', 'bin'), 'codex.exe')
      : undefined;
    return executable ? { executable, argsPrefix: [] } : undefined;
  }
  if (provider === 'claude') {
    const executable = appData && path.join(appData, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe');
    return executable && fs.existsSync(executable) ? { executable, argsPrefix: [] } : undefined;
  }

  const bundle = appData && path.join(appData, 'npm', 'node_modules', '@google', 'gemini-cli', 'bundle', 'gemini.js');
  const executable = findWindowsExecutable('node', environment);
  return bundle && executable && fs.existsSync(bundle) ? { executable, argsPrefix: [bundle] } : undefined;
}

export function prepareOfficialCliCommand(provider: PipelineProvider, command: ProcessCommand, environment: NodeJS.ProcessEnv = process.env): ProcessCommand {
  if (command.executable !== provider) return command;
  const launch = resolveOfficialCliLaunch(provider, environment);
  return launch ? { ...command, executable: launch.executable, args: [...launch.argsPrefix, ...command.args] } : command;
}
