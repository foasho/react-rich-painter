import React from 'react';
import { BsPenFill, BsMouseFill, BsHandIndexThumbFill } from 'react-icons/bs';
import { useUiStore, InputType } from '../../store/ui';

type PenTypeProps = {
  size?: number;
};

const PenType: React.FC<PenTypeProps> = ({ size = 20 }) => {
  const { inputType, setInputType } = useUiStore();

  const inputTypes: Array<{ type: InputType; icon: React.ReactNode; label: string }> = [
    { type: 'pen', icon: <BsPenFill size={size * 0.7} />, label: 'ペン' },
    { type: 'mouse', icon: <BsMouseFill size={size * 0.7} />, label: 'マウス' },
    { type: 'touch', icon: <BsHandIndexThumbFill size={size * 0.7} />, label: 'タッチ' },
  ];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '3px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
    padding: '3px',
  };

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    borderRadius: '5px',
    backgroundColor: isActive ? '#4a90e2' : 'transparent',
    color: isActive ? '#ffffff' : '#aaaaaa',
    transition: 'all 0.2s',
    border: 'none',
    padding: 0,
  });

  return (
    <div style={containerStyle}>
      {inputTypes.map(({ type, icon, label }) => (
        <button
          key={type}
          style={buttonStyle(inputType === type)}
          onClick={() => setInputType(type)}
          title={label}
          onMouseEnter={(e) => {
            if (inputType !== type) {
              e.currentTarget.style.backgroundColor = '#3a3a3a';
            }
          }}
          onMouseLeave={(e) => {
            if (inputType !== type) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
};

export { PenType };
