import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const ROOT = path.resolve(fileURLToPath(new URL("../../", import.meta.url)));
export const REVIEW_DIR = path.join(ROOT, "review", "automation");
export const STATE_PATH = path.join(REVIEW_DIR, "state.json");

export function argValue(name, fallback = undefined) {
  const pref = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(pref));
  if (hit) return hit.slice(pref.length);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

export function boolArg(name, fallback = false) {
  const val = argValue(name);
  if (val == null) return fallback;
  return !["0", "false", "no"].includes(String(val).toLowerCase());
}

export function targetUrlFromArg() {
  const arg = argValue("url");
  if (arg) return arg;
  return pathToFileURL(path.join(ROOT, "index.html")).href;
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function readJsonSafe(file, fallback) {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt);
  } catch {
    return fallback;
  }
}

export async function writeJson(file, obj) {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, `${JSON.stringify(obj, null, 2)}\n`, "utf8");
}

export function stamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

export async function readProjectFiles() {
  const [html, css] = await Promise.all([
    fs.readFile(path.join(ROOT, "index.html"), "utf8"),
    fs.readFile(path.join(ROOT, "styles.css"), "utf8")
  ]);
  return { html, css };
}

export async function writeProjectFile(rel, content) {
  const target = path.join(ROOT, rel);
  if (!target.startsWith(ROOT)) throw new Error("Refusing to write outside project root.");
  await fs.writeFile(target, content, "utf8");
}
