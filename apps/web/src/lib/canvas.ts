export type DrawingPoint = {
  x: number;
  y: number;
  pressure: number;
  time: number;
};

const BRUSH_SIZE = 28;

const INTERPOLATION_STEP = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function resizeCanvas(canvas: HTMLCanvasElement) {
  const { width, height } = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  const previousWidth = canvas.width;
  const previousHeight = canvas.height;
  const previous = document.createElement("canvas");

  previous.width = previousWidth;
  previous.height = previousHeight;
  previous.getContext("2d")?.drawImage(canvas, 0, 0);

  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  if (previousWidth && previousHeight) {
    context.drawImage(previous, 0, 0, canvas.width, canvas.height);
  }

  context.setTransform(scale, 0, 0, scale, 0, 0);
}

export function drawGraphiteSegment(
  context: CanvasRenderingContext2D,
  from: DrawingPoint,
  to: DrawingPoint,
) {
  const pressure = (from.pressure + to.pressure) / 2;
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const speed = distance / Math.max(1, to.time - from.time);
  const density = 1 - clamp(speed / 1.8, 0, 0.72);
  const width = BRUSH_SIZE * (0.74 + pressure * 0.32);
  const normalX = distance ? -(to.y - from.y) / distance : 0;
  const normalY = distance ? (to.x - from.x) / distance : 0;

  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = `rgba(187, 190, 197, ${0.18 + density * 0.12})`;
  context.lineWidth = width * 0.76;

  if (Math.random() > 0.025) {
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }

  const deposits = Math.round(4 + density * 4);
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  for (let i = 0; i < deposits; i++) {
    const along = (i + Math.random()) / deposits;
    const centerBias = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
    const lateral = centerBias * width * 0.38;
    const edgeFactor = Math.abs(lateral) / (width * 0.38);
    const x = from.x + (to.x - from.x) * along + normalX * lateral;
    const y = from.y + (to.y - from.y) * along + normalY * lateral;
    const size = 0.4 + Math.random() * (0.55 + density * 0.55);
    const opacity = (0.045 + density * 0.065) * (1 - edgeFactor * 0.24);

    context.save();
    context.translate(x, y);
    context.rotate(angle + (Math.random() - 0.5) * 0.5);
    context.fillStyle = `rgba(210, 212, 217, ${opacity})`;
    context.beginPath();
    context.ellipse(0, 0, size * (0.7 + Math.random() * 0.9), size, 0, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }
}

export function interpolatePoints(from: DrawingPoint, to: DrawingPoint) {
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / INTERPOLATION_STEP),
  );

  return Array.from({ length: steps }, (_, index) => {
    const progress = (index + 1) / steps;

    return {
      x: from.x + (to.x - from.x) * progress,
      y: from.y + (to.y - from.y) * progress,
      pressure: from.pressure + (to.pressure - from.pressure) * progress,
      time: from.time + (to.time - from.time) * progress,
    };
  });
}

export function canvasToGrayscale(imageData: ImageData): Float32Array {
  const pixels = new Float32Array(imageData.width * imageData.height);

  for (let i = 0; i < pixels.length; i++) {
    const r = imageData.data[i * 4];
    pixels[i] = r / 255;
  }

  return pixels;
}

function getBoundingBox(
  pixels: Float32Array,
  width: number,
  height: number,
  threshold = 0.05,
): BoundingBox | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const value = pixels[y * width + x];

      if (value <= threshold) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX === -1) {
    return null;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
}

function imageDataToGrayscale(imageData: ImageData): Float32Array {
  const pixels = new Float32Array(imageData.width * imageData.height);

  for (let i = 0; i < pixels.length; i++) {
    const index = i * 4;

    const r = imageData.data[index];
    const g = imageData.data[index + 1];
    const b = imageData.data[index + 2];

    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    pixels[i] = gray / 255;
  }

  return pixels;
}

type BoundingBox = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function cropCanvas(canvas: HTMLCanvasElement, box: BoundingBox): HTMLCanvasElement {
  const width = box.maxX - box.minX + 1;
  const height = box.maxY - box.minY + 1;

  const cropped = document.createElement("canvas");

  cropped.width = width;
  cropped.height = height;

  const ctx = cropped.getContext("2d")!;

  ctx.drawImage(canvas, box.minX, box.minY, width, height, 0, 0, width, height);

  return cropped;
}

function resizeToFit(
  canvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
): HTMLCanvasElement {
  const scale = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);

  const width = Math.max(1, Math.round(canvas.width * scale));

  const height = Math.max(1, Math.round(canvas.height * scale));

  const resized = document.createElement("canvas");

  resized.width = width;
  resized.height = height;

  const ctx = resized.getContext("2d")!;

  ctx.imageSmoothingEnabled = true;

  ctx.drawImage(canvas, 0, 0, width, height);

  return resized;
}

function placeOnMNISTCanvas(digit: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  canvas.width = MNIST_SIZE;
  canvas.height = MNIST_SIZE;

  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, MNIST_SIZE, MNIST_SIZE);

  const x = Math.round((MNIST_SIZE - digit.width) / 2);

  const y = Math.round((MNIST_SIZE - digit.height) / 2);

  ctx.drawImage(digit, x, y);

  return canvas;
}

function centerByMass(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d")!;

  const image = ctx.getImageData(0, 0, MNIST_SIZE, MNIST_SIZE);

  const pixels = imageDataToGrayscale(image);

  let mass = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < MNIST_SIZE; y++) {
    for (let x = 0; x < MNIST_SIZE; x++) {
      const value = pixels[y * MNIST_SIZE + x];

      mass += value;
      sumX += x * value;
      sumY += y * value;
    }
  }

  if (mass === 0) {
    return;
  }

  const centerX = sumX / mass;
  const centerY = sumY / mass;

  const target = (MNIST_SIZE - 1) / 2;

  const dx = Math.round(target - centerX);
  const dy = Math.round(target - centerY);

  if (dx === 0 && dy === 0) {
    return;
  }

  const copy = document.createElement("canvas");

  copy.width = MNIST_SIZE;
  copy.height = MNIST_SIZE;

  const copyCtx = copy.getContext("2d")!;

  copyCtx.drawImage(canvas, 0, 0);

  ctx.clearRect(0, 0, MNIST_SIZE, MNIST_SIZE);

  ctx.fillStyle = "black";

  ctx.fillRect(0, 0, MNIST_SIZE, MNIST_SIZE);

  ctx.drawImage(copy, dx, dy);
}

const MNIST_SIZE = 28;
const DIGIT_SIZE = 20;

export function preprocessDigit(canvas: HTMLCanvasElement): Float32Array {
  const sourceCtx = canvas.getContext("2d");

  if (!sourceCtx) {
    throw new Error("Could not get canvas context");
  }

  const sourceImage = sourceCtx.getImageData(0, 0, canvas.width, canvas.height);

  const grayscale = imageDataToGrayscale(sourceImage);

  const box = getBoundingBox(grayscale, canvas.width, canvas.height);

  if (!box) {
    return new Float32Array(MNIST_SIZE * MNIST_SIZE);
  }

  const cropped = cropCanvas(canvas, box);

  const resized = resizeToFit(cropped, DIGIT_SIZE, DIGIT_SIZE);

  const mnistCanvas = placeOnMNISTCanvas(resized);

  centerByMass(mnistCanvas);

  const finalCtx = mnistCanvas.getContext("2d")!;

  const finalImage = finalCtx.getImageData(0, 0, MNIST_SIZE, MNIST_SIZE);

  return imageDataToGrayscale(finalImage);
}

export function inputToCanvas(input: Float32Array): HTMLCanvasElement {
  const canvas = document.createElement("canvas");

  canvas.width = 28;
  canvas.height = 28;

  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(28, 28);

  for (let i = 0; i < input.length; i++) {
    const value = Math.round(input[i] * 255);
    const index = i * 4;

    image.data[index] = value;
    image.data[index + 1] = value;
    image.data[index + 2] = value;
    image.data[index + 3] = 255;
  }

  ctx.putImageData(image, 0, 0);

  return canvas;
}
