import type { Cartridge, FeatureRule, Point_mm } from "../../../../dogovor/cartridge.interface.js";
// КАССЕТА · Поворот (povorot) — эмитит FeatureRule type="notch" (ПРОВИЗОРНО).
// Закон розетки: позиция = мм ОТ КРАЯ (не пиксели). Хост (verstak) сам рисует сцену.
  // ⚠ ПРОВИЗОРНО: поворот — ТРАНСФОРМ, не FeatureRule. Розетка требует onDraw→FeatureRule,
  // поэтому пока эмитим notch-заглушку. НУЖНО РЕШЕНИЕ ОСНОВАТЕЛЯ: как поворот вписать в cartridge-api@1
  // (новый type: "rotate" ИЛИ иной механизм-трансформ). Не подавать как боевую операцию.
 export const cartridge: Cartridge = {
  api: "cartridge-api@1",
  id: "povorot",
  titleRu: "Поворот",
  activate() {},
  onDraw(start: Point_mm, end: Point_mm): FeatureRule {
    return {
      type: "notch",
      x: { kind: "fixed", fromEdge: "left", mm: Math.min(start.x, end.x) },
      y: { kind: "fixed", fromEdge: "top", mm: Math.min(start.y, end.y) },
      size: { w_mm: Math.abs(end.x - start.x), h_mm: Math.abs(end.y - start.y) },
    };
  },
  deactivate() {},
};
export default cartridge;
