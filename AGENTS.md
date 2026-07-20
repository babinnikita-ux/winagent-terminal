# WinAgent Terminal — instructions for contributors

## Product boundary

WinAgent Terminal is a Windows Electron terminal application. Preserve terminal
tabs, split panes, Browser Surface, session restore and the `wagent` CLI while
adding features. User-facing product names are **WinAgent** and **wagent**;
legacy `wmux` protocol and data compatibility must not be broken in a broad
rename.

## Multi-AI Pipeline boundary

- The pipeline runs only official locally installed Codex, Claude Code and
  Gemini CLIs with the user's normal subscription sign-in.
- Never read, persist, proxy, inject or expose OAuth tokens, API keys, cookies
  or credential-store data. Do not add API fallbacks.
- The renderer must never start child processes or access the filesystem.
  Expose a narrow, typed preload API and validate every IPC request in main.
- Use `spawn(command, args, { shell: false })` for all pipeline processes.
- Only Codex write stages may modify a pipeline worktree. Read-only stages must
  be checked by Git afterwards; a change is a policy failure, not an automatic
  rollback.
- Pipeline worktrees use a separate `winagent/run-<id>` branch. Never push,
  create a PR, merge, reset or clean a user's repository automatically.

## Quality gates

Use strict TypeScript, avoid unexplained `any`, add focused tests with each
vertical checkpoint, and run the applicable test, lint and production-build
commands before committing. Keep run artifacts out of the user's Git index by
writing only to `.git/info/exclude`, never their `.gitignore`.
