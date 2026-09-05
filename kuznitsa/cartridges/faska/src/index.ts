import type { Cartridge, FeatureRule, Point_mm } from "../../../../dogovor/cartridge.interface.js";
// КАССЕТА · Фаска (faska) — эмитит FeatureRule type="bevel" (фаска вдоль ребра).
// Закон розетки: позиция = мм ОТ КРАЯ (не пиксели). Хост (verstak) сам рисует сцену.
 export const cartridge: Cartridge = {
  api: "cartridge-api@1",
  id: "faska",
  titleRu: "Фаска",
  activate() {},
  onDraw(start: Point_mm, end: Point_mm): FeatureRule {
    return {
      type: "bevel",
      x: { kind: "fixed", fromEdge: "left", mm: Math.min(start.x, end.x) },
      y: { kind: "fixed", fromEdge: "top", mm: Math.min(start.y, end.y) },
      size: { w_mm: Math.abs(end.x - start.x), h_mm: "fill" },
    };
  },
  deactivate() {},
};
export default cartridge;
