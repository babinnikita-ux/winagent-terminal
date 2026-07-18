# Changelog

All notable changes are documented here.

## [0.2.0] - 2026-07-18

### Added

- ProxyAPI launch presets for Claude Code and Codex, including native CLI resume flows.
- Main-process-only `PROXYAPI_KEY` handling and an AI settings status screen that never reveals credentials.
- Isolated, credential-free Codex provider configuration and ProxyAPI setup documentation.
- Regression tests for provider mappings, generated config secrecy and diagnostic redaction.

## [0.1.0] - 2026-07-18

### Added

- Milestone 0 architecture audit and decision record.
- WinAgent Terminal product configuration and Windows package identity.
- Architecture, threat-model, security and third-party attribution documents.
- Windows CI for linting, compilation, renderer build and unit tests.
- Regression tests for the required keyboard-first multiplexer shortcuts.

### Changed

- Adopted the MIT-licensed wmux codebase as the audited implementation base.
- Deferred external agent configuration writes, browser CDP and auto-updates
  until their planned milestones.
- Isolated persisted WinAgent state from the upstream application's data root.
