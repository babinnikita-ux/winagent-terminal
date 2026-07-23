import { useState, useCallback, useEffect, useRef } from 'react';
import { useTerminal } from '../../hooks/useTerminal';
import FindBar from './FindBar';
import CopyMode from './CopyMode';
import '../../styles/terminal.css';
import { AgentPreset } from '../../../shared/types';
import { copyTerminalText } from '../../utils/copy-text';
import { useT } from '../../i18n';
import { appendAgentOutput, sanitizeAgentOutput } from './agent-chat-output';

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
  const agentRawOutputRef = useRef('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const handleAgentOutput = useCallback((chunk: string) => {
    agentRawOutputRef.current = appendAgentOutput(agentRawOutputRef.current, chunk);
    setAssistantOutput(sanitizeAgentOutput(agentRawOutputRef.current));
  }, []);
  const { terminalRef, xtermRef, searchAddonRef, sendText } = useTerminal({
    surfaceId, shell, cwd, visible, focused, colorScheme, startupCommands,
    agentPreset, resumeAgentSession, onOutput: agentPreset ? handleAgentOutput : undefined,
  });

  const [_lastQuery, setLastQuery] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const copyMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t = useT();

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

  const submitAgentMessage = useCallback(() => {
    const content = agentDraft.trim();
    if (!content) return;
    setUserMessages((messages) => [...messages, { id: Date.now(), content }]);
    agentRawOutputRef.current = '';
    setAssistantOutput('');
    sendText(`${content}\r`);
    setAgentDraft('');
  }, [agentDraft, sendText]);

  return (
    <div className={`terminal-pane ${focused ? 'terminal-pane--focused' : ''}`}>
      {agentPreset && (
        <section className="agent-chat" aria-label={`Чат ${chatTitle}`}>
          <header className="agent-chat__header">
            <div>
              <span className="agent-chat__avatar">{agentPreset === 'claude-code' ? 'C' : 'X'}</span>
              <span><strong>{chatTitle}</strong><small>Локальная CLI-сессия</small></span>
            </div>
            <span className="agent-chat__connected"><i /> Подключено</span>
          </header>
          <div className="agent-chat__messages">
            {userMessages.length === 0 && !assistantOutput && (
              <div className="agent-chat__welcome">
                <span className="agent-chat__avatar">{agentPreset === 'claude-code' ? 'C' : 'X'}</span>
                <div>
                  <strong>{chatTitle} готов к работе</strong>
                  <p>Напишите задачу обычным сообщением. Команда будет отправлена в реальную CLI-сессию этой вкладки.</p>
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
              rows={3}
            />
            <div>
              <span>Enter — отправить · Shift+Enter — новая строка</span>
              <button type="button" onClick={submitAgentMessage} disabled={!agentDraft.trim()}>
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
