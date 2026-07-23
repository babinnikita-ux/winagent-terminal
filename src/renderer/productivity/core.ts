export type AttentionKind = 'permission' | 'input' | 'auth' | 'failure' | 'completed';

export interface AttentionItem {
  id: string;
  kind: AttentionKind;
  title: string;
  createdAt: number;
  workspaceId?: string;
  surfaceId?: string;
}

export function updateAttentionItems(
  items: AttentionItem[],
  next: AttentionItem,
  limit = 100,
): AttentionItem[] {
  return [next, ...items.filter((item) => item.id !== next.id)]
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, Math.max(1, limit));
}

export type LayoutTemplateId = 'single' | 'pair' | 'three' | 'quad';
export type LayoutTemplate =
  | { type: 'leaf'; slot: number }
  | { type: 'branch'; direction: 'horizontal' | 'vertical'; ratio: number; children: [LayoutTemplate, LayoutTemplate] };

const layouts: Record<LayoutTemplateId, LayoutTemplate> = {
  single: { type: 'leaf', slot: 0 },
  pair: {
    type: 'branch', direction: 'horizontal', ratio: 0.5,
    children: [{ type: 'leaf', slot: 0 }, { type: 'leaf', slot: 1 }],
  },
  three: {
    type: 'branch', direction: 'horizontal', ratio: 0.5,
    children: [
      { type: 'leaf', slot: 0 },
      {
        type: 'branch', direction: 'vertical', ratio: 0.5,
        children: [{ type: 'leaf', slot: 1 }, { type: 'leaf', slot: 2 }],
      },
    ],
  },
  quad: {
    type: 'branch', direction: 'vertical', ratio: 0.5,
    children: [
      {
        type: 'branch', direction: 'horizontal', ratio: 0.5,
        children: [{ type: 'leaf', slot: 0 }, { type: 'leaf', slot: 1 }],
      },
      {
        type: 'branch', direction: 'horizontal', ratio: 0.5,
        children: [{ type: 'leaf', slot: 2 }, { type: 'leaf', slot: 3 }],
      },
    ],
  },
};

export function selectLayoutTemplate(id: LayoutTemplateId): LayoutTemplate {
  return structuredClone(layouts[id]);
}

export const PROMPT_VARIABLES = [
  'cwd', 'workspace', 'branch', 'selection', 'clipboard', 'error', 'provider',
] as const;
export type PromptVariable = typeof PROMPT_VARIABLES[number];

export function expandPrompt(
  template: string,
  values: Partial<Record<PromptVariable, string>>,
): { text: string; missing: PromptVariable[] } {
  const missing = new Set<PromptVariable>();
  const text = template.replace(/\$\{([a-z]+)\}/gi, (token, rawName: string) => {
    const name = rawName.toLowerCase() as PromptVariable;
    if (!PROMPT_VARIABLES.includes(name)) return token;
    const value = values[name];
    if (value === undefined || value === '') {
      missing.add(name);
      return token;
    }
    return value;
  });
  return { text, missing: [...missing] };
}

export interface ProductivitySettings {
  schemaVersion: 2;
  density: 'compact' | 'normal' | 'spacious';
  providerOrder: Array<'claude' | 'gemini' | 'codex'>;
  [key: string]: unknown;
}

export function migrateProductivitySettings(input: unknown): ProductivitySettings {
  const source = input && typeof input === 'object' ? input as Record<string, unknown> : {};
  const rawDensity = source.density;
  const density = rawDensity === 'dense' ? 'compact'
    : rawDensity === 'compact' || rawDensity === 'spacious' ? rawDensity
      : 'normal';
  const candidateOrder = Array.isArray(source.providerOrder)
    ? source.providerOrder.filter((item): item is 'claude' | 'gemini' | 'codex' =>
      item === 'claude' || item === 'gemini' || item === 'codex')
    : [];
  const providerOrder = [...new Set([...candidateOrder, 'claude', 'gemini', 'codex'])]
    .slice(0, 3) as ProductivitySettings['providerOrder'];
  return { ...source, schemaVersion: 2, density, providerOrder };
}

export function sanitizeDiagnosticReport(report: string, userHome = ''): string {
  let safe = report;
  if (userHome) safe = safe.replaceAll(userHome, '%USERPROFILE%');
  return safe
    .replace(/\b(token|cookie|api[_-]?key|authorization)\s*[:=]\s*[^\s;]+/gi, '$1=[скрыто]')
    .replace(/\b(bearer)\s+[a-z0-9._~+/-]+=*/gi, '$1 [скрыто]');
}
