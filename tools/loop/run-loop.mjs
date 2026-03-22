import path from "node:path";
import { spawn } from "node:child_process";
import { REVIEW_DIR, STATE_PATH, argValue, ensureDir, readJsonSafe, stamp, targetUrlFromArg, writeJson } from "./lib.mjs";

const iterations = Number(argValue("iterations", "4"));
const outDir = argValue("out-dir", REVIEW_DIR);
const url = targetUrlFromArg();
const runId = stamp();
const knownIssuesPath = argValue("known-issues", path.join("review", "known-issues.txt"));

await ensureDir(outDir);
const prev = await readJsonSafe(STATE_PATH, { runs: [] });

function runNode(script, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${path.basename(script)} exited with code ${code}`));
    });
  });
}

const runRecord = {
  id: runId,
  url,
  iterations,
  startedAt: new Date().toISOString(),
  tags: []
};

for (let i = 1; i <= iterations; i++) {
  const tag = `${runId}-iter-${String(i).padStart(2, "0")}`;
  runRecord.tags.push(tag);
  console.log(`\n=== Design Loop Iteration ${i}/${iterations} (${tag}) ===`);

  await runNode(path.join("tools", "loop", "generate-prompt.mjs"), [
    `--out-dir=${outDir}`,
    `--out=${path.join(outDir, `${tag}-prompt.txt`)}`,
    `--known-issues=${knownIssuesPath}`
  ]);
  await runNode(path.join("tools", "loop", "capture.mjs"), [`--url=${url}`, `--out-dir=${outDir}`, `--tag=${tag}`]);
  await runNode(path.join("tools", "loop", "checks.mjs"), [`--url=${url}`, `--out-dir=${outDir}`, `--tag=${tag}`]);
  await runNode(path.join("tools", "loop", "critic.mjs"), [`--out-dir=${outDir}`, `--tag=${tag}`, `--checks=${path.join(outDir, `${tag}-checks.json`)}`]);
  await runNode(path.join("tools", "loop", "apply.mjs"), [`--out-dir=${outDir}`, `--tag=${tag}`, `--suggestions=${path.join(outDir, `${tag}-suggestions.json`)}`]);
}

runRecord.finishedAt = new Date().toISOString();
prev.runs.push(runRecord);
await writeJson(STATE_PATH, prev);

console.log(`\nLoop complete. Artifacts saved in: ${outDir}`);
