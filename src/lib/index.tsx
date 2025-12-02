
export { ReactRichPainter } from "./components";

// Import/Export機能の型とユーティリティをエクスポート
export type {
  PainterState,
  LayerState,
  BrushState,
  CanvasState,
  StabilizerState,
} from "./types/PainterState";

// 共有機能の型をエクスポート
export type {
  StrokeStartData,
  StrokeMoveData,
  StrokeEndData,
  RemoteUserState,
  PainterHandle,
  ShareCallbacks,
} from "./types/ShareTypes";

export {
  exportPainterState,
  importPainterState,
  serializePainterState,
  deserializePainterState,
} from "./utils/stateManager";
