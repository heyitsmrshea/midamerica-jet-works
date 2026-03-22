# Automated Design Loop

This loop is render-first and critic-driven:

1. Capture browser screenshots (`desktop`, `tablet`, `mobile`)
2. Run hard checks (overflow, clipped text, overlap)
3. Ask an LLM critic for exact `find/replace` edits
4. Apply edits to `index.html` and `styles.css`
5. Repeat for N iterations

Artifacts are written to `review/automation/`.

## Setup

```bash
npm install
```

Optional but recommended for critic/autofix:

```bash
export OPENAI_API_KEY=...
export OPENAI_MODEL=gpt-5
```

Without `OPENAI_API_KEY`, the loop still captures screenshots/checks but skips actual AI edits.

## Run

```bash
npm run design:loop -- --iterations=4
```

Useful flags:

- `--url` (default is local `index.html` via `file://`)
- `--out-dir` (default `review/automation`)
- `--iterations` (default `4`)
- `--known-issues` (default `review/known-issues.txt`)

The loop now auto-generates a prompt file at the start of each iteration:

- `review/automation/<run-id>-iter-XX-prompt.txt`

## Individual steps

```bash
npm run design:prompt
npm run design:capture -- --tag=manual
npm run design:checks -- --tag=manual
npm run design:critic -- --tag=manual --checks=review/automation/manual-checks.json
npm run design:apply -- --tag=manual --suggestions=review/automation/manual-suggestions.json
```

Generate a Codex-ready prompt file:

```bash
npm run design:prompt -- --known-issues=review/known-issues.txt
```

Default output:

- `review/automation/codex-loop-prompt.txt`
