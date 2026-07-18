import { describe, expect, it } from 'vitest';
import { hardenWebviewPreferences, isAllowedBrowserUrl, isSafeExternalUrl } from '../../src/main/browser-security';

describe('Browser Surface security policy', () => {
  it('allows only web navigation plus an empty browser page', () => {
    expect(isAllowedBrowserUrl('https://localhost:3000')).toBe(true);
    expect(isAllowedBrowserUrl('http://127.0.0.1:5173')).toBe(true);
    expect(isAllowedBrowserUrl('about:blank')).toBe(true);
    expect(isAllowedBrowserUrl('file:///C:/Users/Nikita/.ssh/id_rsa')).toBe(false);
    expect(isAllowedBrowserUrl('javascript:alert(1)')).toBe(false);
    expect(isAllowedBrowserUrl('data:text/html,test')).toBe(false);
  });

  it('opens only web URLs outside the application', () => {
    expect(isSafeExternalUrl('https://example.com')).toBe(true);
    expect(isSafeExternalUrl('mailto:person@example.com')).toBe(false);
    expect(isSafeExternalUrl('shell:AppsFolder')).toBe(false);
  });

  it('removes guest preload and privileged webview features', () => {
    const preferences: Record<string, unknown> = { preload: 'evil.js', preloadURL: 'evil-url', nodeIntegration: true, contextIsolation: false };
    const params: Record<string, unknown> = { allowpopups: 'true', nodeintegration: 'true' };
    hardenWebviewPreferences(preferences, params);
    expect(preferences).toMatchObject({ nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, allowRunningInsecureContent: false, plugins: false });
    expect(preferences).not.toHaveProperty('preload');
    expect(preferences).not.toHaveProperty('preloadURL');
    expect(params).toMatchObject({ allowpopups: 'false', nodeintegration: 'false' });
  });
});
