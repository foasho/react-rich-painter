/**
 * PainterLib
 */

import { Brush } from "./Brush";

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
  private brush: Brush | null = null;

  /**
   * レイヤー系の変数
   */
  private layers: any[] = [];
  private layerIndex: number = 0;
  private paintingCanvas = document.createElement("canvas");
  private paintingContext = this.paintingCanvas.getContext("2d");
  private renderDirtyRect = false;
  private domElement: HTMLElement = document.createElement("div");
  private dirtyRectDisplay: HTMLCanvasElement = document.createElement("canvas");
  private dirtyRectDisplayContext = this.dirtyRectDisplay.getContext("2d")!;

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
        _this.setLayerOpacity(snapshot as number, index);
      } else {
        _this.setLayerVisible(snapshot as boolean, index);
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

  public getLayerOpacity(index: number | null = null): number {
    const _index = (index == null) ? this.layerIndex : index;
    const opacityStr = this.layers[_index].style.getPropertyValue("opacity");
    const opacity = parseFloat(opacityStr);
    return isNaN(opacity) ? 1 : opacity;
  }

  public setLayerOpacity(opacity: number, index: number | null = null): void {
    const _index = (index == null) ? this.layerIndex : index;
    this.pushLayerOpacityUndo(_index);
    this.layers[_index].style.opacity = opacity.toString();
  }

  public getLayerVisible(index: number | null = null): boolean {
    const _index = (index == null) ? this.layerIndex : index;
    const visibility = this.layers[_index].style.getPropertyValue("visibility");
    return visibility !== "hidden";
  }

  public setLayerVisible(visible: boolean, index: number | null = null): void {
    const _index = (index == null) ? this.layerIndex : index;
    this.pushLayerVisibleUndo(_index);
    this.layers[_index].style.visibility = visible ? "visible" : "hidden";
  }
  
  private getLayerCanvas(index: number): HTMLCanvasElement {
    return this.layers[index].getElementsByClassName("croquis-layer-canvas")[0] as HTMLCanvasElement;
  }

  public getLayerContext(index: number): CanvasRenderingContext2D {
    return this.getLayerCanvas(index).getContext("2d")!;
  }

  public addLayer(index: number | null = null): HTMLElement {
    const _index = (index == null) ? this.layers.length : index;
    const layer = document.createElement("div");
    layer.className = "croquis-layer";
    layer.style.visibility = "visible";
    layer.style.opacity = '1';
    const canvas = document.createElement("canvas");
    canvas.className = "croquis-layer-canvas";
    canvas.width = this.size.width;
    canvas.height = this.size.height;
    canvas.style.position = "absolute";
    layer.appendChild(canvas);
    this.domElement.appendChild(layer);
    this.layers.splice(_index, 0, layer);
    return layer;
  }

  public removeLayer(index: number | null = null): void {
    const _index = (index == null) ? this.layerIndex : index;
    this.pushRemoveLayerUndo(_index);
    this.domElement.removeChild(this.layers[_index]);
    this.layers.splice(_index, 1);
    if (this.layerIndex == this.layers.length) {
      this.selectLayer(this.layerIndex - 1);
    }
    this.sortLayers();
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
  }

  public getCurrentLayerIndex(): number {
    return this.layerIndex;
  }

  private drawDirtyRect(x: number, y: number, w: number, h: number): void {
    const context = this.dirtyRectDisplayContext;
    context.fillStyle = "#f00";
    context.globalCompositeOperation = "source-over";
    context.fillRect(x, y, w, h);
    if ((w > 2) && (h > 2)) {
      context.globalCompositeOperation = "destination-out";
      context.fillRect(x + 1, y + 1, w - 2, h - 2);
    }
  }

  public setCanvasSize(width: number, height: number, offsetX: number = 0, offsetY: number = 0): void {
    this.pushCanvasSizeUndo(width, height, offsetX, offsetY);
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
    for (let i = 0; i < this.layers.length; ++i) {
      let canvas = this.getLayerCanvas(i);
      let context = this.getLayerContext(i);
      let imageData = context.getImageData(0, 0, width, height);
      canvas.width = width;
      canvas.height = height;
      context.putImageData(imageData, offsetX, offsetY);
    }
  }

  public getCanvasSize(): { width: number, height: number } {
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

  public getLayers(): HTMLElement[] {
    return this.layers.slice(); // clone layers
  }

  public getLayerCount(): number {
    return this.layers.length;
  }

  public clearLayer(index: number | null = null): void {
    const _index = (index == null) ? this.layerIndex : index;
    this.pushContextUndo(_index);
    const context = this.getLayerContext(_index);
    const { width, height } = this.size;
    context.clearRect(0, 0, width, height);
  }

  public fillLayer(fillColor: string, index: number | null = null): void {
    const _index = (index == null) ? this.layerIndex : index;
    this.pushContextUndo(_index);
    const context = this.getLayerContext(_index);
    const { width, height } = this.size;
    context.fillStyle = fillColor;
    context.fillRect(0, 0, width, height);
  }

  public getDOMElement(): HTMLElement {
    return this.domElement;
  }

  public setBrush(brush: Brush): void {
    this.brush = brush;
  }
  
}

export { RichPainter };
