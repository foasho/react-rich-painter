import { debounce } from "es-toolkit";
import { STORAGE_KEYS } from "./storage-keys";
import { DEFAULT_BRUSH_SETTINGS, type BrushSettings } from "../defaults";

/**
 * LocalStorageからブラシ設定を読み込む
 */
export function loadBrushSettings(): Partial<BrushSettings> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BRUSH_SETTINGS);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    return parsed;
  } catch (error) {
    console.error("Failed to load brush settings from localStorage:", error);
    return {};
  }
}

/**
 * LocalStorageにブラシ設定を保存（即座に実行）
 */
function saveBrushSettingsImmediate(settings: Partial<BrushSettings>): void {
  try {
    // 既存の設定とマージ
    const existing = loadBrushSettings();
    const merged = { ...existing, ...settings };
    localStorage.setItem(STORAGE_KEYS.BRUSH_SETTINGS, JSON.stringify(merged));
  } catch (error) {
    console.error("Failed to save brush settings to localStorage:", error);
  }
}

/**
 * LocalStorageにブラシ設定を保存（debounce付き）
 * 300msの間に複数回呼ばれても、最後の1回だけ実行される
 */
export const saveBrushSettings = debounce(saveBrushSettingsImmediate, 300);

/**
 * ブラシ設定を初期化（デフォルト値に戻す）
 */
export function resetBrushSettings(): typeof DEFAULT_BRUSH_SETTINGS {
  try {
    localStorage.removeItem(STORAGE_KEYS.BRUSH_SETTINGS);
    return { ...DEFAULT_BRUSH_SETTINGS };
  } catch (error) {
    console.error("Failed to reset brush settings:", error);
    return { ...DEFAULT_BRUSH_SETTINGS };
  }
}

/**
 * ブラシ設定の初期値を取得（LocalStorage + デフォルト値）
 */
export function getInitialBrushSettings(): BrushSettings {
  const stored = loadBrushSettings();
  return {
    ...DEFAULT_BRUSH_SETTINGS,
    ...stored,
  };
}
