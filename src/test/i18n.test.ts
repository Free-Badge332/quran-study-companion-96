import { describe, expect, it } from "vitest";
import { translate } from "@/lib/i18n";

describe("interface languages", () => {
  it("shows Afaan Oromoo wording", () => expect(translate("om", "navSettings")).toBe("Qindaa'ina"));
  it("shows Amharic wording", () => expect(translate("am", "navSettings")).toBe("ቅንብሮች"));
  it("falls back to English for languages without interface wording", () =>
    expect(translate("fr", "navSettings")).toBe("Settings"));
});
