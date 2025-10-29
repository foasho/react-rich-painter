import React from 'react';
import { LuHand } from "react-icons/lu";
import { ToolButton } from './ToolButton';

type HandMoveProps = {
  size?: number;
}

/**
 * 手のひらツール
 * キャンバスの表示位置を移動
 */
const HandMove: React.FC<HandMoveProps> = ({ size = 20 }) => {
  const handleMoveSelect = () => {
    // カーソルをgrabに設定
    const canvasDom = document.getElementById('main_canvas_area');
    if (canvasDom) {
      (canvasDom as HTMLElement).style.cursor = 'grab';
    }
  };

  return (
    <ToolButton
      toolType="move"
      icon={<LuHand />}
      size={size}
      onToolSelect={handleMoveSelect}
    />
  );
};

export { HandMove };
