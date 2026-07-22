import type { AgentChatSession } from '../models/chat';
import ChatMessage from './ChatMessage';

export default function AgentChatPanel({ session }: { session: AgentChatSession }) {
  return (
    <section className="agent-chat-panel" aria-label={`${session.label} mock chat`}>
      <header className="agent-chat-panel__header">
        <div><h2>{session.label}</h2><span className={`status-dot status-dot--${session.status}`} /> <small>{session.status === 'working' ? 'Mock response in progress' : 'Mock ready'}</small></div>
        <div className="agent-chat-panel__controls">
          <button type="button" className="workbench-select-placeholder" aria-label={`${session.label} model selection placeholder`}>{session.modelLabel}</button>
          <button type="button" disabled aria-label={`Stop ${session.label} mock response`}>Stop</button>
          <button type="button" disabled aria-label={`Open ${session.label} terminal`}>Open terminal</button>
        </div>
      </header>
      <div className="agent-chat-panel__messages" aria-live="polite">
        {session.messages.length === 0 ? <div className="workbench-empty">No mock messages yet.</div> : session.messages.map((message) => <ChatMessage key={message.id} agentId={session.agentId} message={message} />)}
      </div>
    </section>
  );
}
