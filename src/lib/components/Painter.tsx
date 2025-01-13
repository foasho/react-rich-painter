import React, { useRef, useEffect, useState, useMemo, ReactNode } from 'react';
import { RichPainter } from '../utils';
import { Toolbar, Brushbar } from "./ui";
import { Brush } from './Brush';

type ReactRichPainterProps = {
  width: number;
  height: number;
  toolbar?: boolean; // Toolbarを表示するかどうか
  brushbar?: boolean; // Brushbarを表示するかどうか
  appendBrushImages?: string[]; // TODO: 追加のBrush画像
  backgroundSize?: number; // 背景タイルの大きさ
};

const ReactRichPainter: React.FC<ReactRichPainterProps> = ({ width, height, toolbar=true, brushbar=true, backgroundSize=20 }) => {
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
        width: "100%", 
        height: "100%", 
        backgroundColor: 'black',
        backgroundImage: `
          linear-gradient(white 1px, transparent 1px),
          linear-gradient(90deg, white 1px, transparent 1px)
        `,
        backgroundSize: `${backgroundSize}px ${backgroundSize}px`,
        touchAction: 'none',
        position: 'relative', // 追加: Wrapperの基準となるように設定
        overflow: 'hidden', // ドラッグ可能な要素がはみ出さないようにする
      }}
    >
      {painter &&  
        <PaintCanvas 
          painter={painter} 
          width={size.width}
          height={size.height}
        />
      }
      {painter && <Brush painter={painter} />}
      {toolbar && <Toolbar />}
      {brushbar && <Brushbar />}
    </div>
  );
};

type PaintCanvasProps = {
  painter: RichPainter;
  width: number;
  height: number;
  backgroundColor?: string;
};
const PaintCanvas = (
  { 
    painter,
    width,
    height,
    backgroundColor = '#FFFFFF',
  }: PaintCanvasProps
) => {

  const [init, setInit] = useState(false);
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const srcLayerRef = useRef<HTMLCanvasElement | null>(null);
  const srcLayerCtx = useRef<CanvasRenderingContext2D | null>(null);
  const painterCanvasRef = useRef<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!init && canvasAreaRef.current) {
      painter.lockHistory();
      painter.setCanvasSize(width, height);
      painter.addLayer();
      painter.addLayer();//もう一枚追加する
      painter.selectLayer(1);
      painter.unlockHistory();
      setInit(true);
      if (canvasAreaRef.current && painterCanvasRef.current) {
        const alreadyPainterDom = document.getElementById("main_canvas_area");
        if (alreadyPainterDom) {
          canvasAreaRef.current.removeChild(alreadyPainterDom);
        }
        const _painterDom = painter.getDOMElement();
        _painterDom.id = "main_canvas_area";
        canvasAreaRef.current.appendChild(_painterDom);
        _painterDom.addEventListener('pointerdown', (e: PointerEvent) => {});//最初の発火
        painterCanvasRef.current.addEventListener('touchstart', (event)=>{
          event.preventDefault();
          // if (userDevice==='ios' && select_input_type==='pen'){
          //   const touches = event.changedTouches;
          //   if ( touches.length === 2 ) {
          //     croquis.undo();
          //   }
          // }
        });
      }
    }
  }, []);

  useEffect(() => {
    if (srcLayerRef.current) {
      srcLayerCtx.current = srcLayerRef.current.getContext("2d");
      srcLayerRef.current.width = width;
      srcLayerRef.current.height = height;
    }
  }, [painter]);

  // ショートカット処理
  useEffect(() => {
    const documentKeyDown = (e: KeyboardEvent) => {
      if (painter){
        // UndoとRedoをキーボードショートカットで実行
        if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          painter.undo();
        } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          painter.redo();
        } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          // Save処理
        }
      }
    };
    document.addEventListener('keydown', documentKeyDown);
    return () => {
      document.removeEventListener('keydown', documentKeyDown);
    }
  }, [painter]);
  
  const PaintCanvasAreaStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    touchAction: 'none',
  };
  const canvasStyle: React.CSSProperties = {
    backgroundColor,
    boxShadow: `${backgroundColor} 0px 2px 8px 0px`,
  };

  return (
    <div id="canvas_area" className="paint-canvas-area" style={PaintCanvasAreaStyle} ref={canvasAreaRef} onContextMenu={() => false}>
      <canvas id="src_layer" ref={srcLayerRef} className="paint-canvas" style={{ display: "none", ...canvasStyle }}></canvas>
      <div id="painter-canvas" className="paint-canvas" ref={painterCanvasRef}></div>
      <canvas id="default_layer" className="paint-canvas"></canvas>
    </div>
  )
}

export { ReactRichPainter };
