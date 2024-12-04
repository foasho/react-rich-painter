

import { useDraggable } from '@dnd-kit/core';
import React from 'react';


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
    transform: transform?`translate3d(${transform.x}px, ${transform.y}px, 0)`: undefined,
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
  return (
    <div 
      ref={setNodeRef}
      style={styles}
      {...listeners}
      {...attributes}
    >{children}</div>
  )
}

export { Wrapper };
