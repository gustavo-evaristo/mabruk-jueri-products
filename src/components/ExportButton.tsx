import { useState } from 'react';
import { useProductsStore } from '../store/useProductsStore';
import { gerarExcel } from '../lib/excel';

export function ExportButton() {
  const products = useProductsStore((s) => s.products);
  const settings = useProductsStore((s) => s.settings);
  const [busy, setBusy] = useState(false);

  const linhas = products.reduce(
    (acc, p) => acc + (p.qtdOuro > 0 ? 1 : 0) + (p.qtdPrata > 0 ? 1 : 0),
    0,
  );

  async function handleClick() {
    setBusy(true);
    try {
      await gerarExcel(products, settings);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="export-bar">
      <div className="summary">
        {products.length} produto(s) · {linhas} linha(s) no Excel
      </div>
      <button className="btn" disabled={busy || linhas === 0} onClick={handleClick}>
        {busy ? 'Gerando…' : 'Gerar Excel'}
      </button>
    </div>
  );
}
