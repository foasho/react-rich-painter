export const createChecker = (
  cellSize: number = 10,
  colorA: string = "#fff",
  colorB: string = "#ccc"
): HTMLCanvasElement => {
  const size = cellSize * 2;
  const checker = document.createElement("canvas");
  checker.width = size;
  checker.height = size;
  const context = checker.getContext("2d")!;
  context.fillStyle = colorB;
  context.fillRect(0, 0, size, size);
  context.fillStyle = colorA;
  context.fillRect(0, 0, cellSize, cellSize);
  context.fillRect(cellSize, cellSize, cellSize, cellSize);
  return checker;
}

export const createAlphaThresholdBorder = (
  image: HTMLCanvasElement,
  threshold: number = 0x80,
  antialias: boolean = false,
  color: string = "#000"
): HTMLCanvasElement => {
  const width = image.width;
  const height = image.height;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width = width;
  canvas.height = height;
  try {
    context.drawImage(image, 0, 0, width, height);
  } catch (e) {
    return canvas;
  }
  const imageData = context.getImageData(0, 0, width, height);
  const d = imageData.data;

  function getAlphaIndex(index: number): number {
    return d[index * 4 + 3];
  }
  function setRedIndex(index: number, red: number): void {
    d[index * 4] = red;
  }
  function getRedXY(x: number, y: number): number {
    const red = d[((y * width) + x) * 4];
    return red ? red : 0;
  }
  function getGreenXY(x: number, y: number): number {
    const green = d[((y * width) + x) * 4 + 1];
    return green;
  }
  function setColorXY(x: number, y: number, red: number, green: number, alpha: number): void {
    const i = ((y * width) + x) * 4;
    d[i] = red;
    d[i + 1] = green;
    d[i + 2] = 0;
    d[i + 3] = alpha;
  }

  // Threshold
  const pixelCount = (d.length * 0.25) | 0;
  for (let i = 0; i < pixelCount; ++i) {
    setRedIndex(i, getAlphaIndex(i) < threshold ? 0 : 1);
  }

  // Outline
  for (let x = 0; x < width; ++x) {
    for (let y = 0; y < height; ++y) {
      if (!getRedXY(x, y)) {
        setColorXY(x, y, 0, 0, 0);
      } else {
        let redCount = 0;
        const left = x - 1;
        const right = x + 1;
        const up = y - 1;
        const down = y + 1;
        redCount += getRedXY(left, up);
        redCount += getRedXY(left, y);
        redCount += getRedXY(left, down);
        redCount += getRedXY(right, up);
        redCount += getRedXY(right, y);
        redCount += getRedXY(right, down);
        redCount += getRedXY(x, up);
        redCount += getRedXY(x, down);
        if (redCount !== 8) {
          setColorXY(x, y, 1, 1, 255);
        } else {
          setColorXY(x, y, 1, 0, 0);
        }
      }
    }
  }

  // Antialias
  if (antialias) {
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        if (getGreenXY(x, y)) {
          let alpha = 0;
          if (getGreenXY(x - 1, y) !== getGreenXY(x + 1, y)) {
            alpha += 0x40;
            setColorXY(x, y, 1, 1, alpha);
          }
          if (getGreenXY(x, y - 1) !== getGreenXY(x, y + 1)) {
            alpha += 0x50;
            setColorXY(x, y, 1, 1, alpha);
          }
        }
      }
    }
  }

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = "source-in";
  context.fillStyle = color;
  context.fillRect(0, 0, width, height);
  return canvas;
}


export const createBrushPointer = (
  brushImage: HTMLImageElement | null,
  v_canvas: HTMLCanvasElement,
  brushSize: number,
  brushAngle: number,
  threshold: number,
  antialias: boolean
): HTMLCanvasElement => {
  brushSize = brushSize | 0;
  const pointer = document.createElement("canvas");
  const pointerContext = pointer.getContext("2d")!;
  if (brushSize === 0) {
    pointer.width = 1;
    pointer.height = 1;
    return pointer;
  }
  if (brushImage === null) {
    const halfSize = (brushSize * 0.5) | 0;
    pointer.width = brushSize;
    pointer.height = brushSize;
    pointerContext.fillStyle = "#000";
    pointerContext.beginPath();
    pointerContext.arc(halfSize, halfSize, halfSize, 0, Math.PI * 2);
    pointerContext.closePath();
    pointerContext.fill();
  } else {
    const width = brushSize;
    const height = brushSize * (brushImage.height / brushImage.width);
    pointer.width = width;
    pointer.height = height;

    // 回転処理などが必要な場合はここに追加できます

    pointerContext.drawImage(brushImage, 0, 0, width, height);
  }
  return createAlphaThresholdBorder(pointer, threshold, antialias);
}

export const createFloodFill = (
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a: number
): HTMLCanvasElement => {
  const result = document.createElement("canvas");
  const w = (result.width = canvas.width);
  const h = (result.height = canvas.height);
  if (x < 0 || x >= w || y < 0 || y >= h || !(r || g || b || a)) return result;

  const originalContext = canvas.getContext("2d")!;
  const originalData = originalContext.getImageData(0, 0, w, h);
  const od = originalData.data;
  const resultContext = result.getContext("2d")!;
  const resultData = resultContext.getImageData(0, 0, w, h);
  const rd = resultData.data;
  const replacementColor = (r << 24) | (g << 16) | (b << 8) | a;

  function getColor(x: number, y: number): number {
    const index = (y * w + x) * 4;
    return rd[index]
      ? replacementColor
      : (od[index] << 24) | (od[index + 1] << 16) | (od[index + 2] << 8) | od[index + 3];
  }

  const targetColor = getColor(x, y);
  const queue: number[] = [];
  queue.push(x, y);

  while (queue.length) {
    const nx = queue.shift()!;
    const ny = queue.shift()!;
    if (nx < 0 || nx >= w || ny < 0 || ny >= h || getColor(nx, ny) !== targetColor) continue;
    let west = nx;
    let east = nx;
    do {
      const wc = getColor(--west, ny);
    } while (west >= 0 && getColor(west, ny) === targetColor);
    do {
      const ec = getColor(++east, ny);
    } while (east < w && getColor(east, ny) === targetColor);
    for (let i = west + 1; i < east; ++i) {
      rd[(ny * w + i) * 4] = 1;
      const north = ny - 1;
      const south = ny + 1;
      if (getColor(i, north) === targetColor) queue.push(i, north);
      if (getColor(i, south) === targetColor) queue.push(i, south);
    }
  }

  for (let i = 0; i < w; ++i) {
    for (let j = 0; j < h; ++j) {
      const index = (j * w + i) * 4;
      if (rd[index] === 0) continue;
      rd[index] = r;
      rd[index + 1] = g;
      rd[index + 2] = b;
      rd[index + 3] = a;
    }
  }

  resultContext.putImageData(resultData, 0, 0);
  return result;
}

