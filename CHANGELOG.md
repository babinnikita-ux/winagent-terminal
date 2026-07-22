# Changelog

All notable changes are documented here.

## [0.27.1] - 2026-07-18

This is the current source version in `package.json`. No public Git tag or
GitHub Release had been published when this changelog was normalized.

### Changed

- Consolidated the WinAgent Terminal milestones recorded below into the current
  source version without rewriting upstream history.

## Historical milestone notes (unreleased)

The following sections record implementation milestones from 2026-07-18. They
are not published WinAgent Terminal releases and must not be inferred to be
GitHub tags or release artifacts.

### Milestone 4

### Changed

- Release artifact names, build/release documentation and security policy now
  use the WinAgent Terminal identity.
- Packaged Claude Code hooks now use the WinAgent pipe contract and are bundled
  with the installer.
- Deferred ConPTY resize is guarded until the Windows PTY agent is ready, which
  prevents an exit/resize race from crashing the test or application process.
- The NSIS installer adds the bundled `wagent` shim to the current-user PATH;
  it uses the packaged Electron runtime when Node.js is not installed.
- Installer packaging now includes all CLI runtime modules required by `wagent`.

### Milestone 3

### Added

- Milestone 4 Browser Surface security policy and regression coverage.
- Milestone 5 `wagent` CLI and authenticated `\\.\pipe\winagent-terminal` IPC contract.

### Changed

- Guest browser pages are sandboxed before attachment and cannot receive a
  preload API, Node integration, popups, plugins or unsafe navigation schemes.

### Milestone 2

### Added

- ProxyAPI launch presets for Claude Code and Codex, including native CLI resume flows.
- Main-process-only `PROXYAPI_KEY` handling and an AI settings status screen that never reveals credentials.
- Isolated, credential-free Codex provider configuration and ProxyAPI setup documentation.
- Regression tests for provider mappings, generated config secrecy and diagnostic redaction.

### Milestone 1

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
