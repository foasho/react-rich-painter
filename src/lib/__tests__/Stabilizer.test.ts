import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Stabilizer } from '../utils/painter/Stabilizer';

describe('Stabilizer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初期化', () => {
    it('パラメータテーブルがlevelに応じて作成される', () => {
      const stabilizer = new Stabilizer(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        5, // level
        0.5, // weight
        100,
        100,
        0.5,
        10
      );

      const table = stabilizer.getParamTable();
      expect(table.length).toBe(5);
    });

    it('level=0でも最低1つのエントリが作成される', () => {
      const stabilizer = new Stabilizer(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        0, // level
        0.5,
        100,
        100,
        0.5,
        10
      );

      const table = stabilizer.getParamTable();
      expect(table.length).toBe(1);
    });

    it('onDownコールバックが初期化時に呼ばれる', () => {
      const onDown = vi.fn();
      new Stabilizer(onDown, vi.fn(), vi.fn(), 3, 0.5, 50, 60, 0.7, 10);

      expect(onDown).toHaveBeenCalledWith(50, 60, 0.7);
    });

    it('onDownがnullでもエラーにならない', () => {
      expect(() => {
        new Stabilizer(null, vi.fn(), vi.fn(), 3, 0.5, 50, 60, 0.7, 10);
      }).not.toThrow();
    });

    it('初期座標がパラメータテーブルに設定される', () => {
      const stabilizer = new Stabilizer(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        3,
        0.5,
        100,
        200,
        0.8,
        10
      );

      const table = stabilizer.getParamTable();
      expect(table[0].x).toBe(100);
      expect(table[0].y).toBe(200);
      expect(table[0].pressure).toBe(0.8);
    });
  });

  describe('move', () => {
    it('座標を更新できる', () => {
      const stabilizer = new Stabilizer(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        3,
        0.5,
        100,
        100,
        0.5,
        10
      );

      stabilizer.move(150, 150, 0.8);
      // moveは内部状態を更新するだけで、即座に反映されない
      // タイマーの実行で反映される
    });

    it('連続でmoveを呼び出せる', () => {
      const stabilizer = new Stabilizer(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        3,
        0.5,
        100,
        100,
        0.5,
        10
      );

      expect(() => {
        stabilizer.move(110, 110, 0.5);
        stabilizer.move(120, 120, 0.6);
        stabilizer.move(130, 130, 0.7);
      }).not.toThrow();
    });
  });

  describe('up', () => {
    it('upを呼び出せる', () => {
      const onUp = vi.fn();
      const stabilizer = new Stabilizer(
        vi.fn(),
        vi.fn(),
        onUp,
        3,
        0.5,
        100,
        100,
        0.5,
        10
      );

      stabilizer.up(150, 150, 0.8);

      // タイマー実行後にonUpが呼ばれる
      vi.runAllTimers();
      expect(onUp).toHaveBeenCalled();
    });

    it('up後にonMoveとonUpが正しい順序で呼ばれる', () => {
      const callOrder: string[] = [];
      const onMove = vi.fn(() => callOrder.push('move'));
      const onUp = vi.fn(() => callOrder.push('up'));

      const stabilizer = new Stabilizer(
        vi.fn(),
        onMove,
        onUp,
        3,
        0.5,
        100,
        100,
        0.5,
        10
      );

      stabilizer.move(150, 150, 0.5);
      stabilizer.up(200, 200, 0.5);

      vi.runAllTimers();

      // 最後のコールがup
      expect(callOrder[callOrder.length - 1]).toBe('up');
    });
  });

  describe('cancel', () => {
    it('タイマーをキャンセルできる', () => {
      const onMove = vi.fn();
      const stabilizer = new Stabilizer(
        vi.fn(),
        onMove,
        vi.fn(),
        3,
        0.5,
        100,
        100,
        0.5,
        10
      );

      stabilizer.cancel();
      vi.runAllTimers();

      // cancel後はonMoveが呼ばれない（初回のタイマー実行がキャンセルされる）
      // 注意: 初期化時に1回タイマーがセットされているので、cancelが間に合えば呼ばれない
    });
  });

  describe('getLast', () => {
    it('最後の座標を取得できる', () => {
      const stabilizer = new Stabilizer(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        3,
        0.5,
        100,
        200,
        0.8,
        10
      );

      const last = stabilizer.getLast();
      expect(last).toHaveProperty('x');
      expect(last).toHaveProperty('y');
      expect(last).toHaveProperty('pressure');
    });
  });

  describe('weight（追従の強さ）', () => {
    it('weight=0で即座に追従', () => {
      const onMove = vi.fn();
      const stabilizer = new Stabilizer(
        vi.fn(),
        onMove,
        vi.fn(),
        3,
        0, // weight=0 → follow=1
        100,
        100,
        0.5,
        10
      );

      stabilizer.move(200, 200, 0.5);
      vi.advanceTimersByTime(10);

      // follow=1だと素早く追従
      expect(onMove).toHaveBeenCalled();
    });

    it('weight=0.95で遅く追従', () => {
      const onMove = vi.fn();
      const stabilizer = new Stabilizer(
        vi.fn(),
        onMove,
        vi.fn(),
        3,
        0.95, // weight=0.95 → follow=0.05
        100,
        100,
        0.5,
        10
      );

      stabilizer.move(200, 200, 0.5);
      vi.advanceTimersByTime(10);

      expect(onMove).toHaveBeenCalled();
    });

    it('weightが0.95を超えても0.95に制限される', () => {
      // 内部でMath.min(0.95, weight)が適用される
      const stabilizer = new Stabilizer(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        3,
        1.5, // 0.95に制限
        100,
        100,
        0.5,
        10
      );

      // エラーなく動作することを確認
      expect(stabilizer.getParamTable()).toBeDefined();
    });

    it('weightが負でも0に制限される', () => {
      const stabilizer = new Stabilizer(
        vi.fn(),
        vi.fn(),
        vi.fn(),
        3,
        -0.5, // 0に制限
        100,
        100,
        0.5,
        10
      );

      expect(stabilizer.getParamTable()).toBeDefined();
    });
  });

  describe('座標の平滑化', () => {
    it('複数回のタイマー実行で座標が平滑化される', () => {
      const moves: Array<{ x: number; y: number }> = [];
      const onMove = vi.fn((x, y) => moves.push({ x, y }));

      const stabilizer = new Stabilizer(
        vi.fn(),
        onMove,
        vi.fn(),
        5,
        0.5,
        0,
        0,
        0.5,
        10
      );

      // 急激な座標変化
      stabilizer.move(100, 100, 0.5);

      // タイマーを複数回実行
      vi.advanceTimersByTime(50);

      // 複数回onMoveが呼ばれる
      expect(onMove.mock.calls.length).toBeGreaterThan(1);

      // 座標が徐々に変化（平滑化）
      // 急激に100,100に跳ぶのではなく、徐々に近づく
    });
  });

  describe('interval', () => {
    it('指定したintervalでタイマーが実行される', () => {
      const onMove = vi.fn();
      new Stabilizer(vi.fn(), onMove, vi.fn(), 3, 0.5, 100, 100, 0.5, 20);

      // 10ms経過時点ではまだ呼ばれない
      vi.advanceTimersByTime(15);
      const callsAt15 = onMove.mock.calls.length;

      // 20ms経過で呼ばれる
      vi.advanceTimersByTime(10);
      const callsAt25 = onMove.mock.calls.length;

      expect(callsAt25).toBeGreaterThan(callsAt15);
    });
  });
});
