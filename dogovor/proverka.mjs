#!/usr/bin/env node
// DOGOVOR · ПРОВЕРКА — гейт приёмки кассеты. Кассета, которая ломает движок, НЕ ВСТАВЛЯЕТСЯ.
// Запуск:  node dogovor/proverka.mjs kuznitsa/cartridges/vyrez
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = process.argv[2];
if (!target) { console.log("Использование: node dogovor/proverka.mjs <путь-к-кассете>"); process.exit(2); }

const dir = join(ROOT, target);
const name = basename(dir);
const api = readFileSync(join(ROOT, "dogovor/VERSION.md"), "utf8").match(/cartridge-api@\d+/)?.[0];

const checks = [];
const ok = (label, pass, why = "") => checks.push({ label, pass, why });

ok("папка существует", existsSync(dir));

let manifest = null;
try { manifest = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")); ok("manifest.json читается", true); }
catch (err) { ok("manifest.json читается", false, err.message); }
if (manifest) {
  ok(`api совпадает (${api})`, manifest.api === api, `в манифесте: ${manifest.api}`);
  ok("id = имя папки", manifest.id === name, `в манифесте: ${manifest.id}`);
}

const realFiles = d => existsSync(d) ? readdirSync(d).filter(f => f !== ".keep" && f !== ".DS_Store").length : 0;
ok("src/ не пустой", realFiles(join(dir, "src")) > 0);
ok("test/ не пустой (золотой тест на СТЕНДЕ)", realFiles(join(dir, "test")) > 0);

// запрещённые импорты: из кассеты можно только в dogovor + белый список библиотек
const WHITELIST = ["react", "three", "zustand"];
const bad = [];
(function walk(d) {
  if (!existsSync(d)) return;
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.(ts|tsx|js|mjs)$/.test(e.name)) continue;
    for (const m of readFileSync(p, "utf8").matchAll(/from\s+["']([^"']+)["']/g)) {
      const imp = m[1];
      if (imp.startsWith(".")) {
        const jumps = imp.split("/").filter(s => s === "..").length;
        if (jumps >= 3 && !imp.includes("dogovor")) bad.push(`${e.name}: ${imp}`);
      } else if (!imp.includes("dogovor") && !WHITELIST.some(w => imp === w || imp.startsWith(w + "/"))) {
        bad.push(`${e.name}: ${imp}`);
      }
    }
  }
})(join(dir, "src"));
ok("импорты легальны (только dogovor + белый список)", bad.length === 0, bad.slice(0, 5).join(" · "));

let fail = 0;
console.log(`\n📦 ПРОВЕРКА КАССЕТЫ: ${name}\n`);
for (const c of checks) {
  console.log(`${c.pass ? "✅" : "❌"} ${c.label}${!c.pass && c.why ? " — " + c.why : ""}`);
  if (!c.pass) fail++;
}
console.log(fail === 0
  ? "\n🟢 ПРИНЯТА — вставляй, добавь ОДНУ строку в cartridges/index.ts, запусти panel/scan.mjs"
  : `\n🔴 ВЕРНУТЬ АВТОРУ — провалов: ${fail}`);
process.exit(fail === 0 ? 0 : 1);
