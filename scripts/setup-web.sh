#!/usr/bin/env bash
# Prepara el entorno de Claude Code en la web para los clips (idempotente).
set -e
command -v ffmpeg >/dev/null || { (apt-get update -qq && apt-get install -y -qq ffmpeg fonts-dejavu-core) >/dev/null 2>&1 || sudo apt-get install -y -qq ffmpeg fonts-dejavu-core; }
echo "ffmpeg: $(ffmpeg -version | head -1)"
node -v
