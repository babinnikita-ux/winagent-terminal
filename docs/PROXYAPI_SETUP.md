# ProxyAPI

WinAgent Terminal uses ProxyAPI only through the `PROXYAPI_KEY` environment
variable. The application has no API-key field and never saves a key to its
settings, sessions, generated TOML, diagnostics or renderer process.

## Configure once for the current Windows user

Open PowerShell and set the value supplied by ProxyAPI:

```powershell
[Environment]::SetEnvironmentVariable('PROXYAPI_KEY', 'your-key', 'User')
```

Close every running WinAgent Terminal window and start it again. In **Settings
→ AI**, the ProxyAPI row becomes `Ready`. The screen deliberately reports only
presence, never the key value.

To remove the key later:

```powershell
[Environment]::SetEnvironmentVariable('PROXYAPI_KEY', $null, 'User')
```

## How launch profiles work

The arrow beside **+** in a terminal pane offers the following presets:

- **Claude Code via ProxyAPI**: child process receives
  `ANTHROPIC_BASE_URL=https://api.proxyapi.ru/anthropic` and uses
  `PROXYAPI_KEY` as its authentication token.
- **Codex via ProxyAPI**: child process receives `PROXYAPI_KEY`; a generated,
  credential-free `config.toml` points Codex to
  `https://api.proxyapi.ru/openai/v1` using the Responses wire API.
- **Resume** items invoke the native CLI session selector (`claude --resume` or
  `codex resume`).

The Codex profile is written under WinAgent's application-data directory and
does not edit `~/.codex/config.toml`. WinAgent does not change Claude Code
settings or install hooks.

## Troubleshooting

If a launch pane reports that ProxyAPI is not configured, verify the variable
from a *new* PowerShell window with `Get-ChildItem Env:PROXYAPI_KEY`, then
restart WinAgent Terminal. If the AI screen marks a CLI as missing, install that
CLI normally and ensure its executable is on `PATH` before restarting.
