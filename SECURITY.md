# Security policy

## Reporting a vulnerability

Do not publish exploitable details in a public issue. Until a project security
contact is configured, report privately to the repository owner and include
reproduction steps, affected version and impact.

## Current security commitments

- `contextIsolation` is enabled and renderer Node integration is disabled.
- Terminal processes are created only by the Electron main process.
- ProxyAPI keys remain in the user environment and never enter renderer state,
  generated configuration, diagnostics or logs.
- Browser guests have no preload API or Node integration; unsafe URL schemes
  and page-origin access to the loopback CDP bridge are blocked.
- Privileged local IPC requires a per-instance token and is not exposed as a
  TCP service by default.
- Telemetry is not enabled by default.
- Full terminal input and transcripts are not logged by default.

Release signing is required before the automatic update feed is published.
