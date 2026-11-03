import { describe, expect, it } from "vitest";
import { compassPoint, distanceToKaaba, qiblaBearing } from "@/lib/qibla";

describe("qibla", () => {
  it("Addis Ababa faces roughly north-north-east", () => {
    expect(qiblaBearing(9.03, 38.74)).toBeCloseTo(4.7, 1);
  });
  it("London faces about 119° (south-east)", () => {
    expect(qiblaBearing(51.51, -0.13)).toBeCloseTo(119, 0);
    expect(compassPoint(qiblaBearing(51.51, -0.13))).toBe("SE");
  });
  it("Addis Ababa is about 1,380 km from the Kaaba", () => {
    expect(Math.round(distanceToKaaba(9.03, 38.74) / 10) * 10).toBeGreaterThan(1350);
    expect(distanceToKaaba(9.03, 38.74)).toBeLessThan(1420);
  });
});

import { accuracyLabel, classifyPermission, headingSpread } from "@/lib/geo";
describe("location + compass rules", () => {
  it("only fixes within 100 m are called precise", () => {
    expect(accuracyLabel(30)).toBe("precise");
    expect(accuracyLabel(800)).toBe("approximate");
    expect(accuracyLabel(5000)).toBe("city");
  });
  it("compass spread wraps across north", () => {
    expect(headingSpread([358, 2, 1])).toBe(4);
    expect(headingSpread([0, 90])).toBe(90);
  });
});

describe("Android location permission states", () => {
  it("granted (precise or approximate) uses the device", () => {
    expect(classifyPermission("prompt", "granted")).toBe("granted");
    expect(classifyPermission("granted")).toBe("granted");
  });
  it("declined in the dialog can be asked again", () => {
    expect(classifyPermission("prompt", "denied")).toBe("denied");
    expect(classifyPermission("prompt-with-rationale", "denied")).toBe("denied");
  });
  it("already denied before asking means permanently denied → Settings", () => {
    expect(classifyPermission("denied", "denied")).toBe("blocked");
  });
});
