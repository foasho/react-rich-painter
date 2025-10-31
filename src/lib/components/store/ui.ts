import { create } from 'zustand';

// PointerEvent.pointerTypeに合わせた入力タイプ
export type InputType = 'pen' | 'mouse' | 'touch';

type UiState = {
  isLayerPanelOpen: boolean;
  toggleLayerPanel: () => void;
  setLayerPanelOpen: (open: boolean) => void;
  inputType: InputType;
  setInputType: (type: InputType) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isLayerPanelOpen: false,
  toggleLayerPanel: () => set((state) => ({ isLayerPanelOpen: !state.isLayerPanelOpen })),
  setLayerPanelOpen: (open) => set({ isLayerPanelOpen: open }),
  inputType: 'pen', // デフォルトはペン
  setInputType: (type) => set({ inputType: type }),
}));
