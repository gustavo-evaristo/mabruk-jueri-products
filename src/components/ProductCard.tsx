import { useRef, useState } from 'react';
import { useProductsStore } from '../store/useProductsStore';
import {
  custoBanhoOuro,
  custoBanhoPrata,
  custoCompra,
  custoTotalAco,
  custoTotalOuro,
  custoTotalPrata,
  descontoEfetivo,
  isAco,
  milesimoOuro,
  milesimoPrata,
  precoSugeridoAco,
  precoSugeridoOuro,
  precoSugeridoPrata,
} from '../lib/calc';
import { pickImageFromDataTransfer, readFileAsDataUrl } from '../lib/files';
import { ProductAiPanel } from './ProductAiPanel';
import type { Product } from '../types';

function fmt(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function NumberField({
  label,
  value,
  onChange,
  step = '0.01',
  readOnly = false,
}: {
  label: string;
  value: number;
  onChange?: (n: number) => void;
  step?: string;
  readOnly?: boolean;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        readOnly={readOnly}
        onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PrecoOverrideField({
  label,
  sugerido,
  override,
  onChange,
}: {
  label: string;
  sugerido: number;
  override: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="field">
      <label>{label} (sugerido R$ {fmt(sugerido)})</label>
      <input
        type="number"
        step="0.01"
        placeholder={fmt(sugerido)}
        value={override ?? ''}
        onChange={(e) =>
          onChange(e.target.value === '' ? null : parseFloat(e.target.value) || 0)
        }
      />
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const settings = useProductsStore((s) => s.settings);
  const update = useProductsStore((s) => s.updateProduct);
  const remove = useProductsStore((s) => s.removeProduct);
  const pct = descontoEfetivo(p, settings);
  const aco = isAco(p.descricao);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleRemove() {
    if (window.confirm(`Remover "${p.descricao}" da lista?`)) {
      remove(p.id);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOver) setDragOver(true);
  }
  function handleDragLeave() {
    setDragOver(false);
  }
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = pickImageFromDataTransfer(e.dataTransfer);
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    update(p.id, { sourceImage: dataUrl });
  }
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    update(p.id, { sourceImage: dataUrl });
  }

  return (
    <div className="card">
      <button
        type="button"
        className="card-remove"
        onClick={handleRemove}
        title="Remover produto"
        aria-label="Remover produto"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>
      <div className="card-left">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <button
          type="button"
          className={`photo dropzone ${dragOver ? 'drag-over' : ''}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          title={p.sourceImage ? 'Clique ou arraste para trocar' : 'Clique ou arraste uma foto'}
        >
          {p.sourceImage ? (
            <img src={p.sourceImage} alt={p.descricao} />
          ) : (
            <span className="code">clique ou arraste a foto</span>
          )}
          {dragOver && <div className="drop-overlay">solte a imagem</div>}
        </button>
        <div className="ref">cód: {p.codigo}</div>
      </div>
      <div className="body">
        <div className="row r1">
          <TextField
            label="Descrição"
            value={p.descricao}
            onChange={(v) => update(p.id, { descricao: v })}
          />
          <TextField
            label="Código do Fornecedor"
            value={p.codigoFornecedor}
            onChange={(v) => update(p.id, { codigoFornecedor: v })}
          />
        </div>
        <div className="row r2">
          <NumberField
            label="Peso (g)"
            value={p.peso}
            onChange={(n) => update(p.id, { peso: n })}
          />
          <NumberField
            label="V. Unit (R$)"
            value={p.vUnit}
            onChange={(n) => update(p.id, { vUnit: n })}
          />
          <div className="field">
            <label>% Desconto (sobrescreve {settings.descontoGlobalPct}%)</label>
            <input
              type="number"
              step="1"
              placeholder={String(settings.descontoGlobalPct)}
              value={p.descontoPct ?? ''}
              onChange={(e) =>
                update(p.id, {
                  descontoPct: e.target.value === '' ? null : parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <NumberField
            label={`Custo de Compra (${pct}% off)`}
            value={custoCompra(p, settings)}
            readOnly
          />
        </div>

        {aco ? (
          <div className="banhos banhos-aco">
            <div className="banho-block aco">
              <h4>AÇO · sem banho</h4>
              <div className="row">
                <NumberField
                  label="Qtd"
                  step="1"
                  value={p.qtdAco}
                  onChange={(n) => update(p.id, { qtdAco: Math.max(0, Math.round(n)) })}
                />
                <TextField
                  label="Subcategoria"
                  value={p.subcategoriaAco}
                  onChange={(v) => update(p.id, { subcategoriaAco: v })}
                />
              </div>
              <div className="row">
                <div className="field">
                  <label>Custo Total (R$)</label>
                  <input readOnly value={fmt(custoTotalAco(p, settings))} />
                </div>
                <PrecoOverrideField
                  label="Preço Varejo"
                  sugerido={precoSugeridoAco(p, settings)}
                  override={p.precoVarejoAco}
                  onChange={(v) => update(p.id, { precoVarejoAco: v })}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="banhos">
            <div className="banho-block ouro">
              <h4>OURO · {milesimoOuro(p)} ms</h4>
              <div className="row">
                <NumberField
                  label="Qtd"
                  step="1"
                  value={p.qtdOuro}
                  onChange={(n) => update(p.id, { qtdOuro: Math.max(0, Math.round(n)) })}
                />
                <div className="field">
                  <label>Custo Banho (R$)</label>
                  <input readOnly value={fmt(custoBanhoOuro(p, settings))} />
                </div>
              </div>
              <div className="row sub">
                <TextField
                  label="Subcategoria"
                  value={p.subcategoriaOuro}
                  onChange={(v) => update(p.id, { subcategoriaOuro: v })}
                />
              </div>
              <div className="row">
                <div className="field">
                  <label>Custo Total (R$)</label>
                  <input readOnly value={fmt(custoTotalOuro(p, settings))} />
                </div>
                <PrecoOverrideField
                  label="Preço Varejo"
                  sugerido={precoSugeridoOuro(p, settings)}
                  override={p.precoVarejoOuro}
                  onChange={(v) => update(p.id, { precoVarejoOuro: v })}
                />
              </div>
            </div>
            <div className="banho-block prata">
              <h4>PRATA · {milesimoPrata(p)} ms</h4>
              <div className="row">
                <NumberField
                  label="Qtd"
                  step="1"
                  value={p.qtdPrata}
                  onChange={(n) => update(p.id, { qtdPrata: Math.max(0, Math.round(n)) })}
                />
                <div className="field">
                  <label>Custo Banho (R$)</label>
                  <input readOnly value={fmt(custoBanhoPrata(p, settings))} />
                </div>
              </div>
              <div className="row sub">
                <TextField
                  label="Subcategoria"
                  value={p.subcategoriaPrata}
                  onChange={(v) => update(p.id, { subcategoriaPrata: v })}
                />
              </div>
              <div className="row">
                <div className="field">
                  <label>Custo Total (R$)</label>
                  <input readOnly value={fmt(custoTotalPrata(p, settings))} />
                </div>
                <PrecoOverrideField
                  label="Preço Varejo"
                  sugerido={precoSugeridoPrata(p, settings)}
                  override={p.precoVarejoPrata}
                  onChange={(v) => update(p.id, { precoVarejoPrata: v })}
                />
              </div>
            </div>
          </div>
        )}

        <ProductAiPanel p={p} />
      </div>
    </div>
  );
}
