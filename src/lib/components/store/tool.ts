import { create } from "zustand";

// pen: 描画, eraser: 消しゴム, dripper: スポイト, lasso: 投げ縄選択, move: キャンバス移動
export type ToolType = "pen" | "eraser" | "dripper" | "lasso" | "move";

type ToolState = {
  currentTool: ToolType;
  setTool: (tool: ToolType) => void;
};

export const useToolStore = create<ToolState>((set) => ({
  currentTool: "pen",
  setTool: (tool) => set({ currentTool: tool }),
}));
