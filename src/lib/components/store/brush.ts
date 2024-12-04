import { create } from 'zustand';

type BrushBarState = {
  size: number;
  color: string;
  shape: 'round' | 'square' | 'custom';
  setSize: (size: number) => void;
  setColor: (color: string) => void;
  setShape: (shape: 'round' | 'square' | 'custom') => void;
};

export const useBrushBarStore = create<BrushBarState>((set) => ({
  size: 10,
  color: '#1c1314',
  shape: 'round',
  setSize: (size) => set({ size }),
  setColor: (color) => set({ color }),
  setShape: (shape) => set({ shape }),
}));
