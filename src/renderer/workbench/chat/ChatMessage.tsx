import { useWorkbenchStore } from '../store';
import type { ChatMessageModel, WorkbenchAgentId } from '../models/chat';
import AgentEventCard from './AgentEventCard';

interface ChatMessageProps {
  agentId: WorkbenchAgentId;
  message: ChatMessageModel;
}

export default function ChatMessage({ agentId, message }: ChatMessageProps) {
  const addMessageToWorkflow = useWorkbenchStore((state) => state.addMessageToWorkflow);
  const sendChatMessage = useWorkbenchStore((state) => state.sendChatMessage);
  const otherAgent: WorkbenchAgentId = agentId === 'claude' ? 'codex' : 'claude';
  const copy = () => { void navigator.clipboard?.writeText(message.content); };

  return (
    <article className={`chat-message chat-message--${message.role}`}>
      <div className="chat-message__meta"><span>{message.role === 'assistant' ? agentId === 'claude' ? 'Claude' : 'Codex' : 'You'}</span><time>{message.createdAt}</time></div>
      <p>{message.content}</p>
      {message.events?.map((event) => <AgentEventCard key={event.id} event={event} />)}
      {message.role === 'assistant' && (
        <div className="chat-message__actions" aria-label="Message actions">
          <button type="button" onClick={copy}>Copy</button>
          <button type="button" onClick={() => sendChatMessage(message.content, [otherAgent])}>Send to {otherAgent === 'claude' ? 'Claude' : 'Codex'}</button>
          <button type="button" onClick={() => addMessageToWorkflow(message, agentId)}>Add to workflow</button>
        </div>
      )}
    </article>
  );
}
