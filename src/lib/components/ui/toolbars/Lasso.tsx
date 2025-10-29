import React from 'react';
import { LuLasso } from "react-icons/lu";
import { ToolButton } from './ToolButton';
import { usePainter } from '../../PainterContext';
import { useSelectionStore } from '../../store/selection';

type LassoProps = {
  size?: number;
}

/**
 * 投げ縄選択ツール
 * 自由な形状で選択範囲を指定
 */
const Lasso: React.FC<LassoProps> = ({ size = 20 }) => {
  const { painter } = usePainter();
  const { clearSelection } = useSelectionStore();

  const handleLassoSelect = () => {
    // 既存の選択範囲をクリア
    clearSelection();

    // 描画モードを無効化（Lassoツール選択時は描画しない）
    painter.setPaintingKnockout(false);

    // カーソルをcrosshairに設定
    const canvasDom = document.getElementById('main_canvas_area');
    if (canvasDom) {
      (canvasDom as HTMLElement).style.cursor = 'crosshair';
    }
  };

  return (
    <ToolButton
      toolType="lasso"
      icon={<LuLasso />}
      size={size}
      onToolSelect={handleLassoSelect}
    />
  );
};

export { Lasso };
