# Review Rubric

This rubric is intentionally severe. The goal is to reject weak work early.

## Score Scale

- `1`: unacceptable, actively harmful to the pitch
- `2`: weak, obvious redesign required
- `3`: serviceable, still not presentation-grade
- `4`: presentation-grade
- `5`: exceptional

## Required Categories

Each iteration must score every page in these categories:

- `hero`
- `section`
- `contrast`
- `mobile`
- `differentiation`

Pages:

- `home`
- `firm`
- `solutions`
- `transactions`
- `leadership`
- `contact`

## Automatic Fail Flags

Any `yes` below is an automatic failure:

- `flag.unreadable_text`
- `flag.empty_primary_frame`
- `flag.template_duplication`
- `flag.mobile_stack_failure`
- `flag.crop_or_clip_failure`

## Ready Threshold

An iteration is only ready when:

- every category score for every page is `4` or `5`
- every automatic fail flag is `no`
- `Open blockers: 0`

If any score is below `4`, the iteration is not ready.
