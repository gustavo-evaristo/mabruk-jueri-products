import { useProductsStore } from '../store/useProductsStore';
import { CATEGORIA_BANHO } from '../lib/categoriaBanho';
import type { Categoria } from '../types';

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step?: string;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        step={step ?? '0.01'}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
    </label>
  );
}

const CATEGORIAS_ORDEM: Categoria[] = [
  'BRINCO',
  'COLAR',
  'PULSEIRA',
  'ANEL',
  'BRACELETE',
  'PINGENTE',
  'TORNOZELEIRA',
  'CONJUNTO',
];

export function GlobalSettings() {
  const settings = useProductsStore((s) => s.settings);
  const update = useProductsStore((s) => s.updateSettings);

  return (
    <div className="settings">
      <div className="settings-block">
        <h3>Gerais</h3>
        <div className="settings-grid">
          <label>
            Fornecedor
            <input
              value={settings.fornecedor}
              onChange={(e) => update({ fornecedor: e.target.value })}
            />
          </label>
          <NumField
            label="% Desconto global"
            step="1"
            value={settings.descontoGlobalPct}
            onChange={(n) => update({ descontoGlobalPct: n })}
          />
          <NumField
            label="Markup % (sugestão de preço)"
            step="1"
            value={settings.markupPct}
            onChange={(n) => update({ markupPct: n })}
          />
          <label>
            Subcategoria default OURO
            <input
              value={settings.subcategoriaDefaultOuro}
              onChange={(e) => update({ subcategoriaDefaultOuro: e.target.value })}
            />
          </label>
          <label>
            Subcategoria default PRATA
            <input
              value={settings.subcategoriaDefaultPrata}
              onChange={(e) => update({ subcategoriaDefaultPrata: e.target.value })}
            />
          </label>
        </div>
      </div>

      <div className="settings-block">
        <h3>Custo do banho por grama (cataforético incluso)</h3>
        <div className="settings-grid">
          <NumField
            label="Ouro 1 ms · R$/g"
            value={settings.custoOuro1}
            onChange={(n) => update({ custoOuro1: n })}
          />
          <NumField
            label="Ouro 2 ms · R$/g"
            value={settings.custoOuro2}
            onChange={(n) => update({ custoOuro2: n })}
          />
          <NumField
            label="Prata 30 ms · R$/g"
            value={settings.custoPrata30}
            onChange={(n) => update({ custoPrata30: n })}
          />
          <NumField
            label="Prata 50 ms · R$/g"
            value={settings.custoPrata50}
            onChange={(n) => update({ custoPrata50: n })}
          />
        </div>
      </div>

      <div className="settings-block">
        <h3>Milésimos por categoria (fixo)</h3>
        <table className="ms-table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Ouro</th>
              <th>Prata</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIAS_ORDEM.map((c) => (
              <tr key={c}>
                <td>{c}</td>
                <td>{CATEGORIA_BANHO[c].msOuro} ms</td>
                <td>{CATEGORIA_BANHO[c].msPrata} ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
