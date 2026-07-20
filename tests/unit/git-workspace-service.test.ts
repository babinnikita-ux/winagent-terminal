import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { GitWorkspaceService } from '../../src/main/pipeline/git-workspace-service';

const ROOT = path.join(os.tmpdir(), `winagent-git-worktree-${process.pid}`);
const REPO = path.join(ROOT, 'repo');
const WORKTREES = path.join(ROOT, 'worktrees');

function git(args: string[], cwd = REPO): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

beforeEach(() => {
  fs.mkdirSync(REPO, { recursive: true });
  git(['init', '--initial-branch=main']);
  git(['config', 'user.email', 'test@winagent.local']);
  git(['config', 'user.name', 'WinAgent Test']);
  fs.writeFileSync(path.join(REPO, 'package.json'), '{"scripts":{"test":"vitest"}}', 'utf8');
  fs.writeFileSync(path.join(REPO, 'README.md'), '# Fixture\n', 'utf8');
  git(['add', '.']);
  git(['commit', '-m', 'fixture']);
});

afterEach(() => fs.rmSync(ROOT, { recursive: true, force: true }));

describe('GitWorkspaceService', () => {
  it('explains when the selected folder is not a Git repository', () => {
    const folder = path.join(ROOT, 'not-a-repository');
    fs.mkdirSync(folder, { recursive: true });

    expect(() => new GitWorkspaceService(WORKTREES).preflight(folder)).toThrow(
      'Git-репозиторием',
    );
  });

  it('creates a separate run branch and ignores only local run artifacts', () => {
    const service = new GitWorkspaceService(WORKTREES);
    const preflight = service.preflight(REPO);
    const worktree = service.createWorktree(preflight, '88888888-8888-4888-8888-888888888888');
    expect(preflight).toMatchObject({ branch: 'main', dirty: false, testInstructions: ['npm test'] });
    expect(worktree.branch).toBe('winagent/run-88888888');
    expect(git(['branch', '--show-current'], worktree.path)).toBe('winagent/run-88888888');
    expect(git(['branch', '--show-current'], REPO)).toBe('main');
    const exclude = fs.readFileSync(path.join(worktree.path, '.git'), 'utf8');
    expect(exclude).toContain('gitdir:');
    const sourceExclude = fs.readFileSync(path.join(REPO, '.git', 'info', 'exclude'), 'utf8');
    expect(sourceExclude).toContain('.winagent/runs/');
    expect(fs.existsSync(path.join(REPO, '.gitignore'))).toBe(false);
  });

  it('captures a binary-safe diff snapshot without changing the source checkout', () => {
    const service = new GitWorkspaceService(WORKTREES);
    fs.appendFileSync(path.join(REPO, 'README.md'), 'change\n', 'utf8');
    const snapshot = service.snapshot(REPO);
    expect(snapshot.status).toContain('README.md');
    expect(snapshot.diff).toContain('+change');
  });
});
