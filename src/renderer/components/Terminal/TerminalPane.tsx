import { useState, useCallback, useEffect, useRef } from 'react';
import { useTerminal } from '../../hooks/useTerminal';
import FindBar from './FindBar';
import CopyMode from './CopyMode';
import '../../styles/terminal.css';
import { AgentPreset } from '../../../shared/types';
import { copyTerminalText } from '../../utils/copy-text';
import { useT } from '../../i18n';

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
  const { terminalRef, xtermRef, searchAddonRef } = useTerminal({ surfaceId, shell, cwd, visible, focused, colorScheme, startupCommands, agentPreset, resumeAgentSession });

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

  return (
    <div className={`terminal-pane ${focused ? 'terminal-pane--focused' : ''}`}>
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
  );
}
