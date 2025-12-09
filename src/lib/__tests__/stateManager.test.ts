import { describe, it, expect, beforeEach } from "vitest";
import {
  exportPainterState,
  serializePainterState,
  deserializePainterState,
} from "../utils/stateManager";
import { RichPainter } from "../utils/painter/RichPainter";
import { PAINTER_STATE_VERSION } from "../types/PainterState";
import { useToolStore } from "../components/store/tool";
import { useUiStore } from "../components/store/ui";
import { useLayerNameStore } from "../components/store/layer";

describe("stateManager", () => {
  let painter: RichPainter;

  beforeEach(() => {
    painter = new RichPainter({
      undoLimit: 10,
      initSize: { width: 100, height: 100 },
    });

    // ストアをリセット
    useToolStore.setState({ currentTool: "pen" });
    useUiStore.setState({
      isLayerPanelOpen: false,
      inputType: "pen",
      consecutiveInputCount: 0,
      lastDetectedInputType: null,
    });
    useLayerNameStore.setState({ layerNames: {} });
  });

  describe("exportPainterState", () => {
    it("Painterの状態をエクスポートできる", () => {
      const state = exportPainterState(painter);

      expect(state).toBeDefined();
      expect(state.version).toBe(PAINTER_STATE_VERSION);
    });

    it("キャンバスサイズが正しくエクスポートされる", () => {
      const state = exportPainterState(painter);

      expect(state.canvas.width).toBe(100);
      expect(state.canvas.height).toBe(100);
    });

    it("レイヤー情報が正しくエクスポートされる", () => {
      painter.addLayer();
      painter.addLayer();

      const state = exportPainterState(painter);

      expect(state.layers.length).toBe(3);
      expect(state.layers[0].id).toBe("layer-0");
      expect(state.layers[1].id).toBe("layer-1");
      expect(state.layers[2].id).toBe("layer-2");
    });

    it("レイヤー名が正しくエクスポートされる", () => {
      const { setLayerName } = useLayerNameStore.getState();
      setLayerName(0, "カスタム名");

      const state = exportPainterState(painter);

      expect(state.layers[0].name).toBe("カスタム名");
    });

    it("レイヤーの可視性がエクスポートされる", () => {
      painter.setLayerVisible(false, 0);

      const state = exportPainterState(painter);

      expect(state.layers[0].visible).toBe(false);
    });

    it("レイヤーの不透明度がエクスポートされる", () => {
      painter.setLayerOpacity(0.5, 0);

      const state = exportPainterState(painter);

      expect(state.layers[0].opacity).toBe(0.5);
    });

    it("選択中のレイヤーIDがエクスポートされる", () => {
      painter.addLayer();
      painter.selectLayer(1);

      const state = exportPainterState(painter);

      expect(state.selectedLayerId).toBe("layer-1");
    });

    it("ブラシ設定がエクスポートされる", () => {
      const brush = painter.getBrush()!;
      brush.setColor("#ff0000");
      brush.setSize(20);
      brush.setSpacing(0.1);
      brush.setFlow(0.8);
      brush.setMerge(0.5);
      brush.setMinimumSize(0.2);

      const state = exportPainterState(painter);

      expect(state.brush.color).toBe("#ff0000");
      expect(state.brush.size).toBe(20);
      expect(state.brush.spacing).toBe(0.1);
      expect(state.brush.flow).toBe(0.8);
      expect(state.brush.merge).toBe(0.5);
      expect(state.brush.minimumSize).toBe(0.2);
    });

    it("スタビライザー設定がエクスポートされる", () => {
      painter.setToolStabilizeLevel(5);
      painter.setToolStabilizeWeight(0.7);

      const state = exportPainterState(painter);

      expect(state.stabilizer.level).toBe(5);
      expect(state.stabilizer.weight).toBe(0.7);
    });

    it("現在のツールがエクスポートされる", () => {
      useToolStore.getState().setTool("eraser");

      const state = exportPainterState(painter);

      expect(state.currentTool).toBe("eraser");
    });

    it("入力タイプがエクスポートされる", () => {
      useUiStore.getState().setInputType("touch");

      const state = exportPainterState(painter);

      expect(state.inputType).toBe("touch");
    });

    it("画像データがBase64でエクスポートされる", () => {
      const state = exportPainterState(painter);

      expect(state.layers[0].imageData).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("serializePainterState", () => {
    it("PainterStateをJSON文字列に変換できる", () => {
      const state = exportPainterState(painter);
      const json = serializePainterState(state);

      expect(typeof json).toBe("string");
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("整形されたJSONが出力される", () => {
      const state = exportPainterState(painter);
      const json = serializePainterState(state);

      // indent: 2で整形されているので改行を含む
      expect(json).toContain("\n");
    });
  });

  describe("deserializePainterState", () => {
    it("JSON文字列からPainterStateを復元できる", () => {
      const originalState = exportPainterState(painter);
      const json = serializePainterState(originalState);
      const restoredState = deserializePainterState(json);

      expect(restoredState.version).toBe(originalState.version);
      expect(restoredState.canvas.width).toBe(originalState.canvas.width);
      expect(restoredState.canvas.height).toBe(originalState.canvas.height);
    });

    it("バージョンがない場合はエラー", () => {
      const invalidJson = JSON.stringify({
        canvas: { width: 100, height: 100 },
        layers: [],
      });

      expect(() => deserializePainterState(invalidJson)).toThrow(
        "Invalid painter state: missing version",
      );
    });

    it("不正なJSONでエラー", () => {
      expect(() => deserializePainterState("not valid json")).toThrow(
        "Failed to parse painter state",
      );
    });

    it("レイヤー情報が復元される", () => {
      painter.addLayer();
      const originalState = exportPainterState(painter);
      const json = serializePainterState(originalState);
      const restoredState = deserializePainterState(json);

      expect(restoredState.layers.length).toBe(2);
      expect(restoredState.layers[0].id).toBe("layer-0");
      expect(restoredState.layers[1].id).toBe("layer-1");
    });

    it("ブラシ設定が復元される", () => {
      const brush = painter.getBrush()!;
      brush.setColor("#00ff00");
      brush.setSize(30);

      const originalState = exportPainterState(painter);
      const json = serializePainterState(originalState);
      const restoredState = deserializePainterState(json);

      expect(restoredState.brush.color).toBe("#00ff00");
      expect(restoredState.brush.size).toBe(30);
    });
  });

  describe("エクスポート・インポートの往復", () => {
    it("エクスポートしたデータをシリアライズ・デシリアライズしても情報が保持される", () => {
      // 設定をカスタマイズ
      const brush = painter.getBrush()!;
      brush.setColor("#123456");
      brush.setSize(15);
      painter.setToolStabilizeLevel(3);
      useToolStore.getState().setTool("dripper");
      useUiStore.getState().setInputType("mouse");

      // 往復
      const original = exportPainterState(painter);
      const json = serializePainterState(original);
      const restored = deserializePainterState(json);

      // 検証
      expect(restored.brush.color).toBe("#123456");
      expect(restored.brush.size).toBe(15);
      expect(restored.stabilizer.level).toBe(3);
      expect(restored.currentTool).toBe("dripper");
      expect(restored.inputType).toBe("mouse");
    });

    it("複数レイヤーの状態が保持される", () => {
      painter.addLayer();
      painter.addLayer();
      painter.setLayerOpacity(0.5, 0);
      painter.setLayerVisible(false, 1);
      painter.selectLayer(2);

      const original = exportPainterState(painter);
      const json = serializePainterState(original);
      const restored = deserializePainterState(json);

      expect(restored.layers.length).toBe(3);
      expect(restored.layers[0].opacity).toBe(0.5);
      expect(restored.layers[1].visible).toBe(false);
      expect(restored.selectedLayerId).toBe("layer-2");
    });
  });

  describe("PainterState型の検証", () => {
    it("必須フィールドがすべて存在する", () => {
      const state = exportPainterState(painter);

      expect(state).toHaveProperty("version");
      expect(state).toHaveProperty("canvas");
      expect(state).toHaveProperty("layers");
      expect(state).toHaveProperty("selectedLayerId");
      expect(state).toHaveProperty("brush");
      expect(state).toHaveProperty("stabilizer");
      expect(state).toHaveProperty("currentTool");
      expect(state).toHaveProperty("inputType");
    });

    it("canvasオブジェクトの構造が正しい", () => {
      const state = exportPainterState(painter);

      expect(state.canvas).toHaveProperty("width");
      expect(state.canvas).toHaveProperty("height");
      expect(typeof state.canvas.width).toBe("number");
      expect(typeof state.canvas.height).toBe("number");
    });

    it("brushオブジェクトの構造が正しい", () => {
      const state = exportPainterState(painter);

      expect(state.brush).toHaveProperty("color");
      expect(state.brush).toHaveProperty("size");
      expect(state.brush).toHaveProperty("spacing");
      expect(state.brush).toHaveProperty("flow");
      expect(state.brush).toHaveProperty("merge");
      expect(state.brush).toHaveProperty("minimumSize");
      expect(state.brush).toHaveProperty("opacity");
    });

    it("stabilizerオブジェクトの構造が正しい", () => {
      const state = exportPainterState(painter);

      expect(state.stabilizer).toHaveProperty("level");
      expect(state.stabilizer).toHaveProperty("weight");
    });

    it("layerオブジェクトの構造が正しい", () => {
      const state = exportPainterState(painter);
      const layer = state.layers[0];

      expect(layer).toHaveProperty("id");
      expect(layer).toHaveProperty("name");
      expect(layer).toHaveProperty("visible");
      expect(layer).toHaveProperty("opacity");
      expect(layer).toHaveProperty("imageData");
    });
  });
});
