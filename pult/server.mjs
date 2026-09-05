#!/usr/bin/env node
// ПУЛЬТ · крошечный статический сервер — только чтобы открыть pult.html в браузере.
// Никакой записи: Пульт v1 читает инвентарь; пути записи придут через kontrol (DB/44 §5.5).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 4571);
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".css": "text/css" };

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^\/+/, "") || "pult.html";
  try {
    const body = await readFile(join(HERE, path));
    res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end("нет такого файла");
  }
}).listen(PORT, () => console.log(`🎛  Пульт: http://localhost:${PORT}`));
