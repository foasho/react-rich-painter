/**
 * PainterLib
 */

type RichPainterProps = {
  undoLimit?: number;
  initSize?: { width: number, height: number };
};

class RichPainter {

  private undoStack: any[] = [];
  private redoStack: any[] = [];
  private undoLimit: number = 30;
  private preventPushUndo = false;
  private pushToTransaction = false;
  private onChanged: (() => void) | undefined = undefined;

  /**
   * 描画系の変数
   */
  private size: { width: number, height: number } = { width: 0, height: 0 };
  private isDrawing = false;
  private isStabilizing = false;

  /**
   * レイヤー系の変数
   */
  private layers: any[] = [];
  private layerIndex: number = 0;
  private paintingCanvas = document.createElement("canvas");
  private paintingContext = this.paintingCanvas.getContext("2d");
  private renderDirtyRect = false;

  constructor({ undoLimit = 30, initSize = { width: 300, height: 300 } }: RichPainterProps) {
    this.undoLimit = undoLimit;
    this.size = initSize;
  }

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
    if (this.preventPushUndo){
      throw new Error("Cannot clear history while history is locked");
    }
    this.undoStack = [];
    this.redoStack = [];
  }

  public pushUndo(undoFunction: ((any?: any) => void)){
    if (this.onChanged){
      this.onChanged();
    }
    if (this.preventPushUndo){
      return;
    }
    this.redoStack = [];
    if (this.pushToTransaction){
      this.undoStack[this.undoStack.length - 1].push(undoFunction);
    } else {
      this.undoStack.push([undoFunction]);
    }
    while (this.undoStack.length > this.undoLimit){
      this.undoStack.shift();
    }
    // TODO: pasteCanvastoRecordLayer();//録画レイヤーに描画
  }

  public undo = () => {
    if (this.pushToTransaction){
      throw "transaction is not ended";
    }
    if (this.preventPushUndo)
        throw "history is locked";
    if (this.isDrawing || this.isStabilizing){
      throw "still drawing";
    }
    if (this.undoStack.length == 0){
      throw "no more undo data";
    }
    let undoTransaction = this.undoStack.pop();
    let redoTransaction = [];
    while (undoTransaction.length){
      redoTransaction.push(undoTransaction.pop()());
    }
    this.redoStack.push(redoTransaction);
    // TODO: pasteCanvastoRecordLayer();//録画レイヤーに描画
  }

  public redo = () => {
    if (this.pushToTransaction){
      throw "transaction is not ended";
    }
    if (this.preventPushUndo)
        throw "history is locked";
    if (this.isDrawing || this.isStabilizing){
      throw "still drawing";
    }
    if (this.redoStack.length == 0){
      throw "no more redo data";
    }
    let redoTransaction = this.redoStack.pop();
    let undoTransaction = [];
    while (redoTransaction.length){
      undoTransaction.push(redoTransaction.pop()());
    }
    this.undoStack.push(undoTransaction);
    // TODO: pasteCanvastoRecordLayer();//録画レイヤーに描画
  }

  // Swap関数を作成
  private createSwap = (index: number, type: "opacity" | "visible") => {
    let _this = this;
    // let snapshotOpacity = this.getLayerOpacity(index);
    let snapshot = type == "opacity" ? this.getLayerOpacity(index) : this.getLayerVisible(index);
    const swap = function(){
      _this.lockHistory();
      let temp = type == "opacity" ? _this.getLayerOpacity(index) : _this.getLayerVisible(index);
      _this.layerIndex = index;
      if (type == "opacity") {
        _this.setLayerOpacity(snapshot, index);
      } else {
        _this.setLayerVisible(snapshot, index);
      }
      snapshot = temp;
      _this.unlockHistory();
      return swap;
    }
    return swap;
  }

  // レイヤー不透明度のUndo追加
  private pushLayerOpacityUndo(index: number | null = null){
    const _index = index == null ? this.layerIndex : index;
    this.pushUndo(this.createSwap(_index, "opacity"));
  }

  // レイヤー表示のUndo追加
  private pushLayerVisibleUndo(index: number | null = null){
    const _index = index == null ? this.layerIndex : index;
    this.pushUndo(this.createSwap(_index, "opacity"));
  }

  // レイヤー削除のUndo追加
  private pushRemoveLayerUndo(index: number){
    let layerContext = this.getLayerContext(index);
    const { width, height } = this.size;
    let snapshotData = layerContext.getImageData(0, 0, width, height);
    let self = this;
    let add = function () {
      self.lockHistory();
      self.addLayer(index);
      var layerContext = self.getLayerContext(index);
      layerContext.putImageData(snapshotData, 0, 0);
      self.unlockHistory();
      return remove;
    }
    let remove = function () {
      self.lockHistory();
      self.removeLayer(index);
      self.unlockHistory();
      return add;
    }
    this.pushUndo(add);
  }

  // テクスチャ選択のUndo追加
  private pushDirtyRectUndo(x: number, y: number, width: number, height: number, index: number){
    const _index = index == null ? this.layerIndex : index;
    const { width: w, height: h } = this.size;
    var right = x + width;
    var bottom = y + height;
    x = Math.min(w, Math.max(0, x));
    y = Math.min(h, Math.max(0, y));
    width = Math.min(w, Math.max(x, right)) - x;
    height = Math.min(h, Math.max(y, bottom)) - y;
    if ((x % 1) > 0)
        ++width;
    if ((y % 1) > 0)
        ++height;
    x = x | 0;
    y = y | 0;
    width = Math.min(w - x, Math.ceil(width));
    height = Math.min(h - y, Math.ceil(height));
    if ((width == 0) || (height == 0)) {
        var doNothing = function () {
            return doNothing;
        };
        this.pushUndo(doNothing);
    }
    else {
      try {
        var layerContext = this.getLayerContext(_index);
        var snapshotData = layerContext.getImageData(x, y, width, height);
        let self = this;
        var swap = function () {
          layerContext = self.getLayerContext(_index);
          let tempData = layerContext.getImageData(x, y, width, height);
          layerContext.putImageData(snapshotData, x, y);
          snapshotData = tempData;
          return swap;
        };
        this.pushUndo(swap);
      }catch (e) {
        console.log("undo stock false");
      }
    }
    if (this.renderDirtyRect) {
      this.drawDirtyRect(x, y, width, height);
    }
  }

  private pushContextUndo(index: number | null = null){
    const _index = (index == null) ? this.layerIndex : index;
    const { width, height } = this.size;
    this.pushDirtyRectUndo(0, 0, width, height, _index);
  }

  private pushCanvasSizeUndo(width: number, height: number, offsetX: number, offsetY: number){
    let snapshotSize = this.size;
    let snapshotDatas = [];
    let w = snapshotSize.width;
    let h = snapshotSize.height;
    let self = this;
    for (var i = 0; i < this.layers.length; ++i) {
      var layerContext = this.getLayerContext(i);
      snapshotDatas[i] = layerContext.getImageData(0, 0, w, h);
    }
    function setSize(width: number, height: number, offsetX: number = 0, offsetY: number = 0) {
        self.lockHistory();
        self.setCanvasSize(width, height, offsetX, offsetY);
        self.unlockHistory();
    }
    var rollback = function () {
        setSize(w, h);
        for (var i = 0; i < self.layers.length; ++i) {
            var layerContext = self.getLayerContext(i);
            layerContext.putImageData(snapshotDatas[i], 0, 0);
        }
        return redo;
    };
    var redo = function () {
        rollback();
        setSize(width, height, offsetX, offsetY);
        return rollback;
    };
    this.pushUndo(rollback);
  }

  public getLayerOpacity(index: number): any {}

  public setLayerOpacity(opacity: number, index: number): void {}

  public getLayerVisible(index: number): any {}

  public setLayerVisible(visible: boolean, index: number): void {}
  
  private getLayerContext(index: number): any {}

  private addLayer(index: number): void {}

  private removeLayer(index: number): void {}

  private drawDirtyRect(x: number, y: number, width: number, height: number): void {}

  public setCanvasSize(width: number, height: number, offsetX: number, offsetY: number): void {}
  
}

export { RichPainter };