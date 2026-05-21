import { downscaleDataUrl, generateImage, type Material } from './gemini';
import { uploadToImgbb } from './imgbb';
import { isAco } from './calc';
import type { Product } from '../types';

export interface GenerateResult {
  ouro?: string;
  prata?: string;
  aco?: string;
}

export interface PipelineError {
  material: Material;
  message: string;
}

async function generateAndUpload(
  source: string,
  material: Material,
  improve = false,
): Promise<string> {
  const imageDataUrl = await generateImage(source, material, improve);
  return await uploadToImgbb(imageDataUrl);
}

/**
 * Regenera apenas uma variante (ouro / prata / aço) com prompt de melhoria.
 */
export async function regerarImagemParaProduto(
  p: Product,
  material: Material,
): Promise<string> {
  if (!p.sourceImage) throw new Error('Anexe a foto-fonte antes de regenerar.');
  const source = await downscaleDataUrl(p.sourceImage, 1024);
  return await generateAndUpload(source, material, true);
}

/**
 * Para um produto: gera as 1 ou 2 imagens necessárias (em paralelo),
 * sobe pra ImgBB e devolve as URLs. Erros por material são acumulados.
 */
export async function gerarImagensParaProduto(
  p: Product,
): Promise<{ urls: GenerateResult; errors: PipelineError[] }> {
  if (!p.sourceImage) {
    throw new Error('Anexe a foto-fonte antes de gerar.');
  }

  const source = await downscaleDataUrl(p.sourceImage, 1024);
  const materials: Material[] = isAco(p.descricao) ? ['aco'] : ['ouro', 'prata'];

  const results = await Promise.allSettled(
    materials.map((m) => generateAndUpload(source, m)),
  );

  const urls: GenerateResult = {};
  const errors: PipelineError[] = [];
  results.forEach((r, i) => {
    const m = materials[i];
    if (r.status === 'fulfilled') {
      urls[m] = r.value;
    } else {
      errors.push({
        material: m,
        message: r.reason instanceof Error ? r.reason.message : String(r.reason),
      });
    }
  });

  return { urls, errors };
}
