import { useEffect, useState } from 'react';
import { GlobalSettings } from './components/GlobalSettings';
import { CategoryTabs } from './components/CategoryTabs';
import { ProductCard } from './components/ProductCard';
import { ExportButton } from './components/ExportButton';
import { useProductsStore } from './store/useProductsStore';
import { extractProductImages } from './lib/pdfImages';
import type { Categoria } from './types';

export function App() {
  const products = useProductsStore((s) => s.products);
  const [tab, setTab] = useState<Categoria>('BRINCO');
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    extractProductImages('/produtos.pdf')
      .then((imgs) => {
        if (!cancelled) setImages(imgs);
      })
      .catch((err) => console.error('Falha ao extrair imagens do PDF:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = products.filter((p) => p.categoria === tab);

  return (
    <div className="app">
      <h1>Cadastro em lote · Jueri</h1>
      <GlobalSettings />
      <CategoryTabs active={tab} onChange={setTab} />
      <div className="cards">
        {visible.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
            Nenhum produto nessa categoria ainda.
          </div>
        )}
        {visible.map((p) => (
          <ProductCard key={p.id} p={p} imageUrl={images[p.imageIndex]} />
        ))}
      </div>
      <ExportButton />
    </div>
  );
}
