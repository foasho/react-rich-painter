import React, { useEffect, useRef, useState } from 'react';
import { FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import { RichPainter } from '../../../utils/painter/RichPainter';

type LayerItemProps = {
  painter: RichPainter;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

const LayerItem: React.FC<LayerItemProps> = ({
  painter,
  index,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(100);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  // レイヤーの状態を更新
  useEffect(() => {
    const visible = painter.getLayerVisible(index);
    const op = painter.getLayerOpacity(index);
    setIsVisible(visible);
    setOpacity(Math.round(op * 100));
  }, [painter, index]);

  // サムネイルを生成
  useEffect(() => {
    const generateThumbnail = () => {
      try {
        const thumbnailCanvas = painter.createLayerThumbnail(index, 60, 60);
        const dataUrl = thumbnailCanvas.toDataURL();
        setThumbnail(dataUrl);
      } catch (error) {
        console.error('Failed to generate thumbnail:', error);
      }
    };

    generateThumbnail();

    // レイヤーが変更されたときにサムネイルを更新
    const interval = setInterval(generateThumbnail, 1000);
    return () => clearInterval(interval);
  }, [painter, index]);

  const handleVisibilityToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    painter.setLayerVisible(!isVisible, index);
    setIsVisible(!isVisible);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (painter.getLayerCount() <= 1) {
      alert('最後のレイヤーは削除できません');
      return;
    }
    onDelete();
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseInt(e.target.value);
    setOpacity(newOpacity);
    painter.setLayerOpacity(newOpacity / 100, index);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px',
    backgroundColor: isSelected ? '#2a2a2a' : '#1a1a1a',
    borderRadius: '8px',
    marginBottom: '4px',
    cursor: 'pointer',
    border: isSelected ? '2px solid #4a90e2' : '2px solid transparent',
    transition: 'all 0.2s',
  };

  const thumbnailStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    backgroundColor: '#ffffff',
    borderRadius: '4px',
    marginRight: '8px',
    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
    backgroundSize: '10px 10px',
    backgroundPosition: '0 0, 5px 5px',
    opacity: isVisible ? 1 : 0.3,
  };

  const infoStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
  };

  const opacityContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const opacityLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#aaaaaa',
    minWidth: '30px',
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    height: '4px',
    cursor: 'pointer',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    marginLeft: '8px',
  };

  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    transition: 'color 0.2s',
  };

  return (
    <div style={containerStyle} onClick={onSelect}>
      <div style={thumbnailStyle}>
        {thumbnail && (
          <img
            src={thumbnail}
            alt={`Layer ${index + 1}`}
            style={{ width: '100%', height: '100%', borderRadius: '4px' }}
          />
        )}
      </div>
      <div style={infoStyle}>
        <div style={nameStyle}>レイヤー {index + 1}</div>
        <div style={opacityContainerStyle}>
          <span style={opacityLabelStyle}>{opacity}%</span>
          <input
            type="range"
            min="0"
            max="100"
            value={opacity}
            onChange={handleOpacityChange}
            onClick={(e) => e.stopPropagation()}
            style={sliderStyle}
          />
        </div>
      </div>
      <div style={actionsStyle}>
        <button
          style={iconButtonStyle}
          onClick={handleVisibilityToggle}
          title={isVisible ? '非表示にする' : '表示する'}
        >
          {isVisible ? <FaEye /> : <FaEyeSlash />}
        </button>
        <button
          style={iconButtonStyle}
          onClick={handleDelete}
          title="削除"
        >
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

export { LayerItem };
