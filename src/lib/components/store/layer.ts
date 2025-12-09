import { create } from "zustand";

type LayerNameState = {
  layerNames: { [index: number]: string };
  getLayerName: (index: number) => string;
  setLayerName: (index: number, name: string) => void;
  addLayerName: (index: number, name?: string) => void;
  removeLayerName: (index: number) => void;
  swapLayerNames: (indexA: number, indexB: number) => void;
  shiftLayerNamesAfterRemove: (removedIndex: number) => void;
};

export const useLayerNameStore = create<LayerNameState>((set, get) => ({
  layerNames: {},

  getLayerName: (index: number) => {
    const names = get().layerNames;
    return names[index] || `レイヤー ${index + 1}`;
  },

  setLayerName: (index: number, name: string) => {
    set((state) => ({
      layerNames: { ...state.layerNames, [index]: name },
    }));
  },

  addLayerName: (index: number, name?: string) => {
    set((state) => ({
      layerNames: {
        ...state.layerNames,
        [index]: name || `レイヤー ${index + 1}`,
      },
    }));
  },

  removeLayerName: (index: number) => {
    set((state) => {
      const newNames = { ...state.layerNames };
      delete newNames[index];
      return { layerNames: newNames };
    });
  },

  swapLayerNames: (indexA: number, indexB: number) => {
    set((state) => {
      const newNames = { ...state.layerNames };
      const tempName = newNames[indexA] || `レイヤー ${indexA + 1}`;
      newNames[indexA] = newNames[indexB] || `レイヤー ${indexB + 1}`;
      newNames[indexB] = tempName;
      return { layerNames: newNames };
    });
  },

  shiftLayerNamesAfterRemove: (removedIndex: number) => {
    set((state) => {
      const newNames: { [index: number]: string } = {};
      Object.keys(state.layerNames).forEach((key) => {
        const index = parseInt(key);
        if (index < removedIndex) {
          newNames[index] = state.layerNames[index];
        } else if (index > removedIndex) {
          newNames[index - 1] = state.layerNames[index];
        }
      });
      return { layerNames: newNames };
    });
  },
}));
