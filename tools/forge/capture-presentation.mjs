import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium, devices } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const PORT = 4321;
const BASE = `http://127.0.0.1:${PORT}`;
const OUT_DIR = path.join(ROOT, "review", "presentation", "screenshots");
const manifestPath = path.join(ROOT, "review", "presentation", "manifest.json");

const pages = [
  { slug: "comparison", url: `${BASE}/presentation/comparison-board.html`, mid: 1400 },
  { slug: "rationale", url: `${BASE}/presentation/brand-rationale.html`, mid: 1200 },
  { slug: "reaper-launch", url: `${BASE}/releases/reaper-launch.html`, mid: 1500 }
];

await fs.mkdir(OUT_DIR, { recursive: true });

const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
  cwd: ROOT,
  stdio: "ignore"
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function settle(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForLoadState("load", { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function captureDevice(browser, deviceTag, options) {
  const page = await browser.newPage(options);
  const shots = [];

  for (const route of pages) {
    await settle(page, route.url);
    const firstPath = path.join(OUT_DIR, `${route.slug}-${deviceTag}-first.png`);
    await page.screenshot({ path: firstPath, fullPage: false });
    shots.push({ page: route.slug, device: deviceTag, type: "first", output: firstPath });

    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), route.mid);
    await page.waitForTimeout(700);
    const midPath = path.join(OUT_DIR, `${route.slug}-${deviceTag}-mid.png`);
    await page.screenshot({ path: midPath, fullPage: false });
    shots.push({ page: route.slug, device: deviceTag, type: "mid", output: midPath });
  }

  await page.close();
  return shots;
}

await wait(1400);

const browser = await chromium.launch({ headless: true });
let manifest = [];

try {
  manifest = manifest.concat(
    await captureDevice(browser, "desktop", { viewport: { width: 1440, height: 1200 }, colorScheme: "dark" })
  );
  manifest = manifest.concat(
    await captureDevice(browser, "mobile", { ...devices["iPhone 13"], colorScheme: "dark" })
  );
} finally {
  await browser.close();
  server.kill("SIGTERM");
}

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Captured ${manifest.length} presentation screenshots to ${OUT_DIR}`);
