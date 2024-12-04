import { create } from 'zustand';

type CanvasState = {
  width: number;
  height: number;
  backgroundColor: string;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setBackgroundColor: (color: string) => void;
};

export const useCanvasStore = create<CanvasState>((set) => ({
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  setWidth: (width: number) => set({ width }),
  setHeight: (height: number) => set({ height }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
}));
