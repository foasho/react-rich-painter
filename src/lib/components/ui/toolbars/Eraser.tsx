import React from 'react';
import { LuEraser } from "react-icons/lu";
import { ToolButton } from './ToolButton';
import { usePainter } from '../../PainterContext';

type EraserProps = {
  size?: number;
}

/**
 * 消しゴムツール
 * knockout モードを有効化して描画内容を削除する
 */
const Eraser: React.FC<EraserProps> = ({ size = 20 }) => {
  const { painter } = usePainter();
  const savedColorRef = React.useRef<string>('#000000');

  const handleEraserSelect = () => {
    if (!painter) return;
    const brush = painter.getBrush();
    if (brush) {
      // 現在の色を保存
      savedColorRef.current = brush.getColor();
      // 消しゴムのプレビュー用に白色に変更
      brush.setColor('#FFFFFF');
    }
    // 消しゴムモードでは knockout を有効化
    painter.setPaintingKnockout(true);

    // カーソルをデフォルトに設定
    const canvasDom = document.getElementById('main_canvas_area');
    if (canvasDom) {
      (canvasDom as HTMLElement).style.cursor = 'default';
    }
  };

  return (
    <ToolButton
      toolType="eraser"
      icon={<LuEraser />}
      size={size}
      onToolSelect={handleEraserSelect}
    />
  );
};

export { Eraser };
