import { create } from 'zustand';
import { mockChatSessions } from './mock/mockChatSessions';
import { mockRuns } from './mock/mockRuns';
import { mockWorkflows } from './mock/mockWorkflows';
import type { ChatMessageModel, ChatSessions, PermissionLevel, WorkbenchAgentId } from './models/chat';
import type { RunModel } from './models/run';
import type { AppMode } from './models/workbench';
import type { WorkflowModel, WorkflowStep, WorkflowStepType } from './models/workflow';

const STORAGE_KEY = 'winagent-workbench-v1';
export const WORKBENCH_STORAGE_VERSION = 1;

type PersistedWorkbenchState = Pick<WorkbenchState, 'activeMode' | 'selectedRecipients' | 'sharedContext' | 'permissionLevel' | 'selectedWorkflowId' | 'selectedRunId'> & {
  version: number;
};

export interface WorkbenchState {
  activeMode: AppMode;
  chatSessions: ChatSessions;
  selectedRecipients: WorkbenchAgentId[];
  sharedContext: boolean;
  permissionLevel: PermissionLevel;
  workflows: WorkflowModel[];
  selectedWorkflowId: string | null;
  runs: RunModel[];
  selectedRunId: string | null;
  notice: string | null;
  setActiveMode(mode: AppMode): void;
  setSelectedRecipients(recipients: WorkbenchAgentId[]): void;
  setSharedContext(shared: boolean): void;
  setPermissionLevel(level: PermissionLevel): void;
  sendChatMessage(content: string, recipients?: WorkbenchAgentId[]): void;
  addMessageToWorkflow(message: ChatMessageModel, agentId: WorkbenchAgentId): void;
  dismissNotice(): void;
  selectWorkflow(id: string): void;
  createWorkflow(): void;
  addWorkflowStep(workflowId: string, type?: WorkflowStepType): void;
  updateWorkflowStep(workflowId: string, stepId: string, patch: Partial<WorkflowStep>): void;
  reorderWorkflowStep(workflowId: string, stepId: string, targetStepId: string): void;
  duplicateWorkflowStep(workflowId: string, stepId: string): void;
  deleteWorkflowStep(workflowId: string, stepId: string): void;
  runWorkflow(workflowId: string): void;
  selectRun(id: string): void;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function readPersisted(): Partial<PersistedWorkbenchState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PersistedWorkbenchState;
    return parsed.version === WORKBENCH_STORAGE_VERSION ? parsed : {};
  } catch {
    return {};
  }
}

function mockReply(agentId: WorkbenchAgentId, content: string): ChatMessageModel {
  const detail = agentId === 'claude'
    ? 'Mock response prepared from the shared renderer state. No process was started.'
    : 'Mock response prepared locally. No provider, network or file operation was used.';
  return {
    id: `${agentId}-assistant-${Date.now()}`,
    role: 'assistant',
    content: `${detail} Prompt received: “${content}”`,
    createdAt: 'now',
    events: [{
      id: `${agentId}-mock-event-${Date.now()}`,
      type: 'tool-call',
      title: 'Mock-only response',
      detail: 'This card demonstrates a future adapter event without invoking an adapter.',
    }],
  };
}

function persist(state: WorkbenchState): void {
  const value: PersistedWorkbenchState = {
    version: WORKBENCH_STORAGE_VERSION,
    activeMode: state.activeMode,
    selectedRecipients: state.selectedRecipients,
    sharedContext: state.sharedContext,
    permissionLevel: state.permissionLevel,
    selectedWorkflowId: state.selectedWorkflowId,
    selectedRunId: state.selectedRunId,
  };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* local mock persistence is optional */ }
}

export function createWorkbenchStore() {
  const persisted = readPersisted();
  return create<WorkbenchState>()((set, get) => {
    const save = (next: Partial<WorkbenchState>) => {
      set(next);
      persist(get());
    };

    return {
      activeMode: persisted.activeMode ?? 'chat',
      chatSessions: clone(mockChatSessions),
      selectedRecipients: persisted.selectedRecipients ?? ['claude', 'codex'],
      sharedContext: persisted.sharedContext ?? true,
      permissionLevel: persisted.permissionLevel ?? 'ask-before-write',
      workflows: clone(mockWorkflows),
      selectedWorkflowId: persisted.selectedWorkflowId ?? mockWorkflows[0].id,
      runs: clone(mockRuns),
      selectedRunId: persisted.selectedRunId ?? mockRuns[0].id,
      notice: null,
      setActiveMode: (activeMode) => save({ activeMode }),
      setSelectedRecipients: (selectedRecipients) => save({ selectedRecipients }),
      setSharedContext: (sharedContext) => save({ sharedContext }),
      setPermissionLevel: (permissionLevel) => save({ permissionLevel }),
      sendChatMessage: (rawContent, explicitRecipients) => {
        const content = rawContent.trim();
        const recipients = explicitRecipients ?? get().selectedRecipients;
        if (!content || recipients.length === 0) return;
        const createdAt = 'now';
        set((state) => ({
          chatSessions: {
            ...state.chatSessions,
            ...Object.fromEntries(recipients.map((agentId) => {
              const session = state.chatSessions[agentId];
              const message: ChatMessageModel = {
                id: `${agentId}-user-${Date.now()}`,
                role: 'user',
                content,
                createdAt,
              };
              return [agentId, { ...session, status: 'working' as const, messages: [...session.messages, message] }];
            })),
          },
        }));
        persist(get());
        globalThis.setTimeout(() => {
          set((state) => ({
            chatSessions: {
              ...state.chatSessions,
              ...Object.fromEntries(recipients.map((agentId) => {
                const session = state.chatSessions[agentId];
                return [agentId, { ...session, status: 'ready' as const, messages: [...session.messages, mockReply(agentId, content)] }];
              })),
            },
          }));
        }, 360);
      },
      addMessageToWorkflow: (message, agentId) => {
        const workflowId = get().selectedWorkflowId;
        if (!workflowId) return;
        const step: WorkflowStep = {
          id: `draft-${Date.now()}`,
          type: 'agent-task',
          title: `Draft from ${agentId === 'claude' ? 'Claude' : 'Codex'}`,
          executor: agentId,
          input: message.content,
          expectedOutput: 'Mock follow-up artifact',
          status: 'pending',
          enabled: true,
        };
        set((state) => ({
          workflows: state.workflows.map((workflow) => workflow.id === workflowId
            ? { ...workflow, steps: [...workflow.steps, step] }
            : workflow),
          notice: 'Draft step added to the selected workflow.',
        }));
      },
      dismissNotice: () => set({ notice: null }),
      selectWorkflow: (selectedWorkflowId) => save({ selectedWorkflowId }),
      createWorkflow: () => {
        const id = `workflow-local-${Date.now()}`;
        const workflow: WorkflowModel = { id, name: 'Untitled workflow', description: 'Local mock workflow.', project: 'Local mock state', steps: [] };
        save({ workflows: [...get().workflows, workflow], selectedWorkflowId: id });
      },
      addWorkflowStep: (workflowId, type = 'agent-task') => {
        const step: WorkflowStep = {
          id: `step-${Date.now()}`,
          type,
          title: 'New mock step',
          executor: type === 'human-approval' ? 'human' : 'codex',
          input: 'Describe the mock input.',
          expectedOutput: 'Describe the expected output.',
          status: 'pending',
          enabled: true,
        };
        set((state) => ({ workflows: state.workflows.map((workflow) => workflow.id === workflowId ? { ...workflow, steps: [...workflow.steps, step] } : workflow) }));
      },
      updateWorkflowStep: (workflowId, stepId, patch) => set((state) => ({
        workflows: state.workflows.map((workflow) => workflow.id === workflowId
          ? { ...workflow, steps: workflow.steps.map((step) => step.id === stepId ? { ...step, ...patch } : step) }
          : workflow),
      })),
      reorderWorkflowStep: (workflowId, stepId, targetStepId) => set((state) => ({
        workflows: state.workflows.map((workflow) => {
          if (workflow.id !== workflowId) return workflow;
          const from = workflow.steps.findIndex((step) => step.id === stepId);
          const to = workflow.steps.findIndex((step) => step.id === targetStepId);
          if (from < 0 || to < 0 || from === to) return workflow;
          const steps = [...workflow.steps];
          const [step] = steps.splice(from, 1);
          steps.splice(to, 0, step);
          return { ...workflow, steps };
        }),
      })),
      duplicateWorkflowStep: (workflowId, stepId) => set((state) => ({
        workflows: state.workflows.map((workflow) => {
          if (workflow.id !== workflowId) return workflow;
          const index = workflow.steps.findIndex((step) => step.id === stepId);
          if (index < 0) return workflow;
          const source = workflow.steps[index];
          const duplicate = { ...source, id: `${source.id}-copy-${Date.now()}`, title: `${source.title} copy`, status: 'pending' as const };
          const steps = [...workflow.steps];
          steps.splice(index + 1, 0, duplicate);
          return { ...workflow, steps };
        }),
      })),
      deleteWorkflowStep: (workflowId, stepId) => set((state) => ({
        workflows: state.workflows.map((workflow) => workflow.id === workflowId
          ? { ...workflow, steps: workflow.steps.filter((step) => step.id !== stepId) }
          : workflow),
      })),
      runWorkflow: (workflowId) => {
        const workflow = get().workflows.find((candidate) => candidate.id === workflowId);
        if (!workflow) return;
        const run: RunModel = {
          id: `run-local-${Date.now()}`,
          workflowId,
          workflowName: workflow.name,
          project: workflow.project,
          status: 'running',
          startedAt: 'now',
          duration: '0s',
          agents: ['claude', 'codex'],
          changedFiles: 0,
          tests: 'not-run',
          timeline: [{ id: `timeline-${Date.now()}`, label: 'Mock run started', at: 'now', status: 'running' }],
          artifacts: [],
          approvals: [],
          summary: 'Mock run is progressing locally.',
        };
        save({ runs: [run, ...get().runs], selectedRunId: run.id, activeMode: 'runs' });
        globalThis.setTimeout(() => set((state) => ({ runs: state.runs.map((candidate) => candidate.id === run.id ? {
          ...candidate,
          status: 'complete', duration: '1s', tests: 'passed', summary: 'Mock run completed locally. No command or agent was executed.',
          timeline: [...candidate.timeline, { id: `timeline-complete-${Date.now()}`, label: 'Mock run complete', at: 'now', status: 'complete' }],
        } : candidate) })), 520);
      },
      selectRun: (selectedRunId) => save({ selectedRunId }),
    };
  });
}

export const useWorkbenchStore = createWorkbenchStore();
