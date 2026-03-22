# MidAmerica

This workspace is a clean starting point for the next website.

It combines the most reusable workflow pieces from `3650` and `DarkForge` without copying over their client-specific sites, assets, screenshot archives, or installed dependencies.

## What is here

- `index.html`, `styles.css`, `script.js`: a minimal root prototype we can start shaping immediately
- `tools/loop/`: the automated design loop copied from `3650 Capital`
- `scripts/`: the stricter multi-page visual review cycle copied from `3650`
- `tools/forge/`: browser capture scripts copied from `DarkForge` as reference tooling
- `docs/process/`: the strongest process notes pulled forward from both projects
- `review/`: empty output folders ready for captures and critique artifacts

## How to start

Install dependencies:

```bash
npm install
```

Serve the root prototype:

```bash
npm run serve
```

Run the root design loop:

```bash
npm run design:loop -- --iterations=3
```

## Notes

- The `tools/loop/` workflow operates on the root `index.html` and `styles.css`.
- The scripts in `scripts/` come from the stricter `3650` multi-page review system and assume a future `site/` scaffold with multiple HTML pages and capture anchors.
- The scripts in `tools/forge/` are copied as references and still need page-list or URL edits before they match MidAmerica's eventual structure.
- `scripts/build-review-boards.py` requires Pillow: `python3 -m pip install pillow`
