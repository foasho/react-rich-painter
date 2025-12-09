/**
 * React Rich Painterの完全な状態を表す型定義
 * Import/Export機能で使用されます
 */

/**
 * レイヤー情報
 */
export type LayerState = {
  id: string;
  name: string;
  visible: boolean;
  opacity: number;
  imageData: string; // Base64エンコードされた画像データ（data:image/png;base64,...）
};

/**
 * ブラシ設定
 */
export type BrushState = {
  color: string;
  size: number;
  spacing: number;
  flow: number;
  merge: number;
  minimumSize: number;
  opacity: number;
};

/**
 * キャンバス設定
 */
export type CanvasState = {
  width: number;
  height: number;
};

/**
 * スタビライザー設定
 */
export type StabilizerState = {
  level: number;
  weight: number;
};

/**
 * Painter全体の状態
 */
export type PainterState = {
  version: string; // フォーマットバージョン（将来の互換性のため）
  canvas: CanvasState;
  layers: LayerState[];
  selectedLayerId: string;
  brush: BrushState;
  stabilizer: StabilizerState;
  currentTool: "pen" | "eraser" | "dripper" | "lasso" | "move";
  inputType: "pen" | "mouse" | "touch";
};

/**
 * 現在のフォーマットバージョン
 */
export const PAINTER_STATE_VERSION = "1.0.0";
