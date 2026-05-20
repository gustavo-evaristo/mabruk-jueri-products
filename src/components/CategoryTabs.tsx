import type { Categoria } from '../types';

const TABS: { value: Categoria; label: string; enabled: boolean }[] = [
  { value: 'BRINCO', label: 'Brincos', enabled: true },
  { value: 'COLAR', label: 'Colares', enabled: false },
  { value: 'PULSEIRA', label: 'Pulseiras', enabled: false },
  { value: 'ANEL', label: 'Anéis', enabled: false },
  { value: 'CONJUNTO', label: 'Conjuntos', enabled: false },
];

export function CategoryTabs({
  active,
  onChange,
}: {
  active: Categoria;
  onChange: (c: Categoria) => void;
}) {
  return (
    <div className="tabs">
      {TABS.map((t) => (
        <button
          key={t.value}
          className={`tab ${active === t.value ? 'active' : ''} ${!t.enabled ? 'disabled' : ''}`}
          disabled={!t.enabled}
          onClick={() => t.enabled && onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
