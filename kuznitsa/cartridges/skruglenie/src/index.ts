import type { Cartridge, FeatureRule, Point_mm } from "../../../../dogovor/cartridge.interface.js";
// КАССЕТА · Скругление (skruglenie) — эмитит FeatureRule type="round_corner" (радиус угла).
// Закон розетки: позиция = мм ОТ КРАЯ (не пиксели). Хост (verstak) сам рисует сцену.
 export const cartridge: Cartridge = {
  api: "cartridge-api@1",
  id: "skruglenie",
  titleRu: "Скругление",
  activate() {},
  onDraw(start: Point_mm, end: Point_mm): FeatureRule {
    return {
      type: "round_corner",
      x: { kind: "fixed", fromEdge: "left", mm: Math.min(start.x, end.x) },
      y: { kind: "fixed", fromEdge: "top", mm: Math.min(start.y, end.y) },
      size: { w_mm: Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)), h_mm: Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) },
    };
  },
  deactivate() {},
};
export default cartridge;
