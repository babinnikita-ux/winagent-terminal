# WinAgent Terminal architecture

## Terminal and AI launch boundary

```text
Window
└── Workspace
    └── Pane (leaf or split branch)
        └── Surface
            └── Terminal (xterm.js renderer + ConPTY process)
```

`PtyManager` owns one ConPTY process per terminal surface. It validates the
shell and working directory, resizes the pseudo-console, streams output to the
renderer, and kills the complete process tree when a surface closes. The React
renderer owns the split tree and workspace state; it never spawns processes
directly. `session-persistence` stores the app-owned window, workspace, pane,
surface and working-directory state atomically for restoration after restart.
Its state root is `%APPDATA%\\winagent-terminal`, deliberately separate from
the upstream application's `%APPDATA%\\wmux` directory.

## Security boundary

Electron runs with `contextIsolation: true` and `nodeIntegration: false`.
Preload exposes a constrained API instead of Electron primitives. Renderer IPC
is checked in the main process. The terminal receives only explicitly selected
shell, working directory, dimensions and environment values.

Legacy ProxyAPI launch presets are resolved only in the main process. The
Multi-AI Pipeline does not use these presets, API keys or proxy endpoints: it
uses only official locally installed CLI subscription sessions and exposes
capability status without credentials. Browser
Browser Surfaces use Electron guest webviews only for `http:`, `https:` and
`about:blank` pages. Electron strips their preload, Node integration and popup
privileges before attachment; guest pages are sandboxed and cannot access the
application IPC bridge. Browser CDP remains a local developer-tool boundary;
The public `wagent` CLI sends versioned JSON-RPC-like requests through
`\\.\pipe\winagent-terminal`. Privileged commands need the per-instance token;
they must not be trusted merely because they originate in a renderer, shell or
local process.

## Multi-AI Pipeline

`src/main/pipeline/` is an independent main-process domain. It persists a
validated run state in app data, while each selected repository gets portable,
non-indexed artifacts under `.winagent/runs/<run-id>/`. The pipeline runner
will start local CLI executables with argument arrays and `shell: false`; the
renderer only receives redacted run snapshots through a narrow preload API.

Pipeline writes are isolated to an app-managed Git worktree on a
`winagent/run-<id>` branch. Codex is the sole writer. Read-only provider stages
are checked for Git changes and are stopped on any policy violation. Legacy
`wmux-orchestrator` remains available for compatibility but is not part of this
new execution path.
