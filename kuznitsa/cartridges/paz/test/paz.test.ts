import { describe, it, expect } from "vitest";
import cartridge from "../src/index.js";
describe("cartridge · paz", () => {
  it("api + id + emits viyemka (паз = несквозная выемка, не сквозное hole)", () => {
    expect(cartridge.api).toBe("cartridge-api@1");
    expect(cartridge.id).toBe("paz");
    const r = cartridge.onDraw({ x: 10, y: 20 }, { x: 40, y: 50 });
    expect(r.type).toBe("viyemka");
    expect(r.x.kind).toBe("fixed");
  });
});
