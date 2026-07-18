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

ProxyAPI launch presets are resolved only in the main process. The renderer
passes a fixed `claude-code` or `codex` identifier, never a credential; the key
is read from `PROXYAPI_KEY` only while spawning the child process. Codex receives
an isolated, credential-free provider TOML, while Claude Code receives its
ProxyAPI endpoint through child-process environment variables. Browser
automation and named-pipe commands remain later milestones and must not be
trusted merely because they originate in a renderer, shell, or local process.
