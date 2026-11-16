#!/usr/bin/env bash
# Tras el scaffold: instala dependencias y Chromium dentro del repo del video. Uso: scripts/prepare-video-repo.sh work/<App>-Demo-Video
set -e
cd "$1"
npm install --no-audit --no-fund
npx playwright install --with-deps chromium
