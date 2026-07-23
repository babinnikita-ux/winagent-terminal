export interface WorkspaceModePresentation {
  /** The terminal DOM must stay alive so switching modes never terminates PTYs. */
  keepMounted: true;
  opacity: 0 | 1;
  pointerEvents: 'none' | 'auto';
}

export function getWorkspaceModePresentation(active: boolean): WorkspaceModePresentation {
  return {
    keepMounted: true,
    opacity: active ? 1 : 0,
    pointerEvents: active ? 'auto' : 'none',
  };
}
