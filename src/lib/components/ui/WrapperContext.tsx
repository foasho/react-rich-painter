import React, { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement } from '@dnd-kit/modifiers';
import { Wrapper } from './Wrapper';

type WrapperContextStyleProps = {
  style?: React.CSSProperties;
};

type WrapperStyleProps = {
  withHandle?: boolean;
  draggableId?: string;
  vertical?: boolean;
  between?: boolean;
  width?: string;
  height?: string;
  linePx?: number;
  padding?: string;
  backgroundColor?: string;
};

type WrapperContextProps = {
  children: React.ReactNode;
} & WrapperStyleProps & WrapperContextStyleProps;

const WrapperContext = (
  { 
    children,
    withHandle = true,
    draggableId = "rich_painter",
    vertical = false,
    between = false,
    width = '50%',
    height = '50%',
    linePx = 40,
    // padding = '10px',
    backgroundColor = '#121212',
    style = {},
  }: WrapperContextProps
) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setPosition((prev) => ({
      x: prev.x + (delta?.x || 0),
      y: prev.y + (delta?.y || 0),
    }));
  };

  // verticalがtrueの場合には、widthが50px固定値
  let fixedWidth = width;
  let fixedHeight = height;
  if (vertical) {
    fixedWidth = `${linePx}px`;
  } else {
    fixedHeight = `${linePx}px`;
  }

  return (
    <DndContext 
      onDragEnd={handleDragEnd}
      // modifiers={[restrictToParentElement]} // モディファイアを追加// NOTE: うまく動作しないのでコメントアウト
    >
      <div style={{ position: 'relative', ...style }}>
        <Wrapper 
          withHandle={withHandle}
          position={position}
          draggableId={draggableId}
          vertical={vertical}
          between={between}
          width={fixedWidth}
          height={fixedHeight}
          // padding={padding}
          backgroundColor={backgroundColor}
        >
          {children}
        </Wrapper>
      </div>
    </DndContext>
  );
};

export { WrapperContext };
