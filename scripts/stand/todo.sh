#!/usr/bin/env bash
# Regenera todo el material del stand con la dirección vigente (QR, acrílicos, flyer, videos).
set -euo pipefail
cd "$(dirname "$0")/../.."
node scripts/stand/impresos.mjs
node scripts/stand/acrilico.mjs
node scripts/stand/cta.mjs
node scripts/stand/grabar.mjs          # los 6 videos del stand (~10 min)
cd marca/stand
{ for f in video-stand-0*.mp4 video-cta-qr.mp4; do echo "file '$PWD/$f'"; done; } > /tmp/nl-lista.txt
ffmpeg -v error -y -f concat -safe 0 -i /tmp/nl-lista.txt -c copy video-monitor-completo.mp4
echo "todo listo"
