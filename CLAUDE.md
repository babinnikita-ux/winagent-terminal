# WinAgent Terminal — development guide

Windows Electron terminal application for working with local AI coding CLIs.
The current product owner and repository are represented by `package.json` and
Git remotes; this document intentionally contains no inherited upstream owner,
site or release instructions.

## Commands

```powershell
npm test
npm run lint
npm run build:main
npm run build:renderer
npm run build
```

## Architecture

- `src/main/`: Electron main process, PTY lifecycle, persistence, IPC and all
  filesystem/process access.
- `src/preload/`: constrained `contextBridge` API (`window.wmux` for backwards
  compatibility).
- `src/renderer/`: React UI. It cannot access Node, credentials or child
  processes directly.
- `src/shared/`: shared type contracts and IPC channel names.
- `src/cli/`: `wagent` command over the local named pipe.
- `resources/`: packaged templates and static runtime assets.

Terminal panes, splits, tabs, Browser Surface, session restore and `wagent`
are existing functionality and must remain compatible.

## Multi-AI Pipeline

The implementation plan is
[`docs/exec-plans/multi-ai-pipeline.md`](docs/exec-plans/multi-ai-pipeline.md).
The new pipeline is independent from the legacy `wmux-orchestrator` and from
ProxyAPI terminal presets. It invokes only a user's locally installed official
Codex, Claude Code and Gemini CLI subscriptions; it neither reads nor stores
OAuth tokens, cookies or API keys.

Pipeline code belongs in `src/main/pipeline/`. It must use typed schemas,
atomic persistence, narrow IPC and `spawn(command, args, { shell: false })`.
Only Codex write stages may modify an isolated worktree. Never automate a
password, 2FA, payment, push, PR, merge, reset or cleanup.

## Legacy integration policy

Existing `wmux` protocol and data names remain only for compatibility. Do not
add new features that rely on automatic edits of global `~/.claude` files or
hidden plugin installation. Any legacy integration that changes user settings
must become an explicit opt-in during the migration checkpoint.
