import { useEffect, useState } from 'react';
import type { ProviderUsage } from '../../../shared/types';

const names = { claude: 'Claude', gemini: 'Gemini', codex: 'Codex' } as const;
function remaining(usage: ProviderUsage): number | null { const values = usage.windows.map((item) => item.remainingPercent).filter((value): value is number => value !== null); return values.length ? Math.min(...values) : null; }
export default function ProviderUsagePanel(): JSX.Element {
  const [items, setItems] = useState<ProviderUsage[]>([]);
  useEffect(() => { const api = window.wmux?.providerUsage; if (!api) return; void api.get().then(setItems).catch(() => undefined); return api.onUpdate(setItems); }, []);
  return <section className="provider-usage" aria-label="Лимиты провайдеров"><div className="sidebar-section-title">Лимиты</div>{items.map((item) => { const value = remaining(item); return <button className="provider-usage-card" key={item.provider} onClick={() => void window.wmux?.providerUsage?.refresh(item.provider)} title="Обновить лимиты"><span className={`usage-ring ${value !== null && value < 20 ? 'critical' : value !== null && value <= 50 ? 'warning' : ''}`} style={{ '--usage': `${value ?? 0}` } as React.CSSProperties}><span>{value === null ? '—' : `${value}%`}</span></span><span><strong>{names[item.provider]}</strong><small>{item.status === 'not-installed' ? 'CLI не найден' : item.status === 'fresh' ? 'Данные актуальны' : item.status === 'stale' ? 'Данные устарели' : 'Данные недоступны'}</small></span></button>; })}</section>;
}
