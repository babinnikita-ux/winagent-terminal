# Contributing

WinAgent Terminal accepts focused, reviewable changes. Develop on Windows when
changing ConPTY, Electron packaging, named pipes or installer behaviour.

Before opening a pull request run:

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd test
npm.cmd run build:main
npm.cmd run build:renderer
```

Do not add credentials, terminal transcripts, user state or generated release
artifacts to Git. Keep renderer code free of Node/Electron primitives; add IPC
only through the validated main-process boundary and cover it with tests.
