import { describe, it, expect } from "vitest";
import { featureRuleToModifier } from "./fromCartridge";
import type { FeatureRule } from "../../../dogovor/cartridge.interface";

describe("§1b bridge · FeatureRule → Modifier", () => {
  it("keeps type, maps mm-from-edge to anchors, size→params mm10", () => {
    const fr: FeatureRule = { type: "notch", x: { kind: "fixed", fromEdge: "left", mm: 30 }, y: { kind: "fixed", fromEdge: "top", mm: 20 }, size: { w_mm: 40, h_mm: 15 } };
    const m = featureRuleToModifier(fr);
    expect(m.type).toBe("notch");
    expect(m.anchors[0]).toEqual({ edge: "left", distance: { rule: "fixed", mm10: 300 } });
    expect(m.anchors[1]).toEqual({ edge: "top", distance: { rule: "fixed", mm10: 200 } });
    expect(m.params).toEqual({ w: 400, h: 150 });
  });
  it("laminate fill → 0", () => {
    const fr: FeatureRule = { type: "laminate", x: { kind: "fixed", fromEdge: "left", mm: 0 }, y: { kind: "fixed", fromEdge: "top", mm: 0 }, size: { w_mm: "fill", h_mm: "fill" } };
    expect(featureRuleToModifier(fr).params).toEqual({ w: 0, h: 0 });
  });
});
