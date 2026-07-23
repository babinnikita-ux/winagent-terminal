# TDD evidence: Russian UI and provider usage upgrade

## Source

User-supplied upgrade specification; the maintained implementation checklist is
[`docs/implementation/CLAUDE_UI_UPGRADE_TASKS.md`](../implementation/CLAUDE_UI_UPGRADE_TASKS.md).

## Journeys

- A Russian-speaking user keeps the selected language after restart.
- A user sees only confirmed provider usage, with explicit unavailable/stale states.
- A user can enter focus mode without destroying the saved terminal layout.
- Productivity data is migrated, bounded and sanitized before display or export.

## Evidence

| Guarantee | Test or command | Type | Result |
|---|---|---|---|
| Productivity primitives were absent before implementation | `npm.cmd test -- --run tests/unit/productivity-tools.test.ts` | RED | Missing module |
| Attention dedupe, layouts, prompt variables, migration and redaction work | same command after implementation | GREEN | 5 passed |
| Codex and Gemini parsers were absent | `npm.cmd test -- --run tests/unit/provider-usage.test.ts` | RED | 2 parser tests failed |
| Provider payloads normalize safely | same command after implementation | GREEN | 5 passed |
| Russian parity helper was absent | `npm.cmd test -- --run tests/unit/i18n.test.ts` | RED | parity test failed |
| Russian dictionary parity is enforced | same command after implementation | GREEN | 6 passed |
| Interpolation and plural helpers were absent | `npm.cmd test -- --run tests/unit/i18n.test.ts` | RED | 2 helper tests failed |
| Interpolation and Russian plural rules work | same command after implementation | GREEN | 8 passed |
| Repository regression suite | `npm.cmd test` | unit/integration | 40 files, 266 passed, 5 pre-existing skipped |
| Main process compiles | `npm.cmd run build:main` | compile | PASS |
| Renderer compiles | `npm.cmd run build:renderer` | compile | PASS |
| Source lint | `npm.cmd run lint` | static | PASS |
| Dependency vulnerabilities | `npm.cmd audit --audit-level=high` | security | 0 vulnerabilities |

## Coverage and known gaps

The repository has no coverage script or configured threshold. Component E2E
coverage, real provider-account verification, Windows packaging and Electron
visual screenshots were not available in this run. These limitations are not
replaced with mock provider percentages.

## Checkpoints

RED and GREEN evidence is preserved in separate commits for productivity
primitives, provider parsers and localization helpers. The PR keeps those
commits unsquashed so reviewers can inspect the sequence.
