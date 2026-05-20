import * as pdfjs from 'pdfjs-dist';
// @ts-expect-error -- vite resolves the worker url via the ?url suffix
import workerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

// O PDF (página 4 de brincos) tem 10 produtos em uma grade 2 colunas × 5 linhas.
// Em cada célula, a imagem do produto ocupa a porção esquerda. Coordenadas
// abaixo são relativas ao viewport renderizado.
const GRID = {
  cols: 2,
  rows: 5,
  // Bounds da área da grade (proporcional ao viewport)
  left: 0.06,
  right: 0.94,
  top: 0.04,
  bottom: 0.96,
  // Dentro de cada célula, onde fica a imagem (proporcional ao tamanho da célula)
  imgLeft: 0.05,
  imgRight: 0.45,
  imgTop: 0.05,
  imgBottom: 0.95,
};

export async function extractProductImages(url: string): Promise<string[]> {
  const pdf = await pdfjs.getDocument(url).promise;
  const page = await pdf.getPage(1);
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

  const images: string[] = [];
  for (let i = 0; i < GRID.rows * GRID.cols; i++) {
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
    images.push(sub.toDataURL('image/png'));
  }
  return images;
}
