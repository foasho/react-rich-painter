import { describe, it, expect, beforeEach } from "vitest";
import { Brush } from "../utils/painter/Brush";

describe("Brush", () => {
  let brush: Brush;

  beforeEach(() => {
    brush = new Brush();
  });

  describe("初期化", () => {
    it("デフォルト値が正しく設定される", () => {
      expect(brush.getColor()).toBe("#000");
      expect(brush.getFlow()).toBe(1);
      expect(brush.getSize()).toBe(10);
      expect(brush.getSpacing()).toBe(0.05);
      expect(brush.getAngle()).toBe(0);
      expect(brush.getMinimumSize()).toBe(0);
      expect(brush.getUserDevice()).toBe("pc");
      expect(brush.getToolType()).toBe("pen");
      expect(brush.getIsDrawTool()).toBe(false);
      expect(brush.getIsFinger()).toBe(false);
      expect(brush.getMerge()).toBe(0.2);
      expect(brush.getImage()).toBeNull();
    });
  });

  describe("プロパティ設定", () => {
    describe("color", () => {
      it("色を設定できる", () => {
        brush.setColor("#ff0000");
        expect(brush.getColor()).toBe("#ff0000");
      });

      it("様々な色形式を設定できる", () => {
        brush.setColor("#abc");
        expect(brush.getColor()).toBe("#abc");

        brush.setColor("#aabbcc");
        expect(brush.getColor()).toBe("#aabbcc");
      });
    });

    describe("flow", () => {
      it("フローを設定できる", () => {
        brush.setFlow(0.5);
        expect(brush.getFlow()).toBe(0.5);
      });

      it("0〜1の範囲で設定できる", () => {
        brush.setFlow(0);
        expect(brush.getFlow()).toBe(0);

        brush.setFlow(1);
        expect(brush.getFlow()).toBe(1);
      });
    });

    describe("size", () => {
      it("サイズを設定できる", () => {
        brush.setSize(20);
        expect(brush.getSize()).toBe(20);
      });

      it("1未満の値は1に補正される", () => {
        brush.setSize(0);
        expect(brush.getSize()).toBe(1);

        brush.setSize(-5);
        expect(brush.getSize()).toBe(1);
      });

      it("大きな値も設定できる", () => {
        brush.setSize(500);
        expect(brush.getSize()).toBe(500);
      });
    });

    describe("spacing", () => {
      it("スペーシングを設定できる", () => {
        brush.setSpacing(0.1);
        expect(brush.getSpacing()).toBe(0.1);
      });

      it("0.01未満の値は0.01に補正される", () => {
        brush.setSpacing(0);
        expect(brush.getSpacing()).toBe(0.01);

        brush.setSpacing(0.005);
        expect(brush.getSpacing()).toBe(0.01);
      });
    });

    describe("angle", () => {
      it("角度を設定できる", () => {
        brush.setAngle(45);
        expect(brush.getAngle()).toBe(45);
      });

      it("負の値は0に補正される", () => {
        brush.setAngle(-10);
        expect(brush.getAngle()).toBe(0);
      });
    });

    describe("minimumSize", () => {
      it("最小サイズを設定できる", () => {
        brush.setMinimumSize(0.5);
        expect(brush.getMinimumSize()).toBe(0.5);
      });

      it("0.01未満の値は0.01に補正される", () => {
        brush.setMinimumSize(0);
        expect(brush.getMinimumSize()).toBe(0.01);
      });
    });

    describe("userDevice", () => {
      it("デバイスを設定できる", () => {
        brush.setUserDevice("tablet");
        expect(brush.getUserDevice()).toBe("tablet");
      });
    });

    describe("userSelectInputType", () => {
      it("入力タイプを設定できる", () => {
        brush.setUserSelectInputType("pen");
        expect(brush.getUserSelectInputType()).toBe("pen");

        brush.setUserSelectInputType("touch");
        expect(brush.getUserSelectInputType()).toBe("touch");
      });
    });

    describe("toolType", () => {
      it("ツールタイプを設定できる", () => {
        brush.setToolType("eraser");
        expect(brush.getToolType()).toBe("eraser");

        brush.setToolType("dripper");
        expect(brush.getToolType()).toBe("dripper");

        brush.setToolType("pen");
        expect(brush.getToolType()).toBe("pen");
      });
    });

    describe("isDrawTool", () => {
      it("描画ツールフラグを設定できる", () => {
        brush.setIsDrawTool(true);
        expect(brush.getIsDrawTool()).toBe(true);

        brush.setIsDrawTool(false);
        expect(brush.getIsDrawTool()).toBe(false);
      });
    });

    describe("isFinger", () => {
      it("指先ツールフラグを設定できる", () => {
        brush.setIsFinger(true);
        expect(brush.getIsFinger()).toBe(true);

        brush.setIsFinger(false);
        expect(brush.getIsFinger()).toBe(false);
      });
    });

    describe("merge", () => {
      it("混色値を設定できる", () => {
        brush.setMerge(0.5);
        expect(brush.getMerge()).toBe(0.5);
      });

      it("負の値は0に補正される", () => {
        brush.setMerge(-0.5);
        expect(brush.getMerge()).toBe(0);
      });

      it("0を設定できる", () => {
        brush.setMerge(0);
        expect(brush.getMerge()).toBe(0);
      });
    });

    describe("image", () => {
      it("nullを設定できる", () => {
        brush.setImage(null);
        expect(brush.getImage()).toBeNull();
      });

      it("画像を設定できる", () => {
        const img = new Image();
        img.width = 100;
        img.height = 100;
        brush.setImage(img);
        expect(brush.getImage()).toBe(img);
      });

      it("同じ画像を再設定しても変化しない", () => {
        const img = new Image();
        img.width = 100;
        img.height = 100;
        brush.setImage(img);
        brush.setImage(img);
        expect(brush.getImage()).toBe(img);
      });
    });
  });

  describe("clone", () => {
    it("ブラシをクローンできる", () => {
      brush.setColor("#ff0000");
      brush.setFlow(0.8);
      brush.setSize(25);
      brush.setSpacing(0.1);

      const cloned = brush.clone();

      expect(cloned.getColor()).toBe("#ff0000");
      expect(cloned.getFlow()).toBe(0.8);
      expect(cloned.getSize()).toBe(25);
      expect(cloned.getSpacing()).toBe(0.1);
    });

    it("クローンは独立したインスタンス", () => {
      brush.setColor("#ff0000");
      const cloned = brush.clone();

      brush.setColor("#00ff00");
      expect(cloned.getColor()).toBe("#ff0000");
      expect(brush.getColor()).toBe("#00ff00");
    });
  });

  describe("描画処理", () => {
    let canvas: HTMLCanvasElement;
    let context: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      context = canvas.getContext("2d")!;
    });

    describe("down", () => {
      it("コンテキストなしでエラー", () => {
        expect(() =>
          brush.down(null as unknown as CanvasRenderingContext2D, 50, 50, 0.5),
        ).toThrow("brush needs the context");
      });

      it("正常に呼び出せる", () => {
        expect(() => brush.down(context, 50, 50, 0.5)).not.toThrow();
      });

      it("筆圧0でも呼び出せる", () => {
        expect(() => brush.down(context, 50, 50, 0)).not.toThrow();
      });
    });

    describe("move", () => {
      it("コンテキストなしでエラー", () => {
        brush.down(context, 50, 50, 0.5);
        expect(() =>
          brush.move(null as unknown as CanvasRenderingContext2D, 60, 60, 0.5),
        ).toThrow("brush needs the context");
      });

      it("正常に呼び出せる", () => {
        brush.down(context, 50, 50, 0.5);
        expect(() => brush.move(context, 60, 60, 0.5)).not.toThrow();
      });

      it("連続で呼び出せる", () => {
        brush.down(context, 50, 50, 0.5);
        expect(() => {
          brush.move(context, 55, 55, 0.5);
          brush.move(context, 60, 60, 0.5);
          brush.move(context, 65, 65, 0.5);
        }).not.toThrow();
      });

      it("筆圧0でも呼び出せる", () => {
        brush.down(context, 50, 50, 0.5);
        expect(() => brush.move(context, 60, 60, 0)).not.toThrow();
      });
    });

    describe("up", () => {
      it("dirtyRectを返す", () => {
        brush.down(context, 50, 50, 0.5);
        brush.move(context, 60, 60, 0.5);
        const dirtyRect = brush.up(context, 70, 70, 0.5);

        expect(dirtyRect).toHaveProperty("x");
        expect(dirtyRect).toHaveProperty("y");
        expect(dirtyRect).toHaveProperty("width");
        expect(dirtyRect).toHaveProperty("height");
      });

      it("描画しなかった場合は空のdirtyRect", () => {
        brush.down(context, 50, 50, 0);
        const dirtyRect = brush.up(context, 50, 50, 0);

        expect(dirtyRect.width).toBe(0);
        expect(dirtyRect.height).toBe(0);
      });
    });
  });

  describe("描画フロー", () => {
    let canvas: HTMLCanvasElement;
    let context: CanvasRenderingContext2D;

    beforeEach(() => {
      canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      context = canvas.getContext("2d")!;
    });

    it("down -> move -> up の完全なフロー", () => {
      brush.setColor("#ff0000");
      brush.setSize(10);

      brush.down(context, 10, 10, 0.5);
      brush.move(context, 20, 20, 0.5);
      brush.move(context, 30, 30, 0.5);
      brush.move(context, 40, 40, 0.5);
      const dirtyRect = brush.up(context, 50, 50, 0.5);

      expect(dirtyRect.width).toBeGreaterThan(0);
      expect(dirtyRect.height).toBeGreaterThan(0);
    });

    it("指先モードでの描画", () => {
      brush.setIsFinger(true);
      brush.setSize(20);

      brush.down(context, 30, 30, 0.5);
      brush.move(context, 40, 40, 0.5);
      const dirtyRect = brush.up(context, 50, 50, 0.5);

      expect(dirtyRect).toBeDefined();
    });

    it("最小サイズの適用", () => {
      brush.setMinimumSize(0.5);

      brush.down(context, 50, 50, 0.1);
      brush.move(context, 60, 60, 0.1);
      const dirtyRect = brush.up(context, 70, 70, 0.1);

      // minimumSizeにより、低筆圧でも描画される
      expect(dirtyRect.width).toBeGreaterThan(0);
    });
  });
});
