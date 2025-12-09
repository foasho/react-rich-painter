import { describe, it, expect, beforeEach } from "vitest";
import { useToolStore } from "../components/store/tool";
import { useLayerNameStore } from "../components/store/layer";
import { useUiStore } from "../components/store/ui";

describe("Zustand Stores", () => {
  describe("useToolStore", () => {
    beforeEach(() => {
      // ストアをリセット
      useToolStore.setState({ currentTool: "pen" });
    });

    it("初期状態はpen", () => {
      const state = useToolStore.getState();
      expect(state.currentTool).toBe("pen");
    });

    it("ツールを変更できる", () => {
      const { setTool } = useToolStore.getState();

      setTool("eraser");
      expect(useToolStore.getState().currentTool).toBe("eraser");

      setTool("dripper");
      expect(useToolStore.getState().currentTool).toBe("dripper");

      setTool("lasso");
      expect(useToolStore.getState().currentTool).toBe("lasso");

      setTool("move");
      expect(useToolStore.getState().currentTool).toBe("move");

      setTool("pen");
      expect(useToolStore.getState().currentTool).toBe("pen");
    });
  });

  describe("useLayerNameStore", () => {
    beforeEach(() => {
      // ストアをリセット
      useLayerNameStore.setState({ layerNames: {} });
    });

    describe("getLayerName", () => {
      it("未設定のインデックスはデフォルト名を返す", () => {
        const { getLayerName } = useLayerNameStore.getState();

        expect(getLayerName(0)).toBe("レイヤー 1");
        expect(getLayerName(1)).toBe("レイヤー 2");
        expect(getLayerName(5)).toBe("レイヤー 6");
      });

      it("設定済みのインデックスは設定名を返す", () => {
        const { setLayerName, getLayerName } = useLayerNameStore.getState();

        setLayerName(0, "カスタム名");
        expect(getLayerName(0)).toBe("カスタム名");
      });
    });

    describe("setLayerName", () => {
      it("レイヤー名を設定できる", () => {
        const { setLayerName, getLayerName } = useLayerNameStore.getState();

        setLayerName(0, "背景");
        expect(getLayerName(0)).toBe("背景");

        setLayerName(1, "線画");
        expect(getLayerName(1)).toBe("線画");
      });

      it("既存の名前を上書きできる", () => {
        const { setLayerName, getLayerName } = useLayerNameStore.getState();

        setLayerName(0, "名前1");
        setLayerName(0, "名前2");
        expect(getLayerName(0)).toBe("名前2");
      });
    });

    describe("addLayerName", () => {
      it("名前を指定して追加できる", () => {
        const { addLayerName, getLayerName } = useLayerNameStore.getState();

        addLayerName(0, "カスタム名");
        expect(getLayerName(0)).toBe("カスタム名");
      });

      it("名前を省略するとデフォルト名になる", () => {
        const { addLayerName, getLayerName } = useLayerNameStore.getState();

        addLayerName(2);
        expect(getLayerName(2)).toBe("レイヤー 3");
      });
    });

    describe("removeLayerName", () => {
      it("レイヤー名を削除できる", () => {
        const { setLayerName, removeLayerName, getLayerName } =
          useLayerNameStore.getState();

        setLayerName(0, "カスタム名");
        expect(getLayerName(0)).toBe("カスタム名");

        removeLayerName(0);
        expect(getLayerName(0)).toBe("レイヤー 1");
      });
    });

    describe("swapLayerNames", () => {
      it("レイヤー名を入れ替えできる", () => {
        const { setLayerName, swapLayerNames, getLayerName } =
          useLayerNameStore.getState();

        setLayerName(0, "名前A");
        setLayerName(1, "名前B");

        swapLayerNames(0, 1);

        expect(getLayerName(0)).toBe("名前B");
        expect(getLayerName(1)).toBe("名前A");
      });

      it("未設定のレイヤー名も正しく入れ替える", () => {
        const { setLayerName, swapLayerNames, getLayerName } =
          useLayerNameStore.getState();

        setLayerName(0, "名前A");
        // index 1 は未設定（デフォルト名）

        swapLayerNames(0, 1);

        expect(getLayerName(0)).toBe("レイヤー 2");
        expect(getLayerName(1)).toBe("名前A");
      });
    });

    describe("shiftLayerNamesAfterRemove", () => {
      it("削除後のインデックスをシフトする", () => {
        const { setLayerName, shiftLayerNamesAfterRemove, getLayerName } =
          useLayerNameStore.getState();

        setLayerName(0, "名前0");
        setLayerName(1, "名前1");
        setLayerName(2, "名前2");
        setLayerName(3, "名前3");

        // インデックス1を削除したと仮定
        shiftLayerNamesAfterRemove(1);

        expect(getLayerName(0)).toBe("名前0");
        expect(getLayerName(1)).toBe("名前2");
        expect(getLayerName(2)).toBe("名前3");
      });

      it("先頭を削除した場合", () => {
        const { setLayerName, shiftLayerNamesAfterRemove, getLayerName } =
          useLayerNameStore.getState();

        setLayerName(0, "名前0");
        setLayerName(1, "名前1");
        setLayerName(2, "名前2");

        shiftLayerNamesAfterRemove(0);

        expect(getLayerName(0)).toBe("名前1");
        expect(getLayerName(1)).toBe("名前2");
      });

      it("末尾を削除した場合はシフトなし", () => {
        const { setLayerName, shiftLayerNamesAfterRemove, getLayerName } =
          useLayerNameStore.getState();

        setLayerName(0, "名前0");
        setLayerName(1, "名前1");
        setLayerName(2, "名前2");

        shiftLayerNamesAfterRemove(2);

        expect(getLayerName(0)).toBe("名前0");
        expect(getLayerName(1)).toBe("名前1");
      });
    });
  });

  describe("useUiStore", () => {
    beforeEach(() => {
      // ストアをリセット
      useUiStore.setState({
        isLayerPanelOpen: false,
        inputType: "pen",
        consecutiveInputCount: 0,
        lastDetectedInputType: null,
      });
    });

    describe("Layer Panel", () => {
      it("初期状態は閉じている", () => {
        const state = useUiStore.getState();
        expect(state.isLayerPanelOpen).toBe(false);
      });

      it("toggleLayerPanelで開閉を切り替えられる", () => {
        const { toggleLayerPanel } = useUiStore.getState();

        toggleLayerPanel();
        expect(useUiStore.getState().isLayerPanelOpen).toBe(true);

        toggleLayerPanel();
        expect(useUiStore.getState().isLayerPanelOpen).toBe(false);
      });

      it("setLayerPanelOpenで直接設定できる", () => {
        const { setLayerPanelOpen } = useUiStore.getState();

        setLayerPanelOpen(true);
        expect(useUiStore.getState().isLayerPanelOpen).toBe(true);

        setLayerPanelOpen(false);
        expect(useUiStore.getState().isLayerPanelOpen).toBe(false);
      });
    });

    describe("Input Type", () => {
      it("初期状態はpen", () => {
        const state = useUiStore.getState();
        expect(state.inputType).toBe("pen");
      });

      it("入力タイプを変更できる", () => {
        const { setInputType } = useUiStore.getState();

        setInputType("mouse");
        expect(useUiStore.getState().inputType).toBe("mouse");

        setInputType("touch");
        expect(useUiStore.getState().inputType).toBe("touch");

        setInputType("pen");
        expect(useUiStore.getState().inputType).toBe("pen");
      });
    });

    describe("自動入力切り替えトラッキング", () => {
      it("初期状態", () => {
        const state = useUiStore.getState();
        expect(state.consecutiveInputCount).toBe(0);
        expect(state.lastDetectedInputType).toBeNull();
      });

      it("同じ入力タイプでカウントが増加する", () => {
        const { incrementConsecutiveInput } = useUiStore.getState();

        incrementConsecutiveInput("mouse");
        expect(useUiStore.getState().consecutiveInputCount).toBe(1);
        expect(useUiStore.getState().lastDetectedInputType).toBe("mouse");

        incrementConsecutiveInput("mouse");
        expect(useUiStore.getState().consecutiveInputCount).toBe(2);

        incrementConsecutiveInput("mouse");
        expect(useUiStore.getState().consecutiveInputCount).toBe(3);
      });

      it("異なる入力タイプでカウントがリセットされる", () => {
        const { incrementConsecutiveInput } = useUiStore.getState();

        incrementConsecutiveInput("mouse");
        incrementConsecutiveInput("mouse");
        incrementConsecutiveInput("mouse");
        expect(useUiStore.getState().consecutiveInputCount).toBe(3);

        incrementConsecutiveInput("touch");
        expect(useUiStore.getState().consecutiveInputCount).toBe(1);
        expect(useUiStore.getState().lastDetectedInputType).toBe("touch");
      });

      it("resetConsecutiveInputでリセットできる", () => {
        const { incrementConsecutiveInput, resetConsecutiveInput } =
          useUiStore.getState();

        incrementConsecutiveInput("mouse");
        incrementConsecutiveInput("mouse");
        incrementConsecutiveInput("mouse");

        resetConsecutiveInput();

        expect(useUiStore.getState().consecutiveInputCount).toBe(0);
        expect(useUiStore.getState().lastDetectedInputType).toBeNull();
      });

      it("AUTO_SWITCH_THRESHOLD(7)に達するまでカウントできる", () => {
        const { incrementConsecutiveInput } = useUiStore.getState();

        for (let i = 0; i < 7; i++) {
          incrementConsecutiveInput("touch");
        }

        expect(useUiStore.getState().consecutiveInputCount).toBe(7);
      });
    });
  });
});
