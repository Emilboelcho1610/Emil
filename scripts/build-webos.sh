#!/usr/bin/env bash
# Bygger en installerbar LG webOS-pakke (.ipk) i dist/.
# Kræver webOS CLI:  npm install -g @webosose/ares-cli
set -e
cd "$(dirname "$0")/.."

echo "==> Samler webOS-build…"
node scripts/assemble.js webos

mkdir -p dist
echo "==> Pakker .ipk…"
ares-package build/webos --outdir dist --no-tmp

echo
echo "Færdig. Pakke(r) i dist/:"
ls -1 dist/*.ipk 2>/dev/null || true
echo
echo "Installer på dit LG TV (Developer Mode skal være slået til):"
echo "  ares-setup-device          # tilføj dit TV (engang)"
echo "  ares-install --device <navn> dist/com.emil.mytv_*.ipk"
echo "  ares-launch  --device <navn> com.emil.mytv"
