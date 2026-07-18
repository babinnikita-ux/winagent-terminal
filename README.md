# WinAgent Terminal

Windows terminal multiplexer for parallel AI coding work. It is a
keyboard-first desktop application built on Electron, React, xterm.js and
ConPTY.

## Current milestone

Milestones 1–4 provide the terminal core, multiplexer UX, ProxyAPI launch
presets and Browser Surface: application
windows, workspaces, terminal surfaces, split panes, tabs, keyboard navigation,
command palette, shell detection, ConPTY process lifecycle, resize and session
persistence. Browser pages are isolated from Electron privileges and support
localhost previews, navigation controls and local CDP automation. The public
`wagent` CLI uses authenticated local IPC; see [CLI reference](docs/CLI_REFERENCE.md).

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
