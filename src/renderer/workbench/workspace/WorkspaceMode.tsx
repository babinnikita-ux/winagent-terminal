import type { ReactNode } from 'react';
import { getWorkspaceModePresentation } from './presentation';

interface WorkspaceModeProps { active: boolean; children: ReactNode; }

/** Keeps terminal trees mounted while another workbench mode is visible. */
export default function WorkspaceMode({ active, children }: WorkspaceModeProps) {
  const presentation = getWorkspaceModePresentation(active);
  return <section className={`workspace-mode ${active ? 'is-active' : ''}`} style={{ opacity: presentation.opacity, pointerEvents: presentation.pointerEvents }} aria-label="Workspace mode" aria-hidden={!active}>{children}</section>;
}
