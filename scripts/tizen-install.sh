#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TIZEN="${TIZEN_CLI:-$HOME/tizen-studio/tools/ide/bin/tizen}"
SDB="${SDB_CLI:-$HOME/tizen-studio/tools/sdb}"
PROFILE="${TIZEN_PROFILE:-MyHomeGamesTV}"
BUILD="$ROOT/.buildResult"

if [[ ! -x "$TIZEN" ]]; then
  echo "Tizen CLI not found at $TIZEN"
  echo "Install Tizen Studio and TV extensions, or set TIZEN_CLI."
  exit 1
fi

rm -rf "$BUILD"
mkdir -p "$BUILD"
cp "$ROOT/index.html" "$ROOT/config.xml" "$ROOT/icon.png" "$BUILD/"
cp -R "$ROOT/css" "$ROOT/js" "$BUILD/"

echo "Packaging with certificate profile: $PROFILE"
"$TIZEN" package -t wgt -s "$PROFILE" -- "$BUILD"

WGT="$(find "$BUILD" -maxdepth 1 -name '*.wgt' | head -n 1)"
if [[ -z "$WGT" ]]; then
  echo "No .wgt was created in $BUILD"
  exit 1
fi

SAFE_WGT="$BUILD/GuessTheNote.wgt"
if [[ "$WGT" != "$SAFE_WGT" ]]; then
  mv "$WGT" "$SAFE_WGT"
  WGT="$SAFE_WGT"
fi

echo "Created $WGT"

if [[ -z "${TV_IP:-}" ]]; then
  echo
  echo "To install on the TV:"
  echo "  1. Enable Developer Mode on the TV (Apps, enter 12345)"
  echo "  2. Set the Host PC IP to this computer"
  echo "  3. Run: TV_IP=192.168.x.x $0"
  exit 0
fi

echo "Connecting to $TV_IP"
"$SDB" connect "$TV_IP"
"$SDB" devices
"$TIZEN" install -n "$(basename "$WGT")" -- "$BUILD"
echo "Installed. Open Indovina la nota from the TV apps list."
