import { describe, expect, it } from 'vitest';
import {
  expandPrompt,
  migrateProductivitySettings,
  sanitizeDiagnosticReport,
  selectLayoutTemplate,
  updateAttentionItems,
} from '../../src/renderer/productivity/core';

describe('productivity workflows', () => {
  it('deduplicates attention events and keeps the newest bounded list', () => {
    const first = { id: 'permission:1', kind: 'permission' as const, title: 'Нужно разрешение', createdAt: 1 };
    const newer = { ...first, title: 'Повторный запрос', createdAt: 2 };
    expect(updateAttentionItems([first], newer, 2)).toEqual([newer]);
  });

  it('provides safe layout templates without sharing mutable trees', () => {
    const first = selectLayoutTemplate('pair');
    const second = selectLayoutTemplate('pair');
    expect(first).toEqual(second);
    expect(first).not.toBe(second);
    expect(first.type).toBe('branch');
  });

  it('expands known prompt variables and reports unresolved variables', () => {
    expect(expandPrompt('Проверь ${cwd} для ${provider}', { cwd: 'C:\\repo', provider: 'Codex' }))
      .toEqual({ text: 'Проверь C:\\repo для Codex', missing: [] });
    expect(expandPrompt('Исправь ${error}', {})).toEqual({ text: 'Исправь ${error}', missing: ['error'] });
  });

  it('migrates settings idempotently and preserves unknown fields', () => {
    const migrated = migrateProductivitySettings({ density: 'dense', custom: 7 });
    expect(migrated).toMatchObject({ schemaVersion: 2, density: 'compact', custom: 7 });
    expect(migrateProductivitySettings(migrated)).toEqual(migrated);
  });

  it('sanitizes homes, tokens, cookies and API keys in diagnostics', () => {
    const report = 'C:\\Users\\Nikita\\app token=secret cookie=session API_KEY=abc';
    const safe = sanitizeDiagnosticReport(report, 'C:\\Users\\Nikita');
    expect(safe).not.toContain('Nikita');
    expect(safe).not.toContain('secret');
    expect(safe).not.toContain('session');
    expect(safe).not.toContain('abc');
  });
});
