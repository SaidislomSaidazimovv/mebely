// Layer-2 drilling for a DECOMPOSED cabinet — the bridge OBYEDINENIE §1 step 3 asks for:
// toProject → panelDecomposition → drilling, so a custom-interior module (which solveBaseCabinet's
// flat {shelves,hasDoor} model rejects via `canDrill`) can still export its сверловка. This is the
// "Layer 2 parametric solver plugs in here" that solveFull's contract already anticipates.
//
// v1 SCOPE — correct-by-composition, NO invented geometry: runs the PROVEN panelDecomposition for
// the parts (geometry + grooves, already trusted by pricing + police), then applies the SAME
// spec-driven primitives solveBaseCabinet uses (camDowelJoint, shelfPinPattern, hingeCupPattern) at
// positions CONSISTENT with panelDecomposition's own model — toDesign.ts maps shelves from `count`,
// so an even distribution AGREES with the decomposed geometry and invents no position.
//
// A cabinet BEYOND this scope returns null → the caller keeps it in `skipped`, exactly as before,
// and nothing wrong is drilled. STAGE 2 added MULTI-DOOR (per-door hinge side + door/drawer kind come
// from the app via joints.frontInfo, since the DesignNode contract is intent-only). Still out of scope
// (stage 2b — need per-compartment adjacency the intent-only tree doesn't carry): vertical dividers and
// царги-top; and a merged side. The safety gate (validateParts) is the backstop for any op that would
// land off a panel. An end-to-end golden for a FULL custom cabinet still needs a factory XML.

import { panelDecomposition } from "./panelDecomposition.js";
import {
  camDowelJoint, toPanel, firstValue, hingeCountFor, JOINT_INSET_MM, HINGE_END_INSET_MM,
} from "./baseCabinet.js";
import { shelfPinPattern } from "../primitives/shelfPinPattern.js";
import { hingeCupPattern, type HingeEdge } from "../primitives/hingeCupPattern.js";
import { mmToMm10 } from "../core/units.js";
import type { Part, mm10 } from "../contracts/types.js";
import type { ConstructionProfile, DesignProject } from "../contracts/design.js";
import type { HardwareSpec } from "../primitives/types.js";

/** The editable joint values the drilling honours — the subset of BaseCabinetInput the tree path uses. */
export interface DecomposedJoints {
  connectorEndOffset_mm10?: mm10;
  system32?: { frontRowSetback_mm10: mm10; backRowSetback_mm10: mm10; rowMode?: "front_and_back" | "front_only" | "paired_32" };
  hingeEndOffset_mm10?: mm10;
  hingeEdge?: "left" | "right";
  /** §3 stage 2 — per-front info the CALLER reads from c.layout and threads in. The DesignNode contract
   *  is intent-only (DB/27) so hinge side + door/drawer kind aren't in it; the app has them. Keyed by the
   *  front node id (`<cabId>:front:<i>`) so a door part matches its front through provenance.nodeId. */
  frontInfo?: Record<string, { kind: "door" | "drawer"; opening?: "left" | "right" | "top" | "bottom" }>;
}

/**
 * Drill a decomposed cabinet. Returns engine Parts WITH operations, or null when the cabinet is
 * beyond v1's drillable scope (the caller then keeps it skipped — same visible behaviour as before).
 */
export function solveDecomposedCabinet(
  design: DesignProject, profile: ConstructionProfile, spec: HardwareSpec, joints: DecomposedJoints = {},
): Part[] | null {
  const { parts, provenance } = panelDecomposition(design, profile);
  const roleOf = (p: Part): string | undefined => provenance[p.id]?.role;
  const nodeIdOf = (p: Part): string | undefined => provenance[p.id]?.nodeId;
  const byRole = (r: string): Part[] => parts.filter((p) => roleOf(p) === r);

  const sides = byRole("side");
  const bottoms = byRole("bottom");
  const tops = byRole("top");
  const shelves = byRole("shelf");
  const doors = byRole("door");

  // v1 scope guard — anything that needs tree-level adjacency or per-node side is a later stage.
  // Skip (return null), never guess: a wrong hole ruins a panel, a skipped module is just visible.
  if (byRole("divider").length > 0) return null;    // per-compartment shelf-pin adjacency = stage 2b
  if (byRole("stretcher").length > 0) return null;  // царги top joint = stage 2b
  if (sides.length !== 2 || bottoms.length !== 1) return null; // merged / degenerate

  const conn = firstValue(spec.connectors);
  const pin = firstValue(spec.shelfPins);
  const hinge = firstValue(spec.hinges);

  const [sideL, sideR] = sides; // panelDecomposition emits sub 0 (left) then sub 1 (right)
  if (!sideL || !sideR) return null;
  const horiz: Array<[Part, "bottom" | "top"]> = [
    ...bottoms.map((b) => [b, "bottom"] as [Part, "bottom"]),
    ...tops.map((t) => [t, "top"] as [Part, "top"]),
  ];

  // ── carcass cam+dowel: each side ↔ bottom/top. jointYs are reconciled to the OVERLAP of the two
  //    panels' depths — panelDecomposition's bottom is D−backZone (shorter than the side's full D),
  //    so clamping to the shorter one keeps every dowel on its horizontal panel.
  if (joints.connectorEndOffset_mm10 !== undefined) {
    const camFromEdge = joints.connectorEndOffset_mm10;
    const sidePairs: Array<[Part, "left" | "right"]> = [[sideL, "left"], [sideR, "right"]];
    for (const [side, kind] of sidePairs) {
      for (const [hz, end] of horiz) {
        const depth = Math.min(side.width_mm10, hz.width_mm10);
        const inset = mmToMm10(JOINT_INSET_MM);
        const jointYs = [inset, depth - inset];
        const { camOps, dowelOps } = camDowelJoint(side, hz, end, kind, jointYs, conn, camFromEdge);
        side.operations.push(...camOps);
        hz.operations.push(...dowelOps);
      }
    }
  }

  // ── shelf-pin rows: both sides, even distribution. toDesign.ts maps shelves from `count`, so the
  //    decomposed geometry is itself even — this agrees with it and invents no position.
  if (shelves.length > 0 && joints.system32) {
    const H = sideL.length_mm10; // a side's length is the cabinet height
    const shelfXs: number[] = [];
    for (let i = 0; i < shelves.length; i++) shelfXs.push(Math.round((H * (i + 1)) / (shelves.length + 1)));
    for (const side of sides) {
      side.operations.push(...shelfPinPattern(toPanel(side), shelfXs, { pin, ...joints.system32 }));
    }
  }

  // ── hinge cups: EACH door (stage 2 — multi-door now allowed). The hinge side comes from the app
  //    (joints.frontInfo, read from c.layout) since the DesignNode contract is intent-only. A drawer
  //    front SLIDES (no cups); a top/bottom lift-up is not a vertical-edge hinge — skip rather than
  //    drill a Ø35 cup on the wrong edge (a wrong-side cup ruins the door).
  for (const door of doors) {
    const info = joints.frontInfo?.[nodeIdOf(door) ?? ""];
    if (info?.kind === "drawer") continue;
    const opening = info?.opening ?? joints.hingeEdge ?? "left";
    if (opening === "top" || opening === "bottom") continue;
    const hingeEdge: HingeEdge = opening === "right" ? "yMax" : "y0";
    const H = door.length_mm10; // a door's length is its height
    const n = hingeCountFor(H / 10);
    const endInset = joints.hingeEndOffset_mm10 ?? mmToMm10(HINGE_END_INSET_MM);
    const xs: number[] = [];
    if (n <= 1) {
      xs.push(Math.round(H / 2));
    } else {
      const span = H - 2 * endInset;
      for (let i = 0; i < n; i++) xs.push(endInset + Math.round((span * i) / (n - 1)));
    }
    door.operations.push(...hingeCupPattern(toPanel(door), hingeEdge, xs, hinge));
  }

  return parts;
}
