/**
 * Sheet previews and the two PDFs (images, grids), with every piece at its real size in millimetres.
 * Pure functions of the saved records and the sheet options; the Print section calls them.
 */
import { packSheets } from './layout.js';
import { INFO_SEPARATOR } from '../core/info.js';
import { createCanvas } from '../lib/canvas.js';

const MM_PER_PT = 25.4 / 72;
const INFO_PT = 6; // settings text, about 2 mm tall
const INFO_LINE = 2.6; // mm
const INFO_PAD = 1.2; // mm
const PREVIEW_PX_PER_MM = 2.4;

/**
 * @typedef {object} SheetOptions
 * @property {boolean} landscape
 * @property {number} margin mm
 * @property {number} gap mm
 * @property {boolean} info print the settings line above each piece
 * @property {boolean} outline thin cutting outline
 */

/** @type {Map<string, ImageBitmap>} */
const bitmaps = new Map();

// jsPDF is large, so it loads on first use
let jsPdfPromise = null;
const loadJsPdf = () => (jsPdfPromise ??= import('jspdf').then((m) => m.jsPDF));
let measureDoc = null;

/** Wrap a record's settings line to its width, measured with the same font the PDF uses. */
async function infoLines(record) {
  const jsPDF = await loadJsPdf();
  measureDoc ??= new jsPDF({ unit: 'mm', format: 'a4' });
  measureDoc.setFont('helvetica', 'normal');
  measureDoc.setFontSize(INFO_PT);
  return measureDoc.splitTextToSize(record.info.join(INFO_SEPARATOR), record.wMm);
}

/**
 * Every checked record, once per copy, laid out on A4 sheets.
 * @param {import('../stores/library.svelte.js').SavedAnimation[]} records
 * @param {SheetOptions} opts
 */
export async function layoutSheets(records, opts) {
  const pieces = [];
  for (const record of records.filter((r) => r.checked)) {
    const lines = opts.info ? await infoLines(record) : [];
    const band = lines.length ? lines.length * INFO_LINE + INFO_PAD : 0;
    for (let c = 0; c < record.copies; c++) {
      pieces.push({ record, lines, band, w: record.wMm, h: record.hMm + band });
    }
  }
  return { ...packSheets(pieces, opts), opts, total: pieces.length };
}

/** Drop cached images of a record that changed or was deleted. */
export function forgetRecord(id) {
  bitmaps.delete(id + 'base');
  bitmaps.delete(id + 'grid');
}

async function bitmap(record, kind) {
  const key = record.id + kind;
  if (!bitmaps.has(key)) bitmaps.set(key, await createImageBitmap(record[kind]));
  return bitmaps.get(key);
}

/**
 * @param {Awaited<ReturnType<typeof layoutSheets>>} L
 * @param {number} pageIndex
 * @param {'base' | 'grid'} kind
 */
export async function drawSheet(L, pageIndex, kind) {
  const k = PREVIEW_PX_PER_MM;
  const c = createCanvas(Math.round(L.PW * k), Math.round(L.PH * k));
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  // printable area
  g.setLineDash([4, 4]);
  g.strokeStyle = '#c9ced6';
  g.lineWidth = 1;
  const m = L.opts.margin;
  g.strokeRect(m * k, m * k, (L.PW - 2 * m) * k, (L.PH - 2 * m) * k);
  g.setLineDash([]);
  for (const it of L.pages[pageIndex].items) {
    const top = it.y + it.band;
    g.drawImage(await bitmap(it.record, kind), it.x * k, top * k, it.w * k, it.record.hMm * k);
    if (L.opts.outline) {
      g.strokeStyle = '#969696';
      g.strokeRect(it.x * k, top * k, it.w * k, it.record.hMm * k);
    }
    if (it.lines.length) {
      g.fillStyle = '#000';
      g.textBaseline = 'top';
      g.font = `${INFO_PT * MM_PER_PT * k}px Helvetica, Arial, sans-serif`;
      it.lines.forEach((l, j) => g.fillText(l, it.x * k, (it.y + j * INFO_LINE) * k));
    }
  }
  return c;
}

/** One-line summary of the layout, and whether some pieces don't fit. */
export function summarize(L) {
  const placed = L.total - L.tooBig.length;
  const n = L.pages.length;
  let text = placed
    ? `${placed} ${placed === 1 ? 'piece' : 'pieces'} on ${n} ${n === 1 ? 'sheet' : 'sheets'} of each kind.`
    : '';
  if (L.tooBig.length) {
    const names = [...new Set(L.tooBig.map((t) => t.record.name))].join(', ');
    text += ` Doesn't fit on the sheet: ${names}. Reduce the margin or try landscape.`;
  }
  return { text: text.trim(), warn: L.tooBig.length > 0 };
}

/**
 * @param {import('../stores/library.svelte.js').SavedAnimation[]} records
 * @param {SheetOptions} opts
 * @param {'base' | 'grid'} kind
 * @returns {Promise<Blob>}
 */
export async function buildPdf(records, opts, kind) {
  const jsPDF = await loadJsPdf();
  const L = await layoutSheets(records, opts);
  const orientation = opts.landscape ? 'landscape' : 'portrait';
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation, compress: true });
  const bytes = new Map();
  for (let i = 0; i < L.pages.length; i++) {
    if (i) doc.addPage('a4', orientation);
    for (const it of L.pages[i].items) {
      const { record } = it;
      if (!bytes.has(record.id)) bytes.set(record.id, new Uint8Array(await record[kind].arrayBuffer()));
      const top = it.y + it.band;
      doc.addImage(bytes.get(record.id), 'PNG', it.x, top, it.w, record.hMm, `${kind}-${record.id}`, 'FAST');
      if (opts.outline) {
        doc.setDrawColor(150);
        doc.setLineWidth(0.1);
        doc.rect(it.x, top, it.w, record.hMm);
      }
      if (it.lines.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(INFO_PT);
        doc.setTextColor(0);
        it.lines.forEach((l, j) => doc.text(l, it.x, it.y + j * INFO_LINE, { baseline: 'top' }));
      }
    }
  }
  return doc.output('blob');
}
