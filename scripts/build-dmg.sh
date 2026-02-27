#!/bin/bash

APP_NAME="Renovo"
APP_PATH="./build/bin/Renovo.app"
DMG_NAME="Renovo-Installer.dmg"
OUT_DIR="./build/dist"

mkdir -p $OUT_DIR
rm -f "$OUT_DIR/$DMG_NAME"

echo "🚀 Creating Disk Image for $APP_NAME..."

create-dmg \
  --volname "$APP_NAME Installer" \
  --window-pos 200 120 \
  --window-size 600 400 \
  --icon-size 120 \
  --icon "$APP_NAME.app" 150 190 \
  --hide-extension "$APP_NAME.app" \
  --app-drop-link 450 190 \
  "$OUT_DIR/$DMG_NAME" \
  "$APP_PATH"

echo "✅ Done: $OUT_DIR/$DMG_NAME"
