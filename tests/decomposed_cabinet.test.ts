// §3 — solveDecomposedCabinet (custom-interior drilling bridge). Now a PERMANENT test in the city
// (was a temp engine/-mirror check). Proves: a simple custom box drills + passes the safety gate;
// multi-door honours per-door hinge side; a drawer front gets no hinge cups; a vertical divider is
// still skipped (returns null) so nothing wrong is drilled. Golden end-to-end for a full custom
// cabinet still needs a factory XML (see BIRLASHTIRISH_REJA / DB notes).
import { describe, expect, it } from "vitest";
import { solveDecomposedCabinet } from "../dvizhok/solver/decomposedCabinet.js";
import { QORASU_PROFILE, loadHardwareSpec } from "../dvizhok/index.js";
import { validateParts } from "../dvizhok/core/validate.js";
import type { DesignNode, DesignProject } from "../dvizhok/contracts/design.js";

const spec = loadHardwareSpec();
const J = QORASU_PROFILE.defaults.joints;
const joints = {
  connectorEndOffset_mm10: J.connectorEndOffset_mm10,
  hingeEndOffset_mm10: J.hinge.endOffset_mm10,
  system32: {
    frontRowSetback_mm10: J.system32.frontRowSetback_mm10,
    backRowSetback_mm10: J.system32.backRowSetback_mm10,
    rowMode: J.system32.rowMode,
  },
};

const proj = (children: DesignNode[]): DesignProject => ({
  projectId: "p", name: "c",
  nodes: [{ nodeId: "c1", kind: "cabinet", roleSlot: "korpus", size: { w_mm10: 8000, h_mm10: 7200, d_mm10: 5600 }, children }],
  slotBindings: { fasad: "A", korpus: "B", orqa: "C", stoleshnitsa: "W" }, overrides: [],
});
const door = (i: number): DesignNode => ({ nodeId: `c1:front:${i}`, kind: "door", size: { w_mm10: 3900, h_mm10: 7000 } });
const cupYs = (parts: ReturnType<typeof solveDecomposedCabinet>): number[] =>
  (parts ?? []).flatMap((p) => p.operations).filter((o) => o.op === "drill" && (o as { diameter_mm10?: number }).diameter_mm10 === 350).map((o) => (o as { y_mm10: number }).y_mm10);

describe("§3 solveDecomposedCabinet — custom-interior drilling bridge", () => {
  it("plain custom box → drilled (cam+dowel) + safety gate clean", () => {
    const parts = solveDecomposedCabinet(proj([]), QORASU_PROFILE, spec, joints);
    expect(parts).not.toBeNull();
    expect(parts!.reduce((n, p) => n + p.operations.length, 0)).toBeGreaterThan(0);
    expect(validateParts(parts!).ok).toBe(true);
  });

  it("multi-door → both drilled + gate clean; LEFT cups sit at a smaller Y than RIGHT", () => {
    const frontInfo = { "c1:front:0": { kind: "door", opening: "left" }, "c1:front:1": { kind: "door", opening: "right" } };
    const parts = solveDecomposedCabinet(proj([door(0), door(1)]), QORASU_PROFILE, spec, { ...joints, frontInfo: frontInfo as never });
    expect(parts).not.toBeNull();
    expect(validateParts(parts!).ok).toBe(true);
    const mk = (opening: string) =>
      cupYs(solveDecomposedCabinet(proj([door(0)]), QORASU_PROFILE, spec, { ...joints, frontInfo: { "c1:front:0": { kind: "door", opening } } as never }));
    expect(Math.max(...mk("left"))).toBeLessThan(Math.min(...mk("right")));
  });

  it("drawer front → NO hinge cups (a drawer slides, it does not hinge)", () => {
    const dr: DesignNode = { nodeId: "c1:front:0", kind: "drawer", size: { w_mm10: 3900, h_mm10: 2000 } };
    const parts = solveDecomposedCabinet(proj([dr]), QORASU_PROFILE, spec, { ...joints, frontInfo: { "c1:front:0": { kind: "drawer" } } as never });
    expect(parts).not.toBeNull();
    expect(cupYs(parts).length).toBe(0);
  });

  it("vertical divider → out of scope → null (kept skipped, never drilled wrong)", () => {
    expect(solveDecomposedCabinet(proj([{ nodeId: "c1:divider:0", kind: "divider" }]), QORASU_PROFILE, spec, joints)).toBeNull();
  });
});
