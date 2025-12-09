/**
 * PainterLib
 */
import { Stabilizer } from "./Stabilizer";
import { Brush } from "./Brush";

type RichPainterProps = {
  undoLimit?: number;
  initSize?: { width: number; height: number };
  imageDataList?: ImageData[]; // 旧croquis同様、初期レイヤーを読み込む場合に使う
};

class RichPainter {
  private undoStack: any[] = [];
  private redoStack: any[] = [];
  private undoLimit: number = 30;
  private preventPushUndo = false;
  private pushToTransaction = false;
  private onChanged: (() => void) | undefined = undefined;

  private size: { width: number; height: number } = { width: 0, height: 0 };

  private layers: HTMLElement[] = [];
  private layerIndex: number = 0;
  private paintingCanvas = document.createElement("canvas");
  private paintingContext = this.paintingCanvas.getContext("2d");
  private renderDirtyRect = false;
  private domElement: HTMLElement = document.createElement("div");
  private dirtyRectDisplay: HTMLCanvasElement =
    document.createElement("canvas");
  private dirtyRectDisplayContext = this.dirtyRectDisplay.getContext("2d")!;

  // 指先ツールで使うゴーストキャンバス
  private ghostLayer: HTMLCanvasElement;
  private ghostCtx: CanvasRenderingContext2D;
  // 指先ツール用の「前回の位置」を保持
  private fingerLastPos: { x: number | null; y: number | null } = {
    x: null,
    y: null,
  };

  /**
   * コールバック用プロパティ（任意）
   */
  public onLayerAdded?: (index: number) => void;
  public onLayerRemoved?: (index: number) => void;
  public onLayerSelected?: (index: number) => void;
  public onLayerSwapped?: (layerA: number, layerB: number) => void;
  public onDowned?: (x: number, y: number, pressure: number) => void;
  public onMoved?: (x: number, y: number, pressure: number) => void;
  public onUpped?: (
    x: number,
    y: number,
    pressure: number,
    dirtyRect: { x: number; y: number; width: number; height: number },
  ) => void;
  public onTicked?: () => void;

  private brush: Brush | null = null;

  constructor({
    undoLimit = 30,
    initSize = { width: 300, height: 300 },
    imageDataList,
  }: RichPainterProps) {
    this.undoLimit = undoLimit;
    this.size = initSize;
    this.brush = new Brush();

    // paintingCanvasの初期化（描画中のプレビュー用）
    this.paintingCanvas.style.opacity = this.paintingOpacity.toString();
    this.paintingCanvas.style.position = "absolute";

    // ドラッグ不可スタイルを適用
    this.domElement.style.userSelect = "none";
    this.domElement.style.webkitUserSelect = "none";
    // this.domElement.style.msUserSelect = "none";
    // this.domElement.style.mozUserSelect = "none";

    // 初期レイヤーを作る or imageDataList を展開
    if (imageDataList && imageDataList.length) {
      this.lockHistory();
      const first = imageDataList[0];
      this.setCanvasSize(first.width, first.height);
      for (let i = 0; i < imageDataList.length; i++) {
        const current = imageDataList[i];
        // サイズチェック
        if (current.width !== first.width || current.height !== first.height) {
          throw new Error("all image data must have the same size");
        }
        this.addLayer(); // 新規レイヤー作成
        const context = this.getLayerContext(i);
        context.putImageData(current, 0, 0);
      }
      this.selectLayer(0);
      this.unlockHistory();
    } else {
      // デフォルトでレイヤー1枚
      this.addLayer();
      this.selectLayer(0);
    }

    // 指先ツール用のゴーストキャンバスを初期化
    this.ghostLayer = document.createElement("canvas");
    this.ghostCtx = this.ghostLayer.getContext("2d")!;
    this.ghostLayer.width = this.size.width;
    this.ghostLayer.height = this.size.height;
  }

  public getDOMElement(): HTMLElement {
    return this.domElement;
  }

  // ------------------------------------------------------------------------
  // Undo/Redo
  // ------------------------------------------------------------------------
  public getUndoLimit(): number {
    return this.undoLimit;
  }

  set setUndoLimit(value: number) {
    this.undoLimit = value;
  }

  public lockHistory() {
    this.preventPushUndo = true;
  }

  public unlockHistory() {
    this.preventPushUndo = false;
  }

  public beginHistoryTransaction() {
    this.undoStack.push([]);
    this.pushToTransaction = true;
  }

  public endHistoryTransaction() {
    this.pushToTransaction = false;
  }

  public clearHistory() {
    if (this.preventPushUndo) {
      throw new Error("Cannot clear history while history is locked");
    }
    this.undoStack = [];
    this.redoStack = [];
  }

  public pushUndo(undoFunction: () => any) {
    if (this.onChanged) {
      this.onChanged();
    }
    if (this.preventPushUndo) {
      return;
    }
    this.redoStack = [];
    if (this.pushToTransaction) {
      this.undoStack[this.undoStack.length - 1].push(undoFunction);
    } else {
      this.undoStack.push([undoFunction]);
    }
    while (this.undoStack.length > this.undoLimit) {
      this.undoStack.shift();
    }
    // pasteCanvastoRecordLayer(); // TODO:録画レイヤーに描画するならここで
  }

  public undo = () => {
    if (this.pushToTransaction) {
      throw "transaction is not ended";
    }
    if (this.preventPushUndo) throw "history is locked";
    if (this.isDrawing || this.isStabilizing) {
      throw "still drawing";
    }
    if (this.undoStack.length == 0) {
      throw "no more undo data";
    }
    let undoTransaction = this.undoStack.pop();
    let redoTransaction = [];
    while (undoTransaction.length) {
      // undoFunctionをcallして "swap" を受け取り、それをredo側に格納
      redoTransaction.push(undoTransaction.pop()());
    }
    this.redoStack.push(redoTransaction);
    // pasteCanvastoRecordLayer(); // TODO:録画レイヤーに描画
  };

  public redo = () => {
    if (this.pushToTransaction) {
      throw "transaction is not ended";
    }
    if (this.preventPushUndo) throw "history is locked";
    if (this.isDrawing || this.isStabilizing) {
      throw "still drawing";
    }
    if (this.redoStack.length == 0) {
      throw "no more redo data";
    }
    let redoTransaction = this.redoStack.pop();
    let undoTransaction = [];
    while (redoTransaction.length) {
      undoTransaction.push(redoTransaction.pop()());
    }
    this.undoStack.push(undoTransaction);
    // pasteCanvastoRecordLayer(); // TODO:録画レイヤーに描画
  };

  // ------------------------------------------------------------------------
  // レイヤーの不透明度・可視化制御
  // ------------------------------------------------------------------------
  private createSwap(index: number, type: "opacity" | "visible") {
    let _this = this;
    let snapshot =
      type == "opacity"
        ? this.getLayerOpacity(index)
        : this.getLayerVisible(index);

    const swap = function () {
      _this.lockHistory();
      let temp =
        type == "opacity"
          ? _this.getLayerOpacity(index)
          : _this.getLayerVisible(index);
      if (type == "opacity") {
        _this.setLayerOpacity(snapshot as number, index, false); // falseでpushしない
      } else {
        _this.setLayerVisible(snapshot as boolean, index, false);
      }
      snapshot = temp;
      _this.unlockHistory();
      return swap;
    };
    return swap;
  }

  private pushLayerOpacityUndo(index: number) {
    this.pushUndo(this.createSwap(index, "opacity"));
  }

  private pushLayerVisibleUndo(index: number) {
    this.pushUndo(this.createSwap(index, "visible"));
  }

  public getLayerOpacity(index: number | null = null): number {
    const _index = index == null ? this.layerIndex : index;
    const opacityStr = this.layers[_index].style.getPropertyValue("opacity");
    const opacity = parseFloat(opacityStr);
    return isNaN(opacity) ? 1 : opacity;
  }

  /**
   * setLayerOpacity() に第三引数 pushUndoFlg を追加し、
   * 内部から呼ぶ際に pushUndo をする/しないを明示化
   */
  public setLayerOpacity(
    opacity: number,
    index: number | null = null,
    pushUndoFlg = true,
  ): void {
    const _index = index == null ? this.layerIndex : index;
    if (pushUndoFlg) {
      this.pushLayerOpacityUndo(_index);
    }
    this.layers[_index].style.opacity = opacity.toString();
  }

  public getLayerVisible(index: number | null = null): boolean {
    const _index = index == null ? this.layerIndex : index;
    const visibility = this.layers[_index].style.getPropertyValue("visibility");
    return visibility !== "hidden";
  }

  public setLayerVisible(
    visible: boolean,
    index: number | null = null,
    pushUndoFlg = true,
  ): void {
    const _index = index == null ? this.layerIndex : index;
    if (pushUndoFlg) {
      this.pushLayerVisibleUndo(_index);
    }
    this.layers[_index].style.visibility = visible ? "visible" : "hidden";
  }

  // ------------------------------------------------------------------------
  // レイヤーの追加・削除
  // ------------------------------------------------------------------------
  private pushRemoveLayerUndo(index: number) {
    let layerContext = this.getLayerContext(index);
    const { width, height } = this.size;
    let snapshotData = layerContext.getImageData(0, 0, width, height);
    let self = this;

    let add = function () {
      self.lockHistory();
      self.addLayer(index);
      var ctx = self.getLayerContext(index);
      ctx.putImageData(snapshotData, 0, 0);
      self.unlockHistory();
      return remove;
    };
    let remove = function () {
      self.lockHistory();
      self.removeLayer(index, false);
      self.unlockHistory();
      return add;
    };
    this.pushUndo(add);
  }

  public addLayer(index: number | null = null): HTMLElement {
    const _index = index == null ? this.layers.length : index;
    const layer = document.createElement("div");
    layer.className = "croquis-layer";
    layer.style.visibility = "visible";
    layer.style.opacity = "1";
    const canvas = document.createElement("canvas");
    canvas.className = "croquis-layer-canvas";
    canvas.width = this.size.width;
    canvas.height = this.size.height;
    canvas.style.position = "absolute";
    layer.appendChild(canvas);
    this.domElement.appendChild(layer);
    this.layers.splice(_index, 0, layer);

    // コールバック
    if (this.onLayerAdded) {
      this.onLayerAdded(_index);
    }
    return layer;
  }

  public removeLayer(index: number | null = null, pushUndoFlg = true): void {
    const _index = index == null ? this.layerIndex : index;
    if (pushUndoFlg) {
      this.pushRemoveLayerUndo(_index);
    }
    this.domElement.removeChild(this.layers[_index]);
    this.layers.splice(_index, 1);
    if (this.layerIndex >= this.layers.length) {
      this.layerIndex = this.layers.length - 1;
    }
    this.sortLayers();
    if (this.onLayerRemoved) {
      this.onLayerRemoved(_index);
    }
  }

  /**
   * レイヤーをすべて削除
   */
  public removeAllLayer() {
    // 必要に応じてUndo登録するかどうか検討
    while (this.layers.length) {
      this.removeLayer(0);
    }
  }

  // レイヤーを入れ替える
  // （swapLayerされるまでに同じレイヤー数を保つ必要があるので注意）
  private pushSwapLayerUndo(layerA: number, layerB: number) {
    let swapFn = () => {
      this.lockHistory();
      this.swapLayer(layerA, layerB, false); // falseでpushUndoしない
      this.unlockHistory();
      return swapFn;
    };
    this.pushUndo(swapFn);
  }

  public swapLayer(layerA: number, layerB: number, pushUndoFlg = true): void {
    if (pushUndoFlg) {
      this.pushSwapLayerUndo(layerA, layerB);
    }
    const tmp = this.layers[layerA];
    this.layers[layerA] = this.layers[layerB];
    this.layers[layerB] = tmp;
    this.sortLayers();
    if (this.onLayerSwapped) {
      this.onLayerSwapped(layerA, layerB);
    }
  }

  private sortLayers(): void {
    while (this.domElement.firstChild) {
      this.domElement.removeChild(this.domElement.firstChild);
    }
    for (let i = 0; i < this.layers.length; ++i) {
      let layer = this.layers[i];
      this.domElement.appendChild(layer);
    }
    this.domElement.appendChild(this.dirtyRectDisplay);
  }

  public selectLayer(index: number): void {
    const latestLayerIndex = this.layers.length - 1;
    if (index > latestLayerIndex) {
      index = latestLayerIndex;
    }
    this.layerIndex = index;
    if (this.paintingCanvas.parentElement != null) {
      this.paintingCanvas.parentElement.removeChild(this.paintingCanvas);
    }
    this.layers[index].appendChild(this.paintingCanvas);
    if (this.onLayerSelected) {
      this.onLayerSelected(index);
    }
  }

  public getCurrentLayerIndex(): number {
    return this.layerIndex;
  }

  // ------------------------------------------------------------------------
  // DirtyRect
  // ------------------------------------------------------------------------
  private drawDirtyRect(x: number, y: number, w: number, h: number): void {
    const context = this.dirtyRectDisplayContext;
    context.fillStyle = "#f00";
    context.globalCompositeOperation = "source-over";
    context.fillRect(x, y, w, h);
    if (w > 2 && h > 2) {
      context.globalCompositeOperation = "destination-out";
      context.fillRect(x + 1, y + 1, w - 2, h - 2);
    }
  }

  private pushDirtyRectUndo(
    x: number,
    y: number,
    width: number,
    height: number,
    index?: number,
  ) {
    const _index = index == null ? this.layerIndex : index;
    const { width: w, height: h } = this.size;
    let right = x + width;
    let bottom = y + height;
    x = Math.min(w, Math.max(0, x));
    y = Math.min(h, Math.max(0, y));
    width = Math.min(w, Math.max(x, right)) - x;
    height = Math.min(h, Math.max(y, bottom)) - y;
    if (x % 1 > 0) ++width;
    if (y % 1 > 0) ++height;
    x = x | 0;
    y = y | 0;
    width = Math.min(w - x, Math.ceil(width));
    height = Math.min(h - y, Math.ceil(height));

    if (width === 0 || height === 0) {
      let doNothing = function () {
        return doNothing;
      };
      this.pushUndo(doNothing);
    } else {
      try {
        let layerContext = this.getLayerContext(_index);
        let snapshotData = layerContext.getImageData(x, y, width, height);
        let self = this;
        let swap = function () {
          layerContext = self.getLayerContext(_index);
          let tempData = layerContext.getImageData(x, y, width, height);
          layerContext.putImageData(snapshotData, x, y);
          snapshotData = tempData;
          return swap;
        };
        this.pushUndo(swap);
      } catch (e) {
        console.log("undo stock false");
      }
    }
    if (this.renderDirtyRect) {
      this.drawDirtyRect(x, y, width, height);
    }
  }

  private pushContextUndo(index?: number) {
    const _index = index == null ? this.layerIndex : index;
    const { width, height } = this.size;
    this.pushDirtyRectUndo(0, 0, width, height, _index);
  }

  // ------------------------------------------------------------------------
  // Canvasサイズ変更
  // ------------------------------------------------------------------------
  private pushCanvasSizeUndo(
    width: number,
    height: number,
    offsetX: number,
    offsetY: number,
  ) {
    let snapshotSize = { ...this.size };
    let snapshotDatas: ImageData[] = [];
    let w = snapshotSize.width;
    let h = snapshotSize.height;
    let self = this;
    for (let i = 0; i < this.layers.length; i++) {
      let layerContext = this.getLayerContext(i);
      snapshotDatas[i] = layerContext.getImageData(0, 0, w, h);
    }
    function setSize(
      width: number,
      height: number,
      offsetX: number = 0,
      offsetY: number = 0,
    ) {
      self.lockHistory();
      self._setCanvasSizeCore(width, height, offsetX, offsetY);
      self.unlockHistory();
    }
    let rollback = function () {
      setSize(w, h);
      for (let i = 0; i < self.layers.length; i++) {
        let layerContext = self.getLayerContext(i);
        layerContext.putImageData(snapshotDatas[i], 0, 0);
      }
      return redo;
    };
    let redo = function () {
      rollback();
      setSize(width, height, offsetX, offsetY);
      return rollback;
    };
    this.pushUndo(rollback);
  }

  public setCanvasSize(
    width: number,
    height: number,
    offsetX: number = 0,
    offsetY: number = 0,
  ): void {
    this.pushCanvasSizeUndo(width, height, offsetX, offsetY);
    // 実際の変更はここではなく _setCanvasSizeCore に回す
    this._setCanvasSizeCore(width, height, offsetX, offsetY);
  }

  private _setCanvasSizeCore(
    width: number,
    height: number,
    offsetX: number,
    offsetY: number,
  ) {
    width = Math.floor(width);
    height = Math.floor(height);
    this.size.width = width;
    this.size.height = height;
    this.paintingCanvas.width = width;
    this.paintingCanvas.height = height;
    this.dirtyRectDisplay.width = width;
    this.dirtyRectDisplay.height = height;
    this.domElement.style.width = width + "px";
    this.domElement.style.height = height + "px";
    for (let i = 0; i < this.layers.length; i++) {
      let canvas = this.getLayerCanvas(i);
      let context = this.getLayerContext(i);
      let imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = width;
      canvas.height = height;
      context.putImageData(imageData, offsetX, offsetY);
    }
  }

  public getCanvasSize(): { width: number; height: number } {
    return { width: this.size.width, height: this.size.height };
  }

  public getCanvasWidth(): number {
    return this.size.width;
  }

  public setCanvasWidth(width: number, offsetX: number = 0): void {
    this.setCanvasSize(width, this.size.height, offsetX, 0);
  }

  public getCanvasHeight(): number {
    return this.size.height;
  }

  public setCanvasHeight(height: number, offsetY: number = 0): void {
    this.setCanvasSize(this.size.width, height, 0, offsetY);
  }

  // ------------------------------------------------------------------------
  // レイヤーの情報取得
  // ------------------------------------------------------------------------
  public getLayerCanvas(index: number): HTMLCanvasElement {
    return this.layers[index].getElementsByClassName(
      "croquis-layer-canvas",
    )[0] as HTMLCanvasElement;
  }

  public getLayerContext(index: number): CanvasRenderingContext2D {
    return this.getLayerCanvas(index).getContext("2d")!;
  }

  public getLayers(): HTMLElement[] {
    return this.layers.slice(); // clone
  }

  public getLayerCount(): number {
    return this.layers.length;
  }

  public getNowLayerContext(): CanvasRenderingContext2D {
    return this.getLayerContext(this.layerIndex);
  }

  // ------------------------------------------------------------------------
  // レイヤーのクリア・塗りつぶし
  // ------------------------------------------------------------------------
  public clearLayer(index: number | null = null): void {
    const _index = index == null ? this.layerIndex : index;
    this.pushContextUndo(_index);
    const context = this.getLayerContext(_index);
    const { width, height } = this.size;
    context.clearRect(0, 0, width, height);
  }

  public fillLayer(fillColor: string, index: number | null = null): void {
    const _index = index == null ? this.layerIndex : index;
    this.pushContextUndo(_index);
    const context = this.getLayerContext(_index);
    const { width, height } = this.size;
    context.fillStyle = fillColor;
    context.fillRect(0, 0, width, height);
  }

  public fillLayerRect(
    fillColor: string,
    x: number,
    y: number,
    width: number,
    height: number,
    index: number | null = null,
  ): void {
    const _index = index == null ? this.layerIndex : index;
    this.pushDirtyRectUndo(x, y, width, height, _index);
    const context = this.getLayerContext(_index);
    context.fillStyle = fillColor;
    context.fillRect(x, y, width, height);
  }

  // バケツ塗り (floodFill) の例
  private getColor(
    x: number,
    y: number,
    w: number,
    d: Uint8ClampedArray,
  ): number {
    var index = (y * w + x) * 4;
    return (
      (d[index] << 24) |
      (d[index + 1] << 16) |
      (d[index + 2] << 8) |
      d[index + 3]
    );
  }

  public floodFill(
    x: number,
    y: number,
    r: number,
    g: number,
    b: number,
    a: number,
    index: number | null = null,
  ) {
    const _index = index == null ? this.layerIndex : index;
    this.pushContextUndo(_index);
    const context = this.getLayerContext(_index);
    const { width: w, height: h } = this.size;
    if (x < 0 || x >= w || y < 0 || y >= h) return;

    let imageData = context.getImageData(0, 0, w, h);
    let d = imageData.data;
    let targetColor = this.getColor(x, y, w, d);
    let replacementColor = (r << 24) | (g << 16) | (b << 8) | a;
    if (targetColor === replacementColor) return;

    let getColorLocal = (xx: number, yy: number) => {
      let idx = (yy * w + xx) * 4;
      return (
        (d[idx] << 24) | (d[idx + 1] << 16) | (d[idx + 2] << 8) | d[idx + 3]
      );
    };
    let setColorLocal = (xx: number, yy: number) => {
      let idx = (yy * w + xx) * 4;
      d[idx] = r;
      d[idx + 1] = g;
      d[idx + 2] = b;
      d[idx + 3] = a;
    };

    let queue: number[] = [];
    queue.push(x, y);

    while (queue.length) {
      let nx = queue.shift()!;
      let ny = queue.shift()!;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      if (getColorLocal(nx, ny) !== targetColor) continue;
      let west = nx,
        east = nx;
      while (west >= 0 && getColorLocal(west, ny) === targetColor) west--;
      while (east < w && getColorLocal(east, ny) === targetColor) east++;
      for (let i = west + 1; i < east; i++) {
        setColorLocal(i, ny);
        if (ny > 0 && getColorLocal(i, ny - 1) === targetColor)
          queue.push(i, ny - 1);
        if (ny < h - 1 && getColorLocal(i, ny + 1) === targetColor)
          queue.push(i, ny + 1);
      }
    }

    context.putImageData(imageData, 0, 0);
  }

  private rgb2hex(rgb: string): string {
    const mat = rgb.match(/\d+/g);
    return (
      "#" +
      mat!
        .map(function (a) {
          return ("0" + parseInt(a).toString(16)).slice(-2);
        })
        .join("")
    );
  }

  public dripperColor(x: number, y: number): string | null {
    try {
      const imageData = this.getLayerContext(this.layerIndex).getImageData(
        x,
        y,
        1,
        1,
      );
      // RGB
      const r = imageData.data[0];
      const g = imageData.data[1];
      const b = imageData.data[2];
      // const a = imageData.data[3]; // スポイトは見た目上色を採用のため、透明度は不要
      const rgb = `rgb(${r}, ${g}, ${b})`;
      const hex = this.rgb2hex(rgb);
      // this.brush?.setColor(hex);
      return hex;
    } catch (e) {
      console.log("not catch dripper");
      return null;
    }
  }

  /**
   * 指先ツール (fingerCanvas) のメイン処理
   * @param x        現在のマウスX座標
   * @param y        現在のマウスY座標
   * @param pressure 筆圧 (0~1想定)
   * @param brushSize 筆サイズ
   * @param brushOpacity 不透明度 (0~1想定 or 0~100想定)
   * @returns 成功/不成功の例として boolean を返す
   */
  public fingerCanvas(
    x: number,
    y: number,
    pressure: number,
    brushSize: number,
    brushOpacity: number,
  ): boolean {
    // 前回の座標がなければ初期化 (最初の呼び出し時)
    const lastx = this.fingerLastPos.x !== null ? this.fingerLastPos.x : x;
    const lasty = this.fingerLastPos.y !== null ? this.fingerLastPos.y : y;

    // 移動量があまりに大きい場合はスキップする例
    if (Math.abs(lastx - x) > 50 || Math.abs(lasty - y) > 50) {
      // 今回は失敗扱い
      return false;
    }

    if (pressure === 0) {
      // 筆圧が0なら描かない
      return false;
    }

    // 今回は「指先ツール専用の layerIndex」を使う例
    // 対象レイヤーのコンテキストを取得
    const targetCtx = this.getLayerContext(this.layerIndex);

    // ぼかしのサイズは実ブラシサイズより少し小さめにするなどの補正
    const adjustRatio = 0.8;
    const paintWidth = (brushSize / 2) * adjustRatio;
    const paintAlpha = brushOpacity; // 数値スケールに注意: 0~1 or 0~100 ?

    // 指先ぼかしのため、中心をずらしてイメージを取得
    const center = paintWidth / 2;
    const imageData = targetCtx.getImageData(
      x - center,
      y - center,
      paintWidth,
      paintWidth,
    );

    // 近傍の色の平均を取得
    const [color, aValue] = this._getColorAverage(imageData);
    if (color === "miss") {
      console.log("fingerCanvas: no color found (all transparent?)");
      // 座標を更新して終了
      this.fingerLastPos.x = x;
      this.fingerLastPos.y = y;
      return false;
    }

    // ghostLayer を一旦クリア
    this.ghostCtx.clearRect(0, 0, this.size.width, this.size.height);

    // ２点間の距離と角度を計算
    const dist = this._distanceBetween(lastx, lasty, x, y);
    const angle = this._angleBetween(lastx, lasty, x, y);

    // aValue が極端に低い場合に少しだけ色を残す例
    const aVal = aValue === 0 ? 0.1 : aValue;

    // dist の長さに沿って少しずつ描画
    for (let i = 0; i < dist; i += 10) {
      const xx = lastx + Math.sin(angle) * i;
      const yy = lasty + Math.cos(angle) * i;

      // アルファ値を計算 (もし brushOpacity が 0~100 なら  / 100)
      // ここでは 0~100 と想定してみる:
      const ctxAlpha = (paintAlpha / 100) * pressure * aVal;
      this.ghostCtx.globalAlpha = ctxAlpha;

      // ラジアルグラデーションを作成
      const radgrad = this.ghostCtx.createRadialGradient(
        xx,
        yy,
        paintWidth / 2,
        xx,
        yy,
        paintWidth,
      );

      // color = "#rrggbb" 形式を想定, alpha=0.5などで重ね塗り
      const rgb = this._hex2rgb(color);
      const rgb1 = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.5)`;
      const rgb2 = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`;

      // グラデーションの色指定
      radgrad.addColorStop(0, color);
      radgrad.addColorStop(0.5, rgb1);
      radgrad.addColorStop(1, rgb2);

      this.ghostCtx.fillStyle = radgrad;
      this.ghostCtx.fillRect(
        xx - paintWidth,
        yy - paintWidth,
        paintWidth * 2,
        paintWidth * 2,
      );
    }

    // ゴーストキャンバスの内容を本キャンバスに転写
    targetCtx.drawImage(this.ghostLayer, 0, 0);

    // 最後に座標を更新
    this.fingerLastPos.x = x;
    this.fingerLastPos.y = y;
    return true;
  }

  //==========================================================
  // 以下、指先ツール用のユーティリティメソッド例
  //==========================================================

  private _distanceBetween(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private _angleBetween(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
  ): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    // 元コードでは (Math.cos(angle), Math.sin(angle)) で進んでいたようなので、
    // 注意: ここでは dy, dx の順で atan2 に入れる
    // sin(angle) = dx / dist, cos(angle) = dy / dist のパターン
    return Math.atan2(dx, dy);
  }

  private _calcAve(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
  }

  private _rgb2hex(rgb: string): string {
    // 例: rgb(128,64,255) -> "#8040ff"
    // 正規表現でパース
    const result = /rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\)/.exec(rgb);
    if (!result) {
      return "#000000"; // fallback
    }
    const r = parseInt(result[1], 10);
    const g = parseInt(result[2], 10);
    const b = parseInt(result[3], 10);

    return (
      "#" +
      [r, g, b]
        .map((c) => {
          const hex = c.toString(16);
          return hex.length === 1 ? "0" + hex : hex;
        })
        .join("")
    );
  }

  private _hex2rgb(hex: string): [number, number, number] {
    // 例: "#8040ff" -> [128,64,255]
    // 先頭の '#' を削除
    const cleanHex = hex.replace(/^#/, "");
    let r = 0,
      g = 0,
      b = 0;
    if (cleanHex.length === 3) {
      // #abc => #aabbcc
      r = parseInt(cleanHex[0] + cleanHex[0], 16);
      g = parseInt(cleanHex[1] + cleanHex[1], 16);
      b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else if (cleanHex.length === 6) {
      r = parseInt(cleanHex.slice(0, 2), 16);
      g = parseInt(cleanHex.slice(2, 4), 16);
      b = parseInt(cleanHex.slice(4, 6), 16);
    }
    return [r, g, b];
  }

  private _getColorAverage(imageData: ImageData): [string, number] {
    // r,g,b,aそれぞれ配列に入れて平均を計算
    const rArr: number[] = [];
    const gArr: number[] = [];
    const bArr: number[] = [];
    const aArr: number[] = [];

    const len = imageData.data.length / 4;
    for (let i = 0; i < len; i++) {
      const r_data = imageData.data[4 * i];
      const g_data = imageData.data[4 * i + 1];
      const b_data = imageData.data[4 * i + 2];
      const a_data = imageData.data[4 * i + 3];
      if (a_data !== 0) {
        rArr.push(r_data);
        gArr.push(g_data);
        bArr.push(b_data);
        aArr.push(a_data);
      } else {
        // 透明度0の場合は白扱い
        rArr.push(255);
        gArr.push(255);
        bArr.push(255);
        aArr.push(0);
      }
    }

    if (rArr.length === 0) {
      return ["miss", 0];
    }
    const rAve = parseInt(this._calcAve(rArr).toString(), 10);
    const gAve = parseInt(this._calcAve(gArr).toString(), 10);
    const bAve = parseInt(this._calcAve(bArr).toString(), 10);
    // Aは [0..255] を [0..1] へ変換
    const aVal = parseInt(this._calcAve(aArr).toString(), 10) / 255;

    const rgbStr = `rgb(${rAve},${gAve},${bAve})`;
    const colorHex = this._rgb2hex(rgbStr);
    return [colorHex, aVal];
  }

  // ------------------------------------------------------------------------
  // サムネイル系
  // ------------------------------------------------------------------------
  public createLayerThumbnail(
    index: number | null = null,
    width?: number,
    height?: number,
  ): HTMLCanvasElement {
    const _index = index == null ? this.layerIndex : index;
    width = width == null ? this.size.width : width;
    height = height == null ? this.size.height : height;
    const layerCanvas = this.getLayerCanvas(_index);
    const thumbnail = document.createElement("canvas");
    const thumbnailContext = thumbnail.getContext("2d")!;
    thumbnail.width = width;
    thumbnail.height = height;
    thumbnailContext.drawImage(layerCanvas, 0, 0, width, height);
    return thumbnail;
  }

  public createFlattenThumbnail(
    width?: number,
    height?: number,
  ): HTMLCanvasElement {
    width = width == null ? this.size.width : width;
    height = height == null ? this.size.height : height;
    const thumbnail = document.createElement("canvas");
    const thumbnailContext = thumbnail.getContext("2d")!;
    thumbnail.width = width;
    thumbnail.height = height;
    for (let i = 0; i < this.layers.length; i++) {
      if (!this.getLayerVisible(i)) continue;
      const layerCanvas = this.getLayerCanvas(i);
      thumbnailContext.globalAlpha = this.getLayerOpacity(i);
      thumbnailContext.drawImage(layerCanvas, 0, 0, width, height);
    }
    // 途中描画中のキャンバス (paintingCanvas) も合成する場合
    thumbnailContext.save();
    thumbnailContext.globalAlpha = this.paintingOpacity;
    thumbnailContext.drawImage(this.paintingCanvas, 0, 0, width, height);
    thumbnailContext.restore();
    return thumbnail;
  }

  // ------------------------------------------------------------------------
  // ツール関連
  // ------------------------------------------------------------------------
  private tool: string = "brush";
  private toolStabilizeLevel = 0;
  private toolStabilizeWeight = 0.8;
  private stabilizer: Stabilizer | null = null;
  private stabilizerInterval = 5;
  private tick: any;
  private tickInterval = 20;
  private paintingOpacity = 1;
  private paintingKnockout = false;
  private paintingFinger = false;
  private paintingClipping = false;

  public getTool(): string {
    return this.tool;
  }
  public setTool(tool: string): void {
    this.tool = tool;
  }

  public getPaintingOpacity(): number {
    return this.paintingOpacity;
  }
  public setPaintingOpacity(opacity: number): void {
    this.paintingOpacity = opacity;
    this.paintingCanvas.style.opacity = opacity.toString();
  }

  public getPaintingKnockout(): boolean {
    return this.paintingKnockout;
  }
  public setPaintingKnockout(knockout: boolean): void {
    this.paintingKnockout = knockout;
    // knockout時もpaintingCanvasは表示する（描画中のプレビューを見せるため）
    // レイヤーへの転写時にdestination-outを使って消しゴム効果を適用
    // 旧実装では隠していたが、これではプレビューが見えないので常に表示する
    this.paintingCanvas.style.visibility = "visible";
  }

  public getPaintingClipping(): boolean {
    return this.paintingClipping;
  }
  public setPaintingClipping(clipping: boolean): void {
    this.paintingClipping = clipping;
  }

  public getPaintingFinger(): boolean {
    return this.paintingFinger;
  }
  public setPaintingFinger(finger: boolean): void {
    this.paintingFinger = finger;
  }

  public getTickInterval(): number {
    return this.tickInterval;
  }
  public setTickInterval(interval: number): void {
    this.tickInterval = interval;
  }

  public getToolStabilizeLevel(): number {
    return this.toolStabilizeLevel;
  }
  public setToolStabilizeLevel(level: number): void {
    this.toolStabilizeLevel = level < 0 ? 0 : level;
  }

  public getToolStabilizeWeight(): number {
    return this.toolStabilizeWeight;
  }
  public setToolStabilizeWeight(weight: number): void {
    this.toolStabilizeWeight = weight;
  }

  public getStabilizerInterval(): number {
    return this.stabilizerInterval;
  }
  public setStabilizerInterval(interval: number): void {
    this.stabilizerInterval = interval;
  }

  // ------------------------------------------------------------------------
  // 描画処理
  // ------------------------------------------------------------------------
  private isDrawing: boolean = false;
  private isStabilizing: boolean = false;
  private beforeKnockout = document.createElement("canvas");

  public gotoBeforeKnockout(): void {
    const context = this.getLayerContext(this.layerIndex);
    const { width, height } = this.size;
    context.clearRect(0, 0, width, height);
    context.drawImage(this.beforeKnockout, 0, 0, width, height);
  }

  public drawPaintingCanvas(): void {
    const context = this.getLayerContext(this.layerIndex);
    const { width, height } = this.size;
    context.save();
    context.globalAlpha = this.paintingOpacity;
    context.globalCompositeOperation = this.paintingKnockout
      ? "destination-out"
      : "source-over";
    context.drawImage(this.paintingCanvas, 0, 0, width, height);
    context.restore();
  }

  private _move(x: number, y: number, pressure: number): void {
    if (this.brush) {
      this.brush.move(this.paintingContext!, x, y, pressure);
      // 描画中はpaintingCanvasに描画するだけで、レイヤーには転写しない
      // paintingCanvas.style.opacityで透明度のプレビューは表示される
      // レイヤーへの転写は_up()で1回だけ行う
    }
    if (this.onMoved) {
      this.onMoved(x, y, pressure);
    }
  }

  private _up(x: number, y: number, pressure: number): void {
    this.isDrawing = false;
    this.isStabilizing = false;
    // knockOut
    if (this.paintingKnockout) {
      this.gotoBeforeKnockout();
    }
    // Undo登録
    // dirtyRectを計算できる場合は pushDirtyRectUndo(...) する
    this.pushContextUndo(); // 全面Undoとする場合

    // paintingCanvas の内容を本番レイヤーに転写
    this.drawPaintingCanvas();
    // paintingCanvas をクリア
    this.paintingContext?.clearRect(0, 0, this.size.width, this.size.height);

    if (this.brush) {
      this.brush.up(this.paintingContext!, x, y, this.size.width);
    }

    if (this.onUpped) {
      this.onUpped(x, y, pressure, {
        x: 0,
        y: 0,
        width: this.size.width,
        height: this.size.height,
      });
    }

    // knockoutTickは使用しないのでクリア不要
    // clearInterval(this.knockoutTick);
    clearInterval(this.tick);
  }

  public down(x: number, y: number, pressure: number): void {
    if (this.isDrawing || this.isStabilizing) {
      throw "still drawing";
    }
    this.isDrawing = true;

    // knockout時のバックアップ
    if (this.paintingKnockout) {
      const w = this.size.width;
      const h = this.size.height;
      const canvas = this.getLayerCanvas(this.layerIndex);
      const beforeKnockoutContext = this.beforeKnockout.getContext("2d")!;
      this.beforeKnockout.width = w;
      this.beforeKnockout.height = h;
      beforeKnockoutContext.clearRect(0, 0, w, h);
      beforeKnockoutContext.drawImage(canvas, 0, 0, w, h);
    }

    // 安定化レベル > 0 の場合、Stabilizerを使う
    if (this.toolStabilizeLevel > 0) {
      this.stabilizer = new Stabilizer(
        // down
        (xx, yy, pp) => {
          // Brushのdown処理を呼ぶ
          if (this.brush && this.paintingContext) {
            this.brush.down(this.paintingContext, xx, yy, pp);
          }
          if (this.onDowned) {
            this.onDowned(xx, yy, pp);
          }
        },
        // move
        (xx, yy, pp) => {
          this._move(xx, yy, pp);
        },
        // up
        (xx, yy, pp) => {
          this._up(xx, yy, pp);
        },
        this.toolStabilizeLevel,
        this.toolStabilizeWeight,
        x,
        y,
        pressure,
        this.stabilizerInterval,
      );
      this.isStabilizing = true;
    } else {
      // Stabilizerなし
      if (this.brush && this.paintingContext) {
        this.brush.down(this.paintingContext, x, y, pressure);
      }
      if (this.onDowned) {
        this.onDowned(x, y, pressure);
      }
    }

    // knockout の再描画
    // 描画中にレイヤーに転写すると、何度も消しゴム効果が適用されてちかちかする
    // 描画中はpaintingCanvasのプレビューのみを表示し、
    // 描き終わった時に_up()で1回だけレイヤーに適用する
    // this.knockoutTick = setInterval(() => {
    //   if (this.paintingKnockout) {
    //     this.gotoBeforeKnockout();
    //     this.drawPaintingCanvas();
    //   }
    // }, this.knockoutInterval);

    // tick 処理
    this.tick = setInterval(() => {
      // if (this.brush?.tick) { this.brush.tick(); }
      if (this.onTicked) {
        this.onTicked();
      }
    }, this.tickInterval);
  }

  // move() の処理
  public move(x: number, y: number, pressure: number): void {
    if (!this.isDrawing) return;
    if (this.stabilizer) {
      this.stabilizer.move(x, y, pressure);
    } else if (!this.isStabilizing) {
      // e.g. this.brush?.move(x, y, pressure);
      this._move(x, y, pressure);
    }
  }

  // up() の処理
  public up(x: number, y: number, pressure: number): void {
    if (!this.isDrawing) throw "you need to call 'down' first";
    if (this.stabilizer) {
      this.stabilizer.up(x, y, pressure);
      // upが完了したら次回以降のmove等は無視するため、nullにしておく
      this.stabilizer = null;
    } else {
      this._up(x, y, pressure);
    }
  }

  // ------------------------------------------------------------------------
  // 追加: DOM座標→キャンバス相対座標
  // ------------------------------------------------------------------------
  public getRelativePosition(
    absoluteX: number,
    absoluteY: number,
  ): { x: number; y: number } {
    const rect = this.domElement.getBoundingClientRect();
    return {
      x: absoluteX - rect.left,
      y: absoluteY - rect.top,
    };
  }

  public getBrush(): Brush | null {
    return this.brush;
  }

  public getIsDrawing(): boolean {
    return this.isDrawing;
  }

  // ------------------------------------------------------------------------
  // リモートストローク機能（share=true の場合に使用）
  // ------------------------------------------------------------------------

  /** リモートユーザーのブラシ状態を一時的に保持 */
  private remoteUserBrushes: Map<
    string,
    {
      brush: Brush;
      layerIndex: number;
      userName?: string;
      lastActivity: number;
    }
  > = new Map();

  /**
   * リモートユーザーのストローク開始を適用
   */
  public remoteDown(
    userId: string,
    x: number,
    y: number,
    pressure: number,
    layerIndex: number,
    brushConfig: {
      color: string;
      size: number;
      opacity: number;
      spacing: number;
      flow: number;
      merge: number;
      minimumSize: number;
      toolType: "pen" | "eraser";
    },
    userName?: string,
  ): void {
    // リモートユーザー用の一時的なBrushインスタンスを作成
    const remoteBrush = new Brush();
    remoteBrush.setColor(brushConfig.color);
    remoteBrush.setSize(brushConfig.size);
    remoteBrush.setFlow(brushConfig.opacity);
    remoteBrush.setSpacing(brushConfig.spacing);
    remoteBrush.setMerge(brushConfig.merge);
    remoteBrush.setMinimumSize(brushConfig.minimumSize);
    remoteBrush.setToolType(brushConfig.toolType);

    // 保存
    this.remoteUserBrushes.set(userId, {
      brush: remoteBrush,
      layerIndex,
      userName,
      lastActivity: Date.now(),
    });

    // 指定されたレイヤーに描画開始
    const context = this.getLayerContext(layerIndex);
    remoteBrush.down(context, x, y, pressure);
  }

  /**
   * リモートユーザーのストローク移動を適用
   */
  public remoteMove(
    userId: string,
    x: number,
    y: number,
    pressure: number,
  ): void {
    const remote = this.remoteUserBrushes.get(userId);
    if (!remote) return;

    // 最終アクティビティを更新
    remote.lastActivity = Date.now();

    // 描画
    const context = this.getLayerContext(remote.layerIndex);
    remote.brush.move(context, x, y, pressure);
  }

  /**
   * リモートユーザーのストローク終了を適用
   */
  public remoteUp(
    userId: string,
    x: number,
    y: number,
    pressure: number,
  ): void {
    const remote = this.remoteUserBrushes.get(userId);
    if (!remote) return;

    // 描画終了
    const context = this.getLayerContext(remote.layerIndex);
    remote.brush.up(context, x, y, pressure);

    // クリーンアップ
    this.remoteUserBrushes.delete(userId);
  }

  /**
   * アクティブなリモートユーザー一覧を取得
   */
  public getRemoteUsers(): Array<{
    userId: string;
    userName?: string;
    layerIndex: number;
    isDrawing: boolean;
    lastActivity: number;
  }> {
    const users: Array<{
      userId: string;
      userName?: string;
      layerIndex: number;
      isDrawing: boolean;
      lastActivity: number;
    }> = [];

    this.remoteUserBrushes.forEach((value, userId) => {
      users.push({
        userId,
        userName: value.userName,
        layerIndex: value.layerIndex,
        isDrawing: true,
        lastActivity: value.lastActivity,
      });
    });

    return users;
  }

  /**
   * 特定のリモートユーザーの描画を強制終了（接続切断時など）
   */
  public removeRemoteUser(userId: string): void {
    this.remoteUserBrushes.delete(userId);
  }

  /**
   * すべてのリモートユーザーの描画を強制終了
   */
  public clearRemoteUsers(): void {
    this.remoteUserBrushes.clear();
  }
}

export { RichPainter };
