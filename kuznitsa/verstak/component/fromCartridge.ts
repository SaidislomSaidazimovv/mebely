// §1b · МОСТ: кассета (FeatureRule) → модификатор узла (Modifier).
// Розетка кузницы отдаёт FeatureRule (dogovor/cartridge.interface): { type, x·y: PosRule, size }.
// Узел хранит Modifier (dogovor/shemy/design): { type, anchors[], params }.
// Типы совпадают 1:1 (hole·notch·bevel·viyemka·round_corner·laminate). Позиция (мм ОТ КРАЯ)
// становится двумя якорями; размер → params в mm10 ("fill" → 0, хост читает как «во всю грань»).
import type { Modifier, Anchor, AnchorEdge, mm10 } from "../contract/design";
import type { FeatureRule, PosRule } from "../../../dogovor/cartridge.interface";

const MM = 10; // мм → mm10 (десятые доли)

function anchorOf(p: PosRule, ratioEdge: AnchorEdge): Anchor {
  if (p.kind === "fixed") return { edge: p.fromEdge, distance: { rule: "fixed", mm10: Math.round(p.mm * MM) as mm10 } };
  if (p.kind === "ratio") return { edge: ratioEdge, distance: { rule: "ratio", value: p.weight } };
  // "locked" — розетка законна (fixed от ПРОТИВОПОЛОЖНОГО края, DB/38 §4); кассеты города его не эмитят.
  return { edge: ratioEdge, distance: { rule: "locked", mm10: Math.round(p.mm * MM) as mm10 } };
}

const sizeMm10 = (s: number | "fill"): number => (s === "fill" ? 0 : Math.round(s * MM));

/** Pure bridge — a cartridge's onDraw output → a DesignNode Modifier the verstak already stores. */
export function featureRuleToModifier(fr: FeatureRule): Modifier {
  return {
    type: fr.type, // FeatureRule["type"] === ModifierType (совпадают дословно)
    anchors: [anchorOf(fr.x, "left"), anchorOf(fr.y, "top")],
    params: { w: sizeMm10(fr.size.w_mm), h: sizeMm10(fr.size.h_mm) },
  };
}
