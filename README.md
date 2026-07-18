# WinAgent Terminal

Windows terminal multiplexer for parallel AI coding work. It is a
keyboard-first desktop application built on Electron, React, xterm.js and
ConPTY.

## Current milestone

Milestones 1–2 provide the terminal core and multiplexer UX: application
windows, workspaces, terminal surfaces, split panes, tabs, keyboard navigation,
command palette, shell detection, ConPTY process lifecycle, resize and session
persistence. AI providers, browser automation and user-facing CLI/IPC are
deliberately scheduled for later milestones.

## Development

```powershell
npm.cmd ci
npm.cmd run build:main
npm.cmd test
npm.cmd run dev
```

See [Architecture](docs/ARCHITECTURE.md), the
[architecture decision](docs/ARCHITECTURE_DECISION.md), and
[Russian quick start](README_RU.md).

## License and attribution

This codebase is an MIT-licensed derivative of `amirlehmam/wmux`; see
[LICENSE](LICENSE) and [third-party notices](THIRD_PARTY_NOTICES.md).
