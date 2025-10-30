import { create } from 'zustand';

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
};

export const useBrushBarStore = create<BrushBarState>((set) => ({
  size: 10,
  color: '#1c1314',
  shape: 'round',
  customBrushIndex: null,
  customBrushImages: [],
  spacing: 0.05,
  flow: 1.0,
  merge: 0.2,
  minimumSize: 0.01,
  stabilizeLevel: 5,
  stabilizeWeight: 0.5,
  setSize: (size) => set({ size }),
  setColor: (color) => set({ color }),
  setShape: (shape) => set({ shape }),
  setCustomBrushIndex: (index) => set({ customBrushIndex: index }),
  setCustomBrushImages: (images) => set({ customBrushImages: images }),
  setSpacing: (spacing) => set({ spacing }),
  setFlow: (flow) => set({ flow }),
  setMerge: (merge) => set({ merge }),
  setMinimumSize: (minimumSize) => set({ minimumSize }),
  setStabilizeLevel: (level) => set({ stabilizeLevel: level }),
  setStabilizeWeight: (weight) => set({ stabilizeWeight: weight }),
}));
