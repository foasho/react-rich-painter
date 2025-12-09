import { create } from "zustand";

type Point = { x: number; y: number };

type SelectionState = {
  // 選択パス（投げ縄の軌跡）
  selectionPath: Point[];

  // 選択中かどうか
  isSelecting: boolean;

  // 選択範囲が確定しているか
  hasSelection: boolean;

  // 選択された画像データ
  selectedImageData: ImageData | null;

  // 選択範囲のオフセット位置
  selectionOffset: { x: number; y: number };

  // 選択範囲を移動中かどうか
  isMovingSelection: boolean;

  // 選択開始
  startSelection: () => void;

  // パスに点を追加
  addPoint: (point: Point) => void;

  // 選択を確定
  finishSelection: () => void;

  // 選択をクリア
  clearSelection: () => void;

  // 選択範囲の移動開始
  startMoving: () => void;

  // 選択範囲の移動終了
  stopMoving: () => void;

  // 選択範囲のオフセット更新
  updateOffset: (x: number, y: number) => void;

  // 選択画像データを設定
  setImageData: (imageData: ImageData | null) => void;
};

export const useSelectionStore = create<SelectionState>((set) => ({
  selectionPath: [],
  isSelecting: false,
  hasSelection: false,
  selectedImageData: null,
  selectionOffset: { x: 0, y: 0 },
  isMovingSelection: false,

  startSelection: () =>
    set({
      isSelecting: true,
      hasSelection: false,
      selectionPath: [],
      selectedImageData: null,
    }),

  addPoint: (point) =>
    set((state) => ({
      selectionPath: [...state.selectionPath, point],
    })),

  finishSelection: () =>
    set({
      isSelecting: false,
      hasSelection: true,
    }),

  clearSelection: () =>
    set({
      selectionPath: [],
      isSelecting: false,
      hasSelection: false,
      selectedImageData: null,
      selectionOffset: { x: 0, y: 0 },
      isMovingSelection: false,
    }),

  startMoving: () => set({ isMovingSelection: true }),

  stopMoving: () => set({ isMovingSelection: false }),

  updateOffset: (x, y) => set({ selectionOffset: { x, y } }),

  setImageData: (imageData) => set({ selectedImageData: imageData }),
}));
