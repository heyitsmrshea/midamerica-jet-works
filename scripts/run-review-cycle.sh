#!/bin/zsh
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LOOP_DIR="$ROOT/review/redesign-loop"
ITERATIONS_DIR="$LOOP_DIR/iterations"

mkdir -p "$ITERATIONS_DIR"

last_num=$(find "$ITERATIONS_DIR" -maxdepth 1 -type d -name 'iteration-*' | sed 's#^.*/iteration-##' | sort | tail -n 1)

if [[ -z "${last_num:-}" ]]; then
  next_num="01"
else
  next_num=$(printf "%02d" $((10#$last_num + 1)))
fi

ITER_DIR="$ITERATIONS_DIR/iteration-$next_num"
mkdir -p "$ITER_DIR"

cat > "$ITER_DIR/critique.md" <<EOF
# Iteration $next_num Critique

Date: $(date +"%Y-%m-%d %H:%M:%S")

## Screenshot Set

See \`manifest.txt\` in this folder.

## Blockers

- 
- 
- 
- 
- 

## Acceptable But Weak

- 
- 
- 

## Working

- 
- 
- 

## Next Changes

1. 
2. 
3. 
4. 
5. 

## Confidence check

- What part of this direction am I overvaluing because I built it?
- What would a top-tier studio cut or redesign immediately?
- If all animations were removed, what would still feel special?
- What still looks derivative or templated?
- Why is this not ready yet?
EOF

cat > "$ITER_DIR/checklist.md" <<EOF
# Iteration $next_num Checklist

- Hero composition reviewed on desktop across all 6 pages.
- Hero composition reviewed on mobile across all 6 pages.
- Full-page screenshots reviewed on desktop across all 6 pages.
- Full-page screenshots reviewed on mobile across all 6 pages.
- Header/nav spacing is consistent across pages.
- Type scale is consistent across pages.
- Image crops do not look accidental in primary frames.
- Empty space reads deliberate, not broken.
- Motion is not compensating for weak static composition.
- Page-to-page differentiation is visible in still frames.
- No section feels obviously templated or placeholder-only.
- Mobile looks authored rather than adapted.
EOF

cat > "$ITER_DIR/scorecard.md" <<EOF
# Iteration $next_num Scorecard

Scale: 1=reject, 2=weak, 3=serviceable, 4=presentation-grade, 5=exceptional
Minimum passing score per category per page: 4

hero.home: 0
hero.services: 0
hero.capabilities: 0
hero.ownership: 0
hero.about: 0
hero.contact: 0

section.home: 0
section.services: 0
section.capabilities: 0
section.ownership: 0
section.about: 0
section.contact: 0

contrast.home: 0
contrast.services: 0
contrast.capabilities: 0
contrast.ownership: 0
contrast.about: 0
contrast.contact: 0

mobile.home: 0
mobile.services: 0
mobile.capabilities: 0
mobile.ownership: 0
mobile.about: 0
mobile.contact: 0

differentiation.home: 0
differentiation.services: 0
differentiation.capabilities: 0
differentiation.ownership: 0
differentiation.about: 0
differentiation.contact: 0

flag.unreadable_text: no
flag.empty_primary_frame: no
flag.template_duplication: no
flag.mobile_stack_failure: no
flag.crop_or_clip_failure: no

summary.lowest_score: 0
summary.pages_below_4: 0
summary.auto_fail_flags: 0
summary.ready_threshold_met: no
EOF

cat > "$ITER_DIR/status.txt" <<EOF
Iteration: $next_num
Screenshots: 0
Structural lint: pending
Review boards: pending
Critique required: yes
Scorecard complete: no
Minimum score >= 4: unknown
Automatic fail flags: unknown
Review complete: no
Open blockers: unknown
Ready to present: no
EOF

"$ROOT/scripts/lint-site-consistency.sh"
perl -0pi -e "s/Structural lint: pending/Structural lint: pass/" "$ITER_DIR/status.txt"

"$ROOT/scripts/capture-visual-qa.sh" "$ITER_DIR"
"$ROOT/scripts/build-review-boards.py" "$ITER_DIR"
perl -0pi -e "s/Review boards: pending/Review boards: pass/" "$ITER_DIR/status.txt"

screenshots=$(find "$ITER_DIR" -maxdepth 1 -name '*.png' ! -name 'board-*' | wc -l | tr -d ' ')
perl -0pi -e "s/Screenshots: .*/Screenshots: $screenshots/" "$ITER_DIR/status.txt"

echo "Created review cycle in $ITER_DIR"
