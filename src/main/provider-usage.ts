import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ProviderId, ProviderUsage, UsageWindow } from '../shared/types';

const STALE_MS = 5 * 60_000;
const cliNames: Record<ProviderId, string> = { claude: 'claude', gemini: 'gemini', codex: 'codex' };

export function normalizePercent(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value * 100) / 100));
}
export function usageWindow(id: string, label: string, used: unknown, resetsAt: unknown = null): UsageWindow {
  const usedPercent = normalizePercent(used);
  return { id, label, usedPercent, remainingPercent: usedPercent === null ? null : 100 - usedPercent,
    resetsAt: typeof resetsAt === 'number' && Number.isFinite(resetsAt) ? resetsAt : null };
}
/** Parses only sanitized bridge payload fields; no status-line text or credentials cross IPC. */
export function parseClaudeStatusLine(payload: unknown): UsageWindow[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const limits = (payload as { rate_limits?: Record<string, { used_percent?: unknown; resets_at?: unknown }> }).rate_limits;
  if (!limits || typeof limits !== 'object') return null;
  const windows = Object.entries(limits).map(([id, value]) => usageWindow(id, id === 'five_hour' ? '5 часов' : id === 'weekly' ? 'Неделя' : id, value?.used_percent, value?.resets_at));
  return windows.some((window) => window.usedPercent !== null) ? windows : null;
}

export function parseCodexUsage(payload: unknown): UsageWindow[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const rateLimits = (payload as { rateLimits?: unknown }).rateLimits;
  if (rateLimits && typeof rateLimits === 'object' && !Array.isArray(rateLimits)) {
    const snapshot = rateLimits as {
      primary?: unknown;
      secondary?: unknown;
    };
    const windows = ([
      ['primary', snapshot.primary],
      ['secondary', snapshot.secondary],
    ] as Array<[string, unknown]>).flatMap(([id, raw]): UsageWindow[] => {
      if (!raw || typeof raw !== 'object') return [];
      const value = raw as { usedPercent?: unknown; resetsAt?: unknown; windowDurationMins?: unknown };
      const duration = typeof value.windowDurationMins === 'number' ? value.windowDurationMins : null;
      const label = duration === 300 ? '5 часов' : duration === 10_080 ? 'Неделя' : id;
      return [usageWindow(String(id), label, value.usedPercent, value.resetsAt)];
    });
    return windows.some((window) => window.usedPercent !== null) ? windows : null;
  }
  if (!Array.isArray(rateLimits)) return null;
  const windows = rateLimits.flatMap((raw): UsageWindow[] => {
    if (!raw || typeof raw !== 'object') return [];
    const value = raw as { id?: unknown; label?: unknown; usedPercent?: unknown; resetsAt?: unknown };
    if (typeof value.id !== 'string') return [];
    return [usageWindow(
      value.id,
      typeof value.label === 'string' ? value.label : value.id,
      value.usedPercent,
      value.resetsAt,
    )];
  });
  return windows.some((window) => window.usedPercent !== null) ? windows : null;
}

export function parseGeminiUsage(payload: unknown): UsageWindow[] | null {
  if (!payload || typeof payload !== 'object') return null;
  const quotas = (payload as { quotas?: unknown }).quotas;
  if (!quotas || typeof quotas !== 'object' || Array.isArray(quotas)) return null;
  const windows = Object.entries(quotas).flatMap(([id, raw]): UsageWindow[] => {
    if (!raw || typeof raw !== 'object') return [];
    const value = raw as { remainingPercent?: unknown; resetsAt?: unknown; label?: unknown };
    const remaining = normalizePercent(value.remainingPercent);
    if (remaining === null) return [];
    return [{
      id,
      label: typeof value.label === 'string' ? value.label : id,
      usedPercent: 100 - remaining,
      remainingPercent: remaining,
      resetsAt: typeof value.resetsAt === 'number' && Number.isFinite(value.resetsAt)
        ? value.resetsAt
        : null,
    }];
  });
  return windows.length ? windows : null;
}

export interface ProviderUsageAdapter {
  readonly provider: ProviderId;
  parse(payload: unknown): UsageWindow[] | null;
}

export const providerUsageAdapters: ReadonlyArray<ProviderUsageAdapter> = [
  { provider: 'claude', parse: parseClaudeStatusLine },
  { provider: 'codex', parse: parseCodexUsage },
  { provider: 'gemini', parse: parseGeminiUsage },
];

export class ProviderUsageService {
  private cache = new Map<ProviderId, ProviderUsage>();
  private timer?: NodeJS.Timeout;
  private listeners = new Set<(items: ProviderUsage[]) => void>();
  start(): void { if (!this.timer) { void this.refresh(); this.timer = setInterval(() => void this.refresh(), 90_000); } }
  stop(): void { if (this.timer) clearInterval(this.timer); this.timer = undefined; }
  subscribe(listener: (items: ProviderUsage[]) => void): () => void { this.listeners.add(listener); listener(this.getAll()); return () => this.listeners.delete(listener); }
  getAll(): ProviderUsage[] { return (['claude', 'gemini', 'codex'] as ProviderId[]).map((provider) => this.get(provider)); }
  get(provider: ProviderId): ProviderUsage {
    const value = this.cache.get(provider);
    if (!value) return { provider, status: 'unavailable', windows: [], updatedAt: null, source: null };
    return value.updatedAt && Date.now() - value.updatedAt > STALE_MS ? { ...value, status: 'stale' } : value;
  }
  ingestClaudeBridge(payload: unknown): ProviderUsage {
    const windows = parseClaudeStatusLine(payload);
    const usage: ProviderUsage = windows ? { provider: 'claude', status: 'fresh', windows, updatedAt: Date.now(), source: 'statusline' } : { provider: 'claude', status: 'error', windows: [], updatedAt: null, source: 'statusline', errorCode: 'invalid-payload' };
    this.cache.set('claude', usage); this.emit(); return usage;
  }
  async refresh(provider?: ProviderId): Promise<ProviderUsage[]> {
    const providers = provider ? [provider] : ['claude', 'gemini', 'codex'] as ProviderId[];
    await Promise.all(providers.map(async (item) => {
      if (item === 'claude' && this.cache.get(item)?.source === 'statusline') return;
      const installed = await commandExists(cliNames[item]);
      if (!installed) {
        this.cache.set(item, { provider: item, status: 'not-installed', windows: [], updatedAt: null, source: null });
        return;
      }
      if (item === 'codex') {
        const windows = await readCodexRateLimits();
        this.cache.set(item, windows
          ? { provider: item, status: 'fresh', windows, updatedAt: Date.now(), source: 'app-server' }
          : { provider: item, status: 'unavailable', windows: [], updatedAt: null, source: 'app-server', errorCode: 'rate-limits-unavailable' });
        return;
      }
      this.cache.set(item, { provider: item, status: 'unavailable', windows: [], updatedAt: null, source: 'cli', errorCode: 'usage-not-supported' });
    }));
    this.emit(); return this.getAll();
  }
  private emit(): void { const values = this.getAll(); this.listeners.forEach((listener) => listener(values)); }
}
function commandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const executable = process.platform === 'win32' ? 'where.exe' : 'which';
    const args = [process.platform === 'win32' ? `${command}.*` : command];
    const child = spawn(executable, args, { shell: false, windowsHide: true, stdio: 'ignore' });
    const timeout = setTimeout(() => { child.kill(); resolve(false); }, 3000);
    child.once('error', () => { clearTimeout(timeout); resolve(false); });
    child.once('exit', (code) => { clearTimeout(timeout); resolve(code === 0); });
  });
}

function readCodexRateLimits(): Promise<UsageWindow[] | null> {
  return new Promise((resolve) => {
    const managedCodex = findManagedCodexExecutable();
    const child = spawn(managedCodex ?? 'codex', ['app-server'], {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    let settled = false;
    let buffer = '';
    const finish = (windows: UsageWindow[] | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      child.kill();
      resolve(windows);
    };
    const timeout = setTimeout(() => finish(null), 6000);
    child.once('error', () => finish(null));
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        try {
          const message = JSON.parse(line);
          if (message?.id === 1) {
            child.stdin.write(`${JSON.stringify({ method: 'initialized', params: {} })}\n`);
            child.stdin.write(`${JSON.stringify({ method: 'account/rateLimits/read', id: 7 })}\n`);
          } else if (message?.id === 7) {
            finish(parseCodexUsage(message.result));
          }
        } catch { /* app-server may emit non-protocol diagnostics */ }
      }
    });
    child.stdin.write(`${JSON.stringify({
      method: 'initialize',
      id: 1,
      params: {
        clientInfo: { name: 'winagent-terminal', title: 'WinAgent Terminal', version: '0.27.1' },
        capabilities: {},
      },
    })}\n`);
  });
}

function findManagedCodexExecutable(): string | null {
  if (process.platform !== 'win32' || !process.env.LOCALAPPDATA) return null;
  const root = path.join(process.env.LOCALAPPDATA, 'OpenAI', 'Codex', 'bin');
  try {
    const candidates = fs.readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(root, entry.name, 'codex.exe'))
      .filter((candidate) => fs.existsSync(candidate))
      .map((candidate) => ({ candidate, modified: fs.statSync(candidate).mtimeMs }))
      .sort((left, right) => right.modified - left.modified);
    return candidates[0]?.candidate ?? null;
  } catch {
    return null;
  }
}
