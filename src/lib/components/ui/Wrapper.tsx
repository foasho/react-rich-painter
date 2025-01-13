// ui/Wrapper.tsx
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MdDragIndicator } from "react-icons/md";

type WrapperStyleProps = {
  draggableId?: string;
  vertical?: boolean;
  between?: boolean;
  width?: string;
  height?: string;
  padding?: string;
  backgroundColor?: string;
};

type WrapperProps = {
  children: React.ReactNode;
  position: { x: number; y: number };
  withHandle?: boolean;
  wrapperBgColor?: string;
} & WrapperStyleProps;

const Wrapper = ({
  children,
  position,
  withHandle = true,
  draggableId = "rich_painter",
  vertical = false,
  between = false,
  width = '250px', // デフォルト幅
  height = '200px', // デフォルト高さ
  // padding = '10px',
  backgroundColor = '#121212',
  wrapperBgColor = '#FFFFFF88',
}: WrapperProps) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: draggableId,
  });

  const currentTransform = transform
    ? {
        x: transform.x + position.x,
        y: transform.y + position.y,
      }
    : position;

  const styles: React.CSSProperties = {
    display: 'flex',
    flexDirection: vertical ? 'column' : 'row',
    justifyContent: between ? 'space-between' : 'flex-start',
    width: width,
    height: height,
    boxSizing: 'border-box',
    // padding: padding,
    zIndex: 100,
    backgroundColor,
    boxShadow: `${wrapperBgColor} 0px 2px 8px 0px`,
    borderRadius: '25px',
    color: 'white',
    position: 'absolute',
    transform: `translate3d(${currentTransform.x}px, ${currentTransform.y}px, 0)`,
    cursor: withHandle ? "auto" : "grab",
  };

  const handleStyles: React.CSSProperties = {
    cursor: 'grab',
    marginRight: vertical? "10px": '5px',
    marginLeft: "10px",
    padding: '3px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#44444488',
    borderRadius: '5px',
    marginTop: vertical? "10px" :'7px',
    marginBottom: '7px',
  };

  const childrenStyles: React.CSSProperties = {
    padding: vertical? '5px' :'10px',
    flex: 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={styles}
    >
      {withHandle && (
        <div
          style={handleStyles}
          {...listeners}
          {...attributes}
        >
          <MdDragIndicator />
        </div>
      )}
      <div style={childrenStyles}>
        {children}
      </div>
    </div>
  );
};

export { Wrapper };
