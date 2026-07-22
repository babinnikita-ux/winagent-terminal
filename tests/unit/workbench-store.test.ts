import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createWorkbenchStore } from '../../src/renderer/workbench/store';

describe('workbench store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('opens Chat on first launch and changes the top-level mode locally', () => {
    const store = createWorkbenchStore();

    expect(store.getState().activeMode).toBe('chat');
    store.getState().setActiveMode('workspace');

    expect(store.getState().activeMode).toBe('workspace');
  });

  it('sends a mock message only to Claude and adds its deterministic reply', async () => {
    const store = createWorkbenchStore();
    store.getState().sendChatMessage('Summarize the plan', ['claude']);

    expect(store.getState().chatSessions.claude.messages.at(-1)).toMatchObject({
      role: 'user',
      content: 'Summarize the plan',
    });
    expect(store.getState().chatSessions.codex.messages.at(-1)?.content).not.toBe('Summarize the plan');

    await vi.runAllTimersAsync();
    expect(store.getState().chatSessions.claude.messages.at(-1)).toMatchObject({ role: 'assistant' });
  });

  it('sends a mock message to Codex and to both selected agents', async () => {
    const store = createWorkbenchStore();
    store.getState().sendChatMessage('Check the changes', ['codex']);
    store.getState().sendChatMessage('Compare outcomes', ['claude', 'codex']);

    expect(store.getState().chatSessions.codex.messages.map((message) => message.content)).toContain('Check the changes');
    expect(store.getState().chatSessions.claude.messages.map((message) => message.content)).toContain('Compare outcomes');
    expect(store.getState().chatSessions.codex.messages.map((message) => message.content)).toContain('Compare outcomes');

    await vi.runAllTimersAsync();
    expect(store.getState().chatSessions.codex.messages.at(-1)?.role).toBe('assistant');
  });

  it('does not submit an empty composer value', () => {
    const store = createWorkbenchStore();
    const before = store.getState().chatSessions.claude.messages.length;

    store.getState().sendChatMessage('   ', ['claude']);

    expect(store.getState().chatSessions.claude.messages).toHaveLength(before);
  });

  it('reorders and deletes workflow steps without mutating the terminal workspace store', () => {
    const store = createWorkbenchStore();
    const workflowId = store.getState().selectedWorkflowId!;
    const original = store.getState().workflows.find((workflow) => workflow.id === workflowId)!;
    const [first, second] = original.steps;

    store.getState().reorderWorkflowStep(workflowId, first.id, second.id);
    expect(store.getState().workflows.find((workflow) => workflow.id === workflowId)?.steps[1].id).toBe(first.id);

    store.getState().deleteWorkflowStep(workflowId, first.id);
    expect(store.getState().workflows.find((workflow) => workflow.id === workflowId)?.steps.some((step) => step.id === first.id)).toBe(false);
  });
});
