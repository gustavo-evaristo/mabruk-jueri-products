import { useState } from 'react';
import { useProductsStore } from '../store/useProductsStore';
import { ExcelPreviewModal } from './ExcelPreviewModal';
import { isAco } from '../lib/calc';

export function ExportButton() {
  const products = useProductsStore((s) => s.products);
  const [open, setOpen] = useState(false);

  const linhas = products.reduce((acc, p) => {
    if (isAco(p.descricao)) return acc + (p.qtdAco > 0 ? 1 : 0);
    return acc + (p.qtdOuro > 0 ? 1 : 0) + (p.qtdPrata > 0 ? 1 : 0);
  }, 0);

  return (
    <>
      <div className="export-bar">
        <div className="summary">
          {products.length} produto(s) · {linhas} linha(s) no Excel
        </div>
        <button className="btn" disabled={linhas === 0} onClick={() => setOpen(true)}>
          Pré-visualizar Excel
        </button>
      </div>
      {open && <ExcelPreviewModal onClose={() => setOpen(false)} />}
    </>
  );
}
