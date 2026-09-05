#!/usr/bin/env node
// PANEL · СКАН — вычисленная правда. Читает папки, пишет panel/status.js. Руками ничего не обновляется.
// Запуск:  node panel/scan.mjs      (или npm run scan; Codespaces гоняет его при старте)
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { kontrolAll } from "../dogovor/kontrol.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const realFiles = (dir) => { // рекурсивный счёт настоящих файлов (.keep не считается)
  let n = 0;
  if (!existsSync(dir)) return 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".keep" || e.name === ".DS_Store") continue;
    n += e.isDirectory() ? realFiles(join(dir, e.name)) : 1;
  }
  return n;
};

const api = (() => {
  try { return readFileSync(join(ROOT, "dogovor/VERSION.md"), "utf8").match(/cartridge-api@\d+/)?.[0] ?? null; }
  catch { return null; }
})();

function scanCartridges(house) {
  const dir = join(ROOT, house, "cartridges");
  if (!existsSync(dir)) return [];
  let registry = "";
  try { registry = readFileSync(join(dir, "index.ts"), "utf8"); } catch {}
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    let manifest = null;
    try { manifest = JSON.parse(readFileSync(join(p, "manifest.json"), "utf8")); } catch {}
    const src = realFiles(join(p, "src")) > 0;
    const test = realFiles(join(p, "test")) > 0;
    const registered = new RegExp(`^\\s*import .*"\\./${name}/`, "m").test(registry);
    const apiOk = manifest?.api === api;
    const status = name.startsWith("_") ? "template"
      : manifest && src && test && registered && apiOk ? "green"
      : manifest ? "yellow" : "red";
    out.push({ name, titleRu: manifest?.titleRu ?? name, status,
      m: !!manifest, s: src, t: test, r: registered, apiOk, source: manifest?.source ?? null });
  }
  return out;
}

const CORE_DIR = { prilozhenie: "korpus", kuznitsa: "verstak" };
const houses = {};
for (const h of ["dogovor", "dvizhok", "prilozhenie", "kuznitsa", "biblioteka", "dannye", "panel"]) {
  houses[h] = {
    files: realFiles(join(ROOT, h)),
    core: CORE_DIR[h] ? realFiles(join(ROOT, h, CORE_DIR[h])) : null,
  };
}

const slots = (list) => {
  const c = list.filter(x => x.status !== "template");
  return { total: c.length,
    green: c.filter(x => x.status === "green").length,
    yellow: c.filter(x => x.status === "yellow").length,
    red: c.filter(x => x.status === "red").length };
};

const kuznitsa = scanCartridges("kuznitsa");
const prilozhenie = scanCartridges("prilozhenie");
const dannye = kontrolAll(ROOT); // контроль настроек и таблиц — та же вычисленная правда
const status = {
  generated: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC",
  api, houses,
  bays: { kuznitsa: { list: kuznitsa, ...slots(kuznitsa) },
          prilozhenie: { list: prilozhenie, ...slots(prilozhenie) } },
  dannye,
};

// 1) status.js — для CI и других потребителей
writeFileSync(join(ROOT, "panel/status.js"),
  "// СГЕНЕРИРОВАНО panel/scan.mjs — НЕ РЕДАКТИРУЙ РУКАМИ, запусти скан заново\n" +
  "window.MEBELCHI_STATUS = " + JSON.stringify(status, null, 1) + ";\n");

// 2) впрыск ПРЯМО в dashboard.html (между маркерами) — панель самодостаточна,
//    открывается двойным кликом где угодно, без сервера и без соседних файлов
const dashPath = join(ROOT, "panel/dashboard.html");
const dash = readFileSync(dashPath, "utf8");
const injected = dash.replace(
  /\/\*STATUS-START\*\/[\s\S]*?\/\*STATUS-END\*\//,
  "/*STATUS-START*/\nwindow.MEBELCHI_STATUS = " + JSON.stringify(status) + ";\n/*STATUS-END*/");
if (injected === dash) { console.error("✗ маркеры STATUS-START/END не найдены в dashboard.html"); process.exit(1); }
writeFileSync(dashPath, injected);

console.log(`✓ panel/dashboard.html + status.js обновлены · ${status.generated} · розетка: ${api}`);
for (const [h, v] of Object.entries(houses)) console.log(`  ${h.padEnd(12)} файлов: ${v.files}`);
console.log(`  кассеты кузницы: ${JSON.stringify(slots(kuznitsa))}`);
console.log(`  экраны приложения: ${JSON.stringify(slots(prilozhenie))}`);
const dRed = dannye.filter(d => d.status === "red").length;
console.log(`  данные: всего ${dannye.length} · 🔴 грязных: ${dRed}${dRed ? " — открой панель, там написано что чинить" : ""}`);
