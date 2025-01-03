import React, { useRef, useEffect, useState, useMemo } from 'react';
import { RichPainter } from '../utils';
import { Toolbar, Brushbar } from "./ui";
import { Brush } from './Brush';

type ReactRichPainterProps = {
  width: number;
  height: number;
  toolbar?: boolean; // Toolbarを表示するかどうか
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
        touchAction: 'none',
        position: 'relative', // 追加: Wrapperの基準となるように設定
        overflow: 'hidden', // ドラッグ可能な要素がはみ出さないようにする
      }}
    >
      {painter && <Brush painter={painter} />}
      {toolbar && <Toolbar />}
      {brushbar && <Brushbar />}
    </div>
  );
};

export { ReactRichPainter };
