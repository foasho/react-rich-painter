import "@testing-library/jest-dom";

// ImageData モック（jsdomには含まれていないため）
class MockImageData {
  readonly data: Uint8ClampedArray;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace = "srgb";

  constructor(sw: number, sh: number);
  constructor(data: Uint8ClampedArray, sw: number, sh?: number);
  constructor(
    swOrData: number | Uint8ClampedArray,
    shOrSw: number,
    sh?: number,
  ) {
    if (typeof swOrData === "number") {
      this.width = swOrData;
      this.height = shOrSw;
      this.data = new Uint8ClampedArray(swOrData * shOrSw * 4);
    } else {
      this.data = swOrData;
      this.width = shOrSw;
      this.height = sh ?? swOrData.length / 4 / shOrSw;
    }
  }
}

globalThis.ImageData = MockImageData as unknown as typeof ImageData;

// Canvas モック
class MockCanvasRenderingContext2D {
  canvas: HTMLCanvasElement;
  fillStyle: string = "#000000";
  strokeStyle: string = "#000000";
  lineWidth: number = 1;
  lineCap: CanvasLineCap = "butt";
  lineJoin: CanvasLineJoin = "miter";
  globalAlpha: number = 1;
  globalCompositeOperation: GlobalCompositeOperation = "source-over";
  imageSmoothingEnabled: boolean = true;
  shadowBlur: number = 0;
  shadowColor: string = "rgba(0, 0, 0, 0)";
  shadowOffsetX: number = 0;
  shadowOffsetY: number = 0;
  font: string = "10px sans-serif";
  textAlign: CanvasTextAlign = "start";
  textBaseline: CanvasTextBaseline = "alphabetic";

  private _imageData: ImageData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  // Drawing methods
  fillRect(_x: number, _y: number, _w: number, _h: number): void {}
  strokeRect(_x: number, _y: number, _w: number, _h: number): void {}
  clearRect(_x: number, _y: number, _w: number, _h: number): void {}
  fill(): void {}
  stroke(): void {}
  beginPath(): void {}
  closePath(): void {}
  moveTo(_x: number, _y: number): void {}
  lineTo(_x: number, _y: number): void {}
  arc(
    _x: number,
    _y: number,
    _radius: number,
    _startAngle: number,
    _endAngle: number,
    _anticlockwise?: boolean,
  ): void {}
  arcTo(
    _x1: number,
    _y1: number,
    _x2: number,
    _y2: number,
    _radius: number,
  ): void {}
  quadraticCurveTo(_cpx: number, _cpy: number, _x: number, _y: number): void {}
  bezierCurveTo(
    _cp1x: number,
    _cp1y: number,
    _cp2x: number,
    _cp2y: number,
    _x: number,
    _y: number,
  ): void {}
  rect(_x: number, _y: number, _w: number, _h: number): void {}
  clip(): void {}
  save(): void {}
  restore(): void {}
  scale(_x: number, _y: number): void {}
  rotate(_angle: number): void {}
  translate(_x: number, _y: number): void {}
  transform(
    _a: number,
    _b: number,
    _c: number,
    _d: number,
    _e: number,
    _f: number,
  ): void {}
  setTransform(
    _a: number,
    _b: number,
    _c: number,
    _d: number,
    _e: number,
    _f: number,
  ): void {}
  resetTransform(): void {}

  // Image methods
  drawImage(
    _image: CanvasImageSource,
    _dx: number,
    _dy: number,
    _dw?: number,
    _dh?: number,
    _sx?: number,
    _sy?: number,
    _sw?: number,
    _sh?: number,
  ): void {}

  createImageData(sw: number, sh: number): ImageData {
    return new ImageData(sw, sh);
  }

  getImageData(_sx: number, _sy: number, sw: number, sh: number): ImageData {
    if (this._imageData) {
      return this._imageData;
    }
    return new ImageData(sw, sh);
  }

  putImageData(
    _imageData: ImageData,
    _dx: number,
    _dy: number,
    _dirtyX?: number,
    _dirtyY?: number,
    _dirtyWidth?: number,
    _dirtyHeight?: number,
  ): void {
    this._imageData = _imageData;
  }

  // Gradient methods
  createLinearGradient(
    _x0: number,
    _y0: number,
    _x1: number,
    _y1: number,
  ): CanvasGradient {
    return {
      addColorStop: () => {},
    } as CanvasGradient;
  }

  createRadialGradient(
    _x0: number,
    _y0: number,
    _r0: number,
    _x1: number,
    _y1: number,
    _r1: number,
  ): CanvasGradient {
    return {
      addColorStop: () => {},
    } as CanvasGradient;
  }

  createPattern(
    _image: CanvasImageSource,
    _repetition: string | null,
  ): CanvasPattern | null {
    return {} as CanvasPattern;
  }

  // Text methods
  fillText(_text: string, _x: number, _y: number, _maxWidth?: number): void {}
  strokeText(_text: string, _x: number, _y: number, _maxWidth?: number): void {}
  measureText(text: string): TextMetrics {
    return {
      width: text.length * 10,
      actualBoundingBoxAscent: 10,
      actualBoundingBoxDescent: 2,
      actualBoundingBoxLeft: 0,
      actualBoundingBoxRight: text.length * 10,
      fontBoundingBoxAscent: 12,
      fontBoundingBoxDescent: 3,
      alphabeticBaseline: 0,
      emHeightAscent: 10,
      emHeightDescent: 2,
      hangingBaseline: 8,
      ideographicBaseline: -2,
    } as TextMetrics;
  }

  // Path methods
  isPointInPath(_x: number, _y: number): boolean {
    return false;
  }
  isPointInStroke(_x: number, _y: number): boolean {
    return false;
  }

  // Other
  getLineDash(): number[] {
    return [];
  }
  setLineDash(_segments: number[]): void {}
  getContextAttributes(): CanvasRenderingContext2DSettings {
    return { alpha: true, desynchronized: false };
  }
}

// HTMLCanvasElement.getContext のモック
const originalGetContext = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function (
  this: HTMLCanvasElement,
  contextId: string,
  _options?: unknown,
): RenderingContext | null {
  if (contextId === "2d") {
    return new MockCanvasRenderingContext2D(
      this,
    ) as unknown as CanvasRenderingContext2D;
  }
  return originalGetContext.call(this, contextId as "2d", _options);
} as typeof HTMLCanvasElement.prototype.getContext;

// toDataURL のモック
HTMLCanvasElement.prototype.toDataURL = function (_type?: string): string {
  return "data:image/png;base64,mockImageData";
};

// toBlob のモック
HTMLCanvasElement.prototype.toBlob = function (
  callback: BlobCallback,
  _type?: string,
  _quality?: number,
): void {
  const blob = new Blob(["mock"], { type: _type || "image/png" });
  callback(blob);
};

// ResizeObserver モック
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// PointerEvent モック
class MockPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pressure: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;

  constructor(type: string, init?: PointerEventInit) {
    super(type, init);
    this.pointerId = init?.pointerId ?? 0;
    this.pressure = init?.pressure ?? 0;
    this.pointerType = init?.pointerType ?? "mouse";
    this.isPrimary = init?.isPrimary ?? true;
  }
}

globalThis.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;

// localStorage モック
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});
