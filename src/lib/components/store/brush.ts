import { create } from 'zustand';
import { getInitialBrushSettings, saveBrushSettings, resetBrushSettings } from './local-storage';

type BrushBarState = {
  size: number;
  color: string;
  shape: 'round' | 'square' | 'custom';
  customBrushIndex: number | null; // null: なし, 0-4: b0.png~b4.png
  customBrushImages: HTMLImageElement[];
  spacing: number; // ブラシの離散具合 (0.01 ~ 1.0)
  flow: number; // ブラシの不透明度 (0 ~ 1.0)
  merge: number; // マージ値 (0 ~ 1.0)
  minimumSize: number; // 最小サイズ (0.01 ~ 1.0)
  stabilizeLevel: number; // スタビライザーレベル (0 ~ 10)
  stabilizeWeight: number; // スタビライザーウェイト (0 ~ 0.95)
  setSize: (size: number) => void;
  setColor: (color: string) => void;
  setShape: (shape: 'round' | 'square' | 'custom') => void;
  setCustomBrushIndex: (index: number | null) => void;
  setCustomBrushImages: (images: HTMLImageElement[]) => void;
  setSpacing: (spacing: number) => void;
  setFlow: (flow: number) => void;
  setMerge: (merge: number) => void;
  setMinimumSize: (minimumSize: number) => void;
  setStabilizeLevel: (level: number) => void;
  setStabilizeWeight: (weight: number) => void;
  resetToDefaults: () => void;
};

// LocalStorageから初期値を読み込む
const initialSettings = getInitialBrushSettings();

export const useBrushBarStore = create<BrushBarState>((set) => ({
  // 初期値（LocalStorage + デフォルト）
  size: initialSettings.size,
  color: initialSettings.color,
  shape: initialSettings.shape,
  customBrushIndex: initialSettings.customBrushIndex,
  customBrushImages: [],
  spacing: initialSettings.spacing,
  flow: initialSettings.flow,
  merge: initialSettings.merge,
  minimumSize: initialSettings.minimumSize,
  stabilizeLevel: initialSettings.stabilizeLevel,
  stabilizeWeight: initialSettings.stabilizeWeight,

  // Setter（変更時にLocalStorageに保存）
  setSize: (size) => {
    set({ size });
    saveBrushSettings({ size });
  },
  setColor: (color) => {
    set({ color });
    saveBrushSettings({ color });
  },
  setShape: (shape) => {
    set({ shape });
    saveBrushSettings({ shape });
  },
  setCustomBrushIndex: (index) => {
    set({ customBrushIndex: index });
    saveBrushSettings({ customBrushIndex: index });
  },
  setCustomBrushImages: (images) => {
    set({ customBrushImages: images });
    // HTMLImageElementはシリアライズできないので保存しない
  },
  setSpacing: (spacing) => {
    set({ spacing });
    saveBrushSettings({ spacing });
  },
  setFlow: (flow) => {
    set({ flow });
    saveBrushSettings({ flow });
  },
  setMerge: (merge) => {
    set({ merge });
    saveBrushSettings({ merge });
  },
  setMinimumSize: (minimumSize) => {
    set({ minimumSize });
    saveBrushSettings({ minimumSize });
  },
  setStabilizeLevel: (level) => {
    set({ stabilizeLevel: level });
    saveBrushSettings({ stabilizeLevel: level });
  },
  setStabilizeWeight: (weight) => {
    set({ stabilizeWeight: weight });
    saveBrushSettings({ stabilizeWeight: weight });
  },

  // デフォルト値にリセット
  resetToDefaults: () => {
    const defaults = resetBrushSettings();
    set({
      size: defaults.size,
      color: defaults.color,
      shape: defaults.shape,
      customBrushIndex: defaults.customBrushIndex,
      spacing: defaults.spacing,
      flow: defaults.flow,
      merge: defaults.merge,
      minimumSize: defaults.minimumSize,
      stabilizeLevel: defaults.stabilizeLevel,
      stabilizeWeight: defaults.stabilizeWeight,
    });
  },
}));
