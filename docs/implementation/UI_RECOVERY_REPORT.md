# Agent self-debug report: production UI

## Failure capture

- Goal: Russian Claude-inspired WinAgent Terminal UI.
- Failure: production renderer opened an English mock comparison workbench.
- Last incorrect result: mock Chat/Workflow/Runs shell was treated as completed product UI.
- Environment: `codex/claude-ui-russian-provider-limits`, PR #2.

## Root cause

`App.tsx` mounted `WorkbenchShell` as the root and persisted `chat` as its
default mode. The real terminal workspace was nested behind a Workspace mode.
The prior verification covered compilation and tests but did not inspect the
first visible Electron screen, so token changes were mistaken for a redesign.

## Recovery action

- Removed mock workbench imports and modes from the production root.
- Restored the real terminal workspace as the primary surface.
- Rebuilt titlebar and sidebar with warm cards, terracotta accent and soft active state.
- Removed the hard-coded blue active workspace.
- Translated onboarding, close confirmation, workspace statuses, tool labels and surface labels.
- Added a regression test that rejects workbench imports from `App.tsx`.

## Evidence

- Renderer bundle decreased from 160 to 140 transformed modules.
- Browser QA with a safe preload fixture rendered the real workspace with
  `lang="ru"` and no console errors.
- `npm.cmd run lint`, both builds and all 41 test files pass.
- Screenshot: [`docs/screenshots/claude-ui-main.png`](../screenshots/claude-ui-main.png).

## Preventive change

UI completion now requires a screenshot of the first visible production route;
CSS tokens and successful compilation alone are insufficient evidence.
