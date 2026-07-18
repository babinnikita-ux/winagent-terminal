/** Translate the documented WinAgent CLI into the compatible internal RPC CLI. */
function flagValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function withoutFlag(args: string[], name: string): string[] {
  const index = args.indexOf(name);
  if (index < 0) return args;
  return [...args.slice(0, index), ...args.slice(index + (index + 1 < args.length ? 2 : 1))];
}

function surfaceCommand(action: string, rest: string[]): string[] {
  const id = flagValue(rest, '--id');
  if (action === 'send') {
    const text = flagValue(rest, '--text');
    return ['send', ...(id ? ['--surface', id] : []), ...(text ? [text] : withoutFlag(rest, '--id'))];
  }
  if (action === 'send-key') return ['send-key', ...withoutFlag(rest, '--id'), ...(id ? ['--surface', id] : [])];
  if (action === 'read') return ['read-screen', ...withoutFlag(rest, '--id'), ...(id ? ['--surface', id] : [])];
  const map: Record<string, string> = { list: 'list-surfaces', create: 'new-surface', focus: 'focus-surface', close: 'close-surface' };
  return [map[action] || action, ...(id ? [id] : rest)];
}

export function normalizeWagentArgs(input: string[]): string[] {
  const args = input.filter((arg, index) => arg !== '--json' || input[index - 1] === 'spawn-batch');
  const [group, action, ...rest] = args;
  if (group === 'workspace') {
    const map: Record<string, string> = { list: 'list-workspaces', create: 'new-workspace', select: 'select-workspace', close: 'close-workspace' };
    return [map[action] || action, ...rest];
  }
  if (group === 'surface') return surfaceCommand(action, rest);
  if (group === 'split') return action === 'down' ? ['split', '--down', ...rest] : ['split', ...rest];
  if (group === 'agent' && action === 'interrupt') return ['agent', 'kill', ...rest];
  if (group === 'agent' && action === 'spawn') {
    const type = flagValue(rest, '--type');
    const withoutType = withoutFlag(rest, '--type');
    if ((type === 'claude' || type === 'codex') && !flagValue(withoutType, '--cmd')) return ['agent', 'spawn', '--cmd', type, ...withoutType];
  }
  return args;
}
