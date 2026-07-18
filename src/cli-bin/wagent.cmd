@echo off
REM WinAgent CLI shim. The main process injects WINAGENT_CLI for every Surface.
if defined WINAGENT_CLI (
  node "%WINAGENT_CLI%" %*
) else (
  node "%~dp0..\cli\wagent.js" %*
)
