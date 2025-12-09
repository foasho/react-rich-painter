import { InputType } from "../../components/store/ui";

// pen: 描画, eraser: 消しゴム, dripper: スポイト, rect: 選択, move: キャンバス移動
type BrushToolType = "pen" | "eraser" | "dripper" | "rect" | "move";

class Brush {
  private color: string = "#000";
  private flow: number = 1;
  private size: number = 10;
  private spacing: number = 0.05;
  private angle: number = 0;
  private minimumSize: number = 0;
  private userDevice: string = "pc";
  private userSelectInputType: InputType = "mouse";
  private toolType: BrushToolType = "pen";
  private isDrawTool: boolean = false; //描画系のツールかどうか
  private isFinger: boolean = false;
  private merge: number = 0.2;
  private image: HTMLImageElement | null = null;
  private transformedImage: HTMLCanvasElement | null = null;
  private transformedImageIsDirty: boolean = true;
  private imageRatio: number = 1;
  private delta: number = 0;
  private prevX: number = 0;
  private prevY: number = 0;
  private lastX: number = 0;
  private lastY: number = 0;
  private prevScale: number = 0;
  private drawFunction: (
    context: CanvasRenderingContext2D,
    size: number,
  ) => void = this.drawCircle.bind(this);
  private dirtyRect: { x: number; y: number; width: number; height: number } = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  constructor() {}

  public clone(): Brush {
    const clone = new Brush();
    clone.setColor(this.getColor());
    clone.setFlow(this.getFlow());
    clone.setSize(this.getSize());
    clone.setSpacing(this.getSpacing());
    clone.setImage(this.getImage());
    return clone;
  }

  public getUserSelectInputType(): InputType {
    return this.userSelectInputType;
  }

  public setUserSelectInputType(value: InputType): void {
    this.userSelectInputType = value;
  }

  public getColor(): string {
    return this.color;
  }

  public setColor(value: string): void {
    this.color = value;
    this.transformedImageIsDirty = true;
  }

  public getFlow(): number {
    return this.flow;
  }

  public setFlow(value: number): void {
    this.flow = value;
    this.transformedImageIsDirty = true;
  }

  public getSize(): number {
    return this.size;
  }

  public setSize(value: number): void {
    this.size = value < 1 ? 1 : value;
    this.transformedImageIsDirty = true;
  }

  public getSpacing(): number {
    return this.spacing;
  }

  public setSpacing(value: number): void {
    this.spacing = value < 0.01 ? 0.01 : value;
  }

  public getAngle(): number {
    return this.angle;
  }

  public setAngle(value: number): void {
    this.angle = value < 0 ? 0 : value;
  }

  public getMinimumSize(): number {
    return this.minimumSize;
  }

  public setMinimumSize(value: number): void {
    this.minimumSize = value < 0.01 ? 0.01 : value;
  }

  public getUserDevice(): string {
    return this.userDevice;
  }

  public setUserDevice(device: string): void {
    this.userDevice = device;
  }

  public getToolType(): BrushToolType {
    return this.toolType;
  }

  public setToolType(tool: BrushToolType): void {
    this.toolType = tool;
  }

  public getIsDrawTool(): boolean {
    return this.isDrawTool;
  }

  public setIsDrawTool(drawTool: boolean): void {
    this.isDrawTool = drawTool;
  }

  public getIsFinger(): boolean {
    return this.isFinger;
  }

  public setIsFinger(finger: boolean): void {
    this.isFinger = finger;
  }

  public getMerge(): number {
    return this.merge;
  }

  public setMerge(value: number): void {
    if (value > 0) {
      this.merge = value;
    } else {
      this.merge = 0;
    }
  }

  public getImage(): HTMLImageElement | null {
    return this.image;
  }

  public setImage(value: HTMLImageElement | null): void {
    if (value == null) {
      this.transformedImage = this.image = null;
      this.imageRatio = 1;
      this.drawFunction = this.drawCircle.bind(this);
    } else if (value !== this.image) {
      this.image = value;
      this.imageRatio = this.image.height / this.image.width;
      this.transformedImage = document.createElement("canvas");
      this.drawFunction = this.drawImage.bind(this);
      this.transformedImageIsDirty = true;
    }
  }

  private appendDirtyRect(
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    if (!(width && height)) return;
    const dxw = this.dirtyRect.x + this.dirtyRect.width;
    const dyh = this.dirtyRect.y + this.dirtyRect.height;
    const xw = x + width;
    const yh = y + height;
    const minX = this.dirtyRect.width ? Math.min(this.dirtyRect.x, x) : x;
    const minY = this.dirtyRect.height ? Math.min(this.dirtyRect.y, y) : y;
    this.dirtyRect.x = minX;
    this.dirtyRect.y = minY;
    this.dirtyRect.width = Math.max(dxw, xw) - minX;
    this.dirtyRect.height = Math.max(dyh, yh) - minY;
  }

  private hexToRGB(
    hex: string,
    alpha: number,
  ): [number, number, number, number] {
    alpha = this.ratioTo255(alpha);
    if (alpha === 0) {
      return [255, 255, 255, alpha];
    }
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return [r, g, b, alpha];
  }

  private RgbaToRGB(rgba: string): [number, number, number, number] {
    const s = rgba.split("(")[1];
    const d = s.split(",");
    return [parseInt(d[0]), parseInt(d[1]), parseInt(d[2]), parseFloat(d[3])];
  }

  /**
   * 改良版混色アルゴリズム
   * @param base キャンバスの既存色 [r, g, b, a] (0-255)
   * @param brushColor ブラシの色 (hex形式)
   * @param mergeAmount 混色の強さ (0-1)
   * @returns 混色後の色 (rgba文字列)
   *
   * mergeAmount = 0: 完全にブラシの色
   * mergeAmount = 1: 既存色とブラシ色を均等に混ぜる（水彩風）
   */
  private mergeBrushColor(
    base: number[],
    brushColor: string,
    mergeAmount: number,
  ): string {
    // ブラシの色をRGBAに変換
    const brushRGB = this.hexToRGB(brushColor, 1);

    // 既存色の透明度を考慮（透明な場合は混色しない）
    const baseAlpha = base[3] / 255;

    if (baseAlpha < 0.01) {
      // 既存色がほぼ透明な場合は、ブラシの色をそのまま使用
      return `rgba(${brushRGB[0]}, ${brushRGB[1]}, ${brushRGB[2]}, 1)`;
    }

    // 混色の強さを筆圧で調整（より自然な描画）
    const adjustedMerge = mergeAmount * Math.min(1, this.prevScale + 0.3);

    // RGB線形補間による混色（絵の具を混ぜるような自然な混色）
    // adjustedMerge = 0: 100% ブラシ色
    // adjustedMerge = 1: 50% 既存色 + 50% ブラシ色
    const blendRatio = adjustedMerge * 0.5; // 最大50%まで既存色を混ぜる

    // RGB各チャンネルを線形補間
    const r = Math.round(brushRGB[0] * (1 - blendRatio) + base[0] * blendRatio);
    const g = Math.round(brushRGB[1] * (1 - blendRatio) + base[1] * blendRatio);
    const b = Math.round(brushRGB[2] * (1 - blendRatio) + base[2] * blendRatio);

    // アルファ値は常に1（不透明）、透明度はflowで制御
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }

  private ratioTo255(ratio: number): number {
    return parseInt(String(ratio * 255));
  }

  private c255ToRatio(data: number): number {
    return data / 255;
  }

  // 以下の関数は、外部のコンテキストや変数（例えば、getNowLayerContext、width、heightなど）に依存しています。
  // これらの関数や変数は、実際の環境に合わせて適切に実装または渡す必要があります。

  private getDripperColor(
    context: CanvasRenderingContext2D,
    _x: number,
    _y: number,
  ): [number, number, number, number] {
    try {
      // const imageData = getNowLayerContext().getImageData(_x, _y, 1, 1);
      // 上記のような外部関数が必要です。ここでは仮の実装をします。
      const imageData = context!.getImageData(_x, _y, 1, 1);
      const r = imageData.data[0];
      const g = imageData.data[1];
      const b = imageData.data[2];
      const a = imageData.data[3];
      if (a === 0) {
        return [255, 255, 255, 0];
      }
      return [r, g, b, a];
    } catch (e) {
      return [255, 255, 255, 0];
    }
  }

  private calcAve(data: number[]): number {
    const sum = data.reduce((acc, val) => acc + val, 0);
    return sum / data.length;
  }

  private getRectAveColor(
    context: CanvasRenderingContext2D,
    _x: number,
    _y: number,
    size: number,
  ): [number, number, number, number] {
    // widthとheightはキャンバスのサイズとして仮定します
    const width = context!.canvas.width;
    const height = context!.canvas.height;

    let w = parseInt(String(size / 1.41421356));
    let c = w / 2;
    let _x_c = _x - c < 0 ? 0 : _x - c;
    let _y_c = _y - c < 0 ? 0 : _y - c;
    w = _x_c + w > width ? width - _x_c : w;
    const h = _y_c + w > height ? height - _y_c : w;
    try {
      if (w < 1 || c < 1 || w < 1) {
        return this.getDripperColor(context, _x, _y);
      }
      const imageData = context!.getImageData(_x_c, _y_c, w, h);
      const r: number[] = [];
      const g: number[] = [];
      const b: number[] = [];
      const a: number[] = [];
      for (let i = 0; i < imageData.data.length / 4; i++) {
        const r_data = imageData.data[4 * i];
        const g_data = imageData.data[4 * i + 1];
        const b_data = imageData.data[4 * i + 2];
        const a_data = imageData.data[4 * i + 3];
        if (a_data !== 0) {
          r.push(r_data);
          g.push(g_data);
          b.push(b_data);
          a.push(a_data);
        } else {
          r.push(255);
          g.push(255);
          b.push(255);
          a.push(0);
        }
      }
      const r_ave = parseInt(String(this.calcAve(r)));
      const g_ave = parseInt(String(this.calcAve(g)));
      const b_ave = parseInt(String(this.calcAve(b)));
      const a_ave = parseInt(String(this.calcAve(a)));
      return [r_ave, g_ave, b_ave, a_ave];
    } catch (e) {
      return [255, 255, 255, 0];
    }
  }

  private getRadGradColor(
    ctx: CanvasRenderingContext2D,
    color: string,
    psize: number,
  ): void {
    const x = psize / 2;
    const y = psize / 2;
    let radgrad = ctx.createRadialGradient(x, y, 0, x, y, psize);
    const rgb = this.RgbaToRGB(color);
    const rgb1 = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.2)`;
    const rgb2 = `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`;
    radgrad.addColorStop(0, color);
    radgrad.addColorStop(0.6, rgb1);
    radgrad.addColorStop(1, rgb2);
    ctx.fillStyle = radgrad;
  }

  private transformImage(): void {
    if (this.transformedImage && this.image) {
      this.transformedImage.width = this.size;
      this.transformedImage.height = this.size * this.imageRatio;
      const brushContext = this.transformedImage.getContext("2d")!;
      brushContext.clearRect(
        0,
        0,
        this.transformedImage.width,
        this.transformedImage.height,
      );
      brushContext.drawImage(
        this.image,
        0,
        0,
        this.transformedImage.width,
        this.transformedImage.height,
      );
      brushContext.globalCompositeOperation = "source-in";

      const base_color = this.getRectAveColor(
        brushContext,
        this.lastX,
        this.lastY,
        this.size,
      );
      const merge_color = this.mergeBrushColor(
        base_color,
        this.color,
        this.merge,
      );
      this.getRadGradColor(brushContext, merge_color, this.size);

      brushContext.globalAlpha = this.flow;
      brushContext.fillRect(
        0,
        0,
        this.transformedImage.width,
        this.transformedImage.height,
      );
    }
  }

  private drawCircle(context: CanvasRenderingContext2D, size: number): void {
    if (this.isFinger) {
      this.drawFinger(context, size);
    } else {
      const halfSize = size * 0.5;
      const base_color = this.getRectAveColor(
        context,
        this.lastX,
        this.lastY,
        size,
      );
      const merge_color = this.mergeBrushColor(
        base_color,
        this.color,
        this.merge,
      );
      this.getRadGradColor(context, merge_color, size);

      context.globalAlpha = this.flow;
      context.beginPath();
      context.arc(halfSize, halfSize, halfSize, 0, Math.PI * 2);
      context.closePath();
      context.fill();
    }
  }

  private drawImage(context: CanvasRenderingContext2D, size: number): void {
    if (this.isFinger) {
      this.drawFinger(context, size);
    } else {
      if (this.transformedImageIsDirty) {
        this.transformImage();
      }
      try {
        if (this.transformedImage) {
          context.drawImage(
            this.transformedImage,
            0,
            0,
            size,
            size * this.imageRatio,
          );
        }
      } catch (e) {
        this.drawCircle(context, size);
      }
    }
  }

  private drawFinger(context: CanvasRenderingContext2D, size: number): void {
    const halfSize = size * 0.5;
    const base_color = this.getRectAveColor(
      context,
      this.lastX,
      this.lastY,
      size,
    );
    const finger_color = `rgba(${base_color[0]},${base_color[1]},${base_color[2]},${this.c255ToRatio(base_color[3])})`;
    this.getRadGradColor(context, finger_color, size);
    context.globalAlpha = this.flow;
    context.beginPath();
    context.arc(halfSize, halfSize, halfSize, 0, Math.PI * 2);
    context.closePath();
    context.fill();
  }

  private drawTo(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ): void {
    const halfSize = size * 0.5;
    const left = x - halfSize;
    const top = y - halfSize * this.imageRatio;
    context.save();
    context.translate(left, top);
    this.drawFunction(context, size);
    context.restore();
    this.appendDirtyRect(left, top, size, size * this.imageRatio);
  }

  public down(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
  ): void {
    if (context == null) throw "brush needs the context";
    this.dirtyRect = { x: 0, y: 0, width: 0, height: 0 };
    if (scale > 0) {
      const s = scale < this.minimumSize ? this.minimumSize : scale;
      this.drawTo(context, x, y, this.size * s);
    }
    this.delta = 0;
    this.lastX = this.prevX = x;
    this.lastY = this.prevY = y;
    this.prevScale = scale;
  }

  public move(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale: number,
  ): void {
    if (context == null) throw "brush needs the context";
    if (scale > 0) {
      const dx = x - this.prevX;
      const dy = y - this.prevY;
      const ds = scale - this.prevScale;
      const d = Math.sqrt(dx * dx + dy * dy);
      this.prevX = x;
      this.prevY = y;
      this.delta += d;
      const midScale = (this.prevScale + scale) * 0.5;
      let drawSpacing = this.size * this.spacing * midScale;
      if (drawSpacing < 0.5) drawSpacing = 0.5;
      if (this.delta < drawSpacing) {
        this.prevScale = scale;
        return;
      }
      context.save();
      const scaleSpacing = ds * (drawSpacing / this.delta);
      let ldx = x - this.lastX;
      let ldy = y - this.lastY;
      const ld = Math.sqrt(ldx * ldx + ldy * ldy);
      if (ld < drawSpacing) {
        this.lastX = x;
        this.lastY = y;
        this.prevScale = scale;
        const s =
          this.prevScale < this.minimumSize ? this.minimumSize : this.prevScale;
        this.drawTo(context, this.lastX, this.lastY, this.size * s);
        this.delta -= drawSpacing;
      } else {
        while (this.delta >= drawSpacing) {
          ldx = x - this.lastX;
          ldy = y - this.lastY;
          const dir = Math.atan2(ldy, ldx);
          const tx = Math.cos(dir);
          const ty = Math.sin(dir);
          this.lastX += tx * drawSpacing;
          this.lastY += ty * drawSpacing;
          this.prevScale += scaleSpacing;
          const s =
            this.prevScale < this.minimumSize
              ? this.minimumSize
              : this.prevScale;
          this.drawTo(context, this.lastX, this.lastY, this.size * s);
          this.delta -= drawSpacing;
        }
      }
      this.prevScale = scale;
      context.restore();
    } else {
      this.delta = 0;
      this.prevX = x;
      this.prevY = y;
      this.prevScale = scale;
    }
  }

  public up(
    _context: CanvasRenderingContext2D,
    _x: number,
    _y: number,
    _scale: number,
  ): { x: number; y: number; width: number; height: number } {
    return this.dirtyRect;
  }
}

export { Brush };
