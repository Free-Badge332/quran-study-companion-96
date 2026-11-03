// Font sizing for the Quran reader.
//
// Arabic ayah text and its translation scale independently: enlarging the
// Arabic should never shrink or stretch the translation, and vice versa.
// Saved values are clamped here so a corrupted or hand-edited preference can
// never render unreadable text.

export const ARABIC_SIZE_KEY = "font-size";
export const TRANSLATION_SIZE_KEY = "translation-font-size";
export const LINE_SPACING_KEY = "line-spacing";

export const ARABIC_SIZE_MIN = 0.7;
export const ARABIC_SIZE_MAX = 1.6;
export const TRANSLATION_SIZE_MIN = 0.8;
export const TRANSLATION_SIZE_MAX = 1.8;
export const LINE_SPACING_MIN = 0.8;
export const LINE_SPACING_MAX = 1.4;

/** Keep a saved scale inside the range the sliders can produce. */
export function clampScale(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(max, Math.max(min, value));
}

/** Arabic ayah text: size and line spacing both grow the block. */
export function arabicTextStyle(size: number, leading: number, baseSize = 1.9, baseLeading = 3) {
  const s = clampScale(size, ARABIC_SIZE_MIN, ARABIC_SIZE_MAX);
  const l = clampScale(leading, LINE_SPACING_MIN, LINE_SPACING_MAX);
  return { fontSize: `${round(baseSize * s)}rem`, lineHeight: `${round(baseLeading * s * l)}rem` };
}

/** Translation text: its own size, independent of the Arabic size. */
export function translationTextStyle(size: number, baseSize = 1) {
  const s = clampScale(size, TRANSLATION_SIZE_MIN, TRANSLATION_SIZE_MAX);
  return { fontSize: `${round(baseSize * s)}rem` };
}

function round(n: number) {
  return Math.round(n * 1000) / 1000;
}
