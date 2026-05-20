import { useEffect, useState } from 'react';
import { GlobalSettings } from './components/GlobalSettings';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductCard } from './components/ProductCard';
import { ExportButton } from './components/ExportButton';
import { SpreadsheetUploader } from './components/SpreadsheetUploader';
import { useProductsStore } from './store/useProductsStore';
import type { Categoria } from './types';

export function App() {
  const products = useProductsStore((s) => s.products);
  const reset = useProductsStore((s) => s.reset);
  const [tab, setTab] = useState<Categoria>('BRINCO');

  const available = new Set<Categoria>(products.map((p) => p.categoria));

  // Garante que a tab ativa exista nos produtos carregados
  useEffect(() => {
    if (products.length > 0 && !available.has(tab)) {
      const first = products[0].categoria;
      setTab(first);
    }
  }, [products, tab, available]);

  if (products.length === 0) {
    return (
      <div className="app">
        <h1>Cadastro em lote · Jueri</h1>
        <SpreadsheetUploader />
      </div>
    );
  }

  const visible = products.filter((p) => p.categoria === tab);

  return (
    <div className="app">
      <div className="header">
        <h1>Cadastro em lote · Jueri</h1>
        <button className="btn-secondary" onClick={reset}>
          Carregar outra planilha
        </button>
      </div>
      <GlobalSettings />
      <CategoryTabs active={tab} available={available} onChange={setTab} />
      <div className="cards">
        {visible.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
            Nenhum produto nessa categoria.
          </div>
        )}
        {visible.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
      <ExportButton />
    </div>
  );
}
