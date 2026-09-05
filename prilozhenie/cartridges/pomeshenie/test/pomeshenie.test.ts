import { describe, it, expect } from "vitest";
import manifest from "../manifest.json";

// Кассета 01 · Помещение — приёмочный смоук: манифест валиден, api города совпал.
describe("cartridge · pomeshenie (01 · Помещение)", () => {
  it("declares cartridge-api@1", () => {
    expect(manifest.api).toBe("cartridge-api@1");
    expect(manifest.id).toBe("pomeshenie");
  });
});
