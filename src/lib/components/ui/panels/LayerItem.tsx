import React, { useEffect, useState } from 'react';
import { FaEye, FaEyeSlash, FaTrash, FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { RichPainter } from '../../../utils/painter/RichPainter';
import { useLayerNameStore } from '../../store/layer';

type LayerItemProps = {
  painter: RichPainter;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
};

const LayerItem: React.FC<LayerItemProps> = ({
  painter,
  index,
  isSelected,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}) => {
  const { getLayerName, setLayerName } = useLayerNameStore();
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(100);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

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
        const thumbnailCanvas = painter.createLayerThumbnail(index, 40, 40);
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

  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveUp();
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveDown();
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseInt(e.target.value);
    setOpacity(newOpacity);
    painter.setLayerOpacity(newOpacity / 100, index);
  };

  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingName(true);
    setEditedName(getLayerName(index));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedName(e.target.value);
  };

  const handleNameBlur = () => {
    if (editedName.trim()) {
      setLayerName(index, editedName.trim());
    }
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    backgroundColor: isSelected ? '#2a2a2a' : '#1a1a1a',
    borderRadius: '4px',
    marginBottom: '3px',
    cursor: 'pointer',
    border: isSelected ? '1px solid #4a90e2' : '1px solid transparent',
    transition: 'all 0.2s',
  };

  const thumbnailStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    minWidth: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '3px',
    marginRight: '6px',
    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
    backgroundSize: '8px 8px',
    backgroundPosition: '0 0, 4px 4px',
    opacity: isVisible ? 1 : 0.3,
    flexBasis: '20%',
  };

  const infoStyle: React.CSSProperties = {
    flex: 3,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
    flexBasis: '60%',
  };

  const nameStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#ffffff',
    cursor: 'text',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const nameInputStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#2a2a2a',
    border: '1px solid #4a90e2',
    borderRadius: '2px',
    padding: '2px 4px',
    width: '100%',
    outline: 'none',
  };

  const opacityContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    width: '100%',
    maxWidth: '100%',
  };

  const opacityLabelStyle: React.CSSProperties = {
    fontSize: '9px',
    color: '#aaaaaa',
    minWidth: '25px',
    flexShrink: 0,
  };

  const sliderStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    height: '3px',
    cursor: 'pointer',
  };

  const actionsStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginLeft: '4px',
    flexBasis: '20%',
  };

  const iconButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    transition: 'color 0.2s',
  };

  const iconButtonDisabledStyle: React.CSSProperties = {
    ...iconButtonStyle,
    color: '#666666',
    cursor: 'not-allowed',
  };

  return (
    <div style={containerStyle} onClick={onSelect}>
      <div style={thumbnailStyle}>
        {thumbnail && (
          <img
            src={thumbnail}
            alt={`Layer ${index + 1}`}
            style={{ width: '100%', height: '100%', borderRadius: '3px' }}
          />
        )}
      </div>
      <div style={infoStyle}>
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleNameKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={nameInputStyle}
            autoFocus
          />
        ) : (
          <div style={nameStyle} onClick={handleNameClick} title={getLayerName(index)}>
            {getLayerName(index)}
          </div>
        )}
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
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            style={canMoveUp ? iconButtonStyle : iconButtonDisabledStyle}
            onClick={handleMoveUp}
            title="上に移動"
            disabled={!canMoveUp}
          >
            <FaChevronUp size={10} />
          </button>
          <button
            style={canMoveDown ? iconButtonStyle : iconButtonDisabledStyle}
            onClick={handleMoveDown}
            title="下に移動"
            disabled={!canMoveDown}
          >
            <FaChevronDown size={10} />
          </button>
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            style={iconButtonStyle}
            onClick={handleVisibilityToggle}
            title={isVisible ? '非表示にする' : '表示する'}
          >
            {isVisible ? <FaEye size={10} /> : <FaEyeSlash size={10} />}
          </button>
          <button
            style={iconButtonStyle}
            onClick={handleDelete}
            title="削除"
          >
            <FaTrash size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};

export { LayerItem };
