# Troubleshooting

## `wagent` cannot connect

Start WinAgent Terminal first. The client connects to
`\\.\pipe\winagent-terminal`; privileged commands also need the token created
for the current Windows user. Do not copy this token to logs or chat.

## Shell or agent is unavailable

Use Settings to inspect detected shell profiles. Install Claude Code or Codex
normally and restart WinAgent Terminal so its PATH is re-evaluated. ProxyAPI
requires `PROXYAPI_KEY` in the user environment, never in application settings.

## Browser preview is blank

Use an `http://` or `https://` URL, including `http://localhost:<port>`. Local
file and `javascript:` URLs are intentionally blocked in Browser Surface.

## Diagnostics

Logs and state belong to `%APPDATA%\winagent-terminal`. Remove no state files
until a backup is made; a corrupt session is preserved and recovered safely at
startup.
