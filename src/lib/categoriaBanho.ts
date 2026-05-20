import type { Categoria, CategoriaBanho } from '../types';

// Tabela fixa: milésimos usados em cada categoria (banho cataforético em todos)
export const CATEGORIA_BANHO: Record<Categoria, CategoriaBanho> = {
  BRINCO:       { msOuro: 1, msPrata: 30 },
  COLAR:        { msOuro: 2, msPrata: 50 },
  PULSEIRA:     { msOuro: 2, msPrata: 50 },
  ANEL:         { msOuro: 2, msPrata: 50 },
  BRACELETE:    { msOuro: 1, msPrata: 30 },
  PINGENTE:     { msOuro: 1, msPrata: 30 },
  TORNOZELEIRA: { msOuro: 1, msPrata: 50 },
  CONJUNTO:     { msOuro: 2, msPrata: 50 },
};
