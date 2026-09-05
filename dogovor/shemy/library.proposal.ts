// DB/37 — ComponentLibraryItem & DesignBlock, the Library Contract.
// PROPOSAL — not merged. Companion to DB/37_COMPONENT_LIBRARY_ITEM.md.
//
// Additive only. Nothing exported from `./design.js` or `./types.js` is
// redefined here; `DesignNode` and `DesignBlock` are shown as the proposed
// patch (new optional fields only) for review, not as a fork.
//
// Types only — no runtime code, per the scope of this proposal.

import type {
  CabinetType, DesignNode as DesignNodeBase, DesignBlock as DesignBlockBase,
  RoleSlot, DecomposeFlag,
} from "./design.js";
import type { mm10, ValidationFinding } from "./types.js";

// ═════════════════════════════════════════════════ §4 — anchoring (dependency)
//
// DB/35 §2 (verbatim): "Modifiers must use DB/32 anchoring (never absolute
// coordinates)." A ComponentLibraryItem's resize-safety story (DB/37 §4)
// depends on `DesignNode` carrying `modifiers[]`, anchored — this is the
// minimal shape needed for that story to type-check. DB/35 §4's tool-by-tool
// table is the authority on concrete modifier variants; this is a
// placeholder shape sized to unblock ComponentLibraryItem, not a final
// modifier taxonomy.

export type AnchorEdge = "top" | "bottom" | "left" | "right" | "front" | "back";

export type AnchorRule =
  | { rule: "fixed"; mm10: mm10 }
  /** Fraction (0..1) of the envelope dimension `edge` runs along. */
  | { rule: "ratio"; value: number }
  /**
   * OPEN — no founder ruling on record for anchor-level `locked` (only
   * `Division.locked`, a per-Line grid rule, is legislated — DB/32 §4).
   * Provisional reading, DB/37 §4: "fixed distance from the OPPOSITE edge",
   * not the near one. Do not ship Live Intent Chips' `locked` cycle state
   * against this until it gets the same explicit ruling DB/35 §10 gave its
   * other open questions.
   */
  | { rule: "locked"; mm10: mm10 };

export interface Anchor {
  edge: AnchorEdge;
  distance: AnchorRule;
}

/**
 * DB/35 §1 verbatim tool list, minus Bind/Carry/Rotate/Material/Kromka —
 * those are session-time forge tools, not all of which persist as a literal
 * `modifiers[]` entry (Carry attaches a child DesignNode + anchor, not a
 * modifier record — DB/35 §4's table, row "Carry"). Material/Kromka in
 * Forge write a project-local `ConstructionOverride`, never a modifier
 * (DB/35 §5.3) — stripped entirely before an item can exist (see
 * `CompiledComponentNode` below).
 */
export type ModifierType =
  | "hole" | "notch" | "bevel" | "viyemka" | "round_corner" | "laminate";

/**
 * DB/35 §2 verbatim: "Forge does NOT alter the base 3D mesh destructively.
 * It appends to a `modifiers[]` array on the `DesignNode`." Placeholder
 * `params` shape — DB/35 §4 names the real per-tool fields (`radius`,
 * `depth`, etc.); this is intentionally loose pending that table becoming
 * code.
 */
export interface Modifier {
  type: ModifierType;
  anchors: Anchor[];
  params: Record<string, mm10 | number | string>;
}

/**
 * PROPOSED PATCH to `DesignNode` (engine/contracts/design.ts) — one new
 * optional field, additive, matches DB/35 §9 Phase 1's bundling of
 * `DesignNode.modifiers[]` with `ComponentLibraryItem` in the same contract
 * batch. Every other field of `DesignNode` is unchanged; shown here as an
 * intersection so this file type-checks standalone without editing
 * design.ts directly.
 */
export type DesignNode = DesignNodeBase & { modifiers?: Modifier[] };

// ═════════════════════════════════════════════════ §2 — shared metadata law

/**
 * The metadata every library item carries, regardless of rung. DB/27 §7:
 * "Both library levels obey this... same law, same binding." DB/35 §7.5:
 * ComponentLibraryItem "must carry `schemaVersion`... an unknown version is
 * REJECTED at import, never guessed" — extending the rule `DesignBlock`
 * already has.
 */
export interface LibraryItemMeta {
  name: string;
  author: string;
  /** Unknown version → REJECTED at import. Never inferred, never migrated silently. */
  schemaVersion: number;
  /**
   * Folder-like grouping (DB/35 §3, verbatim). Deliberately the ONE
   * mechanism — no separate `folders` field. A folder tree is a
   * presentation over tags + `rung`, not a second hierarchy to keep in sync.
   */
  tags?: string[];
  /** Which `fasad`/`korpus`/`orqa` slots this item needs bound before it can decompose. */
  requiredSlots: RoleSlot[];
  /** ISO 8601 (06_CONVENTIONS §9). UI/sort convenience only — not construction provenance. */
  createdAt?: string;
}

// ═══════════════════════════════════════════ §1/§2 — the two concrete rungs

/**
 * PROPOSED PATCH to `DesignBlock` (engine/contracts/design.ts) — adds
 * `rung`, OPTIONAL. Checked against `tests/decomposition.test.ts:343,356`:
 * both existing `DesignBlock` literals omit `rung` and keep compiling
 * (DB/37 §6). Everything else about `DesignBlock` — `blockId`, `root`,
 * `requiredSlots`, `schemaVersion: 1` — is unchanged; shown here as a full
 * interface only so `LibraryItem` below can discriminate on `rung` without
 * editing design.ts directly.
 */
export interface DesignBlock extends DesignBlockBase, LibraryItemMeta {
  blockId: string;
  schemaVersion: 1;
  /** App 2's assembled unit — the ONLY rung whose root may be a cabinet. */
  root: DesignNode & { kind: "cabinet" };
  /** NEW, optional (see DB/37 §6). Absent === "block". */
  rung?: "block";
}

/**
 * NEW. DB/35 §7.5's missing type. The primary output of "Convert to
 * Component" (DB/35 §3): a single Forge-authored `DesignNode` — envelope +
 * modifiers + intent — packaged for reuse, with every `ConstructionOverride`
 * stripped (DB/35 §10.6, "violently stripped away, saving ONLY pure
 * geometry").
 */
export interface ComponentLibraryItem extends LibraryItemMeta {
  componentId: string;
  schemaVersion: 1;
  /**
   * App 3 never builds a cabinet (DB/32 §1 AMENDMENT) — so a Component's
   * root can be anything a NodeKind allows EXCEPT the one value that means
   * "assembled unit", making the wrong shape a compile error, the same move
   * DB/27 §5(a) uses for construction fields on DesignNode.
   */
  root: DesignNode & { kind: Exclude<DesignNode["kind"], "cabinet"> };
  /** Required — new type, no legacy fixtures to protect (contrast DesignBlock.rung). */
  rung: "component";
}

/**
 * DB/36 §3: "Two libraries, not one, because two different things get
 * produced." One list a catalog/search screen can consume; the payload
 * shape still differs per rung. Same pattern as
 * `Operation = DrillOp | ContourOp | SawGrooveOp` in types.ts.
 */
export type LibraryItem = DesignBlock | ComponentLibraryItem;

// ═════════════════════════════════════════════════════ §3 — the publish gate

/**
 * What a failed gate names, so a rejection is always specific — never a bare
 * boolean. Reuses the engine's own flag/finding types rather than
 * reinventing a parallel error vocabulary; only the discriminant `source` is
 * new, to disambiguate which stage produced the failure.
 */
export type LibraryGateFailure =
  | (DecomposeFlag & { source: "decomposition" })
  | (ValidationFinding & { source: "validation" })
  | {
      source: "schema";
      code: "UNKNOWN_SCHEMA_VERSION" | "UNKNOWN_FIELD" | "UNBOUND_REQUIRED_SLOT";
      detail: string;
    }
  /** DB/32 §3's acceptance test, re-checked at publish as a tamper spot-check. */
  | { source: "profile_swap_purity"; detail: string };

export interface LibraryGateResult {
  ok: boolean;
  /** Empty iff ok. Never partial — a rejection always names every failing check found. */
  failures: LibraryGateFailure[];
}

// ═══════════════════════════ the marketplace layer (kept OUT of LibraryItem)

export type PublicationVisibility = "private" | "unlisted" | "published";

/**
 * DB/21 §3: the marketplace is "a layer, not a foundation change" on an
 * entity that already exists. Rating/usage/revenue-share are deliberately
 * NOT typed here — DB/21 §7 (R-M8) marks that economics model explicitly
 * TBD, and freezing a guess into packages/contract would be worse than
 * leaving the gap visible. This type exists only to show where curation
 * state lives so it never gets folded into LibraryItemMeta by accident.
 */
export interface MarketplacePublication {
  itemRung: "block" | "component";
  itemId: string; // DesignBlock.blockId | ComponentLibraryItem.componentId
  itemSchemaVersion: number;
  visibility: PublicationVisibility;
  /** The last gate run against this exact item version. Never optimistic. */
  gate: LibraryGateResult;
}
