import { describe, expect, it } from 'vitest';
import {
  normalizePercent,
  parseClaudeStatusLine,
  parseCodexUsage,
  parseGeminiUsage,
  usageWindow,
} from '../../src/main/provider-usage';

describe('provider usage safety', () => {
  it('normalizes untrusted percentages', () => { expect(normalizePercent(-3)).toBe(0); expect(normalizePercent(120)).toBe(100); expect(normalizePercent(Number.NaN)).toBeNull(); });
  it('calculates remaining only from a real value', () => { expect(usageWindow('weekly', 'Неделя', 40).remainingPercent).toBe(60); expect(usageWindow('weekly', 'Неделя', null).remainingPercent).toBeNull(); });
  it('parses the sanitized Claude bridge format without accepting malformed data', () => { expect(parseClaudeStatusLine({ rate_limits: { five_hour: { used_percent: 31 }, weekly: { used_percent: 72 } } })?.map((item) => item.remainingPercent)).toEqual([69, 28]); expect(parseClaudeStatusLine('{not json}')).toBeNull(); });
  it('parses sanitized Codex app-server windows', () => {
    expect(parseCodexUsage({ rateLimits: [{ id: 'weekly', usedPercent: 25, resetsAt: 42 }] }))
      .toEqual([expect.objectContaining({ id: 'weekly', remainingPercent: 75, resetsAt: 42 })]);
    expect(parseCodexUsage({
      rateLimits: {
        primary: { usedPercent: 20, windowDurationMins: 300, resetsAt: 42 },
        secondary: { usedPercent: 35, windowDurationMins: 10_080, resetsAt: 84 },
      },
    })).toEqual([
      expect.objectContaining({ id: 'primary', label: '5 часов', remainingPercent: 80 }),
      expect.objectContaining({ id: 'secondary', label: 'Неделя', remainingPercent: 65 }),
    ]);
    expect(parseCodexUsage({ rateLimits: 'secret stdout' })).toBeNull();
  });
  it('parses sanitized Gemini quota windows', () => {
    expect(parseGeminiUsage({ quotas: { daily: { remainingPercent: 60 } } }))
      .toEqual([expect.objectContaining({ id: 'daily', usedPercent: 40, remainingPercent: 60 })]);
    expect(parseGeminiUsage(null)).toBeNull();
  });
});
