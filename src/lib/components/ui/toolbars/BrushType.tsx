import React from "react";
import { HiMiniPencil } from "react-icons/hi2";
import { ToolButton } from "./ToolButton";
import { usePainter } from "../../PainterContext";

type BrushTypeProps = {
  size?: number;
};

/**
 * ブラシ（ペン）ツール
 * 通常の描画モード
 */
const BrushType: React.FC<BrushTypeProps> = ({ size = 20 }) => {
  const { painter } = usePainter();

  const handleBrushSelect = () => {
    if (!painter) return;
    const brush = painter.getBrush();
    if (brush) {
      // 消しゴムから戻った場合に備えて、色を元に戻す
      // ColorPalletで最後に設定した色を参照（黒がデフォルト）
      // 実際の色はColorPalletの状態と同期するので、
      // ここでは消しゴムの白色から変更するだけでOK
      const currentColor = brush.getColor();
      if (currentColor === "#FFFFFF" || currentColor === "#ffffff") {
        // 白色（消しゴムの色）の場合は黒に戻す
        brush.setColor("#000000");
      }
    }
    // 通常の描画モードでは knockout を無効化
    painter.setPaintingKnockout(false);

    // カーソルをデフォルトに設定
    const canvasDom = document.getElementById("main_canvas_area");
    if (canvasDom) {
      (canvasDom as HTMLElement).style.cursor = "default";
    }
  };

  return (
    <ToolButton
      toolType="pen"
      icon={<HiMiniPencil />}
      size={size}
      onToolSelect={handleBrushSelect}
    />
  );
};

export { BrushType };
