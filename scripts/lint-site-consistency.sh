#!/bin/zsh
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SITE="$ROOT/site"
RG="$(command -v rg || true)"

if [[ -z "$RG" ]]; then
  echo "FAIL: rg is required for structural lint" >&2
  exit 1
fi

pages=(
  "index.html:hero,pillars,audience,close:home"
  "services.html:hero,signature-grid,response,close:services"
  "capabilities.html:hero,systems,facility,close:capabilities"
  "ownership.html:hero,owners,departments,close:ownership"
  "about.html:hero,values,story,close:about"
  "contact.html:hero,request,location,close:contact"
)

fail() {
  echo "FAIL: $1" >&2
  exit 1
}

for entry in "${pages[@]}"; do
  IFS=":" read -r file anchors slug <<< "$entry"
  path="$SITE/$file"

  [[ -f "$path" ]] || fail "Missing page $file"
  "$RG" -q '<link rel="stylesheet" href="./styles.css"' "$path" || fail "$file missing styles.css"
  "$RG" -q '<script src="./script.js"></script>' "$path" || fail "$file missing script.js"
  "$RG" -q 'class="page-transition"' "$path" || fail "$file missing page transition shell"
  "$RG" -q 'class="progress"' "$path" || fail "$file missing progress bar"
  "$RG" -q 'class="topbar"' "$path" || fail "$file missing topbar"
  "$RG" -q "data-page=\"$slug\"" "$path" || fail "$file missing body data-page=\"$slug\""
  "$RG" -q 'class="brand"' "$path" || fail "$file missing brand block"
  "$RG" -q 'Request Service' "$path" || fail "$file missing Request Service CTA"
  "$RG" -q 'class="site-footer"' "$path" || fail "$file missing site footer"

  h1_count=$("$RG" -c "<h1" "$path")
  [[ "$h1_count" == "1" ]] || fail "$file has $h1_count h1 elements"

  IFS="," read -r -A anchor_list <<< "$anchors"
  for anchor in "${anchor_list[@]}"; do
    "$RG" -q "id=\"$anchor\"" "$path" || fail "$file missing capture anchor #$anchor"
  done

  if "$RG" -q 'style=' "$path"; then
    fail "$file still contains inline styles"
  fi
  "$RG" -q 'fonts.googleapis.com' "$path" || fail "$file missing Google Fonts preconnect/include"
  "$RG" -q 'fonts.gstatic.com' "$path" || fail "$file missing Google Fonts gstatic preconnect"
done

echo "PASS: structural site consistency checks completed"
