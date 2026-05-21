import { useState } from 'react';
import { useProductsStore } from '../store/useProductsStore';
import {
  gerarImagensParaProduto,
  regerarImagemParaProduto,
  type PipelineError,
} from '../lib/aiPipeline';
import { isAco } from '../lib/calc';
import type { Material } from '../lib/gemini';
import type { Product } from '../types';

const URL_FIELD: Record<Material, keyof Pick<Product, 'imageUrlOuro' | 'imageUrlPrata' | 'imageUrlAco'>> = {
  ouro: 'imageUrlOuro',
  prata: 'imageUrlPrata',
  aco: 'imageUrlAco',
};

export function ProductAiPanel({ p }: { p: Product }) {
  const update = useProductsStore((s) => s.updateProduct);
  const [busy, setBusy] = useState(false);
  const [regenerating, setRegenerating] = useState<Material | null>(null);
  const [errors, setErrors] = useState<PipelineError[]>([]);

  const aco = isAco(p.descricao);
  const canGenerate = !!p.sourceImage && !busy;
  const disabledReason = !p.sourceImage ? 'Anexe uma foto primeiro' : '';
  const hasAnyAi = !!(p.imageUrlOuro || p.imageUrlPrata || p.imageUrlAco);

  async function handleGenerate() {
    setBusy(true);
    setErrors([]);
    try {
      const { urls, errors } = await gerarImagensParaProduto(p);
      const patch: Partial<Product> = {};
      if (urls.ouro) patch.imageUrlOuro = urls.ouro;
      if (urls.prata) patch.imageUrlPrata = urls.prata;
      if (urls.aco) patch.imageUrlAco = urls.aco;
      if (Object.keys(patch).length > 0) update(p.id, patch);
      setErrors(errors);
    } catch (err) {
      setErrors([
        {
          material: aco ? 'aco' : 'ouro',
          message: err instanceof Error ? err.message : String(err),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function handleRegenerate(material: Material) {
    setRegenerating(material);
    setErrors((prev) => prev.filter((e) => e.material !== material));
    try {
      const url = await regerarImagemParaProduto(p, material);
      update(p.id, { [URL_FIELD[material]]: url });
    } catch (err) {
      setErrors((prev) => [
        ...prev.filter((e) => e.material !== material),
        {
          material,
          message: err instanceof Error ? err.message : String(err),
        },
      ]);
    } finally {
      setRegenerating(null);
    }
  }

  function clearSource() {
    update(p.id, {
      sourceImage: null,
      imageUrlOuro: null,
      imageUrlPrata: null,
      imageUrlAco: null,
    });
    setErrors([]);
  }

  function renderThumb(material: Material, url: string) {
    const isBusy = regenerating === material;
    return (
      <figure className={`ai-thumb ${material}`}>
        <img src={url} alt={material} />
        <figcaption>
          <a href={url} target="_blank" rel="noreferrer">
            {material.toUpperCase()}
          </a>
        </figcaption>
        <button
          type="button"
          className="thumb-regen"
          onClick={() => handleRegenerate(material)}
          disabled={isBusy || busy}
          title="Gerar versão melhor"
        >
          {isBusy ? 'gerando…' : 'regerar'}
        </button>
      </figure>
    );
  }

  return (
    <div className="ai-panel">
      <div className="ai-panel-row">
        <button
          type="button"
          className="btn btn-sm"
          onClick={handleGenerate}
          disabled={!canGenerate}
          title={disabledReason}
        >
          {busy ? 'Gerando…' : hasAnyAi ? 'Gerar novamente' : 'Gerar imagens IA'}
        </button>
        {p.sourceImage && (
          <button
            type="button"
            className="btn-link"
            onClick={clearSource}
            disabled={busy || !!regenerating}
          >
            limpar foto
          </button>
        )}
      </div>

      {(p.sourceImage || hasAnyAi) && (
        <div className="ai-thumbs">
          {p.sourceImage && (
            <figure className="ai-thumb source">
              <img src={p.sourceImage} alt="fonte" />
              <figcaption>
                <span>FOTO ENVIADA</span>
                <span className="thumb-tag muted">só referência</span>
              </figcaption>
            </figure>
          )}
          {!aco && p.imageUrlOuro && renderThumb('ouro', p.imageUrlOuro)}
          {!aco && p.imageUrlPrata && renderThumb('prata', p.imageUrlPrata)}
          {aco && p.imageUrlAco && renderThumb('aco', p.imageUrlAco)}
        </div>
      )}

      {errors.length > 0 && (
        <ul className="ai-errors">
          {errors.map((e) => (
            <li key={e.material}>
              <strong>{e.material}:</strong> {e.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
