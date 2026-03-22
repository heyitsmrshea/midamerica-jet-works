# Hard Enforcement

This review loop is not advisory. It is a gate.

## Minimum Evidence Per Iteration

- 48 screenshots total.
- 6 pages.
- 2 devices.
- 3 anchored frames per page.
- 1 full-page render per page and device.
- 6 review boards total:
  - desktop heroes
  - mobile heroes
  - desktop sections
  - mobile sections
  - desktop full pages
  - mobile full pages
- Structural lint must pass before capture begins.

## Required Review Artifacts

- `critique.md`
- `checklist.md`
- `scorecard.md`
- `status.txt`
- `manifest.txt`

## Blocking Rules

- A pass cannot be marked ready if any blocker remains open.
- `status.txt` must explicitly include:
  - `Screenshots: 48`
  - `Structural lint: pass`
  - `Review boards: pass`
  - `Scorecard complete: yes`
  - `Minimum score >= 4: yes|no`
  - `Automatic fail flags: N`
  - `Review complete: yes`
  - `Open blockers: N`
  - `Ready to present: yes|no`
- Placeholder bullets in `critique.md`, unchecked checklist items, or zeroed scorecard entries invalidate the pass.

## What Counts As A Blocker

- Accidental empty space in a primary frame.
- Inconsistent headline scale or wrapping between pages.
- Inconsistent header or nav behavior.
- Broken or awkward image crops.
- Unreadable text or weak text/background contrast.
- Motion that overrides or damages the composed layout.
- Mobile layouts that feel adapted instead of designed.
- Any page that materially drops below the quality of the others.

## Automatic Fail Flags

Any `yes` below is an automatic fail:

- `flag.unreadable_text`
- `flag.empty_primary_frame`
- `flag.template_duplication`
- `flag.mobile_stack_failure`
- `flag.crop_or_clip_failure`

## Scoring Threshold

- Every page must score `4` or `5` in:
  - `hero`
  - `section`
  - `contrast`
  - `mobile`
  - `differentiation`
- If any page/category is below `4`, the iteration is not ready.
