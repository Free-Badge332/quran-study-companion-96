import { describe, expect, it } from "vitest";
import {
  increment,
  isComplete,
  justCompleted,
  remaining,
  tasbihReducer,
  undo,
  type TasbihState,
} from "@/lib/tasbih";

const base: TasbihState = { phrase: "subhanallah", counts: {}, targets: {}, total: 0 };

describe("tasbih counter", () => {
  it("each tap adds exactly one and may continue past the target", () => {
    expect(increment(0)).toBe(1);
    expect(increment(33)).toBe(34);
    expect(isComplete(34, 33)).toBe(true);
  });
  it("undo removes one tap and never goes below zero", () => {
    expect(undo(7)).toBe(6);
    expect(undo(0)).toBe(0);
  });
  it("completion fires only on the tap that reaches the target", () => {
    expect(justCompleted(32, 33, 33)).toBe(true);
    expect(justCompleted(33, 34, 33)).toBe(false);
    expect(justCompleted(5, 6, null)).toBe(false);
  });
  it("shows remaining repetitions, e.g. 7 of 33 leaves 26", () => {
    expect(remaining(7, 33)).toBe(26);
    expect(remaining(40, 33)).toBe(0);
    expect(remaining(7, null)).toBeNull();
  });
  it("reset clears only the current dhikr and keeps the all-time total", () => {
    let s = tasbihReducer(base, { type: "tap" });
    s = tasbihReducer(s, { type: "tap" });
    s = tasbihReducer({ ...s, counts: { ...s.counts, alhamdulillah: 5 } }, { type: "reset" });
    expect(s.counts["subhanallah"]).toBe(0);
    expect(s.counts["alhamdulillah"]).toBe(5);
    expect(s.total).toBe(2);
  });
  it("undo also reduces the all-time total, but not when already at zero", () => {
    let s = tasbihReducer(base, { type: "tap" });
    s = tasbihReducer(s, { type: "undo" });
    s = tasbihReducer(s, { type: "undo" });
    expect(s.counts["subhanallah"]).toBe(0);
    expect(s.total).toBe(0);
  });
  it("each dhikr keeps its own count when switching", () => {
    let s = tasbihReducer(base, { type: "tap" });
    s = tasbihReducer(s, { type: "select", phrase: "allahuakbar" });
    s = tasbihReducer(s, { type: "tap" });
    s = tasbihReducer(s, { type: "tap" });
    expect(s.counts).toEqual({ subhanallah: 1, allahuakbar: 2 });
  });
});
