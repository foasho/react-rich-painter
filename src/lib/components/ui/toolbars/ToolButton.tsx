import React from 'react';
import { useToolStore, ToolType } from '../../store';
import { usePainter } from '../../PainterContext';

type ToolButtonProps = {
  toolType: ToolType;
  icon: React.ReactNode;
  size?: number;
  onToolSelect?: () => void;
};

/**
 * ツールボタンの共通コンポーネント
 * Clean Code原則：DRY（Don't Repeat Yourself）に従い、共通ロジックを抽出
 */
const ToolButton: React.FC<ToolButtonProps> = ({
  toolType,
  icon,
  size = 20,
  onToolSelect,
}) => {
  const { currentTool, setTool } = useToolStore();
  const { painter } = usePainter();
  const isActive = currentTool === toolType;

  const handleClick = () => {
    setTool(toolType);
    const brush = painter.getBrush();
    if (brush) {
      brush.setToolType(toolType === 'lasso' ? 'rect' : toolType);
    }

    // ツール固有の処理を実行
    if (onToolSelect) {
      onToolSelect();
    }
  };

  const containerStyle: React.CSSProperties = {
    width: size + 10,
    height: size + 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: isActive ? '#4a90e2' : 'transparent',
    borderRadius: '4px',
    padding: '5px',
    transition: 'background-color 0.2s',
  };

  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    color: 'white',
  };

  return (
    <div style={containerStyle} onClick={handleClick} title={toolType}>
      {React.cloneElement(icon as React.ReactElement, { style: iconStyle })}
    </div>
  );
};

export { ToolButton };
