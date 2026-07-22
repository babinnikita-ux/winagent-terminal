import type { AppMode } from './models/workbench';

interface WorkbenchNavProps {
  activeMode: AppMode;
  onSelectMode(mode: AppMode): void;
  onOpenSettings(): void;
  onOpenHelp(): void;
}

const NAV_ITEMS: Array<{ mode: AppMode; label: string; hint: string }> = [
  { mode: 'chat', label: 'Chat', hint: 'Compare mock agent conversations' },
  { mode: 'workflow', label: 'Workflow', hint: 'Edit a mock workflow' },
  { mode: 'workspace', label: 'Workspace', hint: 'Use terminal workspaces' },
  { mode: 'runs', label: 'Runs', hint: 'Inspect mock workflow history' },
];

export default function WorkbenchNav({ activeMode, onSelectMode, onOpenSettings, onOpenHelp }: WorkbenchNavProps) {
  return (
    <nav className="workbench-nav" aria-label="Workbench modes">
      <div className="workbench-nav__brand" aria-label="WinAgent workbench">WA</div>
      <div className="workbench-nav__modes">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.mode}
            type="button"
            className={`workbench-nav__button ${activeMode === item.mode ? 'is-active' : ''}`}
            aria-label={item.label}
            aria-current={activeMode === item.mode ? 'page' : undefined}
            title={item.hint}
            onClick={() => onSelectMode(item.mode)}
          >
            <span aria-hidden>{item.label.slice(0, 1)}</span>
            <span className="workbench-nav__label">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="workbench-nav__bottom">
        <button type="button" className="workbench-nav__button" aria-label="Settings" title="Settings" onClick={onOpenSettings}>S<span className="workbench-nav__label">Settings</span></button>
        <button type="button" className="workbench-nav__button" aria-label="Help" title="Help" onClick={onOpenHelp}>?<span className="workbench-nav__label">Help</span></button>
      </div>
    </nav>
  );
}
