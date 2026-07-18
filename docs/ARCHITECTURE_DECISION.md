# Architecture decision record: implementation base

Date: 2026-07-18  
Status: accepted

## Decision

WinAgent Terminal is a separate, MIT-licensed derivative of
[`amirlehmam/wmux`](https://github.com/amirlehmam/wmux), renamed and maintained
as an independent product. It keeps Electron, TypeScript, React, xterm.js and
node-pty/ConPTY as its Milestone 1 foundation. No source code, assets, naming,
or visual identity from GPL-licensed `cmux` is copied.

The product identity is defined in `src/shared/app-config.ts`; Electron package
and Windows identity are aligned with it. The upstream `wmux` protocol names
remain temporarily internal compatibility details and will be migrated during
the CLI/IPC milestone without breaking persisted Milestone 1 workspaces.

## Audit sources and findings

| Project | License and activity | Technical finding | Decision |
| --- | --- | --- | --- |
| [`manaflow-ai/cmux`](https://github.com/manaflow-ai/cmux) | GPL-3.0-or-later; active, 6,688 commits, 1,500+ open issues (audit date) | Native Swift/AppKit and libghostty; macOS-only. It has a high-quality terminal, browser, agent notifications, CLI/socket API and session restore. | Reject as a code base: GPL is incompatible with the requested closed/commercial use and its native stack targets macOS. Use only as product-research input. |
| [`amirlehmam/wmux`](https://github.com/amirlehmam/wmux) | MIT; 348 commits, 0 open issues, 41 releases (audit date) | Electron + strict TypeScript + React + xterm.js + node-pty; Windows ConPTY, WebGL terminal rendering, browser panel, named-pipe API, session persistence and tests are already present. | **Select.** Fastest practical route with the best feature coverage and a compatible license. Security-sensitive inherited behaviour is audited before enabling later milestones. |
| [`mkurman/cmux-windows`](https://github.com/mkurman/cmux-windows) | MIT; 21 commits, 9 open issues, 5 releases (audit date) | Native WPF + ConPTY, sensible Core/UI/CLI split and portable publish path; browser needs WebView2 and the codebase has materially less operational history. | Reject for now: promising native option, but less mature and slower to reach an equally tested multiplexer. Revisit only if Electron memory usage becomes an unacceptable measured bottleneck. |

Source evidence: the [cmux repository](https://github.com/manaflow-ai/cmux),
[wmux repository](https://github.com/amirlehmam/wmux), and
[cmux-windows repository](https://github.com/mkurman/cmux-windows), inspected
on 2026-07-18. Repository counters and issue counts are time-sensitive.

## Weighted decision matrix

Score: 1 = poor, 5 = strong. Higher is better except the two explicitly marked
complexity rows, where a higher score means easier/less complex.

| Criterion | Fork wmux | Fork cmux-windows | New implementation |
| --- | ---: | ---: | ---: |
| Time to working MVP | 5 | 3 | 1 |
| Terminal rendering quality | 4 | 3 | 2 |
| Runtime performance | 3 | 5 | 4 |
| RAM efficiency | 2 | 5 | 4 |
| Embedded-browser difficulty | 5 | 3 | 1 |
| Windows 10/11 compatibility | 5 | 5 | 3 |
| Security baseline | 3 | 4 | 4 |
| Maintainability for one developer + Codex | 4 | 3 | 2 |
| Extensibility | 5 | 3 | 4 |
| License compatibility | 5 | 5 | 5 |
| Automation/CLI/IPC readiness | 5 | 3 | 1 |
| Installer build simplicity | 4 | 3 | 2 |
| **Weighted total / 100** | **86** | **73** | **54** |

## Architecture boundaries

```text
Electron main process
├── Terminal service (node-pty + ConPTY)
├── Shell discovery and process lifecycle
├── Versioned session persistence
├── Named-pipe boundary (future Milestone 5)
└── Window lifecycle

Preload (minimal, validated API)
└── Renderer IPC bridge

Renderer (React + Zustand)
├── Window / Workspace / Pane / Surface state
├── xterm.js terminal surfaces
└── Keyboard-first workspace UX
```

The renderer has no Node integration. All process spawning, filesystem access,
credential handling, named pipes and future provider integrations remain in the
main process.

## Risks and controls

| Risk | Control |
| --- | --- |
| Electron memory footprint | Measure idle and multi-pane memory in Milestone 6; suspend inactive surfaces where safe. |
| Upstream code has broad feature scope | Keep product milestones explicit; enable or extend a feature only after the preceding milestone passes build, tests and documentation. |
| ConPTY process leaks | Preserve tree termination through `taskkill /T /F`; add integration tests before release. |
| Inherited external Claude configuration hooks | Do not enable provider hooks or configuration writes until Milestone 3; all future writes require backup, diff and explicit user approval. |
| MIT attribution | Retain upstream license and maintain `THIRD_PARTY_NOTICES.md`. |
| Node/Electron native binary availability | CI builds on Windows and validates node-pty/Electron download and packaged startup. |
