const SECRET_PATTERNS: RegExp[] = [
  /(authorization\s*[:=]\s*)(?:bearer\s+)?[^\s,;]+/gi,
  /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|auth[_-]?token|token|cookie|password)\s*[:=]\s*)[^\s,;]+/gi,
  /([?&](?:api[_-]?key|token|access_token|refresh_token)=)[^&\s]+/gi,
];

const BLOCKED_ENVIRONMENT_NAMES = new Set([
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_AUTH_TOKEN',
  'OPENAI_API_KEY',
  'PROXYAPI_KEY',
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
]);

const ENVIRONMENT_ALLOWLIST = new Set([
  'APPDATA', 'COMSPEC', 'HOME', 'HOMEDRIVE', 'HOMEPATH', 'LANG', 'LOCALAPPDATA',
  'PATH', 'PATHEXT', 'PROGRAMDATA', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROMPT',
  'SYSTEMDRIVE', 'SYSTEMROOT', 'TEMP', 'TMP', 'USERDOMAIN', 'USERNAME', 'USERPROFILE',
  'WINDIR', 'XDG_CONFIG_HOME', 'XDG_DATA_HOME', 'CODEX_HOME', 'CLAUDE_CONFIG_DIR',
]);

export function redactSecrets(value: string, explicitSecrets: readonly string[] = []): string {
  let redacted = value;
  for (const secret of explicitSecrets) {
    if (secret.length >= 4) redacted = redacted.split(secret).join('[REDACTED]');
  }
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, '$1[REDACTED]');
  }
  return redacted;
}

/**
 * Builds the child environment without API-key/proxy injection. It retains only
 * normal path/profile locations used by official CLIs and their credential stores.
 */
export function buildCliEnvironment(source: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
  return Object.fromEntries(Object.entries(source).flatMap(([name, value]) => {
    const normalized = name.toUpperCase();
    if (!value || BLOCKED_ENVIRONMENT_NAMES.has(normalized) || !ENVIRONMENT_ALLOWLIST.has(normalized)) return [];
    return [[name, value]];
  }));
}
