#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT/.pages-dist"

rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR/site-v2"

cp -R "$ROOT/site/." "$OUT_DIR/"
cp -R "$ROOT/site-v2/." "$OUT_DIR/site-v2/"

echo "Prepared Pages artifact at $OUT_DIR"
