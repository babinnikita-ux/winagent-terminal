import type { ChatSessions } from '../models/chat';

export const mockChatSessions: ChatSessions = {
  claude: {
    agentId: 'claude',
    label: 'Claude',
    status: 'ready',
    modelLabel: 'Model selection',
    messages: [
      { id: 'claude-user-1', role: 'user', content: 'Review the repository structure and identify the next safe step.', createdAt: '09:42' },
      {
        id: 'claude-assistant-1',
        role: 'assistant',
        content: 'The terminal workspace remains isolated. I would start with a small, testable renderer change.',
        createdAt: '09:42',
        events: [
          { id: 'claude-tool-1', type: 'tool-call', title: 'Repository inspection', detail: 'Read renderer entry points and the current Zustand slices.' },
          { id: 'claude-file-1', type: 'file-change', title: 'Suggested files', detail: 'src/renderer/App.tsx\nsrc/renderer/store/' },
        ],
      },
    ],
  },
  codex: {
    agentId: 'codex',
    label: 'Codex',
    status: 'ready',
    modelLabel: 'Model selection',
    messages: [
      { id: 'codex-user-1', role: 'user', content: 'Review the repository structure and identify the next safe step.', createdAt: '09:42' },
      {
        id: 'codex-assistant-1',
        role: 'assistant',
        content: 'I would keep agent UI state outside the terminal session tree and make the first flow mock-only.',
        createdAt: '09:42',
        events: [
          { id: 'codex-command-1', type: 'command-result', title: 'Validation plan', detail: 'Unit tests, lint, renderer build, then the packaged build.' },
          { id: 'codex-error-1', type: 'error', title: 'Mock boundary', detail: 'No agent process, network request or user file mutation is performed.' },
        ],
      },
    ],
  },
};
