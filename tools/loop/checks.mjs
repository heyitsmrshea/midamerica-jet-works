import path from "node:path";
import { chromium, devices } from "playwright";
import { REVIEW_DIR, argValue, ensureDir, targetUrlFromArg, writeJson } from "./lib.mjs";

const tag = argValue("tag", "checks");
const outDir = argValue("out-dir", REVIEW_DIR);
const url = targetUrlFromArg();
await ensureDir(outDir);

const selectors = [
  ".site-header",
  ".hero-copy",
  ".hero-visual",
  ".hero-rail",
  ".sub-hero-copy",
  ".sub-hero-media",
  ".sub-band",
  ".sub-grid",
  ".sub-grid-3",
  ".metrics-grid",
  ".inquiry-wrap",
  ".statement-lead",
  ".statement-grid",
  ".feature-copy",
  ".feature-media",
  ".proof-head",
  ".proof-case",
  ".system-head",
  ".news-head",
  ".news-item"
];

async function runFor(page, label) {
  await page.goto(url, { waitUntil: "networkidle" });
  return page.evaluate((selList) => {
    const issues = [];
    const allowedOverlaps = new Set([
      [".hero-copy", ".hero-visual"].sort().join("::")
    ]);
    const doc = document.documentElement;
    const overflowX = doc.scrollWidth - doc.clientWidth;
    if (overflowX > 1) issues.push({ type: "horizontal-overflow", px: overflowX });

    const clipped = [];
    for (const el of document.querySelectorAll("h1,h2,h3,p,li,a,strong,span")) {
      const text = (el.textContent || "").trim();
      if (!text) continue;
      const cs = getComputedStyle(el);
      const mayClip = ["hidden", "clip"].includes(cs.overflow) || ["hidden", "clip"].includes(cs.overflowY);
      if (!mayClip) continue;
      if (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2) {
        clipped.push({
          text: text.slice(0, 80),
          className: el.className || "",
          tag: el.tagName.toLowerCase()
        });
      }
      if (clipped.length >= 25) break;
    }
    if (clipped.length) issues.push({ type: "clipped-text", items: clipped });

    const peopleCards = [...document.querySelectorAll(".people-card")];
    if (peopleCards.length > 0 && peopleCards.length < 8) {
      issues.push({ type: "under-imaged-leadership", count: peopleCards.length });
    }

    const sparseMedia = [];
    for (const section of document.querySelectorAll("main section")) {
      const images = section.querySelectorAll("img").length;
      const textBlocks = section.querySelectorAll("h1,h2,h3,p,li").length;
      if (textBlocks >= 8 && images === 0) {
        sparseMedia.push((section.className || section.tagName.toLowerCase()).trim());
      }
    }
    if (sparseMedia.length) {
      issues.push({ type: "text-heavy-sections", items: sparseMedia.slice(0, 10) });
    }

    const sels = [];
    for (const s of selList) {
      const n = document.querySelector(s);
      if (!n) continue;
      const r = n.getBoundingClientRect();
      sels.push({ s, r: { l: r.left, t: r.top, r: r.right, b: r.bottom }, n });
    }
    const overlaps = [];
    for (let i = 0; i < sels.length; i++) {
      for (let j = i + 1; j < sels.length; j++) {
        const a = sels[i];
        const b = sels[j];
        if (a.n.contains(b.n) || b.n.contains(a.n)) continue;
        const overlapKey = [a.s, b.s].sort().join("::");
        if (allowedOverlaps.has(overlapKey)) continue;
        const ix = Math.max(0, Math.min(a.r.r, b.r.r) - Math.max(a.r.l, b.r.l));
        const iy = Math.max(0, Math.min(a.r.b, b.r.b) - Math.max(a.r.t, b.r.t));
        const area = ix * iy;
        if (area > 3000) overlaps.push({ a: a.s, b: b.s, area: Math.round(area) });
      }
    }
    if (overlaps.length) issues.push({ type: "overlap", items: overlaps.slice(0, 12) });
    return issues;
  }, selectors);
}

const browser = await chromium.launch({ headless: true });
const report = { url, generatedAt: new Date().toISOString(), devices: {} };
try {
  const desktop = await browser.newPage({ viewport: { width: 1720, height: 1080 } });
  report.devices.desktop = await runFor(desktop, "desktop");
  await desktop.close();

  const mobile = await browser.newPage({ ...devices["iPhone 13"] });
  report.devices.mobile = await runFor(mobile, "mobile");
  await mobile.close();
} finally {
  await browser.close();
}

const outPath = path.join(outDir, `${tag}-checks.json`);
await writeJson(outPath, report);
console.log(`Wrote checks report: ${outPath}`);
