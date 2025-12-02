/**
 * リアルタイム共有機能用の型定義
 * share=true の場合にのみ使用されます
 */

/**
 * ブラシ設定（ストローク送信用）
 */
export type StrokeBrushConfig = {
  color: string;
  size: number;
  opacity: number;
  spacing: number;
  flow: number;
  merge: number;
  minimumSize: number;
  toolType: 'pen' | 'eraser';
};

/**
 * ストローク開始データ
 */
export type StrokeStartData = {
  userId: string;
  userName?: string;
  timestamp: number;
  x: number;
  y: number;
  pressure: number;
  brush: StrokeBrushConfig;
  layerIndex: number;
};

/**
 * ストローク移動データ
 */
export type StrokeMoveData = {
  userId: string;
  timestamp: number;
  x: number;
  y: number;
  pressure: number;
};

/**
 * ストローク終了データ
 */
export type StrokeEndData = {
  userId: string;
  timestamp: number;
  x: number;
  y: number;
  pressure: number;
  layerIndex: number;
};

/**
 * リモートユーザーの描画状態
 */
export type RemoteUserState = {
  userId: string;
  userName?: string;
  isDrawing: boolean;
  layerIndex: number;
  lastActivity: number;
};

/**
 * 共有機能コールバック
 */
export type ShareCallbacks = {
  onStrokeStart?: (data: StrokeStartData) => void;
  onStrokeMove?: (data: StrokeMoveData) => void;
  onStrokeEnd?: (data: StrokeEndData) => void;
  onRemoteUserActivity?: (users: RemoteUserState[]) => void;
};

/**
 * 外部からの制御用ハンドル（useImperativeHandle用）
 */
export type PainterHandle = {
  // リモートストロークの適用
  applyRemoteStrokeStart: (data: StrokeStartData) => void;
  applyRemoteStrokeMove: (data: StrokeMoveData) => void;
  applyRemoteStrokeEnd: (data: StrokeEndData) => void;
  
  // 状態のエクスポート/インポート
  exportState: () => import('./PainterState').PainterState | null;
  importState: (state: import('./PainterState').PainterState) => Promise<void>;
  
  // リモートユーザー管理
  getRemoteUsers: () => RemoteUserState[];
  clearRemoteUser: (userId: string) => void;
};

/**
 * P2P通信メッセージ型
 */
export type WhiteboardMessage =
  | { type: 'stroke_start'; data: StrokeStartData }
  | { type: 'stroke_move'; data: StrokeMoveData }
  | { type: 'stroke_end'; data: StrokeEndData }
  | { type: 'sync_request'; userId: string }
  | { type: 'sync_response'; data: import('./PainterState').PainterState }
  | { type: 'user_joined'; userId: string; userName: string }
  | { type: 'user_left'; userId: string };
