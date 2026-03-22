import fs from "node:fs/promises";
import path from "node:path";
import { REVIEW_DIR, argValue, ensureDir, readProjectFiles, writeJson } from "./lib.mjs";

const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_MODEL || "gpt-5";
const tag = argValue("tag", "iter");
const outDir = argValue("out-dir", REVIEW_DIR);
const checksPath = argValue("checks", path.join(outDir, `${tag}-checks.json`));
await ensureDir(outDir);

const [checksRaw, { html, css }] = await Promise.all([
  fs.readFile(checksPath, "utf8").catch(() => "{}"),
  readProjectFiles()
]);
const checks = JSON.parse(checksRaw || "{}");

const desktopShot = path.join(outDir, `${tag}-desktop-full.png`);
const mobileShot = path.join(outDir, `${tag}-mobile-full.png`);

function dataUrlFromImage(file) {
  return fs
    .readFile(file)
    .then((buf) => `data:image/png;base64,${buf.toString("base64")}`)
    .catch(() => null);
}

const [desktopDataUrl, mobileDataUrl] = await Promise.all([
  dataUrlFromImage(desktopShot),
  dataUrlFromImage(mobileShot)
]);

if (!apiKey) {
  const fallback = {
    summary: "No OPENAI_API_KEY set. Critic step skipped.",
    score: 0,
    changes: []
  };
  const out = path.join(outDir, `${tag}-suggestions.json`);
  await writeJson(out, fallback);
  console.log(`Wrote placeholder suggestions: ${out}`);
  process.exit(0);
}

const system = `You are a harsh web design critic. Default stance: current output is bad until proven.
Return only valid JSON with this exact shape:
{
  "summary": "string",
  "score": 0-100,
  "changes": [
    {"file":"styles.css|index.html","find":"exact substring","replace":"exact replacement","reason":"short"}
  ]
}
Rules:
- Maximum 10 changes.
- Use exact find/replace operations that are directly applicable.
- Prioritize fixing overflow, clipping, hierarchy, rhythm, and mobile readability.
- Only edit index.html and styles.css.
- If no safe changes, return empty changes array.`;

const userBlocks = [
  {
    type: "input_text",
    text: [
      "Current checks report:",
      JSON.stringify(checks, null, 2),
      "",
      "Current index.html:",
      html,
      "",
      "Current styles.css:",
      css
    ].join("\n")
  }
];

if (desktopDataUrl) {
  userBlocks.push({ type: "input_text", text: "Desktop screenshot:" });
  userBlocks.push({ type: "input_image", image_url: desktopDataUrl });
}
if (mobileDataUrl) {
  userBlocks.push({ type: "input_text", text: "Mobile screenshot:" });
  userBlocks.push({ type: "input_image", image_url: mobileDataUrl });
}

const resp = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model,
    input: [
      { role: "system", content: [{ type: "input_text", text: system }] },
      { role: "user", content: userBlocks }
    ]
  })
});

if (!resp.ok) {
  const txt = await resp.text();
  throw new Error(`Critic API failed: ${resp.status} ${txt}`);
}

const json = await resp.json();
const rawText = json.output_text || "";
let parsed;
try {
  parsed = JSON.parse(rawText);
} catch {
  parsed = { summary: "Could not parse critic JSON", score: 0, changes: [] };
}

if (!Array.isArray(parsed.changes)) parsed.changes = [];
parsed.changes = parsed.changes
  .filter((c) => c && (c.file === "styles.css" || c.file === "index.html"))
  .slice(0, 10);

const outPath = path.join(outDir, `${tag}-suggestions.json`);
await writeJson(outPath, parsed);
console.log(`Wrote critic suggestions: ${outPath}`);
