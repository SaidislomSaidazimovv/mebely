import { describe, it, expect } from "vitest";
import cartridge from "../src/index.js";
describe("cartridge · povorot", () => {
  it("api + id + emits notch", () => {
    expect(cartridge.api).toBe("cartridge-api@1");
    expect(cartridge.id).toBe("povorot");
    const r = cartridge.onDraw({ x: 10, y: 20 }, { x: 40, y: 50 });
    expect(r.type).toBe("notch");
    expect(r.x.kind).toBe("fixed");
  });
});
