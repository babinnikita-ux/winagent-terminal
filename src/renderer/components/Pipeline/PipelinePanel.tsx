import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/pipeline.css';

type Provider = 'codex' | 'claude' | 'gemini';
type RunStatus = 'created' | 'preflight' | 'coordinating' | 'researching' | 'architecting' | 'implementing' | 'reviewing' | 'fixing' | 'verifying' | 'completed' | 'paused_auth' | 'paused_quota' | 'paused_approval' | 'paused_user' | 'failed' | 'cancelled';

interface Capability {
  provider: Provider;
  available: boolean;
  version?: string;
  reason?: string;
  details: string;
}

interface PipelineRun {
  id: string;
  repositoryPath: string;
  task: string;
  autonomyMode: 'safe' | 'balanced' | 'autonomous';
  executionMode: 'strict' | 'best_effort';
  useWorktree: boolean;
  status: RunStatus;
  branch?: string;
  worktreePath?: string;
  failureReason?: string;
  stages: Array<{
    id: string;
    provider: Provider;
    writeAccess: boolean;
    status: 'pending' | 'running' | 'succeeded' | 'failed' | 'paused' | 'cancelled' | 'skipped';
    result?: { summary: string };
  }>;
}

const STAGE_LABELS: Record<string, string> = {
  coordinator: 'Brief задачи',
  researcher: 'Исследование',
  architect: 'Архитектура',
  implementer: 'Реализация',
  reviewer: 'Ревью',
  fixer: 'Исправления',
  finalizer: 'Финал',
};

interface PipelinePanelProps {
  onClose: () => void;
}

function providerLabel(provider: Provider): string {
  return provider === 'codex' ? 'Codex' : provider === 'claude' ? 'Claude' : 'Gemini';
}

export default function PipelinePanel({ onClose }: PipelinePanelProps) {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [repositoryPath, setRepositoryPath] = useState('');
  const [task, setTask] = useState('');
  const [autonomyMode, setAutonomyMode] = useState<PipelineRun['autonomyMode']>('safe');
  const [executionMode, setExecutionMode] = useState<PipelineRun['executionMode']>('strict');
  const [useWorktree] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const list = await window.wmux?.pipeline?.list?.();
      if (Array.isArray(list)) {
        setRuns(list as PipelineRun[]);
        setSelectedRunId((current) => current ?? list[0]?.id ?? null);
      }
    } catch { setError('Не удалось обновить список конвейеров.'); }
  }, []);

  useEffect(() => {
    void refresh();
    void window.wmux?.pipeline?.capabilities?.().then((items: Capability[]) => setCapabilities(items)).catch(() => setCapabilities([]));
    const timer = window.setInterval(() => void refresh(), 1000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const selected = useMemo(() => runs.find((run) => run.id === selectedRunId) ?? null, [runs, selectedRunId]);

  const chooseRepository = async () => {
    const result = await window.wmux?.system?.pickFolder?.();
    if (result?.path) setRepositoryPath(result.path);
  };

  const start = async () => {
    if (!repositoryPath.trim() || !task.trim()) {
      setError('Выберите репозиторий и опишите задачу.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      const run = await window.wmux.pipeline.createDraft({ repositoryPath, task, autonomyMode, executionMode, useWorktree });
      setSelectedRunId(run.id);
      await window.wmux.pipeline.start(run.id);
      await refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Не удалось запустить конвейер.');
    } finally {
      setCreating(false);
    }
  };

  const stop = async () => {
    if (!selected) return;
    try {
      await window.wmux.pipeline.stop(selected.id);
      await refresh();
    } catch {
      setError('Не удалось остановить конвейер.');
    }
  };

  return (
    <div className="pipeline-overlay" role="dialog" aria-modal="true" aria-label="Конвейеры">
      <section className="pipeline-panel">
        <header className="pipeline-panel__header">
          <div>
            <p className="pipeline-panel__eyebrow">WinAgent · локальные подписки</p>
            <h1>Конвейеры</h1>
          </div>
          <button className="pipeline-icon-button" onClick={onClose} aria-label="Закрыть конвейеры">×</button>
        </header>

        <div className="pipeline-panel__body">
          <aside className="pipeline-setup">
            <h2>Полный цикл</h2>
            <p>Codex пишет только в отдельный worktree. Claude и Gemini остаются в режиме чтения.</p>
            <label>Репозиторий
              <span className="pipeline-path-row"><input value={repositoryPath} onChange={(event) => setRepositoryPath(event.target.value)} placeholder="C:\\Projects\\MyProject" /><button onClick={() => void chooseRepository()}>Выбрать</button></span>
            </label>
            <label>Одна задача
              <textarea value={task} onChange={(event) => setTask(event.target.value)} placeholder="Что нужно изменить и как проверить результат" rows={6} />
            </label>
            <div className="pipeline-options">
              <label>Автономность<select value={autonomyMode} onChange={(event) => setAutonomyMode(event.target.value as PipelineRun['autonomyMode'])}><option value="safe">Безопасный</option><option value="balanced">Сбалансированный</option><option value="autonomous">Автономный</option></select></label>
              <label>Режим<select value={executionMode} onChange={(event) => setExecutionMode(event.target.value as PipelineRun['executionMode'])}><option value="strict">Строгий</option><option value="best_effort">Best effort</option></select></label>
            </div>
            <label className="pipeline-checkbox"><input type="checkbox" checked={useWorktree} onChange={(event) => setUseWorktree(event.target.checked)} disabled /> Изолировать в Git worktree (обязательно)</label>
            {error && <p className="pipeline-error" role="alert">{error}</p>}
            <button className="pipeline-start" disabled={creating} onClick={() => void start()}>{creating ? 'Создаю run…' : 'Запустить конвейер'}</button>
            <div className="pipeline-capabilities" aria-label="Статус CLI">
              {(['codex', 'claude', 'gemini'] as Provider[]).map((provider) => {
                const capability = capabilities.find((item) => item.provider === provider);
                return <div key={provider} className={`pipeline-capability ${capability?.available ? 'pipeline-capability--ready' : 'pipeline-capability--blocked'}`}><span>{providerLabel(provider)}</span><small>{capability?.available ? capability.version || 'готов' : capability?.reason || 'не проверен'}</small></div>;
              })}
            </div>
          </aside>

          <main className="pipeline-run" aria-live="polite">
            <div className="pipeline-run__toolbar"><h2>{selected ? selected.task : 'Выберите run'}</h2><span className={`pipeline-run__status pipeline-run__status--${selected?.status ?? 'created'}`}>{selected?.status ?? 'ожидание'}</span></div>
            {selected ? <>
              <div className="pipeline-run__controls"><button disabled={!['preflight', 'coordinating', 'researching', 'architecting', 'implementing', 'reviewing', 'fixing', 'verifying'].includes(selected.status)} onClick={() => void stop()}>Остановить</button>{selected.status === 'paused_user' ? <span>Run безопасно остановлен после перезапуска. Повтор write-этапа потребует явного подтверждения.</span> : <span>Пауза и повтор этапа появятся после checkpoint восстановления run.</span>}</div>
              <ol className="pipeline-timeline">
                {selected.stages.map((stage) => <li key={stage.id} className={`pipeline-stage pipeline-stage--${stage.status}`}><span className="pipeline-stage__dot" /><div><strong>{STAGE_LABELS[stage.id]}</strong><small>{providerLabel(stage.provider)} · {stage.writeAccess ? 'worktree write' : 'только чтение'}</small>{stage.result && <p>{stage.result.summary}</p>}</div><em>{stage.status}</em></li>)}
              </ol>
              <section className="pipeline-result"><h3>Результат</h3>{selected.failureReason ? <p className="pipeline-error">{selected.failureReason}</p> : <p>{selected.status === 'completed' ? 'FINAL.md и отчёт сохранены в .winagent/runs.' : 'Статус обновляется автоматически. Ввод паролей и 2FA остаются только в живом терминале.'}</p>}{selected.branch && <dl><div><dt>Ветка</dt><dd>{selected.branch}</dd></div><div><dt>Worktree</dt><dd>{selected.worktreePath}</dd></div></dl>}</section>
            </> : <div className="pipeline-empty"><strong>Новый конвейер</strong><p>Выберите репозиторий, опишите задачу и запустите «Полный цикл».</p></div>}
          </main>
        </div>
      </section>
    </div>
  );
}
