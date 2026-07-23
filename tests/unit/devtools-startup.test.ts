import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('developer tools startup', () => {
  it('does not open DevTools automatically in development mode', () => {
    const source = readFileSync('src/main/window-manager.ts', 'utf8');
    expect(source).not.toContain('win.webContents.openDevTools');
    expect(source).toContain('win.loadURL');
  });
});
