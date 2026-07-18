# Threat model (Milestone 1)

## Assets

- The integrity of the Windows user session and terminal process tree.
- Workspace paths and restored layout state.
- The renderer-to-main-process trust boundary.

## Threats and mitigations

| Threat | Mitigation |
| --- | --- |
| A compromised web page reaches Electron privileges | Browser Surface guests are sandboxed; preload, Node integration, plugins, popups and insecure content are disabled before every attachment. They may navigate only to `http:`, `https:` or `about:blank`. |
| Malformed renderer input starts arbitrary host code | Process creation stays in main and uses structured shell/cwd data, not a shell command string. |
| Closing a pane leaves agent children running | The PTY manager uses controlled process-tree termination before closing ConPTY. |
| Corrupt restored state prevents startup | Session persistence is versioned and recovery-safe by design; recovery tests are required before release. |
| A secret reaches renderer or logs | No provider credentials are introduced in Milestone 1. Future credential flow must use Windows Credential Manager or DPAPI and redaction. |

The Browser Surface is available in Milestone 4. Its CDP bridge binds only to
loopback and rejects page-origin connections; named pipes, automatic updates
and any external configuration mutation remain later milestones.
