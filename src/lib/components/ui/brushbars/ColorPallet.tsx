import React, { useState, useRef } from 'react';
import { usePainter } from '../../PainterContext';

type ColorPalletProps = {
  size?: number;
  initialColor?: string;
  onColorChange?: (color: string) => void;
};

const ColorPallet: React.FC<ColorPalletProps> = ({
  size = 30,
  initialColor = '#000000',
  onColorChange,
}) => {
  const [color, setColor] = useState<string>(initialColor);
  const inputRef = useRef<HTMLInputElement>(null);
  const { painter } = usePainter();

  // 初回マウント時にBrushの色を初期色に設定
  React.useEffect(() => {
    const brush = painter!.getBrush();
    if (brush) {
      brush.setColor(initialColor);
    }
  }, [painter, initialColor]);

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = event.target.value;
    setColor(newColor);

    // Brushの色を更新
    const brush = painter!.getBrush();
    if (brush) {
      brush.setColor(newColor);
    }

    if (onColorChange) {
      onColorChange(newColor);
    }
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: `${size}px`,
    height: `${size}px`,
  };

  const circleStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: color,
    borderRadius: '50%',
    cursor: 'pointer',
    border: '2px solid #fff',
    boxSizing: "border-box"  
  };

  const hiddenInputStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    border: 'none',
  };

  return (
    <div style={containerStyle}>
      <input
        type="color"
        ref={inputRef}
        value={color}
        onChange={handleColorChange}
        style={hiddenInputStyle}
        aria-label="色を選択"
      />
      <div
        style={circleStyle}
        role="button"
        aria-label="色を選択"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            inputRef.current?.click();
          }
        }}
      />
    </div>
  );
};

export { ColorPallet };
