import fs from "node:fs/promises";
import path from "node:path";
import { chromium, devices } from "playwright";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const OUT_DIR = path.join(ROOT, "review", "current-site", "screenshots");
const manifestPath = path.join(ROOT, "review", "current-site", "manifest.json");

const shots = [
  {
    id: "home-hero-desktop",
    url: "https://darkforge.co/",
    device: "desktop",
    fullPage: false,
    waitMs: 1800
  },
  {
    id: "home-full-desktop",
    url: "https://darkforge.co/",
    device: "desktop",
    fullPage: true,
    waitMs: 1800
  },
  {
    id: "home-products-desktop",
    url: "https://darkforge.co/",
    device: "desktop",
    fullPage: false,
    scrollY: 780,
    waitMs: 1800
  },
  {
    id: "home-contact-reviews-desktop",
    url: "https://darkforge.co/",
    device: "desktop",
    fullPage: false,
    scrollY: 2100,
    waitMs: 1800
  },
  {
    id: "reaper-product-desktop",
    url: "https://darkforge.co/product/dark-forge-reaper-5%e2%80%b3-ported-comp/",
    device: "desktop",
    fullPage: false,
    waitMs: 1800
  },
  {
    id: "truth-page-desktop",
    url: "https://darkforge.co/about-us/",
    device: "desktop",
    fullPage: false,
    waitMs: 1800
  },
  {
    id: "truth-details-desktop",
    url: "https://darkforge.co/about-us/",
    device: "desktop",
    fullPage: false,
    scrollY: 850,
    waitMs: 1800
  },
  {
    id: "stories-page-desktop",
    url: "https://darkforge.co/blog/",
    device: "desktop",
    fullPage: false,
    waitMs: 1800
  },
  {
    id: "stories-list-desktop",
    url: "https://darkforge.co/blog/",
    device: "desktop",
    fullPage: false,
    scrollY: 920,
    waitMs: 1800
  },
  {
    id: "contact-page-desktop",
    url: "https://darkforge.co/contact-us/",
    device: "desktop",
    fullPage: false,
    waitMs: 1800
  },
  {
    id: "contact-form-desktop",
    url: "https://darkforge.co/contact-us/",
    device: "desktop",
    fullPage: false,
    scrollY: 880,
    waitMs: 1800
  },
  {
    id: "home-hero-mobile",
    url: "https://darkforge.co/",
    device: "mobile",
    fullPage: false,
    waitMs: 1800
  },
  {
    id: "home-full-mobile",
    url: "https://darkforge.co/",
    device: "mobile",
    fullPage: true,
    waitMs: 1800
  },
  {
    id: "home-products-mobile",
    url: "https://darkforge.co/",
    device: "mobile",
    fullPage: false,
    scrollY: 760,
    waitMs: 1800
  },
  {
    id: "home-contact-mobile",
    url: "https://darkforge.co/",
    device: "mobile",
    fullPage: false,
    scrollY: 2050,
    waitMs: 1800
  },
  {
    id: "truth-page-mobile",
    url: "https://darkforge.co/about-us/",
    device: "mobile",
    fullPage: false,
    waitMs: 1800
  },
  {
    id: "contact-page-mobile",
    url: "https://darkforge.co/contact-us/",
    device: "mobile",
    fullPage: false,
    waitMs: 1800
  },
  {
    id: "contact-form-mobile",
    url: "https://darkforge.co/contact-us/",
    device: "mobile",
    fullPage: false,
    scrollY: 860,
    waitMs: 1800
  }
];

await fs.mkdir(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ headless: true });
const manifest = [];

async function gotoAndSettle(page, url, waitMs) {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  await page.waitForTimeout(waitMs);
  await page.waitForLoadState("load", { timeout: 10000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
}

async function scrollIfNeeded(page, scrollY = 0) {
  if (!scrollY) return;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), scrollY);
  await page.waitForTimeout(600);
}

try {
  for (const shot of shots) {
    const page = await browser.newPage(
      shot.device === "mobile"
        ? { ...devices["iPhone 13"], colorScheme: "dark" }
        : { viewport: { width: 1440, height: 1200 }, colorScheme: "dark" }
    );

    await gotoAndSettle(page, shot.url, shot.waitMs);
    await scrollIfNeeded(page, shot.scrollY);

    const output = path.join(OUT_DIR, `${shot.id}.png`);
    await page.screenshot({
      path: output,
      fullPage: shot.fullPage
    });

    manifest.push({
      ...shot,
      output
    });

    await page.close();
    console.log(`Captured ${shot.id}`);
  }
} finally {
  await browser.close();
}

await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Saved manifest to ${manifestPath}`);
