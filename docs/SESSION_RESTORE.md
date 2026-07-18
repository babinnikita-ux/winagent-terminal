# Session restore

WinAgent stores its state in `%APPDATA%\winagent-terminal`. The rolling
session is written atomically and contains layout, workspaces, surface metadata,
working directories and browser URLs — never live process handles or secrets.

On restart, the application restores the layout and launches fresh terminal
processes. A named session can be saved or loaded from the sidebar session
menu. On version changes WinAgent clears only the volatile auto-session, while
named sessions remain available to avoid restoring stale process trees.

If state is corrupted, WinAgent falls back to a safe new session. Back up the
state directory before manual recovery; do not copy credentials into a session
file.
