/**
 * A4 layout: shelf packing (first-fit, tallest pieces first). The base sheets and the grid sheets
 * share the same layout, so every grid lands exactly where its image is.
 */

export const A4 = { short: 210, long: 297 };
const EPSILON = 1e-6;

/**
 * @template T
 * @typedef {T & { w: number, h: number }} Piece a piece to place, sizes in mm
 */

/**
 * @template T
 * @param {Array<Piece<T>>} pieces
 * @param {{ landscape: boolean, margin: number, gap: number }} opts
 * @returns {{ PW: number, PH: number, pages: Array<{ items: Array<Piece<T> & { x: number, y: number }> }>, tooBig: Array<Piece<T>> }}
 */
export function packSheets(pieces, { landscape, margin, gap }) {
  const PW = landscape ? A4.long : A4.short;
  const PH = landscape ? A4.short : A4.long;
  const usableW = PW - 2 * margin;
  const usableH = PH - 2 * margin;

  const sorted = [...pieces].sort((a, b) => b.h - a.h || b.w - a.w);
  const pages = [];
  const tooBig = [];

  const place = (page, shelf, piece) => {
    page.items.push({ ...piece, x: margin + shelf.x, y: margin + shelf.y });
    shelf.x += piece.w + gap;
  };
  const openShelf = (page, piece) => {
    const shelf = { y: page.nextY, h: piece.h, x: 0 };
    page.shelves.push(shelf);
    page.nextY += piece.h + gap;
    place(page, shelf, piece);
  };

  for (const piece of sorted) {
    if (piece.w > usableW + EPSILON || piece.h > usableH + EPSILON) {
      tooBig.push(piece);
      continue;
    }
    let placed = false;
    for (const page of pages) {
      const shelf = page.shelves.find((s) => s.x + piece.w <= usableW + EPSILON && piece.h <= s.h + EPSILON);
      if (shelf) {
        place(page, shelf, piece);
        placed = true;
        break;
      }
      if (page.nextY + piece.h <= usableH + EPSILON) {
        openShelf(page, piece);
        placed = true;
        break;
      }
    }
    if (!placed) {
      const page = { shelves: [], nextY: 0, items: [] };
      pages.push(page);
      openShelf(page, piece);
    }
  }
  return { PW, PH, pages, tooBig };
}
