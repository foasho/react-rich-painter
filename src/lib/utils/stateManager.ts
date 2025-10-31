import { RichPainter } from './painter/RichPainter';
import { PainterState, PAINTER_STATE_VERSION, LayerState } from '../types/PainterState';
import { useLayerNameStore } from '../components/store/layer';
import { useToolStore } from '../components/store/tool';
import { useUiStore } from '../components/store/ui';
import { useBrushBarStore } from '../components/store/brush';

/**
 * RichPainterインスタンスから現在の状態を抽出してPainterStateオブジェクトを生成
 */
export const exportPainterState = (painter: RichPainter): PainterState => {
  const brush = painter.getBrush();
  const layerNameStore = useLayerNameStore.getState();
  const toolStore = useToolStore.getState();
  const uiStore = useUiStore.getState();
  const brushBarStore = useBrushBarStore.getState();

  // キャンバスサイズを取得
  const canvasSize = painter.getCanvasSize();

  // レイヤー情報を抽出
  const layerCount = painter.getLayerCount();
  const layers: LayerState[] = [];

  for (let i = 0; i < layerCount; i++) {
    const layerCanvas = painter.getLayerCanvas(i);
    const imageData = layerCanvas.toDataURL('image/png'); // Base64エンコード

    layers.push({
      id: `layer-${i}`,
      name: layerNameStore.getLayerName(i),
      visible: painter.getLayerVisible(i),
      opacity: painter.getLayerOpacity(i),
      imageData,
    });
  }

  // ブラシ設定を抽出
  if (!brush) {
    throw new Error('Brush is not initialized');
  }

  const brushState = {
    color: brush.getColor(),
    size: brush.getSize(),
    spacing: brush.getSpacing(),
    flow: brush.getFlow(),
    merge: brush.getMerge(),
    minimumSize: brush.getMinimumSize(),
    opacity: brush.getFlow(), // flowが不透明度に相当
  };

  // スタビライザー設定を抽出
  const stabilizerState = {
    level: painter.getToolStabilizeLevel(),
    weight: painter.getToolStabilizeWeight(),
  };

  // 全体の状態オブジェクトを構築
  const state: PainterState = {
    version: PAINTER_STATE_VERSION,
    canvas: {
      width: canvasSize.width,
      height: canvasSize.height,
    },
    layers,
    selectedLayerId: `layer-${painter.getCurrentLayerIndex()}`,
    brush: brushState,
    stabilizer: stabilizerState,
    currentTool: toolStore.currentTool,
    inputType: uiStore.inputType,
  };

  return state;
};

/**
 * PainterStateオブジェクトからRichPainterインスタンスと各種Storeを復元
 */
export const importPainterState = async (
  painter: RichPainter,
  state: PainterState
): Promise<void> => {
  const layerNameStore = useLayerNameStore.getState();
  const toolStore = useToolStore.getState();
  const uiStore = useUiStore.getState();
  const brushBarStore = useBrushBarStore.getState();
  const brush = painter.getBrush();

  // History lockして余計なUndo履歴を作らない
  painter.lockHistory();

  try {
    // キャンバスサイズを設定
    painter.setCanvasSize(state.canvas.width, state.canvas.height);

    // 既存のレイヤーをすべて削除（最初の1つは残る）
    const currentLayerCount = painter.getLayerCount();
    for (let i = currentLayerCount - 1; i > 0; i--) {
      painter.removeLayer(i);
    }

    // レイヤーを復元
    for (let i = 0; i < state.layers.length; i++) {
      const layerState = state.layers[i];

      // 最初のレイヤー以外は新規作成
      if (i > 0) {
        painter.addLayer();
      }

      // レイヤー名を設定
      layerNameStore.setLayerName(i, layerState.name);

      // レイヤーの可視性と不透明度を設定
      painter.setLayerVisible(layerState.visible, i);
      painter.setLayerOpacity(layerState.opacity, i);

      // 画像データを復元
      await loadImageDataToLayer(painter, i, layerState.imageData);
    }

    // 選択中のレイヤーを復元
    const selectedLayerIndex = parseInt(state.selectedLayerId.replace('layer-', ''));
    if (!isNaN(selectedLayerIndex) && selectedLayerIndex < state.layers.length) {
      painter.selectLayer(selectedLayerIndex);
    }

    // ブラシ設定を復元
    if (!brush) {
      throw new Error('Brush is not initialized');
    }

    brush.setColor(state.brush.color);
    brush.setSize(state.brush.size);
    brush.setSpacing(state.brush.spacing);
    brush.setFlow(state.brush.flow);
    brush.setMerge(state.brush.merge);
    brush.setMinimumSize(state.brush.minimumSize);
    brushBarStore.setFlow(state.brush.opacity); // opacityをflowとして復元

    // スタビライザー設定を復元
    painter.setToolStabilizeLevel(state.stabilizer.level);
    painter.setToolStabilizeWeight(state.stabilizer.weight);

    // ツールとUI状態を復元
    toolStore.setTool(state.currentTool);
    uiStore.setInputType(state.inputType);
  } finally {
    // History unlockを必ず実行
    painter.unlockHistory();
  }
};

/**
 * Base64エンコードされた画像データをレイヤーに読み込む
 */
const loadImageDataToLayer = (
  painter: RichPainter,
  layerIndex: number,
  imageDataUrl: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const context = painter.getLayerContext(layerIndex);
      context.clearRect(0, 0, painter.getCanvasSize().width, painter.getCanvasSize().height);
      context.drawImage(img, 0, 0);
      resolve();
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image data for layer ${layerIndex}`));
    };

    img.src = imageDataUrl;
  });
};

/**
 * PainterStateオブジェクトをJSON文字列に変換
 */
export const serializePainterState = (state: PainterState): string => {
  return JSON.stringify(state, null, 2);
};

/**
 * JSON文字列からPainterStateオブジェクトをパース
 */
export const deserializePainterState = (json: string): PainterState => {
  try {
    const state = JSON.parse(json) as PainterState;

    // バージョンチェック（将来的な互換性のため）
    if (!state.version) {
      throw new Error('Invalid painter state: missing version');
    }

    return state;
  } catch (error) {
    throw new Error(`Failed to parse painter state: ${error}`);
  }
};
