#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist"
VERSION="$(python3 - <<'PY'
import json
from pathlib import Path
manifest = json.loads(Path("manifest.json").read_text())
print(manifest["version"])
PY
)"

ZIP_NAME="my-notes-extension-v${VERSION}.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"

cd "$ROOT_DIR"
zip -qr "$ZIP_PATH" \
  manifest.json \
  background.js \
  sidepanel.html \
  sidepanel.css \
  sidepanel.js \
  icons

echo "Created: $ZIP_PATH"
