export type WorkbenchAgentId = 'claude' | 'codex';
export type ChatRole = 'user' | 'assistant' | 'system';
export type PermissionLevel = 'read-only' | 'ask-before-write' | 'full-access';

export interface AgentEvent {
  id: string;
  type: 'tool-call' | 'command-result' | 'file-change' | 'error';
  title: string;
  detail: string;
  openByDefault?: boolean;
}

export interface ChatMessageModel {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  events?: AgentEvent[];
}

export interface AgentChatSession {
  agentId: WorkbenchAgentId;
  label: string;
  status: 'ready' | 'working' | 'error';
  modelLabel: string;
  messages: ChatMessageModel[];
}

export type ChatSessions = Record<WorkbenchAgentId, AgentChatSession>;
