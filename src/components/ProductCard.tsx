import { useProductsStore } from '../store/useProductsStore';
import {
  custoBanhoOuro,
  custoBanhoPrata,
  custoCompra,
  custoTotalOuro,
  custoTotalPrata,
  descontoEfetivo,
  milesimoOuro,
  milesimoPrata,
  precoSugeridoOuro,
  precoSugeridoPrata,
} from '../lib/calc';
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

export function ProductCard({ p, imageUrl }: { p: Product; imageUrl?: string }) {
  const settings = useProductsStore((s) => s.settings);
  const update = useProductsStore((s) => s.updateProduct);
  const pct = descontoEfetivo(p, settings);
  const sugOuro = precoSugeridoOuro(p, settings);
  const sugPrata = precoSugeridoPrata(p, settings);

  return (
    <div className="card">
      <div>
        <div className="photo">
          {imageUrl ? <img src={imageUrl} alt={p.descricao} /> : <span className="code">sem foto</span>}
        </div>
        <div className="ref">cód. PDF: {p.codigo}</div>
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
                sugerido={sugOuro}
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
                sugerido={sugPrata}
                override={p.precoVarejoPrata}
                onChange={(v) => update(p.id, { precoVarejoPrata: v })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
