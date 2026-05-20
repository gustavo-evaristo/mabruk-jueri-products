import type { GlobalSettings, Product } from '../types';
import { CATEGORIA_BANHO } from './categoriaBanho';

export function isAco(descricao: string): boolean {
  const norm = (descricao ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
  return /\baco\b/.test(norm);
}

export function descontoEfetivo(p: Product, settings: GlobalSettings): number {
  return p.descontoPct ?? settings.descontoGlobalPct;
}

export function custoCompra(p: Product, settings: GlobalSettings): number {
  const pct = descontoEfetivo(p, settings);
  return round2(p.vUnit * (1 - pct / 100));
}

export function milesimoOuro(p: Product): number {
  return CATEGORIA_BANHO[p.categoria].msOuro;
}

export function milesimoPrata(p: Product): number {
  return CATEGORIA_BANHO[p.categoria].msPrata;
}

export function custoBanhoOuro(p: Product, s: GlobalSettings): number {
  const ms = milesimoOuro(p);
  const porGrama = ms === 2 ? s.custoOuro2 : s.custoOuro1;
  return round2(p.peso * porGrama);
}

export function custoBanhoPrata(p: Product, s: GlobalSettings): number {
  const ms = milesimoPrata(p);
  const porGrama = ms === 50 ? s.custoPrata50 : s.custoPrata30;
  return round2(p.peso * porGrama);
}

export function custoTotalOuro(p: Product, s: GlobalSettings): number {
  return round2(custoCompra(p, s) + custoBanhoOuro(p, s));
}

export function custoTotalPrata(p: Product, s: GlobalSettings): number {
  return round2(custoCompra(p, s) + custoBanhoPrata(p, s));
}

// Markup: custo_total × (1 + markup/100), arredondado para o próximo "X9,99".
export function aplicarMarkup(custoTotal: number, markupPct: number): number {
  if (!Number.isFinite(custoTotal) || custoTotal <= 0) return 9.99;
  const bruto = custoTotal * (1 + markupPct / 100);
  return roundToNoveNoventaNove(bruto);
}

// Menor x = 10k + 9,99 tal que x >= value. Ex: 92 → 99,99 · 85 → 89,99 · 9 → 9,99.
export function roundToNoveNoventaNove(value: number): number {
  if (!Number.isFinite(value) || value <= 9.99) return 9.99;
  // tolerância para floats: trata 9.99 como já válido
  const k = Math.ceil((value - 9.99 - 1e-9) / 10);
  return round2(k * 10 + 9.99);
}

export function precoSugeridoOuro(p: Product, s: GlobalSettings): number {
  return aplicarMarkup(custoTotalOuro(p, s), s.markupPct);
}

export function precoSugeridoPrata(p: Product, s: GlobalSettings): number {
  return aplicarMarkup(custoTotalPrata(p, s), s.markupPct);
}

export function custoTotalAco(p: Product, s: GlobalSettings): number {
  // Aço não tem banho, então o custo total é só o custo de compra (com desconto).
  return custoCompra(p, s);
}

export function precoSugeridoAco(p: Product, s: GlobalSettings): number {
  return aplicarMarkup(custoTotalAco(p, s), s.markupPct);
}

export function precoFinalOuro(p: Product, s: GlobalSettings): number {
  return p.precoVarejoOuro ?? precoSugeridoOuro(p, s);
}

export function precoFinalPrata(p: Product, s: GlobalSettings): number {
  return p.precoVarejoPrata ?? precoSugeridoPrata(p, s);
}

export function precoFinalAco(p: Product, s: GlobalSettings): number {
  return p.precoVarejoAco ?? precoSugeridoAco(p, s);
}

export function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}
