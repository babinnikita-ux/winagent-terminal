import { describe, expect, it } from 'vitest';
import { getWorkspaceModePresentation } from '../../src/renderer/workbench/workspace/presentation';

describe('workspace mode presentation', () => {
  it('keeps inactive workspace content mounted while preventing interaction', () => {
    expect(getWorkspaceModePresentation(false)).toEqual({
      keepMounted: true,
      opacity: 0,
      pointerEvents: 'none',
    });
  });

  it('makes the retained workspace interactive when selected', () => {
    expect(getWorkspaceModePresentation(true)).toEqual({
      keepMounted: true,
      opacity: 1,
      pointerEvents: 'auto',
    });
  });
});
