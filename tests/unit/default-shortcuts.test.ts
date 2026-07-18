import { describe, expect, it } from 'vitest';
import { DEFAULT_SHORTCUTS, ShortcutBinding } from '../../src/renderer/store/settings-slice';

function expectShortcut(actual: ShortcutBinding, expected: ShortcutBinding): void {
  expect(actual).toEqual(expected);
}

describe('Milestone 2 default shortcuts', () => {
  it('preserves the keyboard-first workspace and pane controls', () => {
    expectShortcut(DEFAULT_SHORTCUTS.newWorkspace, { key: 'n', ctrl: true });
    expectShortcut(DEFAULT_SHORTCUTS.newSurface, { key: 't', ctrl: true });
    expectShortcut(DEFAULT_SHORTCUTS.splitRight, { key: 'd', ctrl: true });
    expectShortcut(DEFAULT_SHORTCUTS.splitDown, { key: 'd', ctrl: true, shift: true });
    expectShortcut(DEFAULT_SHORTCUTS.toggleZoom, { key: 'Enter', ctrl: true, shift: true });
    expectShortcut(DEFAULT_SHORTCUTS.closeWorkspace, { key: 'w', ctrl: true, shift: true });
    expectShortcut(DEFAULT_SHORTCUTS.closeSurfaceOrPane, { key: 'w', ctrl: true });
  });

  it('preserves navigation, search, palette and settings shortcuts', () => {
    expectShortcut(DEFAULT_SHORTCUTS.focusLeft, { key: 'ArrowLeft', ctrl: true, alt: true });
    expectShortcut(DEFAULT_SHORTCUTS.focusRight, { key: 'ArrowRight', ctrl: true, alt: true });
    expectShortcut(DEFAULT_SHORTCUTS.focusUp, { key: 'ArrowUp', ctrl: true, alt: true });
    expectShortcut(DEFAULT_SHORTCUTS.focusDown, { key: 'ArrowDown', ctrl: true, alt: true });
    expectShortcut(DEFAULT_SHORTCUTS.toggleSidebar, { key: 'b', ctrl: true });
    expectShortcut(DEFAULT_SHORTCUTS.commandPalette, { key: 'p', ctrl: true, shift: true });
    expectShortcut(DEFAULT_SHORTCUTS.find, { key: 'f', ctrl: true });
    expectShortcut(DEFAULT_SHORTCUTS.openSettings, { key: ',', ctrl: true });
    expectShortcut(DEFAULT_SHORTCUTS.showNotifications, { key: 'n', ctrl: true, alt: true });
  });
});
