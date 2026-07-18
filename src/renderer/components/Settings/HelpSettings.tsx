import { useEffect, useState } from 'react';
import { useT } from '../../i18n';
import { APP_CONFIG } from '../../../shared/app-config';

// Help / About panel — shows the running app version and quick links to the
// project's GitHub issues page and website. The version comes from the main
// process (Electron's app.getVersion()) so it always matches the packaged build
// rather than a hardcoded literal.
export default function HelpSettings() {
  const t = useT();
  const [version, setVersion] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(window.wmux?.system?.getVersion?.())
      .then((v?: string) => {
        if (!cancelled && typeof v === 'string') setVersion(v);
      })
      .catch(() => {
        /* version unavailable — leave blank rather than crash the panel */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">{t('settings.help.about')}</h3>

      <div className="settings-row">
        <label className="settings-label">{t('settings.help.version')}</label>
        <span>{APP_CONFIG.productName}{version ? ` v${version}` : ''}</span>
      </div>

      <p className="settings-hint">{t('settings.help.hint')}</p>
    </div>
  );
}
