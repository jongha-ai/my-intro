# AIWORKS LAB — AI 직원의 첫 출근

주제: **“AI 직원이 출근하면, 사장님의 일이 달라집니다.”**

완성본: `dist/AIWORKS_LAB_AI_Employee_44s_1080x1920.mp4`

**44초 · 세로 1080×1920 · 30fps · H.264 / AAC · 한국어 내레이션 · 번인 자막**

소상공인·중소기업 대표에게 AI 직원의 역할 분담, 콘텐츠 제작 흐름, 사람의 최종 승인이라는 협업 방식을 소개하는 브랜드 쇼츠입니다. 기획·디자인·모션·음악·편집을 이번 작업에서 독립 제작했습니다. 유료 API, 유료 음원, 유료 스톡 영상은 사용하지 않았습니다.

## 파일

| 파일 | 내용 |
|---|---|
| `dist/AIWORKS_LAB_AI_Employee_44s_1080x1920.mp4` | 배포용 완성 영상 |
| `dist/contact-sheet.jpg` | 완성 영상에서 추출한 장면 확인 이미지 |
| `dist/poster.jpg` | 브랜드 엔딩 포스터 |
| `dist/narration.srt` | 내레이션 자막 별도 파일; MP4에도 이미 자막 포함 |
| `dist/validation.json` | 실제 파일 규격·디코딩·오디오 검증 결과 |
| `dist/asr-review.json` | 최종 음악 믹스에 대한 별도 음성 인식 교차 점검 |
| `index.html`, `film.js` | 시간 기반 Canvas 모션그래픽 원본 및 브라우저 플레이어 |
| `narration.json` | 대본, 자막, 발화 구간; 브랜드명만 영어로 별도 합성 |
| `assets/narration.wav`, `music.wav`, `mix.wav` | 내레이션, 자체 합성 음악·효과음, 최종 믹스 |
| `tools/` | 렌더링·음성·음악·폰트 제작 및 MP4 조립 도구 |

## 연출

| 구간 | 메시지와 모션 |
|---|---|
| 0–5초 | “사장님, 오늘도 혼자 하세요?” 업무 카드가 들어와 쌓이고 AI 코어 위치로 수렴 |
| 5–8.5초 | 궤도가 회전하는 입체 AI 코어와 출근 완료 배지 |
| 8.5–15초 | 요청이 AI 코어를 거쳐 기획·글쓰기·디자인 역할로 분배되는 데이터 흐름 |
| 15–20초 | 기획→카피→디자인→쇼츠 처리 상태가 순차적으로 완료되는 제작 파이프라인 |
| 20–25.5초 | 하나의 카페 아이디어가 세 개의 입체 콘텐츠 목업으로 펼쳐짐 |
| 25.5–31초 | 결과물 확인 → 포인터 이동 → 사장님 승인 완료 |
| 31–36.5초 | 업무 스택이 하나로 정리되며 밝은 배경으로 전환, 고객·사업에 집중 |
| 36.5–44초 | 기존 브랜드 심볼과 AIWORKS LAB 타이포그래피, AI 직원 도입·콘텐츠 자동화 상담 CTA |

슬라이드 이미지를 이어 붙이지 않고, 각 프레임의 궤도·연결선·업무 상태·입체 카드·포인터·카메라 푸시를 코드로 계산합니다. 장면 사이에는 대각선 와이프와 색상 전환을 사용했습니다. 딥네이비/코발트/라임과 페이퍼 화이트를 대비시키고, 엔딩에는 기존 심볼을 유지했습니다. 음악은 124 BPM의 신스·베이스·킥·하이햇과 전환 효과음을 직접 합성했습니다. 내레이션 구간에는 음악을 자동으로 낮췄습니다.

## 기존 파일 보존

- 제작 브랜치: `feat/aiworks-lab-brand-short`; 기존 작업 브랜치의 HEAD에서 분기.
- 기존 `index.html`, `banner.png`, `prd,md`는 수정하지 않았습니다.
- 참고 브랜치: `claude/lecture-opening-motion-graphic-m7eoze`, 확인한 커밋 `116b44969183eda7a568b96a7cbc7d843975cf43`.
- 참고 브랜치는 체크아웃하거나 수정하지 않고 Git 객체로 읽었습니다. `opening/assets`에서 로고와 Montserrat 폰트를 새 폴더로 복사했습니다. 기존 영상·음악은 재사용하지 않았습니다.

## 재생 / 제작

플레이어는 로컬 HTTP 서버에서 열고 우측 하단 재생 버튼을 누릅니다. 파일을 직접 열면 JSON과 폰트 로딩이 제한될 수 있습니다. `Space`로 재생/일시정지, `R`로 처음으로 이동합니다.

```bash
cd /workspace/my-intro/brand-short
python3 -m http.server 8001 --bind 127.0.0.1
```

### 저장된 음성·음악으로 다시 렌더링

Node.js, Chromium, FFmpeg가 필요합니다. 이번 환경은 Node 24.19.0, Playwright 1.57.0, Chromium 154, FFmpeg 7.1.5를 사용했습니다.

```bash
cd /workspace/my-intro/brand-short
npm ci --ignore-scripts --cache /tmp/aiworks-npm
# Chromium이 다른 경로라면 CHROMIUM_PATH 환경변수로 지정합니다.
node tools/render.cjs --stills 2,6.8,12.3,18.8,23.2,29.8,34.5,40.8
node tools/render.cjs
python3 tools/assemble.py
```

현재 클라우드에 이미 설치된 Playwright를 쓰는 경우:

```bash
NODE_PATH=/opt/codex/cua_node/lib/node_modules node tools/render.cjs
python3 tools/assemble.py
```

렌더러는 실제 시계 대신 `window.__seek(t)`로 1/30초씩 진행해 JPEG 프레임을 FFmpeg에 전달합니다. 로컬 폰트 로딩과 브라우저 오류를 확인하고 FFmpeg 실패 시 종료 코드를 보존합니다. `--from`, `--to`, `--output`으로 구간 렌더가 가능합니다. 이번에는 0–22초와 22–44초 두 구간을 병렬 렌더한 뒤 `python3 tools/assemble.py --parts`로 합쳤습니다. 최종 검증 중 JPEG 전체 범위 색상을 확인해 납품본은 SDR Rec.709 / 제한 범위 yuv420p로 변환했습니다. 렌더러에도 이 색상 처리를 반영했습니다. 기본 `assemble.py`는 단일 렌더 결과인 `picture.mp4`를 사용하며, 이미 Rec.709인 영상은 재인코딩 없이 조립합니다.

### 대본을 바꿔 음성까지 다시 생성

다운로드 이후에는 합성과 영상 렌더링이 로컬 CPU에서 실행됩니다. API 키가 필요하지 않습니다. 모델 파일 약 145 MB는 결과 소스 ZIP에 포함하지 않았습니다. 고정 버전 npm 데이터 패키지에서 내려받으며, 모든 패키지의 SHA-512 SRI를 검증합니다. 패키지 JavaScript는 실행하지 않고 base64 데이터만 복원합니다. Hugging Face 직접 접근과 Microsoft 음성 서비스는 현재 환경에서 차단되어 사용하지 않았습니다.

```bash
cd /workspace/my-intro/brand-short
python3 -m venv /workspace/scratch/aiworks-venv
/workspace/scratch/aiworks-venv/bin/pip install -r requirements.txt
/workspace/scratch/aiworks-venv/bin/python tools/prepare_tts.py --output /workspace/scratch/aiworks-model
/workspace/scratch/aiworks-venv/bin/python tools/make_audio.py --model /workspace/scratch/aiworks-model
# 특정 발화만 수정할 경우 --only 8; 최종 믹스도 다시 생성됩니다.
```

대본은 `narration.json`, 화면 문구와 타이밍은 `film.js`에서 편집합니다. 대본의 시작·종료 시각은 44초 구성에 맞춰 조정해야 합니다. 현재의 음악만 다시 만들려면 `python tools/make_audio.py`를 실행합니다. 한국어 폰트에는 전체 한글 완성형 음절을 포함했습니다. 폰트를 다시 만들 때는 시스템 Noto Sans CJK TTC와 `tools/make_fonts.py`를 사용합니다.

### 납품 파일 검증 / 소스 ZIP

```bash
# 위 requirements.txt 설치로 Pillow를 포함한 검증 의존성도 준비됩니다.
/workspace/scratch/aiworks-venv/bin/python tools/validate.py
python3 tools/package_source.py
```

규격 검사, 전체 디코딩, 0.4초 이상 검정 구간 검사, 최종 AAC의 실제 LUFS·true peak 측정 후 해당 MP4에서 포스터와 콘택트 시트를 추출합니다. 소스 ZIP에는 재렌더용 최종 WAV, 폰트, 코드, 라이선스, 대본과 검증 결과가 포함됩니다. MP4 자체, 모델 가중치, 렌더 중간 파일은 제외합니다. ZIP은 CRC를 확인하고 파일별 SHA-256 목록도 포함합니다.

## 도구 / 자산 출처

- **Canvas 2D + 자체 JavaScript**: 모든 화면 그래픽, 입체 투영, 커피 컵 일러스트, UI 목업, 모션. 실사·스톡 영상 없음.
- **Playwright / Chromium**: 프레임 캡처. **FFmpeg / ffprobe**: H.264 인코딩, AAC 믹싱, loudness normalization, 규격·디코딩 검증.
- **Python / NumPy / SciPy**: 자체 음악·전환음 합성, 볼륨 덕킹, 오디오 편집.
- **Supertonic 3 / ONNX Runtime**: 로컬 합성 내레이션. 고정 프리셋 음성 5번, 16 denoising steps, 복제 음성 없음. 모델은 `@3sln/donki-lle-voice-multi{,-2,-3}@0.1.1`의 양자화 재배포본. 버전·SRI는 `tools/tts-model-lock.json`에 고정했습니다. upstream: https://github.com/supertone-oss-archive/supertonic . 참고 Python helper는 커밋 `1e9799e964ea4c0dad7cde993b65c3c813a7b373`의 MIT 코드이며 `tools/SUPERTONIC_CODE_LICENSE`를 동봉했습니다. 모델은 upstream에 명시된 OpenRAIL-M 조건을 따릅니다: https://huggingface.co/supertone-oss-archive/supertonic-3/blob/main/LICENSE . 모델 가중치는 배포 ZIP에 포함하지 않습니다.
- **SenseVoice / sherpa-onnx 1.12.36**: 최종 음악 믹스의 음성 인식 교차 점검에만 사용. 검수용 모델은 GitHub k2-fsa/sherpa-onnx의 `asr-models` 릴리스에서 받았습니다. 영상에 포함하지 않습니다.
- **Noto Sans CJK KR / Montserrat**: SIL Open Font License. 라이선스를 `assets/fonts/OFL-*.txt`에 포함했습니다.
- **브랜드 심볼**: 사용자 지정 참고 브랜치에 포함된 기존 AIWorks 심볼. AIWORKS LAB 문자는 이번 영상에서 별도 조판했습니다.

## 한계 / 검증 범위

1. 전문 성우 녹음이 아닌 합성 음성입니다. 브랜드명은 발음 명료도를 위해 영어와 한국어 문장을 나눠 생성했습니다. 별도 ASR로 문장 누락을 점검했지만 고유명사 인식은 완전하지 않으며, 사람의 최종 청취 평가를 대체하지 않습니다.
2. 화면의 AI 업무 UI, 카페, 쇼츠·SNS·블로그 결과물은 설명을 위한 자체 제작 예시입니다. 실제 고객 계정이나 AIWORKS LAB 운영 시스템에 연결한 화면 녹화가 아닙니다. 실측 성과·절감률·자동 게시 성공률을 주장하지 않습니다.
3. 영상의 상담 CTA에는 확인되지 않은 URL·QR·연락처를 넣지 않았습니다. 실제 게시 시 계정 프로필이나 게시물에 공식 상담 경로를 연결할 수 있습니다.
4. 실사 촬영이나 유료 영상 생성 API 없이 코드 기반 모션그래픽으로 제작했습니다. 각 프레임과 오디오를 기술적으로 검증하고 주요 장면을 시각 확인했으며, SNS 업로드 후 플랫폼 재압축·기기별 재생·접근성 검수는 수행하지 않았습니다.
5. 외부 모델과 npm 배포본을 사용하는 재합성은 해당 배포처의 가용성에 의존합니다. 저장된 WAV와 로컬 폰트만으로 영상 자체는 다시 렌더할 수 있습니다. 원본 모델과 양자화 재배포본의 수치적 동일성을 주장하지 않습니다.

클라우드 환경 게시나 원격 Git push, SNS 게시, 유료 서비스 결제는 수행하지 않았습니다.
