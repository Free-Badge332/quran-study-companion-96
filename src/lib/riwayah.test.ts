import { describe, expect, it } from "vitest";
import { markSurahDifferences, riwayahKey } from "./riwayah";
describe("riwayah", () => {
  it("maps reciter labels to bundled texts", () => {
    expect(riwayahKey("Al-Duri an Abi Amr")).toBe("duri");
    expect(riwayahKey("Rewayat Hafs A'n Assem")).toBe("hafs");
    expect(riwayahKey("Rewayat Warsh A'n Nafi'")).toBe("warsh");
    expect(riwayahKey("Rewayat AlDorai A'n Al-Kisa'ai")).toBeNull();
  });
  it("marks only words that differ, even across different verse splits", () => {
    const out = markSurahDifferences([{ id: 1, text: "قال ربك" }, { id: 2, text: "يا موسى قل" }], ["قَالَ رَبُّكَ يا", "موسى قال"]);
    expect(out.flatMap((v) => v.words.filter((w) => w.differs).map((w) => w.word))).toEqual(["قل"]);
  });
});
