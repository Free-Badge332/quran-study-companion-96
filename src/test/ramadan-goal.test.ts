import { describe, expect, it } from "vitest";
import { checklistProgress, nextFastEvent, toggleItem } from "@/lib/ramadan";
import { goalProgress } from "@/lib/quran-goal";
import { parseCustomTarget, tasbihReducer } from "@/lib/tasbih";

const d = (h: number, m = 0, day = 1) => new Date(2026, 2, day, h, m);
const today = { fajr: d(5, 10), maghrib: d(18, 40) };
const tomorrow = d(5, 9, 2);

describe("nextFastEvent", () => {
  it("before Fajr counts down to suhoor ending", () => expect(nextFastEvent(d(3), today, tomorrow)).toEqual({ kind: "suhoor", at: today.fajr }));
  it("during the day counts down to iftar", () => expect(nextFastEvent(d(12), today, tomorrow)).toEqual({ kind: "iftar", at: today.maghrib }));
  it("after Maghrib counts down to tomorrow's suhoor", () => expect(nextFastEvent(d(20), today, tomorrow)).toEqual({ kind: "suhoor", at: tomorrow }));
});

describe("checklist", () => {
  it("toggles on and off", () => expect(toggleItem(toggleItem([], "quran"), "quran")).toEqual([]));
  it("7 items: 1 done is 1/7", () => expect(checklistProgress(["fasted"])).toBeCloseTo(1 / 7));
});

describe("quran goal", () => {
  it("15 min goal with 450 s read is half", () => expect(goalProgress(450, 15)).toBe(0.5));
  it("caps at 1", () => expect(goalProgress(9999, 5)).toBe(1));
});

describe("custom tasbih target", () => {
  it("accepts 70", () => expect(parseCustomTarget("70")).toBe(70));
  it("rejects 0, decimals and over 10000", () => {
    expect(parseCustomTarget("0")).toBeNull();
    expect(parseCustomTarget("3.5")).toBeNull();
    expect(parseCustomTarget("10001")).toBeNull();
  });
  it("a tap adds exactly one", () => {
    const s = tasbihReducer({ phrase: "a", counts: { a: 4 }, targets: {}, total: 4 }, { type: "tap" });
    expect(s.counts["a"]).toBe(5);
  });
});
