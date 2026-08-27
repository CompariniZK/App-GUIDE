#!/usr/bin/env bash
# Build the Boussole web app for Netlify.
#
# Problem: Expo puts vector-icon fonts under a deep path that includes a folder
# literally named "node_modules":
#   assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/*.ttf
# Netlify strips folders named "node_modules" on deploy, so the icon font 404s.
#
# Fix: flatten every icon font into a shallow dist/fonts/ folder (short path, no
# node_modules, no "@" segments) and rewrite the bundled font paths to match.
set -e
cd "$(dirname "$0")/.."

echo "==> Exporting web build..."
rm -rf dist
npx expo export --platform web

DEEP="assets/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts"
if [ -d "dist/$DEEP" ]; then
  echo "==> Flattening icon fonts -> dist/fonts/"
  mkdir -p dist/fonts
  cp "dist/$DEEP"/*.ttf dist/fonts/

  echo "==> Rewriting font paths in the JS bundle -> fonts/"
  for js in dist/_expo/static/js/web/*.js; do
    sed -i "s#$DEEP/#fonts/#g" "$js"
  done
  echo "==> Fonts flattened: $(ls dist/fonts/*.ttf | wc -l) files"
else
  echo "!! Expected font folder not found — Expo layout may have changed."
fi

echo "==> Build ready. Drag the dist/ folder to Netlify to deploy."
