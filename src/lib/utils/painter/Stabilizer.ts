// Stabilizer.ts

class Stabilizer {
  private follow: number;
  private paramTable: Array<{ x: number; y: number; pressure: number }> = [];
  private current: { x: number; y: number; pressure: number };
  private first: { x: number; y: number; pressure: number };
  private last: { x: number; y: number; pressure: number };
  private upCalled: boolean = false;

  /**
   * "setTimeout" の戻り値を保管し、必要なら明示的に clearTimeout できるように
   */
  private timeoutId: any = null;

  /**
   * @param onDown  描画開始時に呼び出されるコールバック
   * @param onMove  移動時に呼び出されるコールバック
   * @param onUp    描画終了時に呼び出されるコールバック
   * @param level   安定化レベル(0〜)
   * @param weight  安定化強度(0〜0.95)
   * @param x       初期マウスX座標
   * @param y       初期マウスY座標
   * @param pressure 筆圧(無い場合は1.0など)
   * @param interval 安定化のタイマー間隔(ms)
   */
  constructor(
    private onDown: ((x: number, y: number, pressure: number) => void) | null,
    private onMove: (x: number, y: number, pressure: number) => void,
    private onUp: (x: number, y: number, pressure: number) => void,
    level: number,
    weight: number,
    x: number,
    y: number,
    pressure: number,
    private interval: number = 5,
  ) {
    // Croquis.Stabilizer 内のロジックを踏襲
    this.interval = interval || 5;
    this.follow = 1 - Math.min(0.95, Math.max(0, weight));

    this.current = { x, y, pressure };

    for (let i = 0; i < level; i++) {
      this.paramTable.push({ x, y, pressure });
    }
    // level=0 のとき、paramTable は空になり得るので注意
    if (this.paramTable.length === 0) {
      // 最低1つは作っておく
      this.paramTable.push({ x, y, pressure });
    }

    this.first = this.paramTable[0];
    this.last = this.paramTable[this.paramTable.length - 1];

    if (this.onDown) {
      this.onDown(x, y, pressure);
    }

    // タイマー開始
    this.timeoutId = window.setTimeout(() => this._move(), this.interval);
  }

  public getParamTable() {
    return this.paramTable;
  }

  public move(x: number, y: number, pressure: number): void {
    // 更新だけ
    this.current.x = x;
    this.current.y = y;
    this.current.pressure = pressure;
  }

  public up(x: number, y: number, pressure: number): void {
    // upが呼ばれたら最終座標を登録して "upCalled = true" にしておく
    this.current.x = x;
    this.current.y = y;
    this.current.pressure = pressure;
    this.upCalled = true;
  }

  private dlerp(a: number, d: number, t: number): number {
    // a + (d * t)
    return a + d * t;
  }

  private _move(justCalc?: boolean): number {
    let delta = 0;
    // 先頭の要素を current に合わせる
    this.first.x = this.current.x;
    this.first.y = this.current.y;
    this.first.pressure = this.current.pressure;

    for (let i = 1; i < this.paramTable.length; i++) {
      const curr = this.paramTable[i];
      const prev = this.paramTable[i - 1];

      const dx = prev.x - curr.x;
      const dy = prev.y - curr.y;
      const dp = prev.pressure - curr.pressure;

      delta += Math.abs(dx);
      delta += Math.abs(dy);

      // 末端に向かって少しずつ追従
      curr.x = this.dlerp(curr.x, dx, this.follow);
      curr.y = this.dlerp(curr.y, dy, this.follow);
      curr.pressure = this.dlerp(curr.pressure, dp, this.follow);
    }

    // justCalc===true の場合は、実際には描画せず delta の計算のみ返す
    if (justCalc) {
      return delta;
    }

    // up後
    if (this.upCalled) {
      // deltaが 1 を超える間は move を呼び出し続ける
      while (delta > 1) {
        this.onMove(this.last.x, this.last.y, this.last.pressure);
        // delta 再計算
        delta = this._move(true);
      }
      // 最後に up コールバック
      this.onUp(this.last.x, this.last.y, this.last.pressure);
    }
    // まだ upされてない場合は、onMoveを呼んで再度タイマーセット
    else {
      this.onMove(this.last.x, this.last.y, this.last.pressure);
      this.timeoutId = window.setTimeout(() => this._move(), this.interval);
    }

    return delta;
  }

  /**
   * 万が一、外部からタイマーを止めたい場合のメソッド
   */
  public cancel(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  /**
   * 拡張機能
   */
  public getLast(): { x: number; y: number; pressure: number } {
    return this.last;
  }
}

export { Stabilizer };
