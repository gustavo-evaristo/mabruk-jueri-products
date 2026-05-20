import ExcelJS from 'exceljs';
import type { GlobalSettings, Product } from '../types';
import {
  custoBanhoOuro,
  custoBanhoPrata,
  custoCompra,
  milesimoOuro,
  milesimoPrata,
  precoFinalOuro,
  precoFinalPrata,
} from './calc';

export const HEADERS = [
  'ID',
  'Foto',
  'Código de Barras',
  'Código Pai',
  'Descrição',
  'Código do Fornecedor',
  'Fornecedor',
  'Categoria',
  'Subcategoria',
  'Cor',
  'Observação',
  'Tamanho',
  'Peso',
  'Milésimos de Banho',
  'Custo de Compra',
  'Custo de Insumos',
  'Custo do Banho de Ouro',
  'Custo do Banho de Ródio',
  'Custo do Banho de Prata',
  'Custo do Banho de Verniz',
  'Preço de Varejo',
  'Quantidade',
  'Localização',
  'Exibir no Catálogo',
  'Status',
] as const;

type Row = (string | number | null)[];

function buildRowOuro(p: Product, s: GlobalSettings): Row {
  return [
    null,
    null,
    null,
    null,
    p.descricao,
    p.codigoFornecedor,
    s.fornecedor,
    p.categoria,
    p.subcategoriaOuro,
    'OURO',
    null,
    null,
    p.peso,
    milesimoOuro(p),
    custoCompra(p, s),
    0,
    custoBanhoOuro(p, s),
    0,
    0,
    0,
    precoFinalOuro(p, s),
    p.qtdOuro,
    null,
    'Sim',
    'Ativo',
  ];
}

function buildRowPrata(p: Product, s: GlobalSettings): Row {
  return [
    null,
    null,
    null,
    null,
    p.descricao,
    p.codigoFornecedor,
    s.fornecedor,
    p.categoria,
    p.subcategoriaPrata,
    'PRATA',
    null,
    null,
    p.peso,
    milesimoPrata(p),
    custoCompra(p, s),
    0,
    0,
    0,
    custoBanhoPrata(p, s),
    0,
    precoFinalPrata(p, s),
    p.qtdPrata,
    null,
    'Sim',
    'Ativo',
  ];
}

export async function gerarExcel(products: Product[], settings: GlobalSettings): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Report');

  ws.addRow([...HEADERS]);
  ws.getRow(1).font = { bold: true };

  for (const p of products) {
    if (p.qtdOuro > 0) ws.addRow(buildRowOuro(p, settings));
    if (p.qtdPrata > 0) ws.addRow(buildRowPrata(p, settings));
  }

  HEADERS.forEach((h, i) => {
    ws.getColumn(i + 1).width = Math.max(12, h.length + 2);
  });

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `produtos_jueri_${ts}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
