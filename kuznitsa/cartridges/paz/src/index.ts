import type { Cartridge, FeatureRule, Point_mm } from "../../../../dogovor/cartridge.interface.js";
// КАССЕТА · Паз (paz) — эмитит FeatureRule type="viyemka" (паз = НЕсквозной канал-выемка).
// Почему viyemka, а НЕ hole: паз не пробивает панель. type="hole" хост рисует как СКВОЗНОЕ окно
// (setWindows) — физически неверно для паза. viyemka = несквозная выемка/карман (setViyemkas),
// ближайшая честная форма. Контракт (dogovor/shemy/design.ts:132) намеренно держит «groove» ВНЕ
// модификаторов — настоящий паз это профиль-treatment (design.ts:513), кассета = ПРИБЛИЖЕНИЕ.
// Закон розетки: позиция = мм ОТ КРАЯ (не пиксели). Хост (verstak) сам рисует сцену.
 export const cartridge: Cartridge = {
  api: "cartridge-api@1",
  id: "paz",
  titleRu: "Паз",
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
