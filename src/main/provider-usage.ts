import { spawn } from 'child_process';
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
      this.cache.set(item, installed ? { provider: item, status: 'unavailable', windows: [], updatedAt: null, source: 'cli', errorCode: 'usage-not-supported' } : { provider: item, status: 'not-installed', windows: [], updatedAt: null, source: null });
    }));
    this.emit(); return this.getAll();
  }
  private emit(): void { const values = this.getAll(); this.listeners.forEach((listener) => listener(values)); }
}
function commandExists(command: string): Promise<boolean> {
  return new Promise((resolve) => { const child = spawn(command, ['--version'], { shell: false, windowsHide: true, stdio: 'ignore' }); const timeout = setTimeout(() => { child.kill(); resolve(false); }, 3000); child.once('error', () => { clearTimeout(timeout); resolve(false); }); child.once('exit', (code) => { clearTimeout(timeout); resolve(code === 0); }); });
}
