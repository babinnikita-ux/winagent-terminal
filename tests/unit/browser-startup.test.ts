import { describe, expect, it } from 'vitest';
import { DEFAULT_BROWSER_PREFS } from '../../src/renderer/store/settings-slice';
import { DEFAULT_BROWSER_URL } from '../../src/renderer/components/Browser/BrowserPane';
import { readFileSync } from 'node:fs';

describe('internal browser startup', () => {
  it('stays closed by default', () => {
    expect(DEFAULT_BROWSER_PREFS.openOnStartup).toBe(false);
  });

  it('does not navigate to an upstream wmux page by default', () => {
    expect(DEFAULT_BROWSER_URL).toBe('about:blank');
    expect(DEFAULT_BROWSER_URL).not.toContain('wmux');
  });

  it('ignores legacy auto-open preferences during application startup', () => {
    const source = readFileSync('src/renderer/App.tsx', 'utf8');
    expect(source).toContain('const [browserOpen, setBrowserOpen] = useState(false)');
    expect(source).not.toContain('browserPrefs.openOnStartup');
  });
});
