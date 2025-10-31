/**
 * デフォルト値のマスタ定義
 * すべてのブラシ設定のデフォルト値をここで管理
 */

// 型定義
export type BrushShape = 'round' | 'square' | 'custom';

export type BrushSettings = {
  // 基本設定
  size: number;
  color: string;
  shape: BrushShape;

  // カスタムブラシ
  customBrushIndex: number | null;

  // 詳細設定
  spacing: number;
  flow: number;
  merge: number;
  minimumSize: number;

  // スタビライザー設定
  stabilizeLevel: number;
  stabilizeWeight: number;
};

export const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
  // 基本設定
  size: 10,
  color: '#474747ff',
  shape: 'round',

  // カスタムブラシ
  customBrushIndex: null,

  // 詳細設定
  spacing: 0.05,
  flow: 1.0,
  merge: 0.2,
  minimumSize: 0.01,

  // スタビライザー設定
  stabilizeLevel: 5,
  stabilizeWeight: 0.5,
};
