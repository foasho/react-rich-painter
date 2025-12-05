import { describe, it, expect, beforeEach } from 'vitest';
import { RichPainter } from '../utils/painter/RichPainter';

describe('RichPainter', () => {
  let painter: RichPainter;

  beforeEach(() => {
    painter = new RichPainter({
      undoLimit: 10,
      initSize: { width: 100, height: 100 },
    });
  });

  describe('初期化', () => {
    it('指定したサイズでキャンバスが作成される', () => {
      const size = painter.getCanvasSize();
      expect(size.width).toBe(100);
      expect(size.height).toBe(100);
    });

    it('undoLimitが正しく設定される', () => {
      expect(painter.getUndoLimit()).toBe(10);
    });

    it('初期レイヤーが1つ作成される', () => {
      expect(painter.getLayerCount()).toBe(1);
    });

    it('初期レイヤーが選択されている', () => {
      expect(painter.getCurrentLayerIndex()).toBe(0);
    });

    it('DOMElementが取得できる', () => {
      const dom = painter.getDOMElement();
      expect(dom).toBeDefined();
      expect(dom instanceof HTMLElement).toBe(true);
    });

    it('Brushインスタンスが取得できる', () => {
      const brush = painter.getBrush();
      expect(brush).toBeDefined();
      expect(brush).not.toBeNull();
    });
  });

  describe('レイヤー管理', () => {
    describe('addLayer', () => {
      it('レイヤーを追加できる', () => {
        painter.addLayer();
        expect(painter.getLayerCount()).toBe(2);
      });

      it('指定したインデックスにレイヤーを追加できる', () => {
        painter.addLayer(0);
        expect(painter.getLayerCount()).toBe(2);
      });

      it('複数のレイヤーを追加できる', () => {
        painter.addLayer();
        painter.addLayer();
        painter.addLayer();
        expect(painter.getLayerCount()).toBe(4);
      });

      it('onLayerAddedコールバックが呼ばれる', () => {
        let calledWith: number | undefined;
        painter.onLayerAdded = (index) => {
          calledWith = index;
        };
        painter.addLayer();
        expect(calledWith).toBe(1);
      });
    });

    describe('removeLayer', () => {
      it('レイヤーを削除できる', () => {
        painter.addLayer();
        expect(painter.getLayerCount()).toBe(2);
        painter.removeLayer(1);
        expect(painter.getLayerCount()).toBe(1);
      });

      it('onLayerRemovedコールバックが呼ばれる', () => {
        painter.addLayer();
        let calledWith: number | undefined;
        painter.onLayerRemoved = (index) => {
          calledWith = index;
        };
        painter.removeLayer(1);
        expect(calledWith).toBe(1);
      });

      it('現在選択中のレイヤーより後のレイヤーを削除しても選択インデックスが変わらない', () => {
        painter.addLayer();
        painter.addLayer();
        painter.selectLayer(0);
        painter.removeLayer(2);
        expect(painter.getCurrentLayerIndex()).toBe(0);
      });
    });

    describe('selectLayer', () => {
      it('レイヤーを選択できる', () => {
        painter.addLayer();
        painter.addLayer();
        painter.selectLayer(1);
        expect(painter.getCurrentLayerIndex()).toBe(1);
      });

      it('範囲外のインデックスは最後のレイヤーに補正される', () => {
        painter.addLayer();
        painter.selectLayer(100);
        expect(painter.getCurrentLayerIndex()).toBe(1);
      });

      it('onLayerSelectedコールバックが呼ばれる', () => {
        painter.addLayer();
        let calledWith: number | undefined;
        painter.onLayerSelected = (index) => {
          calledWith = index;
        };
        painter.selectLayer(1);
        expect(calledWith).toBe(1);
      });
    });

    describe('swapLayer', () => {
      it('レイヤーを入れ替えできる', () => {
        painter.addLayer();
        painter.addLayer();
        const layers = painter.getLayers();
        expect(layers.length).toBe(3);
      });

      it('onLayerSwappedコールバックが呼ばれる', () => {
        painter.addLayer();
        let calledA: number | undefined;
        let calledB: number | undefined;
        painter.onLayerSwapped = (a, b) => {
          calledA = a;
          calledB = b;
        };
        painter.swapLayer(0, 1);
        expect(calledA).toBe(0);
        expect(calledB).toBe(1);
      });
    });

    describe('getLayerCanvas / getLayerContext', () => {
      it('レイヤーのキャンバスを取得できる', () => {
        const canvas = painter.getLayerCanvas(0);
        expect(canvas).toBeDefined();
        expect(canvas instanceof HTMLCanvasElement).toBe(true);
      });

      it('レイヤーのコンテキストを取得できる', () => {
        const context = painter.getLayerContext(0);
        expect(context).toBeDefined();
      });

      it('現在のレイヤーのコンテキストを取得できる', () => {
        const context = painter.getNowLayerContext();
        expect(context).toBeDefined();
      });
    });
  });

  describe('レイヤー不透明度と可視化', () => {
    describe('opacity', () => {
      it('デフォルトの不透明度は1', () => {
        expect(painter.getLayerOpacity(0)).toBe(1);
      });

      it('不透明度を設定できる', () => {
        painter.setLayerOpacity(0.5, 0);
        expect(painter.getLayerOpacity(0)).toBe(0.5);
      });

      it('インデックスを省略すると現在のレイヤーが対象になる', () => {
        painter.setLayerOpacity(0.7);
        expect(painter.getLayerOpacity()).toBe(0.7);
      });
    });

    describe('visibility', () => {
      it('デフォルトで可視状態', () => {
        expect(painter.getLayerVisible(0)).toBe(true);
      });

      it('可視状態を設定できる', () => {
        painter.setLayerVisible(false, 0);
        expect(painter.getLayerVisible(0)).toBe(false);
      });

      it('可視状態を復元できる', () => {
        painter.setLayerVisible(false, 0);
        painter.setLayerVisible(true, 0);
        expect(painter.getLayerVisible(0)).toBe(true);
      });
    });
  });

  describe('Undo/Redo', () => {
    describe('基本動作', () => {
      it('Undoスタックが空の場合エラーをスローする', () => {
        expect(() => painter.undo()).toThrow('no more undo data');
      });

      it('Redoスタックが空の場合エラーをスローする', () => {
        expect(() => painter.redo()).toThrow('no more redo data');
      });
    });

    describe('History Lock', () => {
      it('lockHistoryでUndo記録が無効化される', () => {
        painter.lockHistory();
        expect(() => painter.undo()).toThrow('history is locked');
      });

      it('unlockHistoryでUndo記録が再開される', () => {
        painter.lockHistory();
        painter.unlockHistory();
        expect(() => painter.undo()).toThrow('no more undo data');
      });

      it('clearHistoryはlockHistory中に呼び出せない', () => {
        painter.lockHistory();
        expect(() => painter.clearHistory()).toThrow(
          'Cannot clear history while history is locked'
        );
        painter.unlockHistory();
      });
    });

    describe('レイヤー操作のUndo', () => {
      it('レイヤー削除をUndoできる', () => {
        painter.addLayer();
        expect(painter.getLayerCount()).toBe(2);
        painter.removeLayer(1);
        expect(painter.getLayerCount()).toBe(1);
        painter.undo();
        expect(painter.getLayerCount()).toBe(2);
      });

      it('レイヤー削除のUndoをRedoできる', () => {
        painter.addLayer();
        painter.removeLayer(1);
        painter.undo();
        painter.redo();
        expect(painter.getLayerCount()).toBe(1);
      });

      it('不透明度変更をUndoできる', () => {
        painter.setLayerOpacity(0.5, 0);
        expect(painter.getLayerOpacity(0)).toBe(0.5);
        painter.undo();
        expect(painter.getLayerOpacity(0)).toBe(1);
      });

      it('可視状態変更をUndoできる', () => {
        painter.setLayerVisible(false, 0);
        expect(painter.getLayerVisible(0)).toBe(false);
        painter.undo();
        expect(painter.getLayerVisible(0)).toBe(true);
      });

      it('レイヤー入れ替えをUndoできる', () => {
        painter.addLayer();
        painter.swapLayer(0, 1);
        painter.undo();
        expect(painter.getLayerCount()).toBe(2);
      });
    });

    describe('トランザクション', () => {
      it('トランザクション中はpushが同じスタックにまとめられる', () => {
        painter.beginHistoryTransaction();
        painter.setLayerOpacity(0.5, 0);
        painter.setLayerOpacity(0.3, 0);
        painter.endHistoryTransaction();
        painter.undo();
        expect(painter.getLayerOpacity(0)).toBe(1);
      });

      it('トランザクション中にUndoを呼ぶとエラー', () => {
        painter.beginHistoryTransaction();
        expect(() => painter.undo()).toThrow('transaction is not ended');
        painter.endHistoryTransaction();
      });
    });

    describe('undoLimit', () => {
      it('undoLimitを超えると古いエントリが削除される', () => {
        for (let i = 0; i < 15; i++) {
          painter.setLayerOpacity(0.9 - i * 0.05, 0);
        }
        let undoCount = 0;
        try {
          while (true) {
            painter.undo();
            undoCount++;
          }
        } catch {
          // no more undo data
        }
        expect(undoCount).toBe(10);
      });
    });
  });

  describe('キャンバスサイズ', () => {
    it('キャンバスサイズを変更できる', () => {
      painter.setCanvasSize(200, 150);
      const size = painter.getCanvasSize();
      expect(size.width).toBe(200);
      expect(size.height).toBe(150);
    });

    it('キャンバス幅のみ変更できる', () => {
      painter.setCanvasWidth(250);
      expect(painter.getCanvasWidth()).toBe(250);
      expect(painter.getCanvasHeight()).toBe(100);
    });

    it('キャンバス高さのみ変更できる', () => {
      painter.setCanvasHeight(180);
      expect(painter.getCanvasWidth()).toBe(100);
      expect(painter.getCanvasHeight()).toBe(180);
    });

    it('サイズ変更をUndoできる', () => {
      painter.setCanvasSize(200, 200);
      painter.undo();
      const size = painter.getCanvasSize();
      expect(size.width).toBe(100);
      expect(size.height).toBe(100);
    });
  });

  describe('ツール設定', () => {
    it('ツールを設定・取得できる', () => {
      painter.setTool('eraser');
      expect(painter.getTool()).toBe('eraser');
    });

    it('描画不透明度を設定・取得できる', () => {
      painter.setPaintingOpacity(0.5);
      expect(painter.getPaintingOpacity()).toBe(0.5);
    });

    it('knockoutモードを設定・取得できる', () => {
      painter.setPaintingKnockout(true);
      expect(painter.getPaintingKnockout()).toBe(true);
    });

    it('clippingモードを設定・取得できる', () => {
      painter.setPaintingClipping(true);
      expect(painter.getPaintingClipping()).toBe(true);
    });

    it('fingerモードを設定・取得できる', () => {
      painter.setPaintingFinger(true);
      expect(painter.getPaintingFinger()).toBe(true);
    });

    it('スタビライザーレベルを設定・取得できる', () => {
      painter.setToolStabilizeLevel(5);
      expect(painter.getToolStabilizeLevel()).toBe(5);
    });

    it('スタビライザーレベルは負の値が0に補正される', () => {
      painter.setToolStabilizeLevel(-5);
      expect(painter.getToolStabilizeLevel()).toBe(0);
    });

    it('スタビライザーウェイトを設定・取得できる', () => {
      painter.setToolStabilizeWeight(0.5);
      expect(painter.getToolStabilizeWeight()).toBe(0.5);
    });

    it('tickIntervalを設定・取得できる', () => {
      painter.setTickInterval(30);
      expect(painter.getTickInterval()).toBe(30);
    });

    it('stabilizerIntervalを設定・取得できる', () => {
      painter.setStabilizerInterval(10);
      expect(painter.getStabilizerInterval()).toBe(10);
    });
  });

  describe('描画処理', () => {
    it('isDrawingの初期値はfalse', () => {
      expect(painter.getIsDrawing()).toBe(false);
    });

    it('down後はisDrawingがtrueになる', () => {
      painter.down(50, 50, 0.5);
      expect(painter.getIsDrawing()).toBe(true);
    });

    it('描画中にdownを呼ぶとエラー', () => {
      painter.down(50, 50, 0.5);
      expect(() => painter.down(60, 60, 0.5)).toThrow('still drawing');
    });

    it('up後はisDrawingがfalseになる', () => {
      painter.down(50, 50, 0.5);
      painter.up(60, 60, 0.5);
      expect(painter.getIsDrawing()).toBe(false);
    });

    it('downせずにupを呼ぶとエラー', () => {
      expect(() => painter.up(50, 50, 0.5)).toThrow(
        "you need to call 'down' first"
      );
    });

    it('moveはisDrawing中のみ処理される', () => {
      painter.move(50, 50, 0.5);
      expect(painter.getIsDrawing()).toBe(false);
    });

    it('コールバックが正しく呼ばれる', () => {
      let downCalled = false;
      let moveCalled = false;
      let upCalled = false;

      painter.onDowned = () => {
        downCalled = true;
      };
      painter.onMoved = () => {
        moveCalled = true;
      };
      painter.onUpped = () => {
        upCalled = true;
      };

      painter.down(50, 50, 0.5);
      expect(downCalled).toBe(true);

      painter.move(60, 60, 0.5);
      expect(moveCalled).toBe(true);

      painter.up(70, 70, 0.5);
      expect(upCalled).toBe(true);
    });
  });

  describe('レイヤー操作', () => {
    describe('clearLayer', () => {
      it('レイヤーをクリアできる', () => {
        painter.clearLayer(0);
        expect(painter.getLayerCount()).toBe(1);
      });
    });

    describe('fillLayer', () => {
      it('レイヤーを塗りつぶしできる', () => {
        painter.fillLayer('#ff0000', 0);
        expect(painter.getLayerCount()).toBe(1);
      });
    });

    describe('fillLayerRect', () => {
      it('矩形範囲を塗りつぶしできる', () => {
        painter.fillLayerRect('#00ff00', 10, 10, 50, 50, 0);
        expect(painter.getLayerCount()).toBe(1);
      });
    });
  });

  describe('サムネイル生成', () => {
    it('レイヤーサムネイルを生成できる', () => {
      const thumbnail = painter.createLayerThumbnail(0, 50, 50);
      expect(thumbnail).toBeDefined();
      expect(thumbnail instanceof HTMLCanvasElement).toBe(true);
      expect(thumbnail.width).toBe(50);
      expect(thumbnail.height).toBe(50);
    });

    it('統合サムネイルを生成できる', () => {
      painter.addLayer();
      const thumbnail = painter.createFlattenThumbnail(50, 50);
      expect(thumbnail).toBeDefined();
      expect(thumbnail instanceof HTMLCanvasElement).toBe(true);
      expect(thumbnail.width).toBe(50);
      expect(thumbnail.height).toBe(50);
    });

    it('サイズを省略するとキャンバスサイズが使用される', () => {
      const thumbnail = painter.createLayerThumbnail();
      expect(thumbnail.width).toBe(100);
      expect(thumbnail.height).toBe(100);
    });
  });

  describe('リモートストローク機能', () => {
    const mockBrushConfig = {
      color: '#ff0000',
      size: 10,
      opacity: 100,
      spacing: 0.1,
      flow: 1,
      merge: 0,
      minimumSize: 0.1,
      toolType: 'pen' as const,
    };

    it('リモートストロークを開始できる', () => {
      painter.remoteDown('user1', 50, 50, 0.5, 0, mockBrushConfig, 'TestUser');
      const users = painter.getRemoteUsers();
      expect(users.length).toBe(1);
      expect(users[0].userId).toBe('user1');
      expect(users[0].userName).toBe('TestUser');
    });

    it('リモートストロークを移動できる', () => {
      painter.remoteDown('user1', 50, 50, 0.5, 0, mockBrushConfig);
      painter.remoteMove('user1', 60, 60, 0.5);
      const users = painter.getRemoteUsers();
      expect(users.length).toBe(1);
    });

    it('リモートストロークを終了できる', () => {
      painter.remoteDown('user1', 50, 50, 0.5, 0, mockBrushConfig);
      painter.remoteUp('user1', 70, 70, 0.5);
      const users = painter.getRemoteUsers();
      expect(users.length).toBe(0);
    });

    it('リモートユーザーを強制削除できる', () => {
      painter.remoteDown('user1', 50, 50, 0.5, 0, mockBrushConfig);
      painter.removeRemoteUser('user1');
      const users = painter.getRemoteUsers();
      expect(users.length).toBe(0);
    });

    it('全リモートユーザーをクリアできる', () => {
      painter.remoteDown('user1', 50, 50, 0.5, 0, mockBrushConfig);
      painter.remoteDown('user2', 60, 60, 0.5, 0, mockBrushConfig);
      painter.clearRemoteUsers();
      const users = painter.getRemoteUsers();
      expect(users.length).toBe(0);
    });
  });

  describe('座標変換', () => {
    it('相対座標を取得できる', () => {
      const pos = painter.getRelativePosition(100, 100);
      expect(pos).toHaveProperty('x');
      expect(pos).toHaveProperty('y');
    });
  });
});
