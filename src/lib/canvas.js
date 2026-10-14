/** Canvas and image helpers. */

/**
 * @param {number} width
 * @param {number} height
 */
export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<Blob>}
 */
export const toPngBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));

/**
 * Decode an image blob into a canvas the drawing code can read from.
 * @param {Blob} blob
 */
export async function canvasFromBlob(blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = createCanvas(bitmap.width, bitmap.height);
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  return canvas;
}

/**
 * Draw `src` centred inside a W×H box, as large as fits, optionally scaled down further.
 * @param {CanvasRenderingContext2D} g
 * @param {CanvasImageSource & { width: number, height: number }} src
 * @param {number} W
 * @param {number} H
 * @param {number} [scale]
 */
export function drawContain(g, src, W, H, scale = 1) {
  const s = Math.min(W / src.width, H / src.height) * scale;
  const w = src.width * s;
  const h = src.height * s;
  g.drawImage(src, (W - w) / 2, (H - h) / 2, w, h);
}
