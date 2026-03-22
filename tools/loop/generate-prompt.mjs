import fs from "node:fs/promises";
import path from "node:path";
import { ROOT, REVIEW_DIR, argValue, ensureDir } from "./lib.mjs";

const templatePath = path.join(ROOT, "tools", "loop", "prompt-template.txt");
const outDir = argValue("out-dir", REVIEW_DIR);
const outPath = argValue("out", path.join(outDir, "codex-loop-prompt.txt"));
const knownIssuesPath = argValue("known-issues", path.join(ROOT, "review", "known-issues.txt"));

await ensureDir(path.dirname(outPath));

const template = await fs.readFile(templatePath, "utf8");
let knownIssues = "";
try {
  knownIssues = (await fs.readFile(knownIssuesPath, "utf8")).trim();
} catch {
  knownIssues = "";
}

const knownIssuesBlock = knownIssues
  ? `Current known issues:\n${knownIssues
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0)
      .map((l) => (l.trim().startsWith("-") ? l.trim() : `- ${l.trim()}`))
      .join("\n")}`
  : "Current known issues:\n- (none provided)";

const output = template
  .replaceAll("{{ROOT}}", ROOT)
  .replaceAll("{{KNOWN_ISSUES_BLOCK}}", knownIssuesBlock);

await fs.writeFile(outPath, `${output}\n`, "utf8");
console.log(`Prompt generated: ${outPath}`);
