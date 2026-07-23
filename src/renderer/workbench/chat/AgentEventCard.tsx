import type { AgentEvent } from '../models/chat';

export default function AgentEventCard({ event }: { event: AgentEvent }) {
  return (
    <details className={`agent-event-card agent-event-card--${event.type}`} open={event.openByDefault}>
      <summary>{event.title}<span>{event.type.replace('-', ' ')}</span></summary>
      <pre>{event.detail}</pre>
    </details>
  );
}
