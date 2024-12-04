class Stabilizer {
  private follow: number;
  private paramTable: { x: number; y: number; pressure: number }[];
  private current: { x: number; y: number; pressure: number };
  private first: { x: number; y: number; pressure: number };
  private last: { x: number; y: number; pressure: number };
  private upCalled: boolean = false;
  private interval: number;
  private downCallback: ((x: number, y: number, pressure: number) => void) | null;
  private moveCallback: (x: number, y: number, pressure: number) => void;
  private upCallback: (x: number, y: number, pressure: number) => void;

  constructor(
    down: ((x: number, y: number, pressure: number) => void) | null,
    move: (x: number, y: number, pressure: number) => void,
    up: (x: number, y: number, pressure: number) => void,
    level: number,
    weight: number,
    x: number,
    y: number,
    pressure: number,
    interval: number = 5
  ) {
    this.interval = interval;
    this.follow = 1 - Math.min(0.95, Math.max(0, weight));
    this.paramTable = [];
    this.current = { x: x, y: y, pressure: pressure };
    for (let i = 0; i < level; ++i) {
      this.paramTable.push({ x: x, y: y, pressure: pressure });
    }
    this.first = this.paramTable[0];
    this.last = this.paramTable[this.paramTable.length - 1];
    this.downCallback = down;
    this.moveCallback = move;
    this.upCallback = up;

    if (this.downCallback) {
      this.downCallback(x, y, pressure);
    }
    window.setTimeout(() => this._move(false), this.interval);
  }

  getParamTable() {
    return this.paramTable;
  }

  move(x: number, y: number, pressure: number) {
    this.current.x = x;
    this.current.y = y;
    this.current.pressure = pressure;
  }

  up(x: number, y: number, pressure: number) {
    this.current.x = x;
    this.current.y = y;
    this.current.pressure = pressure;
    this.upCalled = true;
  }

  private dlerp(a: number, d: number, t: number): number {
    return a + d * t;
  }

  private _move(justCalc: boolean): any {
    let curr, prev, dx, dy, dp;
    let delta = 0;
    this.first.x = this.current.x;
    this.first.y = this.current.y;
    this.first.pressure = this.current.pressure;
    for (let i = 1; i < this.paramTable.length; ++i) {
      curr = this.paramTable[i];
      prev = this.paramTable[i - 1];
      dx = prev.x - curr.x;
      dy = prev.y - curr.y;
      dp = prev.pressure - curr.pressure;
      delta += Math.abs(dx) + Math.abs(dy);
      curr.x = this.dlerp(curr.x, dx, this.follow);
      curr.y = this.dlerp(curr.y, dy, this.follow);
      curr.pressure = this.dlerp(curr.pressure, dp, this.follow);
    }
    if (justCalc) {
      return delta;
    }
    if (this.upCalled) {
      while (delta > 1) {
        this.moveCallback(this.last.x, this.last.y, this.last.pressure);
        delta = this._move(true);
      }
      this.upCallback(this.last.x, this.last.y, this.last.pressure);
    } else {
      this.moveCallback(this.last.x, this.last.y, this.last.pressure);
      window.setTimeout(() => this._move(false), this.interval);
    }
  }
}

export { Stabilizer };