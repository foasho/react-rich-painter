import React from 'react';
import { LuLayers } from "react-icons/lu";
import { useUiStore } from '../../store/ui';

type LayerProps = {
  size?: number;
}

const Layer: React.FC<LayerProps> = ({ size = 20 }) => {
  const { isLayerPanelOpen, toggleLayerPanel } = useUiStore();

  const handleClick = () => {
    toggleLayerPanel();
  };

  const containerStyle: React.CSSProperties = {
    width: size + 10,
    height: size + 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: isLayerPanelOpen ? '#4a90e2' : 'transparent',
    borderRadius: '16px',
    transition: 'background-color 0.2s',
  };

  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    color: 'white',
  };

  return (
    <div style={containerStyle} onClick={handleClick} title="レイヤー">
      <LuLayers style={iconStyle} />
    </div>
  );
};

export { Layer };
