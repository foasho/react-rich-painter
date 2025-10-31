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
  wrapperBgColor?: string;
};

type WrapperContextProps = {
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
} & WrapperStyleProps & WrapperContextStyleProps;

const WrapperContext = (
  {
    children,
    initialPosition = { x: 0, y: 0 },
    withHandle = true,
    draggableId = "rich_painter",
    vertical = false,
    between = false,
    width = '50%',
    height = '50%',
    linePx = 40,
    backgroundColor = '#121212',
    wrapperBgColor = '#FFFFFF88',
    style = {},
  }: WrapperContextProps
) => {
  // localStorageから位置を読み込む
  const getInitialPosition = () => {
    if (typeof window === 'undefined') return initialPosition;

    try {
      const storageKey = `wrapper-position-${draggableId}`;
      const savedPosition = localStorage.getItem(storageKey);
      if (savedPosition) {
        return JSON.parse(savedPosition);
      }
    } catch (error) {
      console.error('Failed to load position from localStorage:', error);
    }
    return initialPosition;
  };

  const [position, setPosition] = useState(getInitialPosition);

  // positionが変更されたらlocalStorageに保存
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storageKey = `wrapper-position-${draggableId}`;
      localStorage.setItem(storageKey, JSON.stringify(position));
    } catch (error) {
      console.error('Failed to save position to localStorage:', error);
    }
  }, [position, draggableId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta } = event;
    setPosition((prev: { x: number, y: number }) => ({
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
          wrapperBgColor={wrapperBgColor}
        >
          {children}
        </Wrapper>
      </div>
    </DndContext>
  );
};

export { WrapperContext };
