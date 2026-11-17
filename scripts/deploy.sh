#!/usr/bin/env bash
# Publica el prototipo en la rama gh-pages (sitio de la organización: https://nextlegalhn.github.io/).
set -euo pipefail
cd "$(dirname "$0")/.."
BASE_PATH=/ npm run build
cp dist/index.html dist/404.html   # rutas como /entrar funcionan al recargar
touch dist/.nojekyll
REMOTE=https://github.com/NextLegalHN/nextlegalhn.github.io.git
TMP=$(mktemp -d)
cp -R dist/. "$TMP"
cd "$TMP"
git init -q -b gh-pages
git add -A
git commit -q -m "Publicar prototipo $(date '+%Y-%m-%d %H:%M')"
git push -q -f "$REMOTE" gh-pages
echo "Publicado en gh-pages"
