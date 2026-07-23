import { describe, expect, it } from 'vitest';
import { isTextInputTarget } from '../../src/renderer/workbench/keyboard';

describe('workbench keyboard boundaries', () => {
  it('recognizes textarea targets so terminal shortcuts are not intercepted while composing', () => {
    expect(isTextInputTarget({ tagName: 'TEXTAREA', isContentEditable: false } as unknown as EventTarget)).toBe(true);
  });

  it('does not treat terminal surface targets as text inputs', () => {
    expect(isTextInputTarget({ tagName: 'DIV', isContentEditable: false } as unknown as EventTarget)).toBe(false);
  });
});
