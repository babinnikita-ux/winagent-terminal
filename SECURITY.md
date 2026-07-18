# Security policy

## Reporting a vulnerability

Do not publish exploitable details in a public issue. Until a project security
contact is configured, report privately to the repository owner and include
reproduction steps, affected version and impact.

## Current security commitments

- `contextIsolation` is enabled and renderer Node integration is disabled.
- Terminal processes are created only by the Electron main process.
- Credentials and provider configuration are not part of Milestone 1.
- Telemetry is not enabled by default.
- Full terminal input and transcripts are not logged by default.

Security controls for ProxyAPI, agent hooks, browser automation, IPC
authentication and releases will be added in their respective milestones.
