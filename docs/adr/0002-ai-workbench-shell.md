# ADR 0002: AI workbench shell

**Date**: 2026-07-22
**Status**: accepted
**Deciders**: WinAgent Terminal maintainers

## Context

WinAgent Terminal already provides a terminal multiplexer with persistent
workspace split trees and PTYs. The renderer needs UI-only Chat, Workflow and
Runs views without changing IPC, provider credentials, session persistence or
the terminal core.

## Decision

Chat, Workflow, Workspace and Runs are top-level `AppMode` values, not
`SurfaceType` values. Workspace keeps the existing multiplexer mounted behind
the selected mode so mode changes cannot terminate PTYs or discard browser
resize state. The workbench uses a separate renderer-only Zustand store with
versioned local mock preferences; no mock conversations, workflow data or runs
are sent to the main process.

Future Agent Adapters will consume typed UI/domain events behind a renderer
adapter boundary. They will not be coupled to panel components or use the mock
store as a credential, process or transport layer.

## Alternatives considered

### Add Chat and Workflow as surfaces

- **Pros**: Reuses the existing pane model.
- **Cons**: Couples durable terminal session state to transient product modes
  and complicates PTY lifecycle behavior.
- **Why not**: These views are application-level workflows, not panes inside a
  terminal split tree.

### Extend the existing terminal Zustand store

- **Pros**: Fewer store modules.
- **Cons**: Increases the risk of changing persisted terminal layout data.
- **Why not**: Workbench state has a different lifecycle and storage boundary.

## Consequences

### Positive

- Existing workspaces, SplitContainer, Browser Surface and session persistence
  remain compatible.
- Mock-only UI can evolve independently before any agent adapter is introduced.
- Chat controls do not route keyboard input into terminal shortcuts.

### Risks

- A future adapter must explicitly migrate mock data if it needs durable runs.
- The workbench local-storage record is versioned and optional; invalid records
  fall back to the Chat default rather than touching terminal session data.
- Hidden Workspace DOM remains mounted by design, so future mode layout work
  must preserve its available dimensions.
