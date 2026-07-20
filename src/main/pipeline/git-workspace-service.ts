import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export interface GitPreflight {
  repositoryPath: string;
  head: string;
  branch: string | null;
  dirty: boolean;
  testInstructions: string[];
}

export interface PipelineWorktree {
  branch: string;
  path: string;
}

export interface GitSnapshot {
  head: string;
  status: string;
  diff: string;
}

function git(repositoryPath: string, args: string[]): string {
  try {
    return execFileSync('git', args, { cwd: repositoryPath, encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    throw new Error(`GIT_CONFLICT: ${details}`, { cause: error });
  }
}

function detectTestInstructions(repositoryPath: string): string[] {
  const packagePath = path.join(repositoryPath, 'package.json');
  if (!fs.existsSync(packagePath)) return [];
  try {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { scripts?: Record<string, string> };
    return packageJson.scripts?.test ? ['npm test'] : [];
  } catch {
    return [];
  }
}

/** Git boundary for pipelines. Never operates on the user's checkout after preflight. */
export class GitWorkspaceService {
  constructor(private readonly worktreeRoot: string) {}

  preflight(repositoryPath: string): GitPreflight {
    const resolved = path.resolve(repositoryPath);
    if (!fs.existsSync(resolved)) throw new Error('GIT_CONFLICT: папка репозитория не существует.');
    if (git(resolved, ['rev-parse', '--is-inside-work-tree']) !== 'true') {
      throw new Error('GIT_CONFLICT: выбранная папка не является Git-репозиторием.');
    }
    return {
      repositoryPath: resolved,
      head: git(resolved, ['rev-parse', 'HEAD']),
      branch: this.currentBranch(resolved),
      dirty: git(resolved, ['status', '--porcelain']).length > 0,
      testInstructions: detectTestInstructions(resolved),
    };
  }

  createWorktree(preflight: GitPreflight, runId: string): PipelineWorktree {
    const shortId = runId.replace(/[^a-z0-9]/gi, '').slice(0, 8).toLowerCase();
    if (shortId.length < 8) throw new Error('GIT_CONFLICT: некорректный идентификатор run.');
    const branch = `winagent/run-${shortId}`;
    const worktreePath = path.join(this.worktreeRoot, shortId);
    if (fs.existsSync(worktreePath)) throw new Error('GIT_CONFLICT: worktree для этого run уже существует.');
    if (git(preflight.repositoryPath, ['branch', '--list', branch])) {
      throw new Error(`GIT_CONFLICT: ветка ${branch} уже существует.`);
    }
    fs.mkdirSync(this.worktreeRoot, { recursive: true });
    git(preflight.repositoryPath, ['worktree', 'add', '-b', branch, worktreePath, preflight.head]);
    this.ensureRunArtifactsExcluded(worktreePath);
    return { branch, path: worktreePath };
  }

  snapshot(repositoryPath: string): GitSnapshot {
    return {
      head: git(repositoryPath, ['rev-parse', 'HEAD']),
      status: git(repositoryPath, ['status', '--porcelain']),
      diff: git(repositoryPath, ['diff', '--no-ext-diff', '--binary', 'HEAD']),
    };
  }

  ensureRunArtifactsExcluded(repositoryPath: string): void {
    const commonGitDirectory = git(repositoryPath, ['rev-parse', '--git-common-dir']);
    const resolvedCommonDirectory = path.isAbsolute(commonGitDirectory)
      ? commonGitDirectory
      : path.resolve(repositoryPath, commonGitDirectory);
    const excludePath = path.join(resolvedCommonDirectory, 'info', 'exclude');
    fs.mkdirSync(path.dirname(excludePath), { recursive: true });
    const existing = fs.existsSync(excludePath) ? fs.readFileSync(excludePath, 'utf8') : '';
    if (existing.split(/\r?\n/).includes('.winagent/runs/')) return;
    fs.appendFileSync(excludePath, `${existing && !existing.endsWith('\n') ? '\n' : ''}.winagent/runs/\n`, 'utf8');
  }

  private currentBranch(repositoryPath: string): string | null {
    try {
      const branch = git(repositoryPath, ['symbolic-ref', '--quiet', '--short', 'HEAD']);
      return branch || null;
    } catch {
      return null;
    }
  }
}
