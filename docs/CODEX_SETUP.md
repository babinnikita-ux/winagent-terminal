# Codex through ProxyAPI

Install the Codex CLI, set `PROXYAPI_KEY` as described in
[ProxyAPI setup](PROXYAPI_SETUP.md), then restart WinAgent Terminal. Select
**+ → Codex via ProxyAPI** in the target pane.

WinAgent creates an isolated, credential-free Codex provider configuration for
that child process. Your existing `~/.codex` files are not changed. Select
**Resume Codex** to use the CLI's native session picker.
