import type { Categoria } from '../types';

const TABS: { value: Categoria; label: string }[] = [
  { value: 'BRINCO', label: 'Brincos' },
  { value: 'COLAR', label: 'Colares' },
  { value: 'PULSEIRA', label: 'Pulseiras' },
  { value: 'ANEL', label: 'Anéis' },
  { value: 'BRACELETE', label: 'Braceletes' },
  { value: 'PINGENTE', label: 'Pingentes' },
  { value: 'TORNOZELEIRA', label: 'Tornozeleiras' },
  { value: 'CONJUNTO', label: 'Conjuntos' },
];

export function CategoryTabs({
  active,
  available,
  onChange,
}: {
  active: Categoria;
  available: Set<Categoria>;
  onChange: (c: Categoria) => void;
}) {
  return (
    <div className="tabs">
      {TABS.filter((t) => available.has(t.value)).map((t) => (
        <button
          key={t.value}
          className={`tab ${active === t.value ? 'active' : ''}`}
          onClick={() => onChange(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
