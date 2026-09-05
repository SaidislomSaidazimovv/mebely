import { describe, it, expect } from "vitest";
import cartridge from "../src/index.js";
describe("cartridge · skruglenie", () => {
  it("api + id + emits round_corner", () => {
    expect(cartridge.api).toBe("cartridge-api@1");
    expect(cartridge.id).toBe("skruglenie");
    const r = cartridge.onDraw({ x: 10, y: 20 }, { x: 40, y: 50 });
    expect(r.type).toBe("round_corner");
    expect(r.x.kind).toBe("fixed");
  });
});
