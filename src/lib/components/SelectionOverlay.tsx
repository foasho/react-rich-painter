import React, { useRef, useEffect } from 'react';
import { useSelectionStore } from './store/selection';

type SelectionOverlayProps = {
  width: number;
  height: number;
};

/**
 * 選択範囲を描画するオーバーレイキャンバス
 * - 選択中: 選択パスを点線で表示
 * - 選択確定後: マーチングアンツ（動く点線）で表示
 * - 移動中: 選択された画像を表示
 */
const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const { selectionPath, isSelecting, hasSelection, selectedImageData, selectionOffset, isMovingSelection } = useSelectionStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 選択がない場合はキャンバスをクリアして終了
    if (!hasSelection && !isSelecting) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    // 移動中の場合、選択画像を描画（アニメーションループで継続的に更新）
    if (isMovingSelection && selectedImageData && selectionPath.length > 2) {
      let animationId: number;
      let isRunning = true;

      const drawMoving = () => {
        // 移動が終了したらアニメーション停止
        const currentStore = useSelectionStore.getState();
        if (!isRunning || !currentStore.isMovingSelection) {
          ctx.clearRect(0, 0, width, height);
          return;
        }

        ctx.clearRect(0, 0, width, height);

        // 元の位置を半透明で描画（削除予定領域）
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
        for (let i = 1; i < selectionPath.length; i++) {
          ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 新しい位置に選択画像を描画
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = selectedImageData.width;
        tempCanvas.height = selectedImageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
          tempCtx.putImageData(selectedImageData, 0, 0);

          // 選択範囲の境界を計算
          const minX = Math.min(...selectionPath.map(p => p.x));
          const minY = Math.min(...selectionPath.map(p => p.y));

          // クリッピングパスを設定
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(selectionPath[0].x + selectionOffset.x, selectionPath[0].y + selectionOffset.y);
          for (let i = 1; i < selectionPath.length; i++) {
            ctx.lineTo(selectionPath[i].x + selectionOffset.x, selectionPath[i].y + selectionOffset.y);
          }
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(tempCanvas, minX + selectionOffset.x, minY + selectionOffset.y);
          ctx.restore();
        }

        // 新しい位置の境界線を描画
        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(selectionPath[0].x + selectionOffset.x, selectionPath[0].y + selectionOffset.y);
        for (let i = 1; i < selectionPath.length; i++) {
          ctx.lineTo(selectionPath[i].x + selectionOffset.x, selectionPath[i].y + selectionOffset.y);
        }
        ctx.closePath();
        ctx.stroke();

        // 白い線を重ねて描画
        ctx.strokeStyle = '#FFFFFF';
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -4;
        ctx.stroke();
        ctx.restore();

        animationId = requestAnimationFrame(drawMoving);
      };

      animationId = requestAnimationFrame(drawMoving);
      return () => {
        isRunning = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        ctx.clearRect(0, 0, width, height);
      };
    }

    // キャンバスをクリア
    ctx.clearRect(0, 0, width, height);

    // 選択中の場合、パスを描画
    if (isSelecting && selectionPath.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = 0;

      ctx.beginPath();
      ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
      for (let i = 1; i < selectionPath.length; i++) {
        ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 選択確定後の場合、マーチングアンツを描画
    if (hasSelection && selectionPath.length > 2 && !isMovingSelection) {
      let animationId: number;
      let isRunning = true;

      const drawMarchingAnts = (offset: number) => {
        ctx.clearRect(0, 0, width, height);
        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.lineDashOffset = -offset;

        ctx.beginPath();
        ctx.moveTo(selectionPath[0].x, selectionPath[0].y);
        for (let i = 1; i < selectionPath.length; i++) {
          ctx.lineTo(selectionPath[i].x, selectionPath[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // 白い線を重ねて描画（コントラストを高める）
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineDashOffset = -offset - 4;
        ctx.stroke();
        ctx.restore();
      };

      // アニメーション
      const animate = () => {
        // 選択が解除されたらアニメーション停止
        const currentStore = useSelectionStore.getState();
        if (!isRunning || !currentStore.hasSelection) {
          ctx.clearRect(0, 0, width, height);
          return;
        }

        animationRef.current = (animationRef.current + 0.5) % 8;
        drawMarchingAnts(animationRef.current);
        animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);
      return () => {
        isRunning = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        ctx.clearRect(0, 0, width, height);
      };
    }
  }, [selectionPath, isSelecting, hasSelection, selectedImageData, selectionOffset, isMovingSelection, width, height]);

  const canvasStyle: React.CSSProperties = {
    position: 'absolute',
    pointerEvents: 'none', // イベントを通過させる
    top: 0,
    left: 0,
    clipPath: `inset(0 0 0 0)`, // キャンバス範囲内に制限
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={canvasStyle}
    />
  );
};

export { SelectionOverlay };
