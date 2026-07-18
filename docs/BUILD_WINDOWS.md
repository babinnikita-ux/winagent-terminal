# Windows build

Supported targets are Windows 10 x64 and Windows 11 x64. Build from a native
Windows PowerShell session with current Node.js and the Visual C++ build tools
available for `node-pty` when a prebuild is unavailable.

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd test
npm.cmd run build
```

The release output contains an NSIS installer
`winagent-terminal-<version>-setup.exe`. The release workflow also creates a
portable x64 ZIP from the unpacked application; it does not require WSL.
The installer adds its bundled `wagent` shim to the current user's `PATH`, so
the CLI works without a separate Node.js installation after opening a new shell.
Do not add API keys to `package.json`, build arguments or release logs.
