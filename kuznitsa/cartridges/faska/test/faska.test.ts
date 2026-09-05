import { describe, it, expect } from "vitest";
import cartridge from "../src/index.js";
describe("cartridge · faska", () => {
  it("api + id + emits bevel", () => {
    expect(cartridge.api).toBe("cartridge-api@1");
    expect(cartridge.id).toBe("faska");
    const r = cartridge.onDraw({ x: 10, y: 20 }, { x: 40, y: 50 });
    expect(r.type).toBe("bevel");
    expect(r.x.kind).toBe("fixed");
  });
});
