import React, { useEffect, useState } from 'react';
import { WrapperContext } from '../WrapperContext';
import { LayerItem } from './LayerItem';
import { usePainter } from '../../PainterContext';
import { useLayerNameStore } from '../../store/layer';
import { FaPlus } from 'react-icons/fa';

type LayerPanelProps = {};

const LayerPanel: React.FC<LayerPanelProps> = () => {
  const { painter } = usePainter();
  const { addLayerName, swapLayerNames, shiftLayerNamesAfterRemove } = useLayerNameStore();
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
    const newIndex = painter.getLayerCount();
    painter.addLayer();
    addLayerName(newIndex);
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
    shiftLayerNamesAfterRemove(index);
    updateLayers();
  };

  const handleMoveLayerUp = (index: number) => {
    if (!painter) return;
    if (index >= painter.getLayerCount() - 1) return; // 最上位レイヤーは上に移動できない

    // 現在選択中のレイヤーインデックスを保存
    const currentSelected = painter.getCurrentLayerIndex();

    // レイヤーとレイヤー名をスワップ
    painter.swapLayer(index, index + 1);
    swapLayerNames(index, index + 1);

    // 選択中のレイヤーの新しいインデックスを計算
    let newSelectedIndex = currentSelected;
    if (currentSelected === index) {
      newSelectedIndex = index + 1;
    } else if (currentSelected === index + 1) {
      newSelectedIndex = index;
    }

    // 選択を復元
    painter.selectLayer(newSelectedIndex);
    setSelectedLayerIndex(newSelectedIndex);

    updateLayers();
  };

  const handleMoveLayerDown = (index: number) => {
    if (!painter) return;
    if (index <= 0) return; // 最下位レイヤーは下に移動できない

    // 現在選択中のレイヤーインデックスを保存
    const currentSelected = painter.getCurrentLayerIndex();

    // レイヤーとレイヤー名をスワップ
    painter.swapLayer(index, index - 1);
    swapLayerNames(index, index - 1);

    // 選択中のレイヤーの新しいインデックスを計算
    let newSelectedIndex = currentSelected;
    if (currentSelected === index) {
      newSelectedIndex = index - 1;
    } else if (currentSelected === index - 1) {
      newSelectedIndex = index;
    }

    // 選択を復元
    painter.selectLayer(newSelectedIndex);
    setSelectedLayerIndex(newSelectedIndex);

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
    padding: '6px 8px',
    borderBottom: '1px solid #333',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ffffff',
  };

  const addButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    padding: '4px 8px',
    backgroundColor: '#4a90e2',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    transition: 'background-color 0.2s',
  };

  const layerListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '4px',
    maxHeight: '400px',
  };

  const layerCountStyle: React.CSSProperties = {
    padding: '4px 8px',
    fontSize: '10px',
    color: '#aaaaaa',
    borderTop: '1px solid #333',
    textAlign: 'center',
  };

  return (
    <WrapperContext
      draggableId="layer-panel"
      vertical={true}
      width="240px"
      height="auto"
      linePx={240}
      backgroundColor="#1a1a1a"
      style={{ top: '60px', right: '10px' }}
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
            <FaPlus size={10} />
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
              onMoveUp={() => handleMoveLayerUp(index)}
              onMoveDown={() => handleMoveLayerDown(index)}
              canMoveUp={index < painter.getLayerCount() - 1}
              canMoveDown={index > 0}
            />
          ))}
        </div>
        <div style={layerCountStyle}>
          {layers.length} / {maxLayers} レイヤー
        </div>
      </div>
    </WrapperContext>
  );
};

export { LayerPanel };
