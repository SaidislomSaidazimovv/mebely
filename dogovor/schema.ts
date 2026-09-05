// DOGOVOR · рантайм-проверка эмитов (TypeScript ловит форму, это ловит СМЫСЛ)
// Ноль зависимостей. Хост зовёт validateFeatureRule на КАЖДЫЙ emit кассеты.

import type { FeatureRule } from "./cartridge.interface";

const TYPES = ["hole", "notch", "bevel", "viyemka", "round_corner", "laminate"];
const EDGES = ["top", "bottom", "left", "right"];

export function validateFeatureRule(r: unknown): string[] {
  const e: string[] = [];
  const o = r as Partial<FeatureRule>;
  if (!o || typeof o !== "object") return ["не объект"];
  if (!TYPES.includes(o.type as string)) e.push(`type: ${String(o.type)} — не из списка`);
  for (const axis of ["x", "y"] as const) {
    const p = o[axis] as { kind?: string; mm?: number; fromEdge?: string; weight?: number } | undefined;
    if (!p?.kind) { e.push(`${axis}: нет kind`); continue; }
    if (p.kind === "fixed") {
      if (!EDGES.includes(p.fromEdge ?? "")) e.push(`${axis}.fromEdge: край не назван`);
      if (typeof p.mm !== "number" || p.mm < 0 || p.mm > 5000)
        e.push(`${axis}.mm=${p.mm} — вне 0…5000 мм (пиксели пролезли?)`);
    }
    if (p.kind === "locked" && typeof p.mm !== "number") e.push(`${axis}.mm обязателен для locked`);
    if (p.kind === "ratio" && !(typeof p.weight === "number" && p.weight > 0)) e.push(`${axis}.weight > 0 обязателен`);
  }
  const s = o.size as { w_mm?: number | string; h_mm?: number | string } | undefined;
  for (const d of ["w_mm", "h_mm"] as const) {
    const v = s?.[d];
    if (v !== "fill" && !(typeof v === "number" && v > 0 && v <= 5000))
      e.push(`size.${d}=${String(v)} — не "fill" и не 0…5000 мм`);
  }
  return e; // пустой массив = правило принято
}
