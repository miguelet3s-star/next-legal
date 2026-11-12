#!/usr/bin/env bash
# Publica el prototipo en la rama gh-pages (GitHub Pages sirve /next-legal/).
set -euo pipefail
cd "$(dirname "$0")/.."
BASE_PATH=/next-legal/ npm run build
cp dist/index.html dist/404.html   # rutas como /entrar funcionan al recargar
touch dist/.nojekyll
REMOTE=$(git remote get-url origin)
TMP=$(mktemp -d)
cp -R dist/. "$TMP"
cd "$TMP"
git init -q -b gh-pages
git add -A
git commit -q -m "Publicar prototipo $(date '+%Y-%m-%d %H:%M')"
git push -q -f "$REMOTE" gh-pages
echo "Publicado en gh-pages"
