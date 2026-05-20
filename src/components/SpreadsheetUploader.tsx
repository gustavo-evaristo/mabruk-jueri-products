import { useRef, useState } from 'react';
import { parseProdutosXlsx } from '../lib/xlsxParser';
import { useProductsStore } from '../store/useProductsStore';

export function SpreadsheetUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const loadProducts = useProductsStore((s) => s.loadProducts);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    setStatus('Lendo planilha…');
    try {
      const parsed = await parseProdutosXlsx(file, (msg) => setStatus(msg));
      if (parsed.length === 0) {
        setError('Não consegui identificar nenhum produto válido na planilha.');
      } else {
        setStatus(`Carregando ${parsed.length} produto(s)…`);
        loadProducts(parsed);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Falha ao processar a planilha.');
    } finally {
      setBusy(false);
      setStatus('');
    }
  }

  return (
    <div className="uploader">
      <div className="uploader-card">
        <h2>Importar planilha de produtos</h2>
        <p>
          Selecione a planilha (.xlsx) com as colunas <code>codigo</code>, <code>codigo_fornecedor</code>,{' '}
          <code>descricao</code>, <code>categoria</code>, <code>quantidade</code>, <code>peso</code>{' '}
          e <code>valor_unitario</code>.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
        <button
          className="btn"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Processando…' : 'Selecionar planilha'}
        </button>
        {busy && (
          <div className="loading">
            <div className="spinner" />
            <span>{status || 'Processando…'}</span>
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
