#!/usr/bin/env bash
# 프레임(JPEG) + 오디오 믹스 → 최종 MP4 (1080×1920, 30fps, H.264/AAC, -14 LUFS)
set -euo pipefail
cd "$(dirname "$0")/.."
FRAMES="${1:-/tmp/frames}"
OUT="dist/aiworks-brand-short-01-v3.mp4"
mkdir -p dist
ffmpeg -y -loglevel error -framerate 30 -i "$FRAMES/%05d.jpg" -i audio/mix.wav \
  -af "loudnorm=I=-14:TP=-1.5:LRA=9" \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -r 30 \
  -c:a aac -b:a 192k -ar 44100 -movflags +faststart -shortest "$OUT"
ls -la "$OUT"
