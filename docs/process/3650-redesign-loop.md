# Redesign Loop

This folder exists so visual review becomes mandatory, repeatable, and difficult to fake.

## Rule

No "done" claim is valid without:

- a full screenshot set
- a written critique
- a next-step plan

## One-command cycle

Run:

```bash
./run-review-cycle.sh
```

That creates:

- `48 screenshots`
- `manifest.txt`
- `critique.md`
- `status.txt`

inside a new `iteration-XX/` folder under `review/redesign-loop/iterations/`.

## Screenshot standard

Each cycle captures:

- `6 pages`
- `3 anchors per page`
- `desktop + mobile`

Total:

- `48 screenshots`

## Critique standard

The critique must begin with failures, not praise.

Minimum:

- `5 failures`
- `3 acceptable but weak items`
- `3 genuinely working items`
- `5 concrete next changes`

## Why this exists

The main failure mode is believing the intended composition instead of the rendered composition.

This process forces reality back into the loop.
