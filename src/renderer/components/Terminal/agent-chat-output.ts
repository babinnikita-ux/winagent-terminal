/* eslint-disable no-control-regex -- terminal streams contain ANSI and C0 control bytes */
const ANSI_CSI = /\u001b(?:\[[0-?]*[ -/]*[@-~]|\][^\u0007]*(?:\u0007|\u001b\\))/g;
const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001a\u001c-\u001f\u007f]/g;

export function sanitizeAgentOutput(chunk: string): string {
  const withoutAnsi = chunk.replace(ANSI_CSI, '').replace(CONTROL_CHARS, '');
  return withoutAnsi
    .split('\n')
    .map((line) => {
      const redraws = line.split('\r');
      return [...redraws].reverse().find((value) => value.length > 0) ?? '';
    })
    .join('\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

export function appendAgentOutput(current: string, chunk: string, limit = 20_000): string {
  const next = `${current}${chunk}`;
  return next.length > limit ? next.slice(-limit) : next;
}

export function buildAgentConnectCommand(
  preset: 'claude-code' | 'codex',
  model: string,
  effort: string,
): string {
  const modelArg = model === 'default' ? '' : ` --model ${model}`;
  if (preset === 'claude-code') {
    const effortArg = effort === 'default' ? '' : ` --effort ${effort}`;
    return `claude.cmd${modelArg}${effortArg}`;
  }
  const effortArg = effort === 'default'
    ? ''
    : ` -c model_reasoning_effort="${effort}"`;
  return `codex.cmd${modelArg}${effortArg}`;
}
