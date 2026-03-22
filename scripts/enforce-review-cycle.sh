#!/bin/zsh
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

ITER_DIR="${1:-}"

if [[ -z "$ITER_DIR" ]]; then
  echo "Usage: ./enforce-review-cycle.sh /path/to/iteration-dir" >&2
  exit 1
fi

[[ -d "$ITER_DIR" ]] || { echo "Missing iteration dir: $ITER_DIR" >&2; exit 1; }

critique="$ITER_DIR/critique.md"
checklist="$ITER_DIR/checklist.md"
scorecard="$ITER_DIR/scorecard.md"
status_file="$ITER_DIR/status.txt"
manifest="$ITER_DIR/manifest.txt"

[[ -f "$critique" ]] || { echo "Missing critique.md" >&2; exit 1; }
[[ -f "$checklist" ]] || { echo "Missing checklist.md" >&2; exit 1; }
[[ -f "$scorecard" ]] || { echo "Missing scorecard.md" >&2; exit 1; }
[[ -f "$status_file" ]] || { echo "Missing status.txt" >&2; exit 1; }
[[ -f "$manifest" ]] || { echo "Missing manifest.txt" >&2; exit 1; }

for board in \
  board-heroes-desktop.png \
  board-heroes-mobile.png \
  board-sections-desktop.png \
  board-sections-mobile.png \
  board-fullpages-desktop.png \
  board-fullpages-mobile.png; do
  [[ -f "$ITER_DIR/$board" ]] || { echo "Missing review board: $board" >&2; exit 1; }
done

png_count=$(find "$ITER_DIR" -maxdepth 1 -name '*.png' ! -name 'board-*' | wc -l | tr -d ' ')
[[ "$png_count" == "48" ]] || { echo "Expected 48 screenshots, found $png_count" >&2; exit 1; }

grep -q '^Screenshots: 48$' "$status_file" || { echo "status.txt does not confirm 48 screenshots" >&2; exit 1; }
grep -q '^Structural lint: pass$' "$status_file" || { echo "status.txt does not show structural lint pass" >&2; exit 1; }
grep -q '^Review boards: pass$' "$status_file" || { echo "status.txt does not show review boards pass" >&2; exit 1; }
grep -q '^Scorecard complete: yes$' "$status_file" || { echo "Scorecard is not marked complete" >&2; exit 1; }
grep -q '^Minimum score >= 4: ' "$status_file" || { echo "Minimum score status missing" >&2; exit 1; }
grep -q '^Automatic fail flags: ' "$status_file" || { echo "Automatic fail flag count missing" >&2; exit 1; }
grep -q '^Review complete: yes$' "$status_file" || { echo "Review is not marked complete" >&2; exit 1; }
grep -q '^Ready to present: ' "$status_file" || { echo "Ready verdict missing" >&2; exit 1; }
grep -q '^Open blockers: ' "$status_file" || { echo "Open blocker count missing" >&2; exit 1; }

blockers=$(grep '^Open blockers: ' "$status_file" | awk -F': ' '{print $2}')
ready=$(grep '^Ready to present: ' "$status_file" | awk -F': ' '{print $2}')
minimum_score=$(grep '^Minimum score >= 4: ' "$status_file" | awk -F': ' '{print $2}')
auto_fail_flags=$(grep '^Automatic fail flags: ' "$status_file" | awk -F': ' '{print $2}')

if rg -n '^- $|^[0-9]+\. $|\[ \]' "$critique" "$checklist" >/dev/null; then
  echo "Review artifacts still contain placeholders" >&2
  exit 1
fi

pages=(home services capabilities ownership about contact)
categories=(hero section contrast mobile differentiation)

for category in "${categories[@]}"; do
  for page in "${pages[@]}"; do
    grep -q "^$category\\.$page: [1-5]$" "$scorecard" || {
      echo "Missing or invalid score for $category.$page" >&2
      exit 1
    }
  done
done

for flag in unreadable_text empty_primary_frame template_duplication mobile_stack_failure crop_or_clip_failure; do
  grep -q "^flag\\.$flag: \\(yes\\|no\\)$" "$scorecard" || {
    echo "Missing or invalid flag flag.$flag" >&2
    exit 1
  }
done

grep -q '^summary.lowest_score: [1-5]$' "$scorecard" || { echo "Invalid summary.lowest_score" >&2; exit 1; }
grep -q '^summary.pages_below_4: [0-9][0-9]*$' "$scorecard" || { echo "Invalid summary.pages_below_4" >&2; exit 1; }
grep -q '^summary.auto_fail_flags: [0-9][0-9]*$' "$scorecard" || { echo "Invalid summary.auto_fail_flags" >&2; exit 1; }
grep -q '^summary.ready_threshold_met: \(yes\|no\)$' "$scorecard" || { echo "Invalid summary.ready_threshold_met" >&2; exit 1; }

if rg -n '^(hero|section|contrast|mobile|differentiation)\.[a-z]+: 0$|^summary\.lowest_score: 0$' "$scorecard" >/dev/null; then
  echo "Scorecard still contains placeholder zeroes in required scored fields" >&2
  exit 1
fi

if [[ "$ready" == "yes" && "$blockers" != "0" ]]; then
  echo "Ready verdict cannot be yes with open blockers" >&2
  exit 1
fi

if [[ "$ready" == "yes" && "$minimum_score" != "yes" ]]; then
  echo "Ready verdict cannot be yes if minimum score threshold is not met" >&2
  exit 1
fi

if [[ "$ready" == "yes" && "$auto_fail_flags" != "0" ]]; then
  echo "Ready verdict cannot be yes with automatic fail flags" >&2
  exit 1
fi

echo "PASS: enforced review cycle is internally consistent for $ITER_DIR"
