import ExcelJS from 'exceljs';
import type { Categoria } from '../types';

export interface ParsedProduct {
  codigo: string;
  codigoFornecedor: string;
  descricao: string;
  categoria: Categoria;
  qtde: number;
  peso: number;
  vUnit: number;
}

const COLUNAS_OBRIGATORIAS = [
  'codigo',
  'codigo_fornecedor',
  'descricao',
  'categoria',
  'quantidade',
  'peso',
  'valor_unitario',
] as const;

type Coluna = (typeof COLUNAS_OBRIGATORIAS)[number];

// Mapeia o texto da coluna "categoria" para o enum interno.
const CATEGORIA_MAP: Record<string, Categoria> = {
  brinco: 'BRINCO',
  brincos: 'BRINCO',
  colar: 'COLAR',
  colares: 'COLAR',
  pulseira: 'PULSEIRA',
  pulseiras: 'PULSEIRA',
  anel: 'ANEL',
  aneis: 'ANEL',
  bracelete: 'BRACELETE',
  braceletes: 'BRACELETE',
  pingente: 'PINGENTE',
  pingentes: 'PINGENTE',
  tornozeleira: 'TORNOZELEIRA',
  tornozeleiras: 'TORNOZELEIRA',
  conjunto: 'CONJUNTO',
  conjuntos: 'CONJUNTO',
};

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function mapearCategoria(raw: unknown): Categoria | null {
  if (typeof raw !== 'string') return null;
  const k = normalizar(raw);
  return CATEGORIA_MAP[k] ?? null;
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object' && 'text' in (v as Record<string, unknown>)) {
    return String((v as { text: unknown }).text ?? '');
  }
  return String(v).trim();
}

function cellToNumber(v: unknown): number {
  if (typeof v === 'number') return v;
  if (v === null || v === undefined) return 0;
  const s = String(v).replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export async function parseProdutosXlsx(
  file: File,
  onProgress?: (msg: string) => void,
): Promise<ParsedProduct[]> {
  onProgress?.('Lendo planilha…');
  const buf = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('Planilha não tem nenhuma aba.');

  // Mapeia cabeçalho → índice da coluna
  const headerRow = ws.getRow(1);
  const idxByCol: Partial<Record<Coluna, number>> = {};
  headerRow.eachCell((cell, colIndex) => {
    const key = normalizar(cellToString(cell.value));
    if ((COLUNAS_OBRIGATORIAS as readonly string[]).includes(key)) {
      idxByCol[key as Coluna] = colIndex;
    }
  });

  const faltando = COLUNAS_OBRIGATORIAS.filter((c) => idxByCol[c] === undefined);
  if (faltando.length > 0) {
    throw new Error(`Planilha sem as colunas obrigatórias: ${faltando.join(', ')}`);
  }

  onProgress?.('Lendo produtos…');
  const out: ParsedProduct[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const codigo = cellToString(row.getCell(idxByCol.codigo!).value);
    if (!codigo) continue; // pula linhas vazias

    const categoria = mapearCategoria(row.getCell(idxByCol.categoria!).value);
    if (!categoria) continue;

    out.push({
      codigo,
      codigoFornecedor: cellToString(row.getCell(idxByCol.codigo_fornecedor!).value),
      descricao: cellToString(row.getCell(idxByCol.descricao!).value),
      categoria,
      qtde: cellToNumber(row.getCell(idxByCol.quantidade!).value),
      peso: cellToNumber(row.getCell(idxByCol.peso!).value),
      vUnit: cellToNumber(row.getCell(idxByCol.valor_unitario!).value),
    });
  }

  return out;
}
