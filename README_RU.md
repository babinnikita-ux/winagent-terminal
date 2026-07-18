# WinAgent Terminal

Терминальный мультиплексор для Windows и параллельной работы с AI coding
agents. В основе — Electron, React, xterm.js и Windows ConPTY.

## Текущий этап

Milestone 1–2: окна, Workspace, Terminal Surface, split panes, вкладки,
keyboard-first навигация, Command Palette, поиск shell, ConPTY, изменение
размера, корректное завершение процессов и восстановление структуры сессии.
ProxyAPI, AI-профили, браузер и CLI/IPC остаются отдельными следующими этапами.

## Запуск из исходников

```powershell
npm.cmd ci
npm.cmd run build:main
npm.cmd test
npm.cmd run dev
```

Архитектурное решение: [docs/ARCHITECTURE_DECISION.md](docs/ARCHITECTURE_DECISION.md).
Модель угроз: [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).
