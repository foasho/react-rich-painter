import { create } from 'zustand';

type UiState = {
  isLayerPanelOpen: boolean;
  toggleLayerPanel: () => void;
  setLayerPanelOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isLayerPanelOpen: false,
  toggleLayerPanel: () => set((state) => ({ isLayerPanelOpen: !state.isLayerPanelOpen })),
  setLayerPanelOpen: (open) => set({ isLayerPanelOpen: open }),
}));
