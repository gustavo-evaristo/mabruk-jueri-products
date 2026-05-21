import { create } from 'zustand';
import type { GlobalSettings, Product } from '../types';
import type { ParsedProduct } from '../lib/xlsxParser';
import { isAco } from '../lib/calc';
import { loadSettings, saveSettings } from '../lib/persistSettings';

const defaultSettings: GlobalSettings = {
  fornecedor: 'GF Brutos',
  descontoGlobalPct: 0,
  custoOuro1: 2.46,
  custoOuro2: 3.19,
  custoPrata30: 1.37,
  custoPrata50: 1.61,
  subcategoriaDefaultOuro: 'OURO',
  subcategoriaDefaultPrata: 'PRATA',
  subcategoriaDefaultAco: 'AÇO',
  markupPct: 1000,
};

const initialSettings = loadSettings(defaultSettings);

interface StoreState {
  products: Product[];
  settings: GlobalSettings;
  loadProducts: (parsed: ParsedProduct[]) => void;
  reset: () => void;
  updateSettings: (patch: Partial<GlobalSettings>) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  removeProduct: (id: string) => void;
}

function buildProduct(p: ParsedProduct, idx: number, s: GlobalSettings): Product {
  const aco = isAco(p.descricao);
  return {
    id: `prod-${idx}`,
    codigo: p.codigo,
    codigoFornecedor: p.codigoFornecedor,
    descricao: p.descricao,
    qtde: p.qtde,
    peso: p.peso,
    vUnit: p.vUnit,
    categoria: p.categoria,
    descontoPct: null,
    qtdOuro: aco ? 0 : Math.floor(p.qtde / 2),
    qtdPrata: aco ? 0 : Math.ceil(p.qtde / 2),
    qtdAco: aco ? p.qtde : 0,
    subcategoriaOuro: s.subcategoriaDefaultOuro,
    subcategoriaPrata: s.subcategoriaDefaultPrata,
    subcategoriaAco: s.subcategoriaDefaultAco,
    precoVarejoOuro: null,
    precoVarejoPrata: null,
    precoVarejoAco: null,
    sourceImage: null,
    imageUrlOuro: null,
    imageUrlPrata: null,
    imageUrlAco: null,
  };
}

export const useProductsStore = create<StoreState>((set) => ({
  products: [],
  settings: initialSettings,
  loadProducts: (parsed) =>
    set((state) => ({
      products: parsed.map((p, i) => buildProduct(p, i, state.settings)),
    })),
  reset: () => set({ products: [] }),
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
        subcategoriaAco:
          p.subcategoriaAco === state.settings.subcategoriaDefaultAco
            ? next.subcategoriaDefaultAco
            : p.subcategoriaAco,
      }));
      saveSettings(next);
      return { settings: next, products };
    }),
  updateProduct: (id, patch) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),
  removeProduct: (id) =>
    set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
}));
