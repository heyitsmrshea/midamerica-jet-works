#!/bin/zsh
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
OUT_DIR="${1:-$ROOT/review/visual-qa/latest}"
PORT="${PORT:-4173}"
BASE_URL="http://127.0.0.1:$PORT"
PLAYWRIGHT="${PLAYWRIGHT:-}"

if [[ -z "$PLAYWRIGHT" ]]; then
  if command -v playwright >/dev/null 2>&1; then
    PLAYWRIGHT="$(command -v playwright)"
  elif [[ -x "$ROOT/node_modules/.bin/playwright" ]]; then
    PLAYWRIGHT="$ROOT/node_modules/.bin/playwright"
  fi
fi

if [[ -z "$PLAYWRIGHT" ]]; then
  echo "playwright CLI is required for visual capture" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
find "$OUT_DIR" -maxdepth 1 -name '*.png' -delete
find "$OUT_DIR" -maxdepth 1 -name '*.webm' -delete
MANIFEST="$OUT_DIR/manifest.txt"
: > "$MANIFEST"
SERVER_PID=""

cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

if ! curl -s "http://127.0.0.1:$PORT/index.html" >/dev/null 2>&1; then
  (
    cd "$SITE"
    python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1
  ) &
  SERVER_PID=$!
  sleep 2
fi

run_capture() {
  local device="$1"
  local url="$2"
  local output="$3"

  if [[ "$device" == "desktop" ]]; then
    /usr/bin/perl -e 'alarm shift @ARGV; exec @ARGV' 120 \
      "$PLAYWRIGHT" screenshot \
      --wait-for-timeout=700 \
      --device="Desktop Chrome HiDPI" \
      --viewport-size="1440,1400" \
      "$url" \
      "$output"
  else
    /usr/bin/perl -e 'alarm shift @ARGV; exec @ARGV' 120 \
      "$PLAYWRIGHT" screenshot \
      --wait-for-timeout=700 \
      --device="iPhone 13" \
      "$url" \
      "$output"
  fi

  echo "$(basename "$output") :: $url" >> "$MANIFEST"
  echo "Captured $(basename "$output")"
}

run_fullpage_capture() {
  local device="$1"
  local url="$2"
  local output="$3"

  if [[ "$device" == "desktop" ]]; then
    /usr/bin/perl -e 'alarm shift @ARGV; exec @ARGV' 180 \
      "$PLAYWRIGHT" screenshot \
      --wait-for-timeout=900 \
      --device="Desktop Chrome HiDPI" \
      --viewport-size="1440,1400" \
      --full-page \
      "$url" \
      "$output"
  else
    /usr/bin/perl -e 'alarm shift @ARGV; exec @ARGV' 180 \
      "$PLAYWRIGHT" screenshot \
      --wait-for-timeout=900 \
      --device="iPhone 13" \
      --full-page \
      "$url" \
      "$output"
  fi

  echo "$(basename "$output") :: $url" >> "$MANIFEST"
  echo "Captured $(basename "$output")"
}

pages=(
  "index.html:home:hero:pillars:audience"
  "services.html:services:hero:signature-grid:response"
  "capabilities.html:capabilities:hero:systems:facility"
  "ownership.html:ownership:hero:owners:departments"
  "about.html:about:hero:values:story"
  "contact.html:contact:hero:request:location"
)

for entry in "${pages[@]}"; do
  IFS=":" read -r file slug anchor1 anchor2 anchor3 <<< "$entry"
  for device in desktop mobile; do
    run_capture "$device" "$BASE_URL/$file?capture=1#$anchor1" "$OUT_DIR/${slug}-${device}-${anchor1}.png"
    run_capture "$device" "$BASE_URL/$file?capture=1#$anchor2" "$OUT_DIR/${slug}-${device}-${anchor2}.png"
    run_capture "$device" "$BASE_URL/$file?capture=1#$anchor3" "$OUT_DIR/${slug}-${device}-${anchor3}.png"
    run_fullpage_capture "$device" "$BASE_URL/$file?capture=1" "$OUT_DIR/${slug}-${device}-full.png"
  done
done

count=$(find "$OUT_DIR" -maxdepth 1 -name '*.png' | wc -l | tr -d ' ')
echo "Expected screenshots: 48" >> "$MANIFEST"
echo "Actual screenshots: $count" >> "$MANIFEST"

if [[ "$count" != "48" ]]; then
  echo "Visual capture incomplete: expected 48 screenshots, got $count" >&2
  exit 1
fi

echo "Captured $count screenshots into $OUT_DIR"
