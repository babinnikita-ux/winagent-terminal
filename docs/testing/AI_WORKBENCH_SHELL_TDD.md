# AI workbench shell — TDD evidence

Date: 2026-07-22

## Red checkpoints

1. `npm.cmd test -- tests/unit/workbench-store.test.ts tests/unit/workbench-keyboard.test.ts` failed before implementation because the workbench store and keyboard helper did not exist.
2. `npm.cmd test -- tests/unit/workspace-mode.test.ts` failed before implementation because the workspace presentation helper did not exist.

## Green checkpoints

1. The focused workbench suite passed after implementing the mock-only store and text-input shortcut guard: 7 tests.
2. The workspace presentation suite and focused workbench suite passed after implementing the retained-workspace presentation helper: 9 tests.

## Final automated verification

| Command | Result |
| --- | --- |
| `npm.cmd ci` | passed |
| `npm.cmd run lint` | passed |
| `npm.cmd test` | passed: 38 files, 253 tests passed, 5 skipped |
| `npm.cmd run build:main` | passed |
| `npm.cmd run build:renderer` | passed |
| `npm.cmd run build` | passed: Windows package built |

No coverage command is configured in this repository. Manual visual capture was intentionally not performed because the owner asked to stop screenshot and window interaction work.
