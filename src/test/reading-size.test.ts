import { describe, expect, it } from "vitest";
import { arabicTextStyle, clampScale, translationTextStyle } from "@/lib/reading-size";

describe("reading font sizes", () => {
  it("scales the Arabic text and its line spacing together", () => {
    expect(arabicTextStyle(1.4, 1)).toEqual({ fontSize: "2.66rem", lineHeight: "4.2rem" });
    expect(arabicTextStyle(1.4, 1.2)).toEqual({ fontSize: "2.66rem", lineHeight: "5.04rem" });
  });

  it("sizes the translation on its own, unaffected by the Arabic size", () => {
    expect(translationTextStyle(1.4)).toEqual({ fontSize: "1.4rem" });
    expect(translationTextStyle(1.4)).not.toEqual(expect.objectContaining({ lineHeight: "4.2rem" }));
  });

  it("keeps a translation larger than the smallest Arabic setting", () => {
    // The old shared slider floored the translation at 0.9rem while the Arabic
    // could drop to 0.7rem; the separate control must keep its own floor.
    expect(translationTextStyle(0.2)).toEqual({ fontSize: "0.8rem" });
    expect(arabicTextStyle(0.2, 1)).toEqual({ fontSize: "1.33rem", lineHeight: "2.1rem" });
  });

  it("clamps out-of-range saved values instead of rendering huge or zero text", () => {
    expect(arabicTextStyle(99, 99)).toEqual({ fontSize: "3.04rem", lineHeight: "6.72rem" });
    expect(translationTextStyle(99)).toEqual({ fontSize: "1.8rem" });
    expect(clampScale(Number.NaN, 0.8, 1.8)).toBe(1);
    expect(translationTextStyle(Number.NaN)).toEqual({ fontSize: "1rem" });
  });
});
