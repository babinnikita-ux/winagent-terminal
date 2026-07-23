import { useWorkbenchStore } from '../store';
import AgentChatPanel from './AgentChatPanel';
import SharedComposer from './SharedComposer';

export default function ChatMode() {
  const sessions = useWorkbenchStore((state) => state.chatSessions);
  const notice = useWorkbenchStore((state) => state.notice);
  const dismissNotice = useWorkbenchStore((state) => state.dismissNotice);
  return (
    <section className="workbench-mode workbench-mode--chat" aria-label="Chat mode">
      <header className="workbench-mode__heading"><div><p>Mock-only comparison</p><h1>Two perspectives, one local workspace</h1></div><span>Claude and Codex are UI samples only</span></header>
      {notice && <div className="workbench-notice" role="status">{notice}<button type="button" onClick={dismissNotice} aria-label="Dismiss notification">Close</button></div>}
      <div className="chat-grid"><AgentChatPanel session={sessions.claude} /><AgentChatPanel session={sessions.codex} /></div>
      <SharedComposer />
    </section>
  );
}
