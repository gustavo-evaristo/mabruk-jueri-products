export type Categoria =
  | 'BRINCO'
  | 'COLAR'
  | 'PULSEIRA'
  | 'ANEL'
  | 'CONJUNTO'
  | 'BRACELETE'
  | 'PINGENTE'
  | 'TORNOZELEIRA';

export type MilesimoOuro = 1 | 2;
export type MilesimoPrata = 30 | 50;

export interface CategoriaBanho {
  msOuro: MilesimoOuro;
  msPrata: MilesimoPrata;
}

export interface Product {
  id: string;
  codigo: string;
  codigoFornecedor: string;
  descricao: string;
  qtde: number;
  peso: number;
  vUnit: number;
  imageIndex: number;
  categoria: Categoria;

  descontoPct: number | null;

  qtdOuro: number;
  qtdPrata: number;
  subcategoriaOuro: string;
  subcategoriaPrata: string;
  // null = preço sugerido pelo markup; number = override manual
  precoVarejoOuro: number | null;
  precoVarejoPrata: number | null;
}

export interface GlobalSettings {
  fornecedor: string;
  descontoGlobalPct: number;
  // Custo do banho cataforético por nível de milésimo (valor por peça)
  custoOuro1: number;
  custoOuro2: number;
  custoPrata30: number;
  custoPrata50: number;
  subcategoriaDefaultOuro: string;
  subcategoriaDefaultPrata: string;
  markupPct: number;
}
