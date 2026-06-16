#!/usr/bin/env bash
# Bygger en signeret Samsung Tizen-pakke (.wgt) i dist/.
# Kræver Tizen Studio CLI + en author-certifikatprofil (se docs/INSTALL-SAMSUNG.md).
#
# Brug:  ./scripts/build-tizen.sh [profilnavn]
set -e
cd "$(dirname "$0")/.."

PROFILE="${1:-MyTVProfile}"

if ! command -v tizen >/dev/null 2>&1; then
  echo "FEJL: 'tizen' CLI blev ikke fundet."
  echo "Installer Tizen Studio og tilføj .../tizen-studio/tools/ide/bin til din PATH."
  exit 1
fi

echo "==> Samler Tizen-build…"
node scripts/assemble.js tizen

mkdir -p dist
echo "==> Bygger web-app…"
tizen build-web -- build/tizen -out build/tizen/.buildResult

echo "==> Pakker og signerer .wgt (profil: $PROFILE)…"
tizen package -t wgt -s "$PROFILE" -- build/tizen/.buildResult -o dist

echo
echo "Færdig. Pakke(r) i dist/:"
ls -1 dist/*.wgt 2>/dev/null || true
echo
echo "Installer på dit Samsung TV (Developer Mode skal være slået til):"
echo "  sdb connect <TV-IP>"
echo "  tizen install -n dist/MyTV.wgt -t <device-id>"
