#!/usr/bin/env node
// DOGOVOR · КОНТРОЛЬ ДАННЫХ — сторож файловой системы.
// Каждый файл-настройка проверяется схемой (_shema.json), каждая таблица — правилами (_pravila.json).
// Чужой ключ, чужая колонка, число вне диапазона = 🔴. Файл без схемы = ⚪ «представлен, не под контролем».
// Запуск:  node dogovor/kontrol.mjs        (или npm run kontrol; scan.mjs зовёт это сам)
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SKIP_DIRS = new Set(["node_modules", ".git", ".github", ".devcontainer", "panel"]);
// Эти две папки проверяются отдельно (DB/44): схема на папку + ядро + перекрёстные ссылки.
const SPECIAL_DIRS = new Set(["komplekty", "predlozheniya"]);
const SKIP_FILES = new Set(["package.json", "manifest.json", "fixture.json", "instrument.json"]);

// ── проверка одного значения по правилу ──
// Типы: chislo · bul · vybor · spisok(varianty|elementy) · tekst · tekst_ili_null · chislo_ili_null · null · obekt(klyuchi)
function checkValue(v, rule, path = "") {
  const e = [];
  const at = (m) => e.push(path ? `${path}: ${m}` : m);
  if (rule.tip === "chislo" || (rule.tip === "chislo_ili_null" && v !== null)) {
    if (typeof v !== "number" || Number.isNaN(v)) at(`не число: ${JSON.stringify(v)}`);
    else {
      if (rule.min !== undefined && v < rule.min) at(`${v} < min ${rule.min}`);
      if (rule.max !== undefined && v > rule.max) at(`${v} > max ${rule.max}`);
    }
  } else if (rule.tip === "chislo_ili_null") {
    // null — разрешено
  } else if (rule.tip === "bul") {
    if (typeof v !== "boolean") at(`не true/false: ${JSON.stringify(v)}`);
  } else if (rule.tip === "vybor") {
    if (!rule.varianty.includes(v)) at(`«${v}» не из списка [${rule.varianty.join(", ")}]`);
  } else if (rule.tip === "spisok") {
    if (!Array.isArray(v)) at("не список");
    else if (rule.varianty) { for (const x of v) if (!rule.varianty.includes(x)) at(`«${x}» не из списка разрешённых`); }
    else if (rule.elementy === "tekst") { for (const x of v) if (typeof x !== "string" || !x.trim()) at(`элемент не текст: ${JSON.stringify(x)}`); }
  } else if (rule.tip === "tekst") {
    if (typeof v !== "string" || v.trim() === "") at("пустой текст");
  } else if (rule.tip === "tekst_ili_null") {
    if (v !== null && (typeof v !== "string" || v.trim() === "")) at("не текст и не null");
  } else if (rule.tip === "null") {
    if (v !== null) at(`должно быть null, а не ${JSON.stringify(v)}`);
  } else if (rule.tip === "obekt") {
    if (typeof v !== "object" || v === null || Array.isArray(v)) at("не объект");
    else {
      const known = rule.klyuchi ?? {};
      for (const [k, x] of Object.entries(v)) {
        if (k.startsWith("_")) continue;
        if (!known[k]) { at(`чужой ключ «${k}»`); continue; }
        e.push(...checkValue(x, known[k], path ? `${path}.${k}` : k));
      }
      for (const k of Object.keys(known)) if (!(k in v)) at(`нет обязательного ключа «${k}»`);
    }
  }
  return e;
}

// ── json-настройки против _shema.json ──
function checkJson(obj, shema) {
  const errs = [];
  if (shema.vse_znacheniya === "bul") {
    for (const [k, v] of Object.entries(obj))
      if (!k.startsWith("_") && typeof v !== "boolean") errs.push(`${k}: не true/false`);
    return errs;
  }
  const known = shema.klyuchi ?? {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith("_")) continue;
    if (!known[k]) { if (shema.strogo) errs.push(`чужой ключ: «${k}»`); continue; }
    errs.push(...checkValue(v, known[k], k));
  }
  for (const k of Object.keys(known)) if (!(k in obj)) errs.push(`нет обязательного ключа «${k}»`);
  return errs;
}

// ── csv против _pravila.json (простой csv: без кавычек-запятых) ──
function checkCsv(text, pravila) {
  const errs = [];
  const rows = text.trim().split(/\r?\n/).map(r => r.split(","));
  const header = rows[0].map(h => h.trim());
  const want = Object.keys(pravila.kolonki);
  for (const h of header) if (!want.includes(h)) errs.push(`чужая колонка: «${h}»`);
  for (const w of want) if (!header.includes(w)) errs.push(`нет колонки «${w}»`);
  if (errs.length) return errs;
  rows.slice(1).forEach((cells, i) => {
    header.forEach((h, c) => {
      const rule = pravila.kolonki[h];
      let v = (cells[c] ?? "").trim();
      if (rule.tip === "chislo") v = Number(v);
      for (const e of checkValue(v, rule)) errs.push(`строка ${i + 2}, ${h}: ${e}`);
    });
  });
  return errs;
}


// ═══════════════════════════════════════════════════════════════════════════════════
// DB/44 — КОМПЛЕКТЫ и ПРЕДЛОЖЕНИЯ. Схема на папку ("*"), два запечатанных ядра,
// перекрёстные ссылки. Касание ядра = 🔴, мерж закрыт. Это «защитный раздел» DB/43 §6.2
// в виде файла и сторожа, а не слоя кода.
// ═══════════════════════════════════════════════════════════════════════════════════
const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const listJson = (dir) => existsSync(dir)
  ? readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_")).sort() : [];
const listDirs = (dir) => existsSync(dir)
  ? readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith("_") && !d.name.startsWith(".")).map((d) => d.name) : [];

/** id правил полиции по файлам dvizhok/politsiya/<класс>/<ID>_*.ts — считаем с диска, не из копии. */
function policeRules(ROOT) {
  const base = join(ROOT, "dvizhok", "politsiya");
  const byId = new Map();
  for (const cls of listDirs(base)) {
    for (const f of readdirSync(join(base, cls))) {
      if (!f.endsWith(".ts")) continue;
      byId.set(f.split("_")[0], cls.toUpperCase());
    }
  }
  return byId;
}

/** export const <NAME>: ConstructionProfile — имена профилей из dvizhok/catalogs/profiles.ts */
function profileNames(ROOT) {
  try {
    const src = readFileSync(join(ROOT, "dvizhok", "catalogs", "profiles.ts"), "utf8");
    return new Set([...src.matchAll(/export const (\w+)\s*:\s*ConstructionProfile/g)].map((m) => m[1]));
  } catch { return new Set(); }
}

/** Контекст перекрёстных ссылок — всё, что читается с диска один раз. */
export function komplektyContext(ROOT) {
  const kDir = join(ROOT, "dogovor", "komplekty");
  const pDir = join(ROOT, "dogovor", "predlozheniya");
  const tryJson = (p, fallback) => { try { return readJson(p); } catch { return fallback; } };
  const bundles = new Map();
  for (const f of listJson(kDir)) bundles.set(f.replace(/\.json$/, ""), tryJson(join(kDir, f), null));
  const pravila = new Map();
  for (const f of listJson(pDir)) pravila.set(f, tryJson(join(pDir, f), null));
  return {
    kDir, pDir, bundles, pravila,
    ruleById: new Map([...pravila.values()].filter(Boolean).map((r) => [r.id, r])),
    rules: policeRules(ROOT),
    profiles: profileNames(ROOT),
    kassety: new Set(listDirs(join(ROOT, "prilozhenie", "cartridges"))),
    kuznitsa: new Set(listDirs(join(ROOT, "kuznitsa", "cartridges"))),
    kShema: tryJson(join(kDir, "_shema.json"), {})["*"] ?? {},
    yadro: tryJson(join(kDir, "_yadro.json"), null),
    pShema: tryJson(join(pDir, "_shema.json"), {})["*"] ?? {},
    etika: tryJson(join(pDir, "_etika.json"), null),
    slovar: tryJson(join(pDir, "_slovar.json"), null),
  };
}

/** Один комплект против схемы, ядра и ссылок. Чистая функция — её гоняет и kontrol, и tests/komplekty.test.ts. */
export function proverKomplekt(name, b, ctx) {
  if (!b) return ["json не читается"];
  const { rules, profiles, kassety, kuznitsa, bundles, ruleById, yadro, kShema } = ctx;
  const e = checkJson(b, kShema);
  if (b.id !== name) e.push(`id «${b.id}» ≠ имя файла «${name}»`);
  if (!yadro) e.push("нет _yadro.json — ядро не запечатано");
  else {
    for (const cls of yadro.zapechatano.klassy_politsii)
      if (!(b.politsiya?.klassy ?? []).includes(cls)) e.push(`ЯДРО: класс ${cls} обязателен, комплект его не включает`);
    for (const id of b.politsiya?.otklyuchit ?? []) {
      const cls = rules.get(id);
      if (!cls) e.push(`otklyuchit: правила «${id}» нет в dvizhok/politsiya (фантом)`);
      else if (yadro.zapechatano.klassy_politsii.includes(cls)) e.push(`ЯДРО: нельзя отключить правило безопасности ${id} (класс ${cls})`);
    }
  }
  if (b.nasleduet && !bundles.has(b.nasleduet)) e.push(`nasleduet «${b.nasleduet}» — такого комплекта нет`);
  if (b.nasleduet === b.id) e.push("комплект наследует сам себя");
  for (const k of b.vklyucheno?.kassety ?? []) if (!kassety.has(k)) e.push(`кассеты «${k}» нет в prilozhenie/cartridges`);
  for (const k of b.vklyucheno?.kuznitsa ?? []) if (!kuznitsa.has(k)) e.push(`кассеты «${k}» нет в kuznitsa/cartridges`);
  if (b.profil && profiles.size && !profiles.has(b.profil)) e.push(`профиля «${b.profil}» нет в dvizhok/catalogs/profiles.ts`);
  for (const pr of b.predlozheniya ?? []) {
    const r = ruleById.get(pr);
    if (!r) e.push(`предложения «${pr}» нет в dogovor/predlozheniya (фантом)`);
    else if (!(r.trigger?.auditoriya?.komplekty ?? []).includes(b.id)) e.push(`${pr} не называет «${b.id}» в своей аудитории — ссылка в одну сторону`);
  }
  return e;
}

/** Одно правило роста против схемы, этики, словаря и ссылок. Чистая функция. */
export function proverPredlozhenie(f, r, ctx, seenUid = new Map()) {
  if (!r) return ["json не читается"];
  const { bundles, etika, slovar, pShema } = ctx;
  const e = checkJson(r, pShema);
  if (!f.startsWith(r.id + "_")) e.push(`id «${r.id}» ≠ начало имени файла «${f}»`);
  if (seenUid.has(r.uid) && seenUid.get(r.uid) !== f) e.push(`uid «${r.uid}» уже занят файлом ${seenUid.get(r.uid)}`);
  if (slovar) {
    if (!slovar.sobytiya[r.trigger?.sobytie]) e.push(`события «${r.trigger?.sobytie}» нет в _slovar.json`);
    if (!slovar.sobytiya[r.metrika?.uspekh]) e.push(`метрика: события «${r.metrika?.uspekh}» нет в _slovar.json`);
  }
  for (const k of r.trigger?.auditoriya?.komplekty ?? []) {
    if (!bundles.has(k)) e.push(`аудитория: комплекта «${k}» нет`);
    else if (!(bundles.get(k)?.predlozheniya ?? []).includes(r.id)) e.push(`комплект «${k}» не перечисляет ${r.id} — ссылка в одну сторону`);
  }
  const offered = r.predlozhenie?.komplekt;
  if (offered && !bundles.has(offered)) e.push(`предлагается комплект «${offered}», которого нет`);
  if (offered && (r.trigger?.auditoriya?.komplekty ?? []).includes(offered)) e.push(`ЭТИКА: предлагает «${offered}» тем, у кого он уже есть (оплаченное не допродаём)`);
  if (!etika) e.push("нет _etika.json — этика не запечатана");
  else {
    const o = r.ogranicheniya ?? {};
    if (etika.nikogda_pri.includes(r.trigger?.sobytie)) e.push(`ЭТИКА: триггер «${r.trigger.sobytie}» — продажа в момент неудачи запрещена`);
    for (const n of etika.nikogda_pri) if (!(o.nikogda_pri ?? []).includes(n)) e.push(`ЭТИКА: nikogda_pri обязан включать «${n}»`);
    if (o.otkaz !== etika.otkaz) e.push(`ЭТИКА: otkaz должен быть «${etika.otkaz}»`);
    if (typeof o.ne_chashe_dney === "number" && o.ne_chashe_dney < etika.min_ne_chashe_dney) e.push(`ЭТИКА: ne_chashe_dney ${o.ne_chashe_dney} < ${etika.min_ne_chashe_dney}`);
    if (typeof o.maks_pokazov === "number" && o.maks_pokazov > etika.maks_pokazov_na_pravilo) e.push(`ЭТИКА: maks_pokazov ${o.maks_pokazov} > ${etika.maks_pokazov_na_pravilo}`);
    if (etika.zapreshennye_formy.includes(r.predlozhenie?.forma)) e.push(`ЭТИКА: форма «${r.predlozhenie.forma}» запрещена`);
    if (etika.zapreshennye_momenty.includes(r.predlozhenie?.moment)) e.push(`ЭТИКА: момент «${r.predlozhenie.moment}» запрещён`);
  }
  return e;
}

export function kontrolKomplekty(ROOT) {
  const out = [];
  const ctx = komplektyContext(ROOT);
  if (!existsSync(ctx.kDir) && !existsSync(ctx.pDir)) return out;
  const push = (p, vid, oshibki) =>
    out.push({ file: relative(ROOT, p), vid, status: oshibki.length ? "red" : "green", oshibki });
  for (const [name, b] of ctx.bundles) push(join(ctx.kDir, name + ".json"), "komplekt", proverKomplekt(name, b, ctx));
  const seenUid = new Map();
  for (const [f, r] of ctx.pravila) {
    push(join(ctx.pDir, f), "predlozhenie", proverPredlozhenie(f, r, ctx, seenUid));
    if (r?.uid && !seenUid.has(r.uid)) seenUid.set(r.uid, f);
  }
  return out;
}

export function kontrolAll(ROOT) {
  const out = [];
  (function walk(dir) {
    let shema = null, pravila = null;
    const names = readdirSync(dir, { withFileTypes: true });
    try { shema = JSON.parse(readFileSync(join(dir, "_shema.json"), "utf8")); } catch {}
    try { pravila = JSON.parse(readFileSync(join(dir, "_pravila.json"), "utf8")); } catch {}
    for (const e of names) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name) && !SPECIAL_DIRS.has(e.name)) walk(p); continue; }
      const rel = relative(ROOT, p);
      if (e.name.startsWith("_") || e.name.startsWith(".")) continue;

      if (e.name.endsWith(".json") && !SKIP_FILES.has(e.name)) {
        const isData = shema?.[e.name] || /nastroyki|profili|pravila|tumblery/.test(rel);
        if (!isData) continue;
        let status = "gray", oshibki = [];
        try {
          const obj = JSON.parse(readFileSync(p, "utf8"));
          if (shema?.[e.name]) { oshibki = checkJson(obj, shema[e.name]); status = oshibki.length ? "red" : "green"; }
        } catch (err) { status = "red"; oshibki = ["json не читается: " + err.message]; }
        out.push({ file: rel, vid: "nastroyki", status, oshibki });
      }

      if (e.name.endsWith(".csv")) {
        let status = "gray", oshibki = [];
        if (pravila?.[e.name]) {
          oshibki = checkCsv(readFileSync(p, "utf8"), pravila[e.name]);
          status = oshibki.length ? "red" : "green";
        }
        out.push({ file: rel, vid: "tablica", status, oshibki });
      }
    }
  })(ROOT);
  out.push(...kontrolKomplekty(ROOT));
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

// ── CLI ──
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const ROOT = join(HERE, "..");
  const res = kontrolAll(ROOT);
  let red = 0;
  console.log("\n📋 КОНТРОЛЬ ДАННЫХ\n");
  for (const r of res) {
    const led = r.status === "green" ? "🟢" : r.status === "red" ? "🔴" : "⚪";
    console.log(`${led} ${r.file}${r.oshibki.length ? "\n     ✗ " + r.oshibki.join("\n     ✗ ") : ""}`);
    if (r.status === "red") red++;
  }
  console.log(red === 0
    ? "\n🟢 ВСЕ ДАННЫЕ ЧИСТЫЕ — можно мержить"
    : `\n🔴 ГРЯЗНЫЕ ФАЙЛЫ: ${red} — мерж закрыт`);
  process.exit(red === 0 ? 0 : 1);
}
