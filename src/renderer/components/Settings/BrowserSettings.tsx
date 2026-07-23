import { useStore } from '../../store';

export default function BrowserSettings() {
  const { browserPrefs, setBrowserPrefs } = useStore();

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Поиск</h3>

      <div className="settings-row">
        <label className="settings-label">Поисковая система</label>
        <select
          className="settings-select"
          value={browserPrefs.searchEngine}
          onChange={(e) =>
            setBrowserPrefs({
              searchEngine: e.target.value as 'google' | 'duckduckgo' | 'bing' | 'brave',
            })
          }
        >
          <option value="google">Google</option>
          <option value="duckduckgo">DuckDuckGo</option>
          <option value="bing">Bing</option>
          <option value="brave">Brave Search</option>
        </select>
      </div>

      <div className="settings-divider" />
      <h3 className="settings-section-title">Инструменты разработчика</h3>

      <div className="settings-row">
        <label className="settings-label">Значок DevTools</label>
        <select
          className="settings-select"
          value={browserPrefs.devToolsIcon}
          onChange={(e) =>
            setBrowserPrefs({
              devToolsIcon: e.target.value as 'default' | 'compact' | 'hidden',
            })
          }
        >
          <option value="default">Обычный</option>
          <option value="compact">Компактный</option>
          <option value="hidden">Скрытый</option>
        </select>
      </div>
    </div>
  );
}
