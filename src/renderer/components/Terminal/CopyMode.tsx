import { useT } from '../../i18n';

interface CopyModeProps {
  active: boolean;
}

export default function CopyMode({ active }: CopyModeProps) {
  const t = useT();
  if (!active) return null;
  return <div className="copy-mode-indicator">{t('terminal.copyMode.hint')}</div>;
}
