import { useEffect, useState } from 'react';

interface AgentReadiness {
  proxyApiConfigured: boolean;
  claudeCodeAvailable: boolean;
  codexAvailable: boolean;
}

const INITIAL: AgentReadiness = {
  proxyApiConfigured: false,
  claudeCodeAvailable: false,
  codexAvailable: false,
};

function Status({ ok, children }: { ok: boolean; children: string }) {
  return <span style={{ color: ok ? '#6ddc8b' : '#e7a35f' }}>{ok ? 'Ready' : 'Missing'} — {children}</span>;
}

/** Shows capability state without ever exposing credential values to the renderer. */
export default function AgentSettings() {
  const [readiness, setReadiness] = useState<AgentReadiness>(INITIAL);
  const refresh = () => {
    window.wmux?.agent?.readiness?.()
      .then((value: AgentReadiness) => { if (value) setReadiness(value); })
      .catch(() => setReadiness(INITIAL));
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">AI agents &amp; ProxyAPI</h3>
      <p className="settings-hint">
        WinAgent Terminal reads <code>PROXYAPI_KEY</code> only from the process environment.
        It has no key input and never writes credentials to settings, session files or logs.
      </p>
      <div className="settings-row"><Status ok={readiness.proxyApiConfigured}>PROXYAPI_KEY environment variable</Status></div>
      <div className="settings-row"><Status ok={readiness.claudeCodeAvailable}>Claude Code CLI on PATH</Status></div>
      <div className="settings-row"><Status ok={readiness.codexAvailable}>Codex CLI on PATH</Status></div>
      <div className="settings-row">
        <button className="settings-button" onClick={refresh}>Refresh status</button>
      </div>
      <div className="settings-divider" />
      <p className="settings-hint">
        Use the arrow next to <strong>+</strong> in a terminal pane to launch Claude Code or Codex through ProxyAPI.
        Resume entries open each CLI&apos;s native session selector. Restart the app after changing the user environment.
      </p>
    </div>
  );
}
