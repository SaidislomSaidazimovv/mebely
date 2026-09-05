import { describe, it, expect } from "vitest";
import manifest from "../manifest.json";
describe("cartridge · konstruktor", () => { it("cartridge-api@1", () => { expect(manifest.api).toBe("cartridge-api@1"); }); });
