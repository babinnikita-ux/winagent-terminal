import { describe, expect, it } from 'vitest';
import { normalizeWagentArgs } from '../../src/cli/wagent-commands';

describe('wagent command contract', () => {
  it('maps documented workspace and split verbs to the versioned IPC CLI', () => {
    expect(normalizeWagentArgs(['workspace', 'create', '--title', 'API', '--cwd', 'C:\\Projects\\Api'])).toEqual(['new-workspace', '--title', 'API', '--cwd', 'C:\\Projects\\Api']);
    expect(normalizeWagentArgs(['workspace', 'list', '--json'])).toEqual(['list-workspaces']);
    expect(normalizeWagentArgs(['split', 'down'])).toEqual(['split', '--down']);
  });

  it('targets surfaces explicitly and launches documented agent types', () => {
    expect(normalizeWagentArgs(['surface', 'send', '--id', 'surf-1', '--text', 'npm test'])).toEqual(['send', '--surface', 'surf-1', 'npm test']);
    expect(normalizeWagentArgs(['surface', 'read', '--id', 'surf-1', '--lines', '100'])).toEqual(['read-screen', '--lines', '100', '--surface', 'surf-1']);
    expect(normalizeWagentArgs(['agent', 'spawn', '--type', 'codex', '--cwd', 'C:\\Code'])).toEqual(['agent', 'spawn', '--cmd', 'codex', '--cwd', 'C:\\Code']);
    expect(normalizeWagentArgs(['agent', 'interrupt', 'agent-1'])).toEqual(['agent', 'kill', 'agent-1']);
  });
});
