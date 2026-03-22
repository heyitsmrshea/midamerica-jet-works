import path from "node:path";
import { chromium, devices } from "playwright";
import { REVIEW_DIR, argValue, ensureDir, targetUrlFromArg } from "./lib.mjs";

const tag = argValue("tag", "capture");
const outDir = argValue("out-dir", REVIEW_DIR);
const url = targetUrlFromArg();

await ensureDir(outDir);

const browser = await chromium.launch({ headless: true });
try {
  const desktop = await browser.newPage({
    viewport: { width: 1720, height: 1080 },
    deviceScaleFactor: 1
  });
  await desktop.goto(url, { waitUntil: "networkidle" });
  await desktop.screenshot({
    path: path.join(outDir, `${tag}-desktop-full.png`),
    fullPage: true
  });
  await desktop.screenshot({
    path: path.join(outDir, `${tag}-desktop-fold.png`)
  });
  await desktop.close();

  const tablet = await browser.newPage({
    viewport: { width: 1024, height: 1366 },
    deviceScaleFactor: 1
  });
  await tablet.goto(url, { waitUntil: "networkidle" });
  await tablet.screenshot({
    path: path.join(outDir, `${tag}-tablet-full.png`),
    fullPage: true
  });
  await tablet.close();

  const mobile = await browser.newPage({ ...devices["iPhone 13"] });
  await mobile.goto(url, { waitUntil: "networkidle" });
  await mobile.screenshot({
    path: path.join(outDir, `${tag}-mobile-full.png`),
    fullPage: true
  });
  await mobile.screenshot({
    path: path.join(outDir, `${tag}-mobile-fold.png`)
  });
  await mobile.close();
} finally {
  await browser.close();
}

console.log(`Captured screenshots for ${url} -> ${outDir} (${tag})`);
