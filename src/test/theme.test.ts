import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, THEME_BOOT_SCRIPT, THEME_MIRROR, isThemeChoice } from "@/lib/theme";

describe("theme preference", () => {
  it("defaults to light", () => {
    expect(DEFAULT_THEME).toBe("light");
  });
  it("accepts only light and dark", () => {
    expect(isThemeChoice("light")).toBe(true);
    expect(isThemeChoice("dark")).toBe(true);
    expect(isThemeChoice("system")).toBe(false);
    expect(isThemeChoice("sepia")).toBe(false);
  });
  it("first paint is light when nothing was saved", () => {
    localStorage.removeItem(THEME_MIRROR);
    document.documentElement.classList.remove("dark");
    eval(THEME_BOOT_SCRIPT);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
  it("an old saved 'system' choice shows light on first paint", () => {
    localStorage.setItem(THEME_MIRROR, "system");
    document.documentElement.classList.remove("dark");
    eval(THEME_BOOT_SCRIPT);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
  it("a saved dark choice shows dark on first paint", () => {
    localStorage.setItem(THEME_MIRROR, "dark");
    document.documentElement.classList.remove("dark");
    eval(THEME_BOOT_SCRIPT);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
