import React, { useEffect, useState } from 'react';
import { Wrapper } from '../Wrapper';
import { LayerItem } from './LayerItem';
import { usePainter } from '../../PainterContext';
import { FaPlus } from 'react-icons/fa';

type LayerPanelProps = {
  position?: { x: number; y: number };
};

const LayerPanel: React.FC<LayerPanelProps> = ({
  position = { x: window.innerWidth - 320, y: 60 },
}) => {
  const { painter } = usePainter();
  const [layers, setLayers] = useState<number[]>([]);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const maxLayers = 30;

  // レイヤーリストを更新
  const updateLayers = () => {
    if (!painter) return;
    const layerCount = painter.getLayerCount();
    const layerIndices = Array.from({ length: layerCount }, (_, i) => i);
    setLayers(layerIndices);
    setSelectedLayerIndex(painter.getCurrentLayerIndex());
  };

  useEffect(() => {
    if (!painter) return;
    updateLayers();

    // レイヤーの変更を監視
    const interval = setInterval(updateLayers, 100);
    return () => clearInterval(interval);
  }, [painter]);

  const handleAddLayer = () => {
    if (!painter) return;
    if (painter.getLayerCount() >= maxLayers) {
      alert(`レイヤーは最大${maxLayers}枚までです`);
      return;
    }
    painter.addLayer();
    updateLayers();
  };

  const handleSelectLayer = (index: number) => {
    if (!painter) return;
    painter.selectLayer(index);
    setSelectedLayerIndex(index);
  };

  const handleDeleteLayer = (index: number) => {
    if (!painter) return;
    if (painter.getLayerCount() <= 1) {
      alert('最後のレイヤーは削除できません');
      return;
    }
    painter.removeLayer(index);
    updateLayers();
  };

  if (!painter) return null;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #333',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
  };

  const addButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#4a90e2',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s',
  };

  const layerListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px',
    maxHeight: '500px',
  };

  const layerCountStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '12px',
    color: '#aaaaaa',
    borderTop: '1px solid #333',
    textAlign: 'center',
  };

  return (
    <Wrapper
      draggableId="layer-panel"
      position={position}
      vertical={true}
      width="300px"
      height="auto"
      backgroundColor="#1a1a1a"
    >
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={titleStyle}>レイヤー</div>
          <button
            style={addButtonStyle}
            onClick={handleAddLayer}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#357abd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4a90e2';
            }}
          >
            <FaPlus />
            追加
          </button>
        </div>
        <div style={layerListStyle}>
          {/* レイヤーを逆順で表示（上のレイヤーが上に表示される） */}
          {[...layers].reverse().map((index) => (
            <LayerItem
              key={index}
              painter={painter}
              index={index}
              isSelected={index === selectedLayerIndex}
              onSelect={() => handleSelectLayer(index)}
              onDelete={() => handleDeleteLayer(index)}
            />
          ))}
        </div>
        <div style={layerCountStyle}>
          {layers.length} / {maxLayers} レイヤー
        </div>
      </div>
    </Wrapper>
  );
};

export { LayerPanel };
