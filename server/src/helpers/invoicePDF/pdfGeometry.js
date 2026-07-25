// pdfGeometry.js — CommonJS port of the admin billing-hub's pdfGeometry.js.
// Pure constants, so this is a byte-for-byte logical match, just export
// syntax changed.

const A4 = { w: 210, h: 297 };
const MARGIN_MM = 3.5; // 0.35 cm

const HALF = { w: A4.w, h: A4.h / 2 };

const BORDER = {
  x: MARGIN_MM,
  y: MARGIN_MM,
  w: HALF.w - MARGIN_MM * 2,
  h: HALF.h - MARGIN_MM * 2,
};

const CONTENT_PAD = 1.5;
const CONTENT = {
  x: BORDER.x + CONTENT_PAD,
  y: BORDER.y + CONTENT_PAD,
  w: BORDER.w - CONTENT_PAD * 2,
  h: BORDER.h - CONTENT_PAD * 2,
};

const BILL_TOTAL_GAP_MM = 2;

module.exports = { A4, MARGIN_MM, HALF, BORDER, CONTENT_PAD, CONTENT, BILL_TOTAL_GAP_MM };