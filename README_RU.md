# WinAgent Terminal

Терминальный мультиплексор для Windows и параллельной работы с AI coding
agents. В основе — Electron, React, xterm.js и Windows ConPTY.

## Текущий этап

Milestone 1–3: окна, Workspace, Terminal Surface, split panes, вкладки,
keyboard-first навигация, Command Palette, поиск shell, ConPTY, изменение
размера, корректное завершение процессов и восстановление структуры сессии.
ProxyAPI и AI-профили готовы: Claude Code и Codex запускаются через меню **+**,
а ключ передаётся только из `PROXYAPI_KEY`. Browser Surface поддерживает
localhost, навигацию, DevTools и локальную CDP-автоматизацию; страницы браузера
изолированы от Electron. CLI `wagent` использует локальный аутентифицированный
IPC: [справочник команд](docs/CLI_REFERENCE.md).

## Запуск из исходников

```powershell
npm.cmd ci
npm.cmd run build:main
npm.cmd test
npm.cmd run dev
```

Архитектурное решение: [docs/ARCHITECTURE_DECISION.md](docs/ARCHITECTURE_DECISION.md).
Модель угроз: [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md).
Настройка ProxyAPI: [docs/PROXYAPI_SETUP.md](docs/PROXYAPI_SETUP.md).
Сборка Windows: [docs/BUILD_WINDOWS.md](docs/BUILD_WINDOWS.md).
Устранение неполадок: [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).
