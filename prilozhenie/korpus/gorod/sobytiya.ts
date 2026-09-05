// ГОРОД · ЭМИТ СОБЫТИЙ — приложение зовёт emit() для событий из dogovor/predlozheniya/_slovar.json.
// Закон (predlozheniya/_shema): чужое событие = 🔴. Клиентская сторона (console + localStorage-журнал).
// Путь в ЛОГ ПУЛЬТА придёт через kontrol (DB/44 §5.5, Пульт v1 читает) — здесь только эмиссия.
import slovar from "../../../dogovor/predlozheniya/_slovar.json";

export type SobytieName = keyof typeof slovar.sobytiya;
const KEY = "gorod_zhurnal";

export function emit(name: SobytieName, fields: Record<string, string | number> = {}): void {
  if (!(name in (slovar.sobytiya as Record<string, unknown>))) {
    console.error(`[город] чужое событие «${name}» — нет в _slovar.json`);
    return;
  }
  const rec = { t: Date.now(), sobytie: name, ...fields };
  console.log("[город·событие]", rec);
  try {
    const log = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    log.push(rec);
    localStorage.setItem(KEY, JSON.stringify(log.slice(-500)));
  } catch { /* приватный режим — просто пропускаем */ }
}
