# WinAgent Terminal architecture

## Milestone 1 scope

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

## Security boundary

Electron runs with `contextIsolation: true` and `nodeIntegration: false`.
Preload exposes a constrained API instead of Electron primitives. Renderer IPC
is checked in the main process. The terminal receives only explicitly selected
shell, working directory, dimensions and environment values.

Future provider credentials, browser automation and named-pipe commands are
outside Milestone 1 and must not be trusted merely because they originate in a
renderer, shell, or local process.
