// DOGOVOR · РОЗЕТКА · cartridge-api@1
// Единственная дверь города. Меняется только PR-ом основателя + записью в VERSION.md.

export const CARTRIDGE_API = "cartridge-api@1";

// ── что кассета ПОЛУЧАЕТ (читай свободно) ─────────────────────────────
export interface Envelope { width_mm: number; height_mm: number; depth_mm: number; }
export interface Point_mm { x: number; y: number; }

export interface CartridgeContext {
  envelope: Envelope;            // габарит панели/экрана
  profileId: string;             // конструкционный профиль — только чтение
  existing: FeatureRule[];       // уже применённые правила (проверка коллизий)
  snap(p: Point_mm): Point_mm;   // магнитная сетка — даёт хост
}

// ── что кассета ОТДАЁТ (не пиши никогда — применяет хост) ─────────────
export type EdgeName = "top" | "bottom" | "left" | "right";

export type PosRule =
  | { kind: "fixed"; fromEdge: EdgeName; mm: number }  // ЗАКОН: мм ОТ КРАЯ, никогда пиксели
  | { kind: "ratio"; weight: number }
  | { kind: "locked"; mm: number };

export interface FeatureRule {
  type: "hole" | "notch" | "bevel" | "viyemka" | "round_corner" | "laminate";
  x: PosRule;
  y: PosRule;
  size: { w_mm: number | "fill"; h_mm: number | "fill" };
}

// ── форма вилки ────────────────────────────────────────────────────────
export interface Cartridge {
  api: typeof CARTRIDGE_API;     // против какой розетки собрана — сверяется при загрузке
  id: string;                    // = имя папки (латиница)
  titleRu: string;               // «Вырез» — что видит пользователь
  activate(ctx: CartridgeContext): void;
  onDraw(start: Point_mm, end: Point_mm): FeatureRule;
  previewGeometry?(rule: FeatureRule): unknown; // хост САМ рисует в сцене — кассета сцену не трогает
  deactivate(): void;
}
