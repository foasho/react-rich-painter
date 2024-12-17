

import React, { useCallback, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';


type WrapperProps = {
  children: React.ReactNode
  draggableId?: string
  vertical?: boolean
  between?: boolean
  width?: string
  height?: string
  padding?: string
  backgroundColor?: string
}
const Wrapper = ({
  children,
  draggableId="rich_painter",
  vertical=false,
  between=false,
  width = '50%',
  height = '50%',
  padding = '10px',
  backgroundColor = '#121212',
}: WrapperProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: draggableId,
  });
  const styles: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    boxSizing: 'border-box',
    padding: padding,
    justifyContent: 'flex-start',
    zIndex: 100,
    backgroundColor,
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    borderRadius: '20px',
    color: 'white',
    transform: `translate3d(${position.x + (transform?.x || 0)}px, ${
      position.y + (transform?.y || 0)
    }px, 0)`,
  }
  if (vertical) {
    styles.flexDirection = 'column';
    styles.height = height;
  } else {
    styles.width = width;
  }
  if (between) {
    styles.justifyContent = 'space-between';
  }

  const handleDragEnd = useCallback(() => {
    if (transform) {
      setPosition({
        x: position.x + transform.x,
        y: position.y + transform.y,
      });
      console.log('position', position);
    }
  }, [position, transform]);

  return (
    <div 
      ref={setNodeRef}
      style={styles}
      {...listeners}
      {...attributes}
      onDragEnd={handleDragEnd}
    >{children}</div>
  )
}

export { Wrapper };
