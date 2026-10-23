#!/usr/bin/env bash
# 처음부터 끝까지 한 번에 만들기.   사용:  tools/make.sh [espeak|edge]
#   1) 나레이션  2) 화면 타임라인에서 효과음 큐 추출  3) 음악·효과음·믹스  4) 프레임 렌더(병렬)  5) MP4 합성
# 필요: node(+playwright), python3(+numpy, scipy), ffmpeg, (가이드 음성) espeak-ng, (자연스러운 음성) edge-tts
set -euo pipefail
cd "$(dirname "$0")/.."
export NODE_PATH="${NODE_PATH:-$(npm root -g)}"
ENGINE="${1:-espeak}"
FRAMES="${FRAMES:-/tmp/aiworks-short-frames}"
python3 tools/make_narration.py --engine "$ENGINE"
node tools/render.js --sfx-only          # 나레이션 타이밍이 바뀌면 효과음 큐도 바뀝니다
python3 tools/make_audio.py
rm -rf "$FRAMES"
node tools/render.js --frames "$FRAMES" --workers "${WORKERS:-4}"
bash tools/build.sh "$FRAMES"
