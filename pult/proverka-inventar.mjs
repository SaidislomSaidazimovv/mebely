#!/usr/bin/env node
// ПУЛЬТ · ИНВЕНТАРЬ-ТЕСТ — ворота шага 7 (OBYEDINENIE.md §1: «инвентарь-тест 🟢»).
//
// Дрейф-детектор: берёт ВЫЧИСЛЕННЫЙ сканером (pult/scan.mjs) инвентарь и сверяет с КАНОНОМ
// движка из OBYEDINENIE.md §0 — «полиция 29 · слияние 9 · стяжки 5 · 43 настройки».
// Любой дрейф реестра (сканер тихо потерял/добавил файл, счётчик разошёлся) → 🔴 и exit 1.
// Только ЧТЕНИЕ, никакой записи — как scan/kontrol/proverka (node, без TS-рантайма, dogovor не трогаем).
//
// Почему node-скрипт в городе, а не vitest в корне: город не имеет TS-рантайма и посылка
// gitignored — тест в корневом репо тянул бы gitignored-путь. Гейт-скрипт повторяет паттерн
// scan/kontrol/proverka: скрипт СЧИТАЕТ, расхождение = красный выход.
import { collectInventar, CITY } from "./scan.mjs";

// КАНОН движка — OBYEDINENIE.md §0 таблица «Движок (канон: полиция 29 · слияние 9 · стяжки 5 · 43 настройки)».
const KANON = { pravil: 29, zapretov: 9, styazhek: 5, nastroek: 43 };
const LABEL = { pravil: "полиция", zapretov: "слияние", styazhek: "стяжки", nastroek: "настройки" };

const inv = await collectInventar(CITY);
const it = inv.itogo;
const fails = [];

// 1) канонические счётчики движка (OBYEDINENIE §0) — жёстко
for (const k of Object.keys(KANON)) {
  if (it[k] !== KANON[k]) fails.push(`${LABEL[k]}: канон ${KANON[k]}, инвентарь ${it[k]}`);
}

// 2) ворота контроля чистые — шаг 7 без «kontrol 🟢» не закрыт
if (it.krasnyh !== 0) fails.push(`контроль: 🔴 ${it.krasnyh} красных ворот (см. npm run kontrol)`);

// 3) целостность — ни один реестр не пуст (пустой = сканер молча потерял папку)
const reestry = {
  nastroyki: inv.nastroyki,
  politsiya: inv.politsiya,
  sliyanie: inv.sliyanie,
  styazhki: inv.styazhki,
  komplekty: inv.komplekty,
  predlozheniya: inv.predlozheniya,
  sobytiya: Object.keys(inv.slovar?.sobytiya ?? {}),
};
for (const [name, arr] of Object.entries(reestry)) {
  if (!arr || arr.length === 0) fails.push(`реестр «${name}» ПУСТ — сканер потерял файлы`);
}

if (fails.length) {
  console.error("🔴 ИНВЕНТАРЬ-ТЕСТ НЕ ПРОЙДЕН — дрейф от канона:");
  for (const f of fails) console.error("   • " + f);
  process.exit(1);
}

const sob = Object.keys(inv.slovar.sobytiya).length;
console.log(
  `🟢 ИНВЕНТАРЬ-ТЕСТ ПРОЙДЕН — канон совпал: полиция ${it.pravil} · слияние ${it.zapretov} · стяжки ${it.styazhek} · настройки ${it.nastroek} · контроль 🟢`
);
console.log(`   целостность: комплекты ${it.komplektov} · правила роста ${it.predlozheniy} · события ${sob} — реестры не пусты`);
