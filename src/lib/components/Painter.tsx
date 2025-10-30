import React, { useRef, useEffect, useState } from 'react';
import { RichPainter } from '../utils';
import { ToolBar, BrushBar } from "./ui";
import { Brush } from './Brush';
import { SelectionOverlay } from './SelectionOverlay';
import { LayerPanel } from './ui/panels/LayerPanel';
import { canvasPointerDown, canvasPointerMove, canvasPointerUp } from '../utils/canvas';
import { PainterProvider } from './PainterContext';
import { useCanvasStore } from './store/canvas';
import { useToolStore } from './store';
import { useSelectionStore } from './store/selection';
import { useBrushBarStore } from './store/brush';
import { useUiStore } from './store/ui';

type ReactRichPainterProps = {
  width?: number;
  height?: number;
  autoSize?: boolean; // 親要素のサイズから自動的にキャンバスサイズを決定するかどうか（デフォルト: true）
  toolbar?: boolean; // Toolbarを表示するかどうか
  brushbar?: boolean; // Brushbarを表示するかどうか
  appendBrushImages?: string[]; // TODO: 追加のBrush画像
  defaultCustomBrush?: boolean; // デフォルトのカスタムブラシ（b0~b4.png）を使用するかどうか
  backgroundSize?: number; // 背景タイルの大きさ
  backgroundTileColor?: string; // 背景タイルの色
};

const ReactRichPainter: React.FC<ReactRichPainterProps> = ({
  width: propWidth,
  height: propHeight,
  autoSize = true,
  toolbar=true,
  brushbar=true,
  defaultCustomBrush=true,
  backgroundSize=20,
  backgroundTileColor="#1e1e1e"
}) => {
  const [painter, setPainter] = useState<RichPainter>();
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [canvasSize, setCanvasSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  const {
    setCustomBrushImages,
    spacing,
    flow,
    merge,
    minimumSize,
    stabilizeLevel,
    stabilizeWeight,
  } = useBrushBarStore();

  const { isLayerPanelOpen } = useUiStore();

  // autoSizeがfalseの場合、widthとheightが必須であることをチェック
  useEffect(() => {
    if (!autoSize && (propWidth === undefined || propHeight === undefined)) {
      console.error('ReactRichPainter: autoSize=false の場合、width と height の指定が必要です。');
    }
  }, [autoSize, propWidth, propHeight]);

  // autoSizeがtrueの場合、親要素のサイズを監視
  useEffect(() => {
    if (!autoSize) {
      // autoSizeがfalseの場合、propで指定されたサイズを使用
      if (propWidth !== undefined && propHeight !== undefined) {
        setCanvasSize({ width: propWidth, height: propHeight });
      }
      return;
    }

    if (!canvasContainerRef.current) return;

    const updateSize = () => {
      if (canvasContainerRef.current) {
        const parentElement = canvasContainerRef.current.parentElement;
        if (parentElement) {
          const parentWidth = parentElement.clientWidth;
          const parentHeight = parentElement.clientHeight;
          const newWidth = Math.floor(parentWidth * 0.8);
          const newHeight = Math.floor(parentHeight * 0.8);
          setCanvasSize({ width: newWidth, height: newHeight });
        }
      }
    };

    // 初期サイズを設定
    updateSize();

    // ResizeObserverで親要素のサイズ変更を監視
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    const parentElement = canvasContainerRef.current.parentElement;
    if (parentElement) {
      resizeObserver.observe(parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [autoSize, propWidth, propHeight]);

  useEffect(() => {
    // RichPainter の初期化（最初のみ）
    const painter = new RichPainter({
      undoLimit: 30,
      initSize: { width: 800, height: 600 }, // 初期サイズは固定値
    });

    // 滑らかな線を実現するためのスタビライザー設定
    painter.setToolStabilizeLevel(5);
    painter.setToolStabilizeWeight(0.5);

    // Brushの初期設定
    const brush = painter.getBrush();
    if (brush) {
      brush.setSize(10);
      brush.setColor('#000000');
      brush.setSpacing(0.05);
      brush.setFlow(1.0);
      brush.setMerge(0.2);
      brush.setMinimumSize(0.01);
    }

    setPainter(painter);
  }, []); // 空の依存配列で一度だけ初期化

  // キャンバスサイズが変更された時にpainterのサイズを更新
  useEffect(() => {
    if (painter && painter.getCanvasSize().width !== canvasSize.width ||
        painter && painter.getCanvasSize().height !== canvasSize.height) {
      painter.lockHistory();
      painter.setCanvasSize(canvasSize.width, canvasSize.height);
      painter.unlockHistory();
    }
  }, [painter, canvasSize.width, canvasSize.height]);

  // ストアの設定値が変更されたときにPainter/Brushを更新（初期化後）
  useEffect(() => {
    if (!painter) return;

    const brush = painter.getBrush();
    if (!brush) return;

    brush.setSpacing(spacing);
    brush.setFlow(flow);
    brush.setMerge(merge);
    brush.setMinimumSize(minimumSize);
    painter.setToolStabilizeLevel(stabilizeLevel);
    painter.setToolStabilizeWeight(stabilizeWeight);
  }, [painter, spacing, flow, merge, minimumSize, stabilizeLevel, stabilizeWeight]);

  // デフォルトカスタムブラシの読み込み
  useEffect(() => {
    if (!defaultCustomBrush) return;

    const brushPaths = [
      '/brush/b0.png',
      '/brush/b1.png',
      '/brush/b2.png',
      '/brush/b3.png',
      '/brush/b4.png',
    ];

    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    brushPaths.forEach((path, index) => {
      const img = new Image();
      img.src = path;
      img.onload = () => {
        loadedImages[index] = img;
        loadedCount++;
        if (loadedCount === brushPaths.length) {
          setCustomBrushImages(loadedImages);
        }
      };
      img.onerror = () => {
        console.error(`Failed to load brush image: ${path}`);
        loadedCount++;
        if (loadedCount === brushPaths.length) {
          setCustomBrushImages(loadedImages.filter(img => img !== undefined));
        }
      };
    });
  }, [defaultCustomBrush, setCustomBrushImages]);

  return (
    <div
      ref={canvasContainerRef}
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: backgroundTileColor,
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
      {painter ? (
        <PainterProvider painter={painter}>
          <PaintCanvas
            painter={painter}
            width={canvasSize.width}
            height={canvasSize.height}
          />
          <Brush painter={painter} />
          {toolbar && <ToolBar />}
          {brushbar && <BrushBar />}
          {isLayerPanelOpen && <LayerPanel />}
        </PainterProvider>
      ) : null}
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

  const initRef = useRef(false);
  const canvasAreaRef = useRef<HTMLDivElement | null>(null);
  const srcLayerRef = useRef<HTMLCanvasElement | null>(null);
  const srcLayerCtx = useRef<CanvasRenderingContext2D | null>(null);
  const painterCanvasRef = useRef<HTMLDivElement | null>(null);

  const { offsetX, offsetY, setOffset } = useCanvasStore();

  // HandMoveツール用の状態
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const offsetXRef = useRef(offsetX);
  const offsetYRef = useRef(offsetY);

  // offsetの最新値をrefに保存
  useEffect(() => {
    offsetXRef.current = offsetX;
    offsetYRef.current = offsetY;
  }, [offsetX, offsetY]);

  // 初期位置を中央に設定
  useEffect(() => {
    if (canvasAreaRef.current) {
      const container = canvasAreaRef.current.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const initialX = (containerWidth - width) / 2;
        const initialY = (containerHeight - height) / 2;
        setOffset(initialX, initialY);
      }
    }
  }, [width, height, setOffset]);

  // キャンバスエリアにtransformを適用
  useEffect(() => {
    if (canvasAreaRef.current) {
      canvasAreaRef.current.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }
  }, [offsetX, offsetY]);

  useEffect(() => {
    if (!initRef.current && canvasAreaRef.current) {
      initRef.current = true;
      painter.lockHistory();
      painter.setCanvasSize(width, height);
      painter.addLayer();
      painter.addLayer();//もう一枚追加する
      painter.selectLayer(1);
      painter.unlockHistory();
      if (canvasAreaRef.current && painterCanvasRef.current) {
        const alreadyPainterDom = document.getElementById("main_canvas_area");
        if (alreadyPainterDom && alreadyPainterDom.parentNode === canvasAreaRef.current) {
          canvasAreaRef.current.removeChild(alreadyPainterDom);
        }
        const _painterDom = painter.getDOMElement();
        _painterDom.id = "main_canvas_area";
        canvasAreaRef.current.appendChild(_painterDom);
        
        // イベントリスナーの設定を整理
        _painterDom.addEventListener('pointerdown', (e: PointerEvent) => {
          e.preventDefault();
          _painterDom.setPointerCapture(e.pointerId);

          // 最新のツール状態を直接ストアから取得
          const currentToolState = useToolStore.getState().currentTool;

          // HandMoveツール選択時はキャンバス移動
          if (currentToolState === 'move') {
            _painterDom.style.cursor = 'grabbing';
            isDragging.current = true;
            dragStart.current = { x: e.clientX, y: e.clientY };
            dragOffset.current = { x: offsetXRef.current, y: offsetYRef.current };
            return;
          }

          // Lassoツール選択時は選択パス描画または選択範囲の移動
          if (currentToolState === 'lasso') {
            const rect = _painterDom.getBoundingClientRect();
            // transformが適用されているので、getBoundingClientRect()は既に移動後の位置
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const selectionStore = useSelectionStore.getState();

            // 既に選択範囲がある場合、クリック位置が選択範囲内かチェック
            if (selectionStore.hasSelection && selectionStore.selectionPath.length > 2) {
              // Point-in-polygon test (Ray casting algorithm)
              const isInside = (px: number, py: number, polygon: {x: number, y: number}[]) => {
                let inside = false;
                for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                  const xi = polygon[i].x + selectionStore.selectionOffset.x;
                  const yi = polygon[i].y + selectionStore.selectionOffset.y;
                  const xj = polygon[j].x + selectionStore.selectionOffset.x;
                  const yj = polygon[j].y + selectionStore.selectionOffset.y;
                  const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
                  if (intersect) inside = !inside;
                }
                return inside;
              };

              if (isInside(x, y, selectionStore.selectionPath)) {
                // 選択範囲内をクリックした場合、移動モードを開始
                selectionStore.startMoving();
                dragStart.current = { x: e.clientX, y: e.clientY };
                dragOffset.current = { x: selectionStore.selectionOffset.x, y: selectionStore.selectionOffset.y };
                return;
              } else {
                // 選択範囲外をクリックした場合、選択を解除するのみ（新しい選択は開始しない）
                selectionStore.clearSelection();
                _painterDom.style.cursor = 'crosshair';
                return;
              }
            }

            // 選択がない状態で新しい選択を開始
            selectionStore.startSelection();
            selectionStore.addPoint({ x, y });
            return;
          }

          // 通常の描画処理
          canvasPointerDown({e, painter, brush: painter.getBrush()!});
        });

        _painterDom.addEventListener('pointermove', (e: PointerEvent) => {
          e.preventDefault();

          // 最新のツール状態を直接ストアから取得
          const currentToolState = useToolStore.getState().currentTool;

          // HandMoveツール選択時はキャンバス移動
          if (currentToolState === 'move' && isDragging.current) {
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            setOffset(
              dragOffset.current.x + dx,
              dragOffset.current.y + dy
            );
            return;
          }

          // Lassoツール選択時は選択パスに点を追加または選択範囲を移動
          if (currentToolState === 'lasso') {
            const selectionStore = useSelectionStore.getState();

            // 選択範囲を移動中の場合
            if (selectionStore.isMovingSelection) {
              const dx = e.clientX - dragStart.current.x;
              const dy = e.clientY - dragStart.current.y;
              selectionStore.updateOffset(
                dragOffset.current.x + dx,
                dragOffset.current.y + dy
              );
              return;
            }

            // 選択パスを描画中の場合
            if (selectionStore.isSelecting) {
              const rect = _painterDom.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              selectionStore.addPoint({ x, y });
            }

            // カーソルの更新（選択範囲内かどうかチェック）
            if (selectionStore.hasSelection && selectionStore.selectionPath.length > 2) {
              const rect = _painterDom.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;

              const isInside = (px: number, py: number, polygon: {x: number, y: number}[]) => {
                let inside = false;
                for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                  const xi = polygon[i].x + selectionStore.selectionOffset.x;
                  const yi = polygon[i].y + selectionStore.selectionOffset.y;
                  const xj = polygon[j].x + selectionStore.selectionOffset.x;
                  const yj = polygon[j].y + selectionStore.selectionOffset.y;
                  const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
                  if (intersect) inside = !inside;
                }
                return inside;
              };

              if (isInside(x, y, selectionStore.selectionPath)) {
                _painterDom.style.cursor = selectionStore.isMovingSelection ? 'grabbing' : 'grab';
              } else {
                _painterDom.style.cursor = 'crosshair';
              }
            } else {
              _painterDom.style.cursor = 'crosshair';
            }

            return;
          }

          // 通常の描画処理
          canvasPointerMove({
            e,
            painter,
            brush: painter.getBrush()!
          });
        });

        _painterDom.addEventListener('pointerup', (e: PointerEvent) => {
          e.preventDefault();
          _painterDom.releasePointerCapture(e.pointerId);

          // 最新のツール状態を直接ストアから取得
          const currentToolState = useToolStore.getState().currentTool;

          // HandMoveツール選択時
          if (currentToolState === 'move') {
            _painterDom.style.cursor = 'grab';
            isDragging.current = false;
            return;
          }

          // Lassoツール選択時は選択を確定、または移動を完了
          if (currentToolState === 'lasso') {
            const selectionStore = useSelectionStore.getState();

            // 選択範囲の移動を完了
            if (selectionStore.isMovingSelection) {
              // 移動を停止
              selectionStore.stopMoving();

              // キャンバスに変更を適用
              const path = selectionStore.selectionPath;
              const offset = selectionStore.selectionOffset;
              const imageData = selectionStore.selectedImageData;

              if (imageData && path.length > 2) {
                const currentLayerCanvas = painter.getLayerCanvas(painter.getCurrentLayerIndex());
                const ctx = currentLayerCanvas.getContext('2d');

                if (ctx) {
                  // 元の選択範囲をクリア
                  ctx.save();
                  ctx.globalCompositeOperation = 'destination-out';
                  ctx.beginPath();
                  ctx.moveTo(path[0].x, path[0].y);
                  for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                  }
                  ctx.closePath();
                  ctx.fill();
                  ctx.restore();

                  // 新しい位置に画像を描画
                  const minX = Math.min(...path.map(p => p.x));
                  const minY = Math.min(...path.map(p => p.y));

                  // 一時キャンバスで画像データを描画
                  const tempCanvas = document.createElement('canvas');
                  tempCanvas.width = imageData.width;
                  tempCanvas.height = imageData.height;
                  const tempCtx = tempCanvas.getContext('2d');

                  if (tempCtx) {
                    tempCtx.putImageData(imageData, 0, 0);

                    // 新しい位置にクリッピングして描画
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(path[0].x + offset.x, path[0].y + offset.y);
                    for (let i = 1; i < path.length; i++) {
                      ctx.lineTo(path[i].x + offset.x, path[i].y + offset.y);
                    }
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(tempCanvas, minX + offset.x, minY + offset.y);
                    ctx.restore();
                  }

                  // 選択をクリア
                  selectionStore.clearSelection();

                  // カーソルをcrosshairに戻す
                  _painterDom.style.cursor = 'crosshair';
                }
              }
              return;
            }

            // 選択パス描画を完了
            if (selectionStore.isSelecting && selectionStore.selectionPath.length > 2) {
              // 選択を確定
              selectionStore.finishSelection();

              // 選択範囲の境界を計算
              const path = selectionStore.selectionPath;
              const minX = Math.min(...path.map(p => p.x));
              const maxX = Math.max(...path.map(p => p.x));
              const minY = Math.min(...path.map(p => p.y));
              const maxY = Math.max(...path.map(p => p.y));
              const selectionWidth = maxX - minX;
              const selectionHeight = maxY - minY;

              // 現在のレイヤーから画像データを取得
              const currentLayerCanvas = painter.getLayerCanvas(painter.getCurrentLayerIndex());
              if (currentLayerCanvas) {
                const ctx = currentLayerCanvas.getContext('2d');
                if (ctx) {
                  // 選択範囲の画像データを取得
                  const imageData = ctx.getImageData(minX, minY, selectionWidth, selectionHeight);

                  // クリッピングパスを使用して選択範囲外をマスク
                  const maskCanvas = document.createElement('canvas');
                  maskCanvas.width = selectionWidth;
                  maskCanvas.height = selectionHeight;
                  const maskCtx = maskCanvas.getContext('2d');

                  if (maskCtx) {
                    // 選択パスを描画（座標をオフセット）
                    maskCtx.beginPath();
                    maskCtx.moveTo(path[0].x - minX, path[0].y - minY);
                    for (let i = 1; i < path.length; i++) {
                      maskCtx.lineTo(path[i].x - minX, path[i].y - minY);
                    }
                    maskCtx.closePath();
                    maskCtx.clip();

                    // 画像データを描画
                    maskCtx.putImageData(imageData, 0, 0);

                    // マスクされた画像データを取得
                    const maskedImageData = maskCtx.getImageData(0, 0, selectionWidth, selectionHeight);
                    selectionStore.setImageData(maskedImageData);
                  }
                }
              }
            }
            return;
          }

          // 通常の描画処理
          canvasPointerUp({e, painter, brush: painter.getBrush()!, isDrawStatus: true, userSelectInputType: 'pen', canvasArea: canvasAreaRef.current! });
        });

        _painterDom.addEventListener('pointercancel', (e: PointerEvent) => {
          e.preventDefault();
          _painterDom.releasePointerCapture(e.pointerId);

          // 最新のツール状態を直接ストアから取得
          const currentToolState = useToolStore.getState().currentTool;

          if (currentToolState === 'move') {
            isDragging.current = false;
            return;
          }

          if (painter.getIsDrawing()) {
            canvasPointerUp({e, painter, brush: painter.getBrush()!, isDrawStatus: true, userSelectInputType: 'pen', canvasArea: canvasAreaRef.current! });
          }
        });
        
        // touchstartイベントは削除（pointerdownで代用可能）
        // painterCanvasRef.current.addEventListener('touchstart', (event)=>{
        //   event.preventDefault();
        //   alert('touchstart');
        // });
      }
    }

    // クリーンアップ関数：コンポーネントのアンマウント時にDOM要素を削除
    return () => {
      if (canvasAreaRef.current) {
        const painterDom = document.getElementById("main_canvas_area");
        if (painterDom && painterDom.parentNode === canvasAreaRef.current) {
          canvasAreaRef.current.removeChild(painterDom);
        }
      }
    };
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
          try {
            painter.undo();
          } catch (error) {
            // Undoスタックが空の場合は何もしない
            console.log('Undo not available:', error);
          }
        } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          try {
            painter.redo();
          } catch (error) {
            // Redoスタックが空の場合は何もしない
            console.log('Redo not available:', error);
          }
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
    position: 'absolute',
  };

  return (
    <div id="canvas_area" className="paint-canvas-area" style={PaintCanvasAreaStyle} ref={canvasAreaRef} onContextMenu={() => false}>
      <canvas id="src_layer" ref={srcLayerRef} className="paint-canvas" style={canvasStyle}></canvas>
      <div id="painter-canvas" className="paint-canvas" ref={painterCanvasRef} style={canvasStyle}></div>
      <canvas id="default_layer" className="paint-canvas" style={canvasStyle}></canvas>
      <SelectionOverlay width={width} height={height} />
    </div>
  )
}

export { ReactRichPainter };
