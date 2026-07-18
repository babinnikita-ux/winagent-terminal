@echo off
REM WinAgent CLI shim. The main process injects WINAGENT_CLI for every Surface.
if defined WINAGENT_CLI (
  node "%WINAGENT_CLI%" %*
) else if exist "%~dp0..\..\WinAgent Terminal.exe" (
  set "ELECTRON_RUN_AS_NODE=1"
  "%~dp0..\..\WinAgent Terminal.exe" "%~dp0..\cli\wagent.js" %*
) else (
  node "%~dp0..\cli\wagent.js" %*
)
