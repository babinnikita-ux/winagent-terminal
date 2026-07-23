import type { ReactNode } from 'react';
import WorkbenchNav from './WorkbenchNav';
import type { AppMode } from './models/workbench';

interface WorkbenchShellProps {
  activeMode: AppMode;
  onSelectMode(mode: AppMode): void;
  onOpenSettings(): void;
  onOpenHelp(): void;
  children: ReactNode;
}

export default function WorkbenchShell({ activeMode, onSelectMode, onOpenSettings, onOpenHelp, children }: WorkbenchShellProps) {
  return (
    <div className="workbench-shell">
      <WorkbenchNav activeMode={activeMode} onSelectMode={onSelectMode} onOpenSettings={onOpenSettings} onOpenHelp={onOpenHelp} />
      <main className="workbench-shell__content">{children}</main>
    </div>
  );
}
