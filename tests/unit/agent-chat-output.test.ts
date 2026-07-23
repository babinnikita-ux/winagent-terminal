import { describe, expect, it } from 'vitest';
import { appendAgentOutput, sanitizeAgentOutput } from '../../src/renderer/components/Terminal/agent-chat-output';

describe('AI chat transcript', () => {
  it('removes terminal control sequences from provider output', () => {
    expect(sanitizeAgentOutput('\u001b[32mГотово\u001b[0m\r\n')).toBe('Готово');
    expect(sanitizeAgentOutput('\u001b]0;secret title\u0007Ответ')).toBe('Ответ');
  });

  it('keeps the transcript bounded without cutting the newest response', () => {
    expect(appendAgentOutput('12345', '67890', 7)).toBe('4567890');
  });

  it('collapses terminal redraw noise', () => {
    expect(sanitizeAgentOutput('Ответ\rОтвет\n\n\nПродолжение')).toBe('Ответ\nПродолжение');
  });
});
