import React, { useRef, useEffect, useState, useMemo, memo } from 'react';
import { RichPainter } from '../utils';
import { Toolbar, Brushbar } from "./ui";
import { Brush } from './Brush';
import { DndContext, useDroppable } from '@dnd-kit/core';

type ReactRichPainterProps = {
  width: number;
  height: number;
  toolbar?: boolean;// Toolbarを表示するかどうか
  brushbar?: boolean; // Brushbarを表示するかどうか
  appendBrushImages?: string[]; // TODO: 追加のBrush画像
};

const ReactRichPainter: React.FC<ReactRichPainterProps> = ({ width, height, toolbar=true, brushbar=true }) => {
  const [painter, setPainter] = useState<RichPainter>();
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const size = useMemo(() => ({ width, height }), [width, height]);


  useEffect(() => {
    // RichPainter の初期化
    const painter = new RichPainter({
      undoLimit: 30,
      initSize: { width, height },
    });
    setPainter(painter);
  }, [width, height]);

  return (
    <DraggableContainer>
      <DndContext>
        <div
          ref={canvasContainerRef}
          style={{ 
            width: size.width, 
            height: size.height, 
            backgroundColor: 'black',
            backgroundImage: `
              linear-gradient(white 1px, transparent 1px),
              linear-gradient(90deg, white 1px, transparent 1px)
            `,
            backgroundSize: '10px 10px', // タイルのサイズ
            touchAction: 'none' 
          }}
        >
          {painter && <Brush painter={painter} />}
          
            {toolbar && <Toolbar />}
            {brushbar && <Brushbar />}
        </div>
      </DndContext>
    </DraggableContainer>
  );
};

type DraggableContainerProps = {
  children: React.ReactNode;
};
const DraggableContainer = memo(({ children }: DraggableContainerProps) => {
  const {setNodeRef} = useDroppable({
    id: 'rich_painter',
  });
  return (
    
      <div ref={setNodeRef}>
        {children}
      </div>
  );
});

export { ReactRichPainter };
