# Visual QA

This folder is for enforced render validation, not ad hoc spot checks.

## Minimum Standard

- `48 screenshots` per run
- `6 pages`
- `3 anchors per page`
- `desktop + mobile`
- `1 full-page render per page and device`

## Capture Script

Run:

```bash
./capture-visual-qa.sh
```

Requirements:

- local server running from `site/` on `http://127.0.0.1:4173`
- `playwright screenshot` CLI available

Output:

- screenshots are written to `review/visual-qa/latest/`

## Why This Exists

The failure mode is trusting the intended composition instead of the rendered composition.

This process forces review against the actual render across pages, anchors, and breakpoints.
