import { useState, useCallback, useEffect, useRef } from 'react';
import { useTerminal } from '../../hooks/useTerminal';
import FindBar from './FindBar';
import CopyMode from './CopyMode';
import '../../styles/terminal.css';
import { AgentPreset } from '../../../shared/types';
import { copyTerminalText } from '../../utils/copy-text';
import { useT } from '../../i18n';
import { appendAgentOutput, buildAgentConnectCommand, sanitizeAgentOutput } from './agent-chat-output';

interface TerminalPaneProps {
  surfaceId?: string;
  shell?: string;
  cwd?: string;
  /** Per-surface color scheme override (issue #4). */
  colorScheme?: string;
  /** Quick-launch profile startup commands (issue #32). */
  startupCommands?: string[];
  agentPreset?: AgentPreset;
  resumeAgentSession?: boolean;
  focused?: boolean;
  visible?: boolean;
  showFindBar?: boolean;
  onFindBarClose?: () => void;
  copyModeActive?: boolean;
}

export default function TerminalPane({
  surfaceId,
  shell,
  cwd,
  colorScheme,
  startupCommands,
  agentPreset,
  resumeAgentSession,
  focused = true,
  visible = true,
  showFindBar = false,
  onFindBarClose,
  copyModeActive = false,
}: TerminalPaneProps) {
  const [agentDraft, setAgentDraft] = useState('');
  const [userMessages, setUserMessages] = useState<Array<{ id: number; content: string }>>([]);
  const [assistantOutput, setAssistantOutput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'missing' | 'connecting' | 'connected'>('checking');
  const [model, setModel] = useState('default');
  const [effort, setEffort] = useState('default');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [providerUsage, setProviderUsage] = useState<any>(null);
  const agentRawOutputRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const handleAgentOutput = useCallback((chunk: string) => {
    agentRawOutputRef.current = appendAgentOutput(agentRawOutputRef.current, chunk);
    const output = sanitizeAgentOutput(agentRawOutputRef.current);
    setAssistantOutput(output);
    if (output) setConnectionStatus('connected');
  }, []);
  const { terminalRef, xtermRef, searchAddonRef, sendText } = useTerminal({
    surfaceId, shell, cwd, visible, focused, colorScheme, startupCommands,
    agentPreset, resumeAgentSession, onOutput: agentPreset ? handleAgentOutput : undefined,
  });

  const [_lastQuery, setLastQuery] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const copyMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useT();

  useEffect(() => {
    if (!agentPreset) return;
    let disposed = false;
    const provider = agentPreset === 'claude-code' ? 'claude' : 'codex';
    void window.wmux?.agent?.readiness?.().then((readiness: any) => {
      if (disposed) return;
      const available = agentPreset === 'claude-code'
        ? readiness?.claudeCodeAvailable
        : readiness?.codexAvailable;
      setConnectionStatus((current) =>
        current === 'connected' ? current : available ? 'connecting' : 'missing');
    }).catch(() => {
      if (!disposed) setConnectionStatus('missing');
    });
    void window.wmux?.providerUsage?.get?.().then((items: any[]) => {
      if (!disposed) setProviderUsage(items?.find((item) => item.provider === provider) ?? null);
    });
    const unsubscribe = window.wmux?.providerUsage?.onUpdate?.((items: any[]) => {
      setProviderUsage(items?.find((item) => item.provider === provider) ?? null);
    });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [agentPreset]);

  // Latest values mirrored into refs so the global F3 / Shift+F3 listener (issue
  // #64) can read them without re-subscribing on every keystroke or focus change.
  const lastQueryRef = useRef(_lastQuery);
  lastQueryRef.current = _lastQuery;
  const activeRef = useRef(false);
  activeRef.current = focused && visible;

  // F3 / Shift+F3 cycle search matches without reopening the find bar. Only the
  // focused, visible terminal acts (there's exactly one at a time).
  useEffect(() => {
    const cycle = (forward: boolean) => {
      if (!activeRef.current || !searchAddonRef.current || !lastQueryRef.current) return;
      if (forward) searchAddonRef.current.findNext(lastQueryRef.current);
      else searchAddonRef.current.findPrevious(lastQueryRef.current);
    };
    const onNext = () => cycle(true);
    const onPrev = () => cycle(false);
    document.addEventListener('wmux:find-next', onNext);
    document.addEventListener('wmux:find-prev', onPrev);
    return () => {
      document.removeEventListener('wmux:find-next', onNext);
      document.removeEventListener('wmux:find-prev', onPrev);
    };
  }, [searchAddonRef]);

  const handleSearch = useCallback((query: string) => {
    setLastQuery(query);
    if (!searchAddonRef.current) return;
    if (!query) {
      // Clear highlights when query is empty
      searchAddonRef.current.clearDecorations();
      return;
    }
    searchAddonRef.current.findNext(query, { incremental: true });
  }, [searchAddonRef]);

  const handleNext = useCallback(() => {
    if (!searchAddonRef.current || !_lastQuery) return;
    searchAddonRef.current.findNext(_lastQuery);
  }, [searchAddonRef, _lastQuery]);

  const handlePrevious = useCallback(() => {
    if (!searchAddonRef.current || !_lastQuery) return;
    searchAddonRef.current.findPrevious(_lastQuery);
  }, [searchAddonRef, _lastQuery]);

  const handleFindBarClose = useCallback(() => {
    if (searchAddonRef.current) {
      searchAddonRef.current.clearDecorations();
    }
    onFindBarClose?.();
  }, [searchAddonRef, onFindBarClose]);

  const showCopyMessage = useCallback((message: string) => {
    if (copyMessageTimerRef.current) clearTimeout(copyMessageTimerRef.current);
    setCopyMessage(message);
    copyMessageTimerRef.current = setTimeout(() => setCopyMessage(''), 1800);
  }, []);

  useEffect(() => () => {
    if (copyMessageTimerRef.current) clearTimeout(copyMessageTimerRef.current);
  }, []);

  useEffect(() => {
    if (agentPreset) messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [agentPreset, assistantOutput, userMessages]);

  const handleCopy = useCallback(async () => {
    const terminal = xtermRef.current;
    if (!terminal) return;
    try {
      const copied = await copyTerminalText(terminal.getSelection(), (text) => window.wmux.clipboard.writeText(text));
      if (copied) {
        terminal.clearSelection();
        terminal.focus();
        showCopyMessage(t('chat.copy.done'));
      } else {
        showCopyMessage(t('chat.copy.empty'));
      }
    } catch {
      showCopyMessage(t('chat.copy.failed'));
    }
  }, [showCopyMessage, t, xtermRef]);

  const handlePaste = useCallback(() => {
    if (!surfaceId) return;
    document.dispatchEvent(new CustomEvent('wmux:paste-terminal', { detail: { surfaceId } }));
  }, [surfaceId]);

  const chatTitle = agentPreset === 'claude-code'
    ? t('chat.title.claude')
    : agentPreset === 'codex'
      ? t('chat.title.codex')
      : t('chat.title.terminal');

  const connectAgent = useCallback(async () => {
    if (!agentPreset) return;
    setConnectionStatus('checking');
    const readiness = await window.wmux?.agent?.readiness?.().catch(() => null);
    const available = agentPreset === 'claude-code'
      ? readiness?.claudeCodeAvailable
      : readiness?.codexAvailable;
    if (!available) {
      setConnectionStatus('missing');
      return;
    }
    agentRawOutputRef.current = '';
    setAssistantOutput('');
    setConnectionStatus('connecting');
    sendText('\x03');
    window.setTimeout(() => {
      sendText(`${buildAgentConnectCommand(agentPreset, model, effort)}\r`);
    }, 180);
    const provider = agentPreset === 'claude-code' ? 'claude' : 'codex';
    void window.wmux?.providerUsage?.refresh?.(provider);
  }, [agentPreset, effort, model, sendText]);

  const pickAttachments = useCallback(async () => {
    const result = await window.wmux?.chat?.pickFiles?.();
    if (!result?.canceled && Array.isArray(result?.paths)) {
      setAttachments((current) => [...new Set([...current, ...result.paths])]);
    }
  }, []);

  const submitAgentMessage = useCallback(() => {
    const content = agentDraft.trim();
    if (!content || connectionStatus !== 'connected') return;
    setUserMessages((messages) => [...messages, { id: Date.now(), content }]);
    agentRawOutputRef.current = '';
    setAssistantOutput('');
    const attachmentContext = attachments.length
      ? `\n\nПрикреплённые файлы:\n${attachments.map((file) => `- "${file}"`).join('\n')}`
      : '';
    sendText(`${content}${attachmentContext}\r`);
    setAgentDraft('');
    setAttachments([]);
  }, [agentDraft, attachments, connectionStatus, sendText]);

  const remainingLimit = providerUsage?.windows?.reduce(
    (lowest: number | null, item: any) =>
      typeof item.remainingPercent === 'number'
        ? (lowest === null ? item.remainingPercent : Math.min(lowest, item.remainingPercent))
        : lowest,
    null,
  );

  return (
    <div className={`terminal-pane ${focused ? 'terminal-pane--focused' : ''}`}>
      {agentPreset && (
        <section className="agent-chat" aria-label={`Чат ${chatTitle}`}>
          <header className="agent-chat__header">
            <div>
              <span className="agent-chat__avatar">{agentPreset === 'claude-code' ? 'C' : 'X'}</span>
              <span><strong>{chatTitle}</strong><small>Локальная CLI-сессия</small></span>
            </div>
            <div className="agent-chat__header-actions">
              <span className="agent-chat__limit">
                Лимит: {typeof remainingLimit === 'number' ? `${Math.round(remainingLimit)}%` : 'нет данных'}
              </span>
              <span className={`agent-chat__connection agent-chat__connection--${connectionStatus}`}>
                <i />
                {connectionStatus === 'connected'
                  ? 'Подключено'
                  : connectionStatus === 'connecting'
                    ? 'Подключение…'
                    : connectionStatus === 'missing'
                      ? 'CLI не найден'
                      : 'Проверка…'}
              </span>
              <button type="button" className="agent-chat__connect" onClick={() => void connectAgent()}>
                {connectionStatus === 'connected' ? 'Переподключить' : 'Подключить'}
              </button>
            </div>
          </header>
          <div className="agent-chat__messages">
            {userMessages.length === 0 && !assistantOutput && (
              <div className="agent-chat__welcome">
                <span className="agent-chat__avatar">{agentPreset === 'claude-code' ? 'C' : 'X'}</span>
                <div>
                  <strong>
                    {connectionStatus === 'connected'
                      ? `${chatTitle} готов к работе`
                      : connectionStatus === 'missing'
                        ? `${chatTitle}: CLI не найден`
                        : `Подключение к ${chatTitle}`}
                  </strong>
                  <p>
                    {connectionStatus === 'connected'
                      ? 'Напишите задачу обычным сообщением. Она будет отправлена в реальную CLI-сессию этой вкладки.'
                      : connectionStatus === 'missing'
                        ? 'Установите CLI провайдера или добавьте его в PATH, затем нажмите «Подключить».'
                        : 'Ожидаем подтверждения от локальной CLI-сессии. Статус изменится только после реального ответа.'}
                  </p>
                </div>
              </div>
            )}
            {userMessages.map((message) => (
              <article className="agent-chat__message agent-chat__message--user" key={message.id}>
                <span>Вы</span>
                <p>{message.content}</p>
              </article>
            ))}
            {assistantOutput && (
              <article className="agent-chat__message agent-chat__message--assistant">
                <span>{chatTitle}</span>
                <pre>{assistantOutput}</pre>
              </article>
            )}
            <div ref={messagesEndRef} />
          </div>
          <footer className="agent-chat__composer">
            <div className="agent-chat__tools">
              <button type="button" onClick={() => void pickAttachments()}>＋ Файл</button>
              <label>
                Модель
                <select value={model} onChange={(event) => setModel(event.target.value)}>
                  <option value="default">По умолчанию</option>
                  {agentPreset === 'claude-code' ? (
                    <>
                      <option value="sonnet">Sonnet</option>
                      <option value="opus">Opus</option>
                      <option value="haiku">Haiku</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-5.4">GPT-5.4</option>
                      <option value="gpt-5.3-codex">GPT-5.3 Codex</option>
                      <option value="gpt-5.3-codex-spark">GPT-5.3 Codex Spark</option>
                    </>
                  )}
                </select>
              </label>
              <label>
                Effort
                <select value={effort} onChange={(event) => setEffort(event.target.value)}>
                  <option value="default">По умолчанию</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="xhigh">XHigh</option>
                  <option value="max">Max</option>
                </select>
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="agent-chat__attachments">
                {attachments.map((file) => (
                  <button
                    type="button"
                    key={file}
                    title={file}
                    onClick={() => setAttachments((current) => current.filter((item) => item !== file))}
                  >
                    {file.split(/[\\/]/).pop()} ×
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={agentDraft}
              onChange={(event) => setAgentDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitAgentMessage();
                }
              }}
              placeholder={`Сообщение для ${chatTitle}…`}
              aria-label={`Сообщение для ${chatTitle}`}
              disabled={connectionStatus !== 'connected'}
              rows={3}
            />
            <div>
              <span>Enter — отправить · Shift+Enter — новая строка</span>
              <button
                type="button"
                onClick={submitAgentMessage}
                disabled={!agentDraft.trim() || connectionStatus !== 'connected'}
              >
                Отправить
              </button>
            </div>
          </footer>
        </section>
      )}
      <div className={agentPreset ? 'terminal-pane__backend' : undefined}>
      <div className="terminal-pane__chatbar" aria-label={t('chat.controls.label')}>
        <div className="terminal-pane__chat-context">
          <span className="terminal-pane__chat-status" aria-hidden="true" />
          <span className="terminal-pane__chat-title">{chatTitle}</span>
          <span className="terminal-pane__chat-hint">{t('chat.copy.hint')}</span>
        </div>
        <div className="terminal-pane__chat-actions">
          <span className="terminal-pane__copy-message" aria-live="polite">{copyMessage}</span>
          <button
            type="button"
            className="terminal-pane__chat-action"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCopy}
          >
            {t('chat.copy.action')}
          </button>
          <button
            type="button"
            className="terminal-pane__chat-action"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handlePaste}
          >
            {t('chat.paste.action')}
          </button>
        </div>
      </div>
      <div ref={terminalRef} className="terminal-pane__container" />
      {showFindBar && (
        <FindBar
          onSearch={handleSearch}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onClose={handleFindBarClose}
        />
      )}
      <CopyMode active={copyModeActive} />
      </div>
    </div>
  );
}
