import React from 'react';

interface UnreadBadgeProps {
  count: number;
  isSelected: boolean;
}

export default function UnreadBadge({ count, isSelected: _isSelected }: UnreadBadgeProps) {
  return (
    <span
      className="unread-badge"
      style={{
        backgroundColor: 'var(--ui-accent)',
      }}
    >
      {count}
    </span>
  );
}
