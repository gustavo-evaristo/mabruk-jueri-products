import * as pdfjs from 'pdfjs-dist';
// @ts-expect-error -- vite resolve o url do worker via ?url
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ParsedProduct {
  codigo: string;
  codigoFornecedor: string;
  descricao: string;
  qtde: number;
  peso: number;
  vUnit: number;
  imageDataUrl: string;
}

// Layout do catálogo do fornecedor: 2 colunas × até 5 linhas por página.
const GRID = {
  cols: 2,
  rows: 5,
  left: 0.06,
  right: 0.94,
  top: 0.04,
  bottom: 0.96,
  imgLeft: 0.05,
  imgRight: 0.45,
  imgTop: 0.05,
  imgBottom: 0.95,
};

function parseNum(s: string): number {
  return parseFloat(s.trim().replace(/\./g, '').replace(',', '.')) || 0;
}

function parsePageText(text: string): Omit<ParsedProduct, 'imageDataUrl'>[] {
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const products: Omit<ParsedProduct, 'imageDataUrl'>[] = [];
  let blockStart = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith('V. Unit:')) continue;
    if (i < 2) continue;
    // Acha o rótulo "Código:" andando para trás
    let codigoLabelIdx = -1;
    for (let j = i - 3; j >= blockStart; j--) {
      if (lines[j] === 'Código:') {
        codigoLabelIdx = j;
        break;
      }
    }
    if (codigoLabelIdx < blockStart + 2) {
      blockStart = i + 1;
      continue;
    }
    const codigo = lines[blockStart];
    const codigoFornecedor = lines[blockStart + 1];
    const descricao = lines.slice(blockStart + 2, codigoLabelIdx).join(' ');
    const qtde = parseInt(lines[i - 2].split(':')[1]?.trim() ?? '0', 10) || 0;
    const peso = parseNum(lines[i - 1].split(':').slice(1).join(':'));
    const vUnit = parseNum(lines[i].split(':').slice(1).join(':'));
    products.push({ codigo, codigoFornecedor, descricao, qtde, peso, vUnit });
    blockStart = i + 1;
  }
  return products;
}

async function getPageText(page: pdfjs.PDFPageProxy): Promise<string> {
  const content = await page.getTextContent();
  return content.items
    .map((it) => ('str' in it ? it.str : ''))
    .filter((s) => s !== undefined)
    .join('\n');
}

async function renderPageImages(page: pdfjs.PDFPageProxy, count: number): Promise<string[]> {
  if (count === 0) return [];
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;

  const gridX = GRID.left * viewport.width;
  const gridY = GRID.top * viewport.height;
  const gridW = (GRID.right - GRID.left) * viewport.width;
  const gridH = (GRID.bottom - GRID.top) * viewport.height;
  const cellW = gridW / GRID.cols;
  const cellH = gridH / GRID.rows;

  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / GRID.cols);
    const col = i % GRID.cols;
    const cellX = gridX + col * cellW;
    const cellY = gridY + row * cellH;
    const x = cellX + GRID.imgLeft * cellW;
    const y = cellY + GRID.imgTop * cellH;
    const w = (GRID.imgRight - GRID.imgLeft) * cellW;
    const h = (GRID.imgBottom - GRID.imgTop) * cellH;

    const sub = document.createElement('canvas');
    sub.width = w;
    sub.height = h;
    sub.getContext('2d')!.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    out.push(sub.toDataURL('image/png'));
  }
  return out;
}

export async function parseProdutosPdf(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<ParsedProduct[]> {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const result: ParsedProduct[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(`Processando página ${pageNum} de ${pdf.numPages}…`);
    const page = await pdf.getPage(pageNum);
    const text = await getPageText(page);
    const pageProducts = parsePageText(text);
    const images = await renderPageImages(page, pageProducts.length);
    for (let i = 0; i < pageProducts.length; i++) {
      result.push({ ...pageProducts[i], imageDataUrl: images[i] ?? '' });
    }
  }

  return result;
}
