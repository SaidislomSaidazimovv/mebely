// SENSE-3 — a wall cabinet does not stand on the floor, so it has no plinth.
//
// This is App-2's reported item #5, as a RULE rather than a workaround. App-2 already
// skips the upper plinth in its own code; the engine still emits one, because
// `kitchen_wall` has no byType scope and falls back to the census default
// (plinth: box, 120mm). The app compensating for an engine mistake is exactly the kind
// of silent divergence the Magic Separation exists to prevent — so the engine must be
// TOLD it is wrong, loudly, until the profile gains a kitchen_wall scope.

import type { Rule, Violation } from "../types.js";
import { violation } from "../types.js";

/** Cabinet types that hang on a wall and therefore never carry a plinth. */
const HANGING: ReadonlySet<string> = new Set(["kitchen_wall"]);

export const SENSE_3: Rule = {
  uid: "r-028",
  id: "SENSE-3",
  severity: "WARN",
  cls: "SENSE",
  title: "У навесного шкафа нет цоколя",
  why: "Навесной шкаф не стоит на полу. Цоколь у него — лишняя деталь в раскрое и лишние деньги в смете.",
  source: "App-2, 2026-08-15 (пункт 5) · профиль пока не имеет scope kitchen_wall",
  status: "active",
  check(ctx) {
    if (!ctx.design || !ctx.provenance) return [];
    const out: Violation[] = [];
    const walk = (n: import("../../contracts/design.js").DesignNode): void => {
      if (n.kind === "cabinet" && n.cabinetType && HANGING.has(n.cabinetType)) {
        const plinths = Object.values(ctx.provenance!).filter((p) => p.nodeId === n.nodeId && p.role === "plinth");
        if (plinths.length > 0) {
          out.push(violation("SENSE-3", n.nodeId,
            `навесной шкаф (${n.cabinetType}) получил ${plinths.length} деталь(ей) цоколя. ` +
            `Добавьте scope byType.kitchen_wall с plinth.style = "none".`));
        }
      }
      (n.children ?? []).forEach(walk);
    };
    ctx.design.nodes.forEach(walk);
    return out;
  },
};
