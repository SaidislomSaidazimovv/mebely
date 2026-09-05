#!/usr/bin/env node
// ПУЛЬТ · СКАНЕР — вычисленная правда, никогда не набранная руками (DB/44 §4 правило 1).
//
// Читает НАСТОЯЩИЕ файлы города и собирает инвентарь для pult.html:
//   dvizhok/catalogs/settings/*.ts   → секции настроек (43 настройки)
//   dvizhok/politsiya/*/*.ts         → правила полиции (29 правил)
//   dvizhok/solver/merge/blockers/   → запреты слияния (9)
//   dvizhok/catalogs/connectors/     → геометрия стяжек (5, с confidence)
//   dogovor/komplekty/               → комплекты + запечатанное ядро
//   dogovor/predlozheniya/           → правила роста + этика + словарь событий
//   dogovor/kontrol.mjs              → статус ворот по каждому файлу
//
// Почему парсинг текста, а не import: движок — TypeScript, у города нет TS-рантайма.
// Секции настроек и стяжки — чистые литералы данных, они ВЫЧИСЛЯЮТСЯ (new Function).
// У правил полиции и запретов слияния вычисляется только шапка-метаданные (до check/blocks).
// Дрейф формата ловит tests/pult_inventar.test.ts в корневом репо: он сравнивает этот
// парсер с настоящими реестрами через vitest. Расхождение = красный тест, не тихая ложь.
// (Это паттерн «discrepancy detector» из R41: скрипт считает, тест сверяет.)

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const CITY = join(HERE, "..");

const read = (p) => readFileSync(p, "utf8");
const readJson = (p) => JSON.parse(read(p));
const listFiles = (dir, ext) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(ext)).sort() : [];

/** Вычислить TS-файл чистых данных: срезать import/export/аннотации, вернуть именованную константу. */
function evalDataFile(path, constName) {
  const src = read(path)
    .replace(/^import[\s\S]*?;$/gm, "")
    .replace(/^export /gm, "")
    .replace(/const (\w+): [\w<>,.[\]| ]+ =/g, "const $1 =");
  return new Function(`${src}; return ${constName};`)();
}

/** Вычислить только шапку объекта — метаданные до первого метода (check(/blocks(). */
function evalHeader(path, stopRe) {
  const src = read(path);
  const start = src.indexOf("= {");
  const stop = src.search(stopRe);
  if (start === -1 || stop === -1 || stop < start) throw new Error(`не найдена шапка: ${path}`);
  const region = src.slice(start + 3, stop).trim().replace(/,$/, "");
  return new Function(`return ({ ${region} });`)();
}

// ── настройки: порядок берём из настоящего манифеста, файлы — из settings/ ──
export function parseSettingsGroups(root) {
  const dir = join(root, "dvizhok", "catalogs", "settings");
  const manifest = read(join(root, "dvizhok", "catalogs", "settingsManifest.ts"));
  const orderNames = [...manifest.matchAll(/^\s*(\w+_GROUP),$/gm)].map((m) => m[1]);
  const byName = new Map();
  for (const f of listFiles(dir, ".ts")) {
    if (f === "types.ts") continue;
    const m = read(join(dir, f)).match(/export const (\w+_GROUP)/);
    if (m) byName.set(m[1], { file: `dvizhok/catalogs/settings/${f}`, group: evalDataFile(join(dir, f), m[1]) });
  }
  const out = [];
  for (const name of orderNames) {
    const hit = byName.get(name);
    if (!hit) throw new Error(`манифест называет ${name}, файла нет — NO MISSING нарушен`);
    out.push({ ...hit.group, file: hit.file });
    byName.delete(name);
  }
  for (const [name, hit] of byName) out.push({ ...hit.group, file: hit.file, vneManifesta: true, name });
  return out;
}

// ── полиция: метаданные каждого правила из его файла ──
export function parsePoliceRules(root) {
  const base = join(root, "dvizhok", "politsiya");
  const out = [];
  for (const cls of ["ce", "geo", "cons", "det", "sense"]) {
    for (const f of listFiles(join(base, cls), ".ts")) {
      const meta = evalHeader(join(base, cls, f), /\n\s*check\(/);
      out.push({ ...meta, file: `dvizhok/politsiya/${cls}/${f}` });
    }
  }
  return out;
}

// ── слияние: 9 запретов ──
export function parseMergeBlockers(root) {
  const dir = join(root, "dvizhok", "solver", "merge", "blockers");
  return listFiles(dir, ".ts").map((f) => ({
    ...evalHeader(join(dir, f), /\n\s*blocks\(/),
    file: `dvizhok/solver/merge/blockers/${f}`,
  }));
}

// ── стяжки: полные литералы с confidence ──
export function parseConnectors(root) {
  const dir = join(root, "dvizhok", "catalogs", "connectors");
  const out = [];
  for (const f of listFiles(dir, ".ts")) {
    if (f === "types.ts" || f === "registry.ts") continue;
    const m = read(join(dir, f)).match(/export const (\w+)/);
    out.push({ ...evalDataFile(join(dir, f), m[1]), file: `dvizhok/catalogs/connectors/${f}` });
  }
  return out;
}

// ── комплекты и правила роста: уже JSON ──
const jsonFolder = (dir, rel) =>
  listFiles(dir, ".json").filter((f) => !f.startsWith("_"))
    .map((f) => ({ ...readJson(join(dir, f)), file: `${rel}/${f}` }));

export async function collectInventar(root = CITY) {
  // Vite (vitest) резолвит голый абсолютный путь, но ломает file:-URL с пробелом;
  // чистый Node — наоборот. Пробуем путь, откатываемся на URL.
  const kontrolPath = join(root, "dogovor", "kontrol.mjs");
  const { kontrolAll } = await import(/* @vite-ignore */ kontrolPath)
    .catch(() => import(pathToFileURL(kontrolPath).href));
  const kDir = join(root, "dogovor", "komplekty");
  const pDir = join(root, "dogovor", "predlozheniya");

  const inv = {
    nastroyki: parseSettingsGroups(root),
    politsiya: parsePoliceRules(root),
    sliyanie: parseMergeBlockers(root),
    styazhki: parseConnectors(root),
    komplekty: jsonFolder(kDir, "dogovor/komplekty"),
    yadro: readJson(join(kDir, "_yadro.json")),
    predlozheniya: jsonFolder(pDir, "dogovor/predlozheniya"),
    etika: readJson(join(pDir, "_etika.json")),
    slovar: readJson(join(pDir, "_slovar.json")),
    kontrol: kontrolAll(root).map(({ file, vid, status, oshibki }) => ({ file, vid, status, oshibki })),
  };
  inv.itogo = {
    nastroek: inv.nastroyki.reduce((n, g) => n + g.settings.length, 0),
    sekciy: inv.nastroyki.length,
    pravil: inv.politsiya.length,
    aktivnyh: inv.politsiya.filter((r) => r.status === "active").length,
    zapretov: inv.sliyanie.length,
    styazhek: inv.styazhki.length,
    komplektov: inv.komplekty.length,
    predlozheniy: inv.predlozheniya.length,
    krasnyh: inv.kontrol.filter((k) => k.status === "red").length,
  };
  return inv;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const inv = await collectInventar(CITY);
  const body = JSON.stringify(inv, null, 1);
  // Хэш конфигурации (R49): каждый экран Пульта показывает, ИЗ ЧЕГО он вычислен.
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 12);
  const out = `// СГЕНЕРИРОВАНО pult/scan.mjs — НЕ РЕДАКТИРУЙ РУКАМИ. Правь настоящие файлы и перезапусти npm run pult.
window.INVENTAR = ${body};
window.INVENTAR.hash = ${JSON.stringify(hash)};
window.INVENTAR.generatedAt = ${JSON.stringify(new Date().toISOString())};
`;
  writeFileSync(join(HERE, "inventar.js"), out);
  const i = inv.itogo;
  console.log(`🎛  ПУЛЬТ: инвентарь собран → ${relative(process.cwd(), join(HERE, "inventar.js"))}`);
  console.log(`   настройки ${i.nastroek} (${i.sekciy} секций) · полиция ${i.aktivnyh}/${i.pravil} · слияние ${i.zapretov} · стяжки ${i.styazhek}`);
  console.log(`   комплекты ${i.komplektov} · правила роста ${i.predlozheniy} · контроль: ${i.krasnyh === 0 ? "🟢 чисто" : `🔴 ${i.krasnyh}`} · hash ${hash}`);
}
