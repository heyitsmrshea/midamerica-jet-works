import fs from "node:fs/promises";
import path from "node:path";
import { REVIEW_DIR, ROOT, argValue, writeJson } from "./lib.mjs";

const tag = argValue("tag", "iter");
const outDir = argValue("out-dir", REVIEW_DIR);
const suggestionsPath = argValue("suggestions", path.join(outDir, `${tag}-suggestions.json`));

const suggestionsRaw = await fs.readFile(suggestionsPath, "utf8");
const suggestions = JSON.parse(suggestionsRaw);

const files = {
  "index.html": path.join(ROOT, "index.html"),
  "styles.css": path.join(ROOT, "styles.css")
};

const contents = {
  "index.html": await fs.readFile(files["index.html"], "utf8"),
  "styles.css": await fs.readFile(files["styles.css"], "utf8")
};

const results = [];
for (const change of suggestions.changes || []) {
  const { file, find, replace, reason } = change;
  if (!files[file] || typeof find !== "string" || typeof replace !== "string" || !find.length) {
    results.push({ ok: false, file, reason: "invalid-change-shape" });
    continue;
  }
  if (!contents[file].includes(find)) {
    results.push({ ok: false, file, reason: "find-not-found", note: reason || "" });
    continue;
  }
  contents[file] = contents[file].replace(find, replace);
  results.push({ ok: true, file, reason: reason || "" });
}

await Promise.all([
  fs.writeFile(files["index.html"], contents["index.html"], "utf8"),
  fs.writeFile(files["styles.css"], contents["styles.css"], "utf8")
]);

const reportPath = path.join(outDir, `${tag}-apply-report.json`);
await writeJson(reportPath, {
  appliedAt: new Date().toISOString(),
  suggestionsPath,
  applied: results
});
console.log(`Wrote apply report: ${reportPath}`);
