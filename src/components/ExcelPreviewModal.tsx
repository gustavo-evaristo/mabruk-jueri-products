import { useEffect, useState } from 'react';
import { HEADERS, buildExcelRows, gerarExcel, type ExcelCell } from '../lib/excel';
import { useProductsStore } from '../store/useProductsStore';

function formatCell(v: ExcelCell, header: string): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') {
    // Valores monetários: 2 casas. Peso/Milésimos/Quantidade: até 2 casas, sem zeros à toa.
    const isMoney =
      header.includes('Custo') ||
      header.includes('Preço');
    if (isMoney) {
      return v.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    return v.toLocaleString('pt-BR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return String(v);
}

export function ExcelPreviewModal({ onClose }: { onClose: () => void }) {
  const products = useProductsStore((s) => s.products);
  const settings = useProductsStore((s) => s.settings);
  const [busy, setBusy] = useState(false);

  const rows = buildExcelRows(products, settings);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleDownload() {
    setBusy(true);
    try {
      await gerarExcel(products, settings);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Preview da planilha</h2>
            <p className="modal-subtitle">
              {rows.length} linha(s) seguindo o cabeçalho da planilha base do Jueri.
              Colunas <strong>ID</strong> e <strong>Código de Barras</strong> ficam em branco —
              são geradas pelo sistema.
            </p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>

        <div className="modal-body">
          {rows.length === 0 ? (
            <div className="empty">Nenhum produto com quantidade &gt; 0.</div>
          ) : (
            <div className="preview-scroll">
              <table className="preview-table">
                <thead>
                  <tr>
                    {HEADERS.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const cor = row[9];
                    const cls =
                      cor === 'OURO' ? 'row-ouro' : cor === 'AÇO' ? 'row-aco' : 'row-prata';
                    return (
                      <tr key={i} className={cls}>
                          {row.map((cell, j) => (
                          <td
                            key={j}
                            className={cell === null || cell === '' ? 'cell-empty' : ''}
                            title={cell === null ? '(vazio)' : String(cell)}
                          >
                            {formatCell(cell, HEADERS[j])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Voltar e ajustar
          </button>
          <button className="btn" onClick={handleDownload} disabled={busy || rows.length === 0}>
            {busy ? 'Gerando…' : 'Baixar Excel'}
          </button>
        </div>
      </div>
    </div>
  );
}
