# WinAgent CLI and local IPC

`wagent` is the supported command-line client. It sends newline-delimited,
versioned JSON-RPC-style messages to `\\.\pipe\winagent-terminal`; the pipe
is local to the current Windows user and privileged calls require the per-run
token held outside the renderer.

```powershell
wagent ping
wagent workspace create --title "API" --cwd "C:\Projects\Api"
wagent workspace list --json
wagent surface create
wagent surface send --id <surface-id> --text "npm test"
wagent surface send-key --id <surface-id> --key enter
wagent surface read --id <surface-id> --lines 100
wagent split right
wagent split down
wagent browser open "http://localhost:3000"
wagent browser snapshot
wagent agent spawn --type codex --cwd "C:\Projects\Api"
wagent agent interrupt <agent-id>
```

`--json` is accepted on documented commands; results are JSON for scripts.
`browser eval` and process-changing calls require the instance token. The
optional TCP bridge is disabled by default; do not expose it outside loopback.
