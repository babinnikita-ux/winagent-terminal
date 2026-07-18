/**
 * Browser Surface security policy.
 *
 * Keep this policy independent from Electron so it can be unit-tested without
 * creating a BrowserWindow. Browser pages may be untrusted; the app renderer
 * and its preload API must never become their privilege boundary.
 */
type MutableWebPreferences = {
  preload?: unknown;
  preloadURL?: unknown;
  nodeIntegration?: boolean;
  contextIsolation?: boolean;
  sandbox?: boolean;
  webSecurity?: boolean;
  allowRunningInsecureContent?: boolean;
  plugins?: boolean;
};

type WebviewParams = Record<string, unknown>;

function parseUrl(value: string): URL | null {
  try { return new URL(value); } catch { return null; }
}

export function isSafeExternalUrl(value: string): boolean {
  const url = parseUrl(value);
  return url?.protocol === 'http:' || url?.protocol === 'https:';
}

/** Browser Surfaces deliberately support web and localhost content, not local files or executable schemes. */
export function isAllowedBrowserUrl(value: string): boolean {
  if (value === 'about:blank') return true;
  return isSafeExternalUrl(value);
}

/** Lock every guest webview down even if a renderer attribute is modified. */
export function hardenWebviewPreferences(
  webPreferences: MutableWebPreferences,
  params: WebviewParams,
): void {
  delete webPreferences.preload;
  delete webPreferences.preloadURL;
  webPreferences.nodeIntegration = false;
  webPreferences.contextIsolation = true;
  webPreferences.sandbox = true;
  webPreferences.webSecurity = true;
  webPreferences.allowRunningInsecureContent = false;
  webPreferences.plugins = false;
  params.allowpopups = 'false';
  params.nodeintegration = 'false';
}
