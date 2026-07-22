/**
 * The terminal shortcut handler is global. Composer controls opt out so their
 * native editing shortcuts keep reaching the textarea instead of a PTY action.
 */
export function isTextInputTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;
  const candidate = target as { tagName?: string; isContentEditable?: boolean };
  return candidate.isContentEditable === true
    || candidate.tagName === 'TEXTAREA'
    || candidate.tagName === 'INPUT'
    || candidate.tagName === 'SELECT';
}
