import { create } from "zustand";

// PointerEvent.pointerTypeに合わせた入力タイプ
export type InputType = "pen" | "mouse" | "touch";

type UiState = {
  isLayerPanelOpen: boolean;
  toggleLayerPanel: () => void;
  setLayerPanelOpen: (open: boolean) => void;
  inputType: InputType;
  setInputType: (type: InputType) => void;
  // 自動入力切り替え用のトラッキング
  consecutiveInputCount: number;
  lastDetectedInputType: InputType | null;
  incrementConsecutiveInput: (type: InputType) => void;
  resetConsecutiveInput: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  isLayerPanelOpen: false,
  toggleLayerPanel: () =>
    set((state) => ({ isLayerPanelOpen: !state.isLayerPanelOpen })),
  setLayerPanelOpen: (open) => set({ isLayerPanelOpen: open }),
  inputType: "pen", // デフォルトはペン
  setInputType: (type) => set({ inputType: type }),
  // 自動入力切り替え用のトラッキング
  consecutiveInputCount: 0,
  lastDetectedInputType: null,
  incrementConsecutiveInput: (type) =>
    set((state) => {
      // 同じタイプの連続入力をカウント
      if (state.lastDetectedInputType === type) {
        return {
          consecutiveInputCount: state.consecutiveInputCount + 1,
          lastDetectedInputType: type,
        };
      } else {
        // 異なるタイプの場合はリセット
        return {
          consecutiveInputCount: 1,
          lastDetectedInputType: type,
        };
      }
    }),
  resetConsecutiveInput: () =>
    set({ consecutiveInputCount: 0, lastDetectedInputType: null }),
}));
