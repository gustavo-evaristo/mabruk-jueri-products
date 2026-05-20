import { create } from 'zustand';
import type { GlobalSettings, Product } from '../types';
import produtosData from '../data/produtos.json';

interface RawProduct {
  codigo: string;
  codigoFornecedor: string;
  descricao: string;
  qtde: number;
  peso: number;
  vUnit: number;
  imageIndex: number;
}

const initialSettings: GlobalSettings = {
  fornecedor: 'GF Brutos',
  descontoGlobalPct: 0,
  custoOuro1: 2.46,
  custoOuro2: 3.19,
  custoPrata30: 1.37,
  custoPrata50: 1.61,
  subcategoriaDefaultOuro: 'LISOS OURO',
  subcategoriaDefaultPrata: 'LISOS PRATA',
  markupPct: 1000,
};

const initialProducts: Product[] = (produtosData as RawProduct[]).map((p, idx) => ({
  id: `brinco-${idx}`,
  codigo: p.codigo,
  codigoFornecedor: p.codigoFornecedor,
  descricao: p.descricao,
  qtde: p.qtde,
  peso: p.peso,
  vUnit: p.vUnit,
  imageIndex: p.imageIndex,
  categoria: 'BRINCO',
  descontoPct: null,
  qtdOuro: p.qtde,
  qtdPrata: 0,
  subcategoriaOuro: initialSettings.subcategoriaDefaultOuro,
  subcategoriaPrata: initialSettings.subcategoriaDefaultPrata,
  precoVarejoOuro: null,
  precoVarejoPrata: null,
}));

interface StoreState {
  products: Product[];
  settings: GlobalSettings;
  updateSettings: (patch: Partial<GlobalSettings>) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
}

export const useProductsStore = create<StoreState>((set) => ({
  products: initialProducts,
  settings: initialSettings,
  updateSettings: (patch) =>
    set((state) => {
      const next = { ...state.settings, ...patch };
      const products = state.products.map((p) => ({
        ...p,
        subcategoriaOuro:
          p.subcategoriaOuro === state.settings.subcategoriaDefaultOuro
            ? next.subcategoriaDefaultOuro
            : p.subcategoriaOuro,
        subcategoriaPrata:
          p.subcategoriaPrata === state.settings.subcategoriaDefaultPrata
            ? next.subcategoriaDefaultPrata
            : p.subcategoriaPrata,
      }));
      return { settings: next, products };
    }),
  updateProduct: (id, patch) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
}));
