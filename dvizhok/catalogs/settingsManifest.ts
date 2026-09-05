// THE CRYSTAL-CLEAR MANIFEST — every construction decision the engine makes, as a
// self-describing setting. The founder's requirement: "I want all the things the
// engine does to be variable and shown as settings … now I'm sure this is
// incomplete — it's getting half things."
//
// Half-ness is made IMPOSSIBLE, not promised. DB/27's law (mutation-proven) says the
// engine reads construction ONLY from the ConstructionProfile. So:
//
//     manifest covers every profile field  ⟺  manifest covers every engine decision
//
// `tests/settings_manifest.test.ts` enforces a BIJECTION between this manifest and the
// profile's leaf fields: no hidden setting, no phantom setting. If someone adds a
// profile field and forgets to manifest it, the build fails. That is the guarantee.
//
// ─────────────────────────────────────────────────────────────────────────────────
// 2026-08-13 — TWO CHANGES, both from the same founder finding.
//
// 1. THE BICONDITIONAL WAS FALSE, and joints are how it failed. It holds only if every
//    engine decision IS a profile field. Joints were not: they lived in
//    hardware_specs.dummy.json and catalog/rules/*.json, outside the profile entirely,
//    so the bijection test never covered them. Ten complete groups, one silent hole,
//    exactly where the drilling lives. `TypeConstruction.joints` closes it — the test
//    now guards joints like everything else.
//
// 2. ONE PHYSICAL FILE PER SECTION (`./settings/*.ts`). Founder: "every section/part
//    should have a physical settings file. In every case possible." This file is no
//    longer where settings are written — it is the ASSEMBLER. A missing section is now
//    visible from `ls`, which matters: the joints hole was invisible partly because
//    there was no file for it to be missing from.
// ─────────────────────────────────────────────────────────────────────────────────
//
// Each entry carries its LOGIC (`why`), its PROVENANCE (`source`), and — for joints —
// its `visual`, because a setback number without a drawing of which edge it measures
// from is unreviewable.

import type { ConstructionProfile } from "../contracts/design.js";
import type { Setting, SettingsGroup } from "./settings/types.js";

import { MATERIAL_GROUP } from "./settings/material.js";
import { BACK_GROUP } from "./settings/back.js";
import { KROMKA_GROUP } from "./settings/kromka.js";
import { PLINTH_GROUP } from "./settings/plinth.js";
import { TOP_GROUP } from "./settings/top.js";
import { BOTTOM_GROUP } from "./settings/bottom.js";
import { SHELF_GROUP } from "./settings/shelf.js";
import { WORKTOP_GROUP } from "./settings/worktop.js";
import { MERGE_GROUP } from "./settings/merge.js";
import { GRAIN_GROUP } from "./settings/grain.js";
import { JOINTS_GROUP } from "./settings/joints.js";

export type { ControlKind, Setting, SettingOption, SettingsGroup } from "./settings/types.js";

/**
 * THE MANIFEST — assembled from the section files, in the order the settings screen
 * shows them. Adding a section means adding a file here; there is nowhere else to put
 * one, and the bijection test rejects a profile field that no section claims.
 */
export const SETTINGS_GROUPS: SettingsGroup[] = [
  MATERIAL_GROUP,
  BACK_GROUP,
  KROMKA_GROUP,
  PLINTH_GROUP,
  TOP_GROUP,
  BOTTOM_GROUP,
  SHELF_GROUP,
  WORKTOP_GROUP,
  MERGE_GROUP,
  GRAIN_GROUP,
  JOINTS_GROUP,
];

/** Flat view — every setting, for the completeness proof and search. */
export function allSettings(): Setting[] {
  return SETTINGS_GROUPS.flatMap((g) => g.settings);
}

export function getSettingsManifest(): SettingsGroup[] {
  return SETTINGS_GROUPS;
}

/** Resolve a manifest path against a profile scope, for the live settings screen. */
export function readSetting(profile: ConstructionProfile, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), profile);
}
