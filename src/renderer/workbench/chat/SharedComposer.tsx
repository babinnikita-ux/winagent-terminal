import { useState } from 'react';
import { useWorkbenchStore } from '../store';
import type { PermissionLevel, WorkbenchAgentId } from '../models/chat';

const RECIPIENTS: Array<{ id: WorkbenchAgentId; label: string }> = [{ id: 'claude', label: 'Claude' }, { id: 'codex', label: 'Codex' }];

export default function SharedComposer() {
  const [draft, setDraft] = useState('');
  const { selectedRecipients, setSelectedRecipients, sharedContext, setSharedContext, permissionLevel, setPermissionLevel, sendChatMessage } = useWorkbenchStore();
  const send = (recipients = selectedRecipients) => {
    if (!draft.trim() || recipients.length === 0) return;
    sendChatMessage(draft, recipients);
    setDraft('');
  };
  const toggleRecipient = (agentId: WorkbenchAgentId) => setSelectedRecipients(selectedRecipients.includes(agentId)
    ? selectedRecipients.filter((recipient) => recipient !== agentId)
    : [...selectedRecipients, agentId]);

  return (
    <section className="shared-composer" aria-label="Shared mock chat composer">
      <div className="shared-composer__topline">
        <label className="context-switch"><input type="checkbox" checked={sharedContext} onChange={(event) => setSharedContext(event.target.checked)} /> {sharedContext ? 'Shared context' : 'Independent context'}</label>
        <label>Permission
          <select value={permissionLevel} onChange={(event) => setPermissionLevel(event.target.value as PermissionLevel)}>
            <option value="read-only">Read only</option><option value="ask-before-write">Ask before write</option><option value="full-access">Full access</option>
          </select>
        </label>
      </div>
      <textarea
        aria-label="Message for mock agents"
        value={draft}
        placeholder="Describe the work to compare…"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); send(); }
        }}
      />
      <div className="shared-composer__actions">
        <div className="recipient-toggle" aria-label="Message recipients">
          {RECIPIENTS.map((recipient) => <label key={recipient.id}><input type="checkbox" checked={selectedRecipients.includes(recipient.id)} onChange={() => toggleRecipient(recipient.id)} /> {recipient.label}</label>)}
        </div>
        <button type="button" disabled title="Mock attachment control">Attach</button>
        <button type="button" onClick={() => send(['claude'])} disabled={!draft.trim()}>Claude</button>
        <button type="button" onClick={() => send(['codex'])} disabled={!draft.trim()}>Codex</button>
        <button type="button" className="workbench-button--accent" onClick={() => send(['claude', 'codex'])} disabled={!draft.trim()}>Both <kbd>Ctrl+Enter</kbd></button>
      </div>
    </section>
  );
}
