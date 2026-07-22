# Security Policy

## Supported versions

Until the first public tagged release, `main` is the only supported source
line. The current source version is `0.27.1`; untagged milestone notes in the
changelog are not supported releases. Security fixes are applied to `main`
first and backported only when a maintained release branch exists.

## Reporting a vulnerability

Use GitHub **Private Vulnerability Reporting** for this repository:
<https://github.com/babinnikita-ux/winagent-terminal/security/advisories/new>.
Do not include exploit details in a public issue. Include affected revision,
reproduction steps, impact, and any practical mitigation. Maintainers will
acknowledge the report, assess scope, coordinate a fix, and agree on disclosure
timing with the reporter before publishing details.

## Security boundaries

- `contextIsolation` is enabled and renderer Node integration is disabled.
- Terminal processes are created only by the Electron main process.
- Provider credentials and local credential stores are outside the renderer
  boundary and must not be read or exposed by WinAgent.
- Browser guests have no preload API or Node integration; unsafe URL schemes
  and page-origin access to the loopback CDP bridge are blocked.
- Privileged local IPC requires a per-instance token and is not exposed as a
  TCP service by default.
- Telemetry is not enabled by default, and terminal input or transcripts are
  not logged by default.

Release signing is required before an automatic update feed is published.
