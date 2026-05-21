import type { GlobalSettings } from '../types';

const KEY = 'mabruk:settings:v1';

export function loadSettings(defaults: GlobalSettings): GlobalSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<GlobalSettings>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: GlobalSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignora — localStorage pode estar cheio ou bloqueado
  }
}
