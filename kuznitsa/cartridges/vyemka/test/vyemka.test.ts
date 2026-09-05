import { describe, it, expect } from "vitest";
import cartridge from "../src/index.js";
describe("cartridge · vyemka", () => {
  it("api + id + emits viyemka", () => {
    expect(cartridge.api).toBe("cartridge-api@1");
    expect(cartridge.id).toBe("vyemka");
    const r = cartridge.onDraw({ x: 10, y: 20 }, { x: 40, y: 50 });
    expect(r.type).toBe("viyemka");
    expect(r.x.kind).toBe("fixed");
  });
});
