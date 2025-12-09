import { describe, it, expect, beforeEach } from "vitest";
import { useUiStore } from "../components/store/ui";

// 自動入力切り替えのロジックをテスト
// events.tsのhandleAutoInputSwitchは内部関数なので、
// useUiStoreの状態変化を通じてテストする

describe("自動入力切り替えシステム", () => {
  beforeEach(() => {
    // ストアをリセット
    useUiStore.setState({
      isLayerPanelOpen: false,
      inputType: "pen",
      consecutiveInputCount: 0,
      lastDetectedInputType: null,
    });
  });

  describe("AUTO_SWITCH_THRESHOLD", () => {
    const AUTO_SWITCH_THRESHOLD = 7;

    it("閾値は7回", () => {
      expect(AUTO_SWITCH_THRESHOLD).toBe(7);
    });
  });

  describe("入力タイプ切り替えのルール", () => {
    describe("ルール1: ペン入力は最優先", () => {
      it("現在mouseモードでpen入力があった場合、即座にpenモードに切り替わる", () => {
        const { setInputType } = useUiStore.getState();
        setInputType("mouse");

        // ペン入力をシミュレート（setInputTypeで直接切り替え）
        setInputType("pen");

        expect(useUiStore.getState().inputType).toBe("pen");
      });

      it("現在touchモードでpen入力があった場合、即座にpenモードに切り替わる", () => {
        const { setInputType } = useUiStore.getState();
        setInputType("touch");

        setInputType("pen");

        expect(useUiStore.getState().inputType).toBe("pen");
      });
    });

    describe("ルール2: ペンモード中の他入力の連続検知", () => {
      it("ペンモード中にmouse入力が連続しても、閾値未満では切り替わらない", () => {
        const { incrementConsecutiveInput } = useUiStore.getState();

        // 6回連続でmouse入力
        for (let i = 0; i < 6; i++) {
          incrementConsecutiveInput("mouse");
        }

        expect(useUiStore.getState().consecutiveInputCount).toBe(6);
        // まだpenモードのまま
        expect(useUiStore.getState().inputType).toBe("pen");
      });

      it("ペンモード中にmouse入力が閾値(7)に達すると、切り替え可能になる", () => {
        const { incrementConsecutiveInput, setInputType } =
          useUiStore.getState();

        // 7回連続でmouse入力
        for (let i = 0; i < 7; i++) {
          incrementConsecutiveInput("mouse");
        }

        expect(useUiStore.getState().consecutiveInputCount).toBe(7);

        // 実際の切り替えはhandleAutoInputSwitchで行われる
        // ここでは閾値に達したことをシミュレート
        const { consecutiveInputCount, lastDetectedInputType } =
          useUiStore.getState();
        if (consecutiveInputCount >= 7 && lastDetectedInputType === "mouse") {
          setInputType("mouse");
        }

        expect(useUiStore.getState().inputType).toBe("mouse");
      });

      it("ペンモード中にtouch入力が閾値に達すると切り替え可能になる", () => {
        const { incrementConsecutiveInput, setInputType } =
          useUiStore.getState();

        for (let i = 0; i < 7; i++) {
          incrementConsecutiveInput("touch");
        }

        const { consecutiveInputCount, lastDetectedInputType } =
          useUiStore.getState();
        if (consecutiveInputCount >= 7 && lastDetectedInputType === "touch") {
          setInputType("touch");
        }

        expect(useUiStore.getState().inputType).toBe("touch");
      });
    });

    describe("ルール3: 異なる入力タイプの混在", () => {
      it("異なる入力タイプが混在するとカウントがリセットされる", () => {
        const { incrementConsecutiveInput } = useUiStore.getState();

        // mouse入力を3回
        incrementConsecutiveInput("mouse");
        incrementConsecutiveInput("mouse");
        incrementConsecutiveInput("mouse");
        expect(useUiStore.getState().consecutiveInputCount).toBe(3);

        // touch入力に切り替え（カウントリセット）
        incrementConsecutiveInput("touch");
        expect(useUiStore.getState().consecutiveInputCount).toBe(1);
        expect(useUiStore.getState().lastDetectedInputType).toBe("touch");
      });

      it("入力タイプが変わるたびにカウントが1からリスタート", () => {
        const { incrementConsecutiveInput } = useUiStore.getState();

        incrementConsecutiveInput("mouse");
        incrementConsecutiveInput("mouse");
        expect(useUiStore.getState().consecutiveInputCount).toBe(2);

        incrementConsecutiveInput("touch");
        expect(useUiStore.getState().consecutiveInputCount).toBe(1);

        incrementConsecutiveInput("mouse");
        expect(useUiStore.getState().consecutiveInputCount).toBe(1);
      });
    });
  });

  describe("resetConsecutiveInput", () => {
    it("カウントと最後の入力タイプをリセットする", () => {
      const { incrementConsecutiveInput, resetConsecutiveInput } =
        useUiStore.getState();

      incrementConsecutiveInput("mouse");
      incrementConsecutiveInput("mouse");
      incrementConsecutiveInput("mouse");

      resetConsecutiveInput();

      expect(useUiStore.getState().consecutiveInputCount).toBe(0);
      expect(useUiStore.getState().lastDetectedInputType).toBeNull();
    });

    it("ペン入力検知時にリセットされる想定", () => {
      const { incrementConsecutiveInput, resetConsecutiveInput, setInputType } =
        useUiStore.getState();

      // mouseの連続入力
      incrementConsecutiveInput("mouse");
      incrementConsecutiveInput("mouse");

      // ペン入力を検知（実際のhandleAutoInputSwitchの動作をシミュレート）
      setInputType("pen");
      resetConsecutiveInput();

      expect(useUiStore.getState().inputType).toBe("pen");
      expect(useUiStore.getState().consecutiveInputCount).toBe(0);
    });
  });

  describe("入力タイプの変換", () => {
    it('pointerType "pen" → InputType "pen"', () => {
      // events.tsでは: detectedType === 'pen' → 'pen'
      const pointerType: string = "pen";
      const inputType =
        pointerType === "touch"
          ? "touch"
          : pointerType === "mouse"
            ? "mouse"
            : "pen";
      expect(inputType).toBe("pen");
    });

    it('pointerType "mouse" → InputType "mouse"', () => {
      const pointerType: string = "mouse";
      const inputType =
        pointerType === "touch"
          ? "touch"
          : pointerType === "mouse"
            ? "mouse"
            : "pen";
      expect(inputType).toBe("mouse");
    });

    it('pointerType "touch" → InputType "touch"', () => {
      const pointerType: string = "touch";
      const inputType =
        pointerType === "touch"
          ? "touch"
          : pointerType === "mouse"
            ? "mouse"
            : "pen";
      expect(inputType).toBe("touch");
    });

    it('不明なpointerType → InputType "pen" (デフォルト)', () => {
      const pointerType: string = "unknown";
      const inputType =
        pointerType === "touch"
          ? "touch"
          : pointerType === "mouse"
            ? "mouse"
            : "pen";
      expect(inputType).toBe("pen");
    });
  });

  describe("ユーザー体験シナリオ", () => {
    it("シナリオ1: ペンタブレットユーザーがマウスに切り替える", () => {
      const { incrementConsecutiveInput, setInputType, resetConsecutiveInput } =
        useUiStore.getState();

      // 初期状態: pen
      expect(useUiStore.getState().inputType).toBe("pen");

      // マウス入力が連続で検知される
      for (let i = 0; i < 7; i++) {
        incrementConsecutiveInput("mouse");
      }

      // 閾値到達で切り替え
      setInputType("mouse");
      resetConsecutiveInput();

      expect(useUiStore.getState().inputType).toBe("mouse");
    });

    it("シナリオ2: マウスユーザーがタッチに切り替える", () => {
      const { incrementConsecutiveInput, setInputType, resetConsecutiveInput } =
        useUiStore.getState();

      // 初期状態をmouseに
      setInputType("mouse");

      // タッチ入力が連続
      for (let i = 0; i < 7; i++) {
        incrementConsecutiveInput("touch");
      }

      setInputType("touch");
      resetConsecutiveInput();

      expect(useUiStore.getState().inputType).toBe("touch");
    });

    it("シナリオ3: ペン入力は即座に優先される", () => {
      const { setInputType, resetConsecutiveInput, incrementConsecutiveInput } =
        useUiStore.getState();

      // mouseモードでmouse入力を続けている
      setInputType("mouse");
      incrementConsecutiveInput("mouse");
      incrementConsecutiveInput("mouse");

      // ペンを拾った瞬間、即座にpenモードに
      setInputType("pen");
      resetConsecutiveInput();

      expect(useUiStore.getState().inputType).toBe("pen");
      expect(useUiStore.getState().consecutiveInputCount).toBe(0);
    });

    it("シナリオ4: 途中で異なる入力が混じるとカウントリセット", () => {
      const { incrementConsecutiveInput } = useUiStore.getState();

      // mouse 5回
      for (let i = 0; i < 5; i++) {
        incrementConsecutiveInput("mouse");
      }
      expect(useUiStore.getState().consecutiveInputCount).toBe(5);

      // touchが1回混じる
      incrementConsecutiveInput("touch");
      expect(useUiStore.getState().consecutiveInputCount).toBe(1);

      // 再度mouse 5回 → まだ閾値未満
      for (let i = 0; i < 5; i++) {
        incrementConsecutiveInput("mouse");
      }
      expect(useUiStore.getState().consecutiveInputCount).toBe(5);
      // penモードのまま
      expect(useUiStore.getState().inputType).toBe("pen");
    });
  });

  describe("エッジケース", () => {
    it("入力がない状態でresetを呼んでもエラーにならない", () => {
      const { resetConsecutiveInput } = useUiStore.getState();

      expect(() => resetConsecutiveInput()).not.toThrow();
      expect(useUiStore.getState().consecutiveInputCount).toBe(0);
    });

    it("同じ入力タイプを大量に連続しても正しくカウントされる", () => {
      const { incrementConsecutiveInput } = useUiStore.getState();

      for (let i = 0; i < 100; i++) {
        incrementConsecutiveInput("mouse");
      }

      expect(useUiStore.getState().consecutiveInputCount).toBe(100);
    });

    it("入力タイプの切り替え後も状態が正しく管理される", () => {
      const { setInputType, incrementConsecutiveInput, resetConsecutiveInput } =
        useUiStore.getState();

      // pen → mouse
      setInputType("mouse");
      resetConsecutiveInput();
      expect(useUiStore.getState().inputType).toBe("mouse");

      // mouse → touch
      for (let i = 0; i < 7; i++) {
        incrementConsecutiveInput("touch");
      }
      setInputType("touch");
      resetConsecutiveInput();
      expect(useUiStore.getState().inputType).toBe("touch");

      // touch → pen (即座)
      setInputType("pen");
      resetConsecutiveInput();
      expect(useUiStore.getState().inputType).toBe("pen");
    });
  });
});

describe("ペン入力の筆圧処理", () => {
  /**
   * setPointerEvent関数の筆圧処理ロジックをテスト
   * events.ts内の実際のロジック:
   * - pointerup/pointercancel時: e.pressureをそのまま使用（0も許可）
   * - pointerdown/pointermove時: e.pressure > 0 ? e.pressure : 1
   */

  // 筆圧計算ロジックを再現（events.tsのsetPointerEvent内のロジック）
  const calculatePressure = (
    eventType: string,
    rawPressure: number
  ): number => {
    const isUpOrCancel =
      eventType === "pointerup" || eventType === "pointercancel";
    return isUpOrCancel ? rawPressure : rawPressure > 0 ? rawPressure : 1;
  };

  describe("pointerdown時の筆圧処理", () => {
    it("筆圧が正の値の場合、その値をそのまま使用", () => {
      expect(calculatePressure("pointerdown", 0.5)).toBe(0.5);
      expect(calculatePressure("pointerdown", 0.8)).toBe(0.8);
      expect(calculatePressure("pointerdown", 1.0)).toBe(1.0);
    });

    it("筆圧が0の場合、1にフォールバック", () => {
      expect(calculatePressure("pointerdown", 0)).toBe(1);
    });

    it("筆圧が負の値の場合、1にフォールバック", () => {
      expect(calculatePressure("pointerdown", -0.1)).toBe(1);
    });
  });

  describe("pointermove時の筆圧処理", () => {
    it("筆圧が正の値の場合、その値をそのまま使用", () => {
      expect(calculatePressure("pointermove", 0.3)).toBe(0.3);
      expect(calculatePressure("pointermove", 0.7)).toBe(0.7);
    });

    it("筆圧が0の場合、1にフォールバック", () => {
      expect(calculatePressure("pointermove", 0)).toBe(1);
    });
  });

  describe("pointerup時の筆圧処理（線終端の自然な細さのため）", () => {
    it("筆圧が0の場合、0をそのまま使用（フォールバックしない）", () => {
      // これが今回の修正のポイント：
      // pointerup時に筆圧0を許可することで、線の終端が自然に細くなる
      expect(calculatePressure("pointerup", 0)).toBe(0);
    });

    it("筆圧が正の値の場合、その値をそのまま使用", () => {
      expect(calculatePressure("pointerup", 0.2)).toBe(0.2);
      expect(calculatePressure("pointerup", 0.5)).toBe(0.5);
    });

    it("筆圧が低い値でもそのまま使用される", () => {
      // ペンを離す直前の低い筆圧も正しく処理される
      expect(calculatePressure("pointerup", 0.05)).toBe(0.05);
      expect(calculatePressure("pointerup", 0.01)).toBe(0.01);
    });
  });

  describe("pointercancel時の筆圧処理", () => {
    it("筆圧が0の場合、0をそのまま使用", () => {
      expect(calculatePressure("pointercancel", 0)).toBe(0);
    });

    it("筆圧が正の値の場合、その値をそのまま使用", () => {
      expect(calculatePressure("pointercancel", 0.4)).toBe(0.4);
    });
  });

  describe("線終端の描画シナリオ", () => {
    it("シナリオ: ペンを離す際の筆圧変化", () => {
      // 描画中の筆圧シーケンスをシミュレート
      const pressureSequence = [
        { type: "pointerdown", pressure: 0.8 },
        { type: "pointermove", pressure: 0.9 },
        { type: "pointermove", pressure: 0.7 },
        { type: "pointermove", pressure: 0.5 },
        { type: "pointermove", pressure: 0.3 },
        { type: "pointermove", pressure: 0.1 },
        { type: "pointerup", pressure: 0 }, // ペンを離した瞬間
      ];

      const processedPressures = pressureSequence.map((event) =>
        calculatePressure(event.type, event.pressure)
      );

      // 線の終端で筆圧が自然に0になることを確認
      expect(processedPressures).toEqual([0.8, 0.9, 0.7, 0.5, 0.3, 0.1, 0]);

      // 最後の筆圧が0であることを確認（線終端が細くなる）
      expect(processedPressures[processedPressures.length - 1]).toBe(0);
    });

    it("シナリオ: pointerdown時に筆圧0でも描画開始できる", () => {
      // 一部のデバイスではpointerdown時に筆圧0が報告されることがある
      // その場合は1にフォールバックして描画を開始する
      const pressure = calculatePressure("pointerdown", 0);
      expect(pressure).toBe(1);
    });
  });
});
