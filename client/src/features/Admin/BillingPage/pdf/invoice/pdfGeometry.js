// pdfGeometry.js

export const A4 = { w: 210, h: 297 };
export const MARGIN_MM = 3.5; // 0.35 cm

export const HALF = { w: A4.w, h: A4.h / 2 };

export const BORDER = {
  x: MARGIN_MM,
  y: MARGIN_MM,
  w: HALF.w - MARGIN_MM * 2,
  h: HALF.h - MARGIN_MM * 2,
};

export const CONTENT_PAD = 1.5;
export const CONTENT = {
  x: BORDER.x + CONTENT_PAD,
  y: BORDER.y + CONTENT_PAD,
  w: BORDER.w - CONTENT_PAD * 2,
  h: BORDER.h - CONTENT_PAD * 2,
};

export const BILL_TOTAL_GAP_MM = 2;