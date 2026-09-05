import type { Cartridge, FeatureRule, Point_mm } from "../../../../dogovor/cartridge.interface.js";
// КАССЕТА · Выемка (vyemka) — эмитит FeatureRule type="viyemka" (выемка).
// Закон розетки: позиция = мм ОТ КРАЯ (не пиксели). Хост (verstak) сам рисует сцену.
 export const cartridge: Cartridge = {
  api: "cartridge-api@1",
  id: "vyemka",
  titleRu: "Выемка",
  activate() {},
  onDraw(start: Point_mm, end: Point_mm): FeatureRule {
    return {
      type: "viyemka",
      x: { kind: "fixed", fromEdge: "left", mm: Math.min(start.x, end.x) },
      y: { kind: "fixed", fromEdge: "top", mm: Math.min(start.y, end.y) },
      size: { w_mm: Math.abs(end.x - start.x), h_mm: Math.abs(end.y - start.y) },
    };
  },
  deactivate() {},
};
export default cartridge;
