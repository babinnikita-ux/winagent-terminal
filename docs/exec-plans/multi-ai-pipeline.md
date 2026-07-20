# Multi-AI Pipeline — execution plan

## Goal and non-negotiable boundary

Add a **Конвейеры** feature to WinAgent Terminal. A user selects a local Git
repository, writes one task and starts the built-in **Полный цикл** template.
Official locally installed CLI subscriptions run sequentially in an isolated
worktree. Codex is the only writer. No API keys, proxies, OAuth extraction,
automatic push, PR or merge are part of the pipeline.

The complete stage sequence is:

1. Codex coordinator (read-only) → `01-task-brief.md`
2. Gemini researcher (read-only) → `02-research.md`
3. Claude architect (read-only) → `03-architecture.md`
4. Codex implementer (write) → `04-implementation.md`
5. Claude reviewer (read-only) → `05-review.md`
6. Codex fixer (write) → `06-fixes.md`
7. Codex finalizer (read-only) → `FINAL.md`

## Audit: current repository and gaps

| Area | Current state | Required migration |
| --- | --- | --- |
| Product | App is already branded WinAgent in packaging, but legacy `wmux` remains in internal IPC/data. | Keep compatibility; use WinAgent/wagent in all new pipeline UI and docs. |
| Process boundary | Renderer uses a constrained preload bridge for terminal processes. | Keep this boundary; pipeline services live in `src/main/pipeline` and receive only narrow IPC. |
| Existing orchestration | `wmux-orchestrator` polls temporary JSON state and is tied to Claude plugins. | Mark legacy; do not reuse it for the pipeline core. |
| Claude integration | `claude-context.ts` currently writes to global `~/.claude/CLAUDE.md`, `settings.json` and installs a plugin. | Disable automatic global mutation in the security migration checkpoint; future integration is explicit opt-in only. |
| Subscription startup | Existing agent presets depend on ProxyAPI and environment key injection. | Pipeline does not call this code. Keep it only as separately labelled legacy terminal compatibility until migration is complete. |
| Persistence | Session persistence is app-owned, atomic JSON. | Add a separate app-data pipeline store plus portable per-run artifacts in the selected repo. |
| Schema validation | No Zod dependency exists. | Add Zod and validate every persisted run, event and StageResult. |
| Gemini availability | The installed Gemini Code Assist CLI is deprecated; current Antigravity account is not eligible in the detected region. | Capability probe reports the exact unsupported/auth condition. It does not substitute a provider or bypass availability. Strict mode stops; best effort records the omission in `FINAL.md`. |

## Architecture decisions

### ADR-001 — Pipeline is a main-process service

`PipelineService` owns a persistent `PipelineStore`, state machine, events and
later the runner. Renderer code only invokes validated commands and receives
redacted snapshots. This keeps filesystem, process and credentials outside the
renderer.

### ADR-002 — Run data has two locations

App data persists resumable metadata. The selected repository receives
`.winagent/runs/<run-id>/` with the user request, artifacts, JSONL events and
bounded logs. `.winagent/runs/` is added only to that repository's
`.git/info/exclude`.

### ADR-003 — Capability is explicit, never simulated

The provider probe distinguishes runtime, authentication, subscription quota
and unsupported versions. A missing provider is never silently replaced. The
current Gemini incompatibility is therefore a supported preflight outcome.

### ADR-004 — Git isolation before writing

The runner performs Git preflight and creates an app-data worktree on
`winagent/run-<shortid>`. It snapshots before and after each write stage. No
pipeline operation touches `main`, `master` or the user's original checkout.

## Checkpoints

| # | Vertical checkpoint | Deliverable and tests | Commit scope |
| --- | --- | --- | --- |
| 0 | Audit and guardrails | This plan, contributor guide, current architecture documentation. | Docs only. |
| 1 | Core run contract | Zod schemas, immutable state machine, atomic persistent store, typed read-only IPC and unit tests. | Core state, no CLI execution. |
| 2 | Safe execution foundation | Process supervisor, redaction, capability probe, fake-CLI fixtures and integration tests. | No real subscription calls. |
| 3 | Codex preflight | Codex adapter, subscription-safe preflight and exact error classification. | Read-only validation only. |
| 4 | Claude adapter | Claude adapter and read-only policy wiring. | Provider-specific tests. |
| 5 | Gemini adapter | Gemini adapter with unsupported-version and eligibility outcomes. | No Antigravity substitution. |
| 6 | Run artifacts | Prompt assembler, versioned templates, artifact/event stores and the full-cycle template. | Deterministic artifact tests. |
| 7 | Git isolation | Git preflight, worktree/branch service, snapshots and per-repo exclude handling. | Fixture-repository integration tests. |
| 8 | Runner and recovery | Sequential runner, pause/resume/cancel/retry safety and restart restoration. | Fake CLI end-to-end service tests. |
| 9 | Russian pipeline UI | Setup, timeline, result/log/files/diff and final screens through narrow IPC. | Renderer tests and accessibility review. |
| 10 | Hardening and package | Limits, cancellation tree cleanup, Russian error UX, Electron E2E, production package. | Full verification. |

Every checkpoint is independently reviewable, tested and committed. A write
stage is never replayed automatically after restart without validating Git
state and an explicit user action where required.

## Verification matrix

- Unit: schema validation, state transitions, prompt assembly, redaction and
  error classification.
- Integration: fake CLI JSONL, auth, quota, malformed output, timeout, crash,
  large stderr, cancellation and read-only diff violation.
- Git fixtures: dirty branch preflight, safe worktree, snapshots and local
  exclude behavior.
- Electron E2E: full fake pipeline, restart during pause, cancellation, final
  report and diff.
- Release: `npm test`, `npm run lint`, `npm run build:main`,
  `npm run build:renderer`, then production packaging.
