import { create } from "zustand";

type CanvasState = {
  width: number;
  height: number;
  backgroundColor: string;
  // キャンバスの表示位置（HandMoveツール用）
  offsetX: number;
  offsetY: number;
  scale: number;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setBackgroundColor: (color: string) => void;
  setOffset: (x: number, y: number) => void;
  setScale: (scale: number) => void;
  resetView: () => void;
};

export const useCanvasStore = create<CanvasState>((set) => ({
  width: 800,
  height: 600,
  backgroundColor: "#ffffff",
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  setWidth: (width: number) => set({ width }),
  setHeight: (height: number) => set({ height }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),
  setScale: (scale) => set({ scale }),
  resetView: () => set({ offsetX: 0, offsetY: 0, scale: 1 }),
}));
