# AIWORKS LAB — A Better Workday

첨부된 **한국어 내레이션 1개와 이미지 4장**으로 새로 만든 사진·모션그래픽 브랜드 쇼츠입니다.

**완성본:** `dist/AIWORKS_LAB_A_Better_Workday_32s_1080x1920.mp4`

- 길이 32초 / 세로 1080×1920 / 30fps / 960프레임
- H.264, yuv420p, SDR Rec.709 / AAC, 48 kHz, 스테레오 / MP4 faststart
- 제공된 내레이션 30.72초 전체 사용, 시작 오프셋 0초, 엔딩 여백 1.28초
- 음성 재합성·교체·속도·피치 변경 없음. 일정한 볼륨 조정과 24→48 kHz 리샘플링만 적용
- 브랜치 `feat/aiworks-lab-image-film`, 작업 폴더 `brand-film-v2/`

이전 `brand-short/`와 기존 저장소 파일은 수정하지 않았습니다. 이전 44초 영상의 프레임·음성·음악은 사용하지 않았습니다. 렌더링 도구의 프레임 캡처 구조와 로컬 폰트·브랜드 심볼만 재사용했고, 화면 구성·애니메이션·음악은 새로 제작했습니다.

## 기획과 연출

사장님의 현실 → AI와 함께 일하는 변화 → 콘텐츠 결과물 → 결과 확인과 결정 → AIWORKS LAB 브랜드 메시지.

촬영 이미지를 중심으로 **차콜·아이보리·샴페인 골드**의 에디토리얼 스타일을 적용했습니다. 바쁜 현실에는 빠른 분할 크롭을, AI 협업에는 빛의 궤적과 말에 맞춰 바뀌는 동사를, 콘텐츠 결과에는 사진 속 태블릿·노트북의 확대 프레임을 사용했습니다. 후반부는 카메라 움직임을 풀어 주면서 여유와 브랜드 메시지를 전달합니다.

| 시간 | 사용 이미지 | 연출 |
|---|---|---|
| 0–3.6초 | 01 | 얼굴을 살린 인물 컷과 하단 대형 훅 타이포 |
| 3.6–6.6초 | 01 | 얼굴·서류·책상을 나눠 보여 주는 세 개의 움직이는 크롭 밴드 |
| 6.6–8.9초 | 01 | “하루가 모자랍니다” 압축 메시지, 더 가까운 카메라 |
| 8.9–12.3초 | 02 | 빛이 스치는 전환, 사진의 홀로그램 경로를 보조하는 라이트 모션 |
| 12.3–18.25초 | 02 | 일을 나누고 → 조사하고 → 기획하고 → 콘텐츠를 만듭니다, 내레이션 타이밍에 따른 단어 전환 |
| 18.25–21.95초 | 03 | 제공 사진 속 실제 디바이스를 확대한 두 개의 결과물 크롭 |
| 21.95–25.7초 | 04 | 사장님의 표정과 결과 확인, 중요한 결정에 집중하는 문구 |
| 25.7–28.7초 | 01 / 04 | 바쁜 사장님과 여유 있는 사장님 사이의 매치 디졸브 |
| 28.7–32초 | 04 / 심볼 | 사진이 차콜로 가라앉으며 골드 브랜드 시그니처로 마무리 |

내레이션의 핵심을 시각화하는 한글 타이포그래피를 사용했습니다. 화면 문구는 전체 음성을 받아쓴 축어 자막이 아닙니다. 구체적인 컷 타이밍은 `timeline.json`, 실제 동작은 `film.js`에 있습니다.

## 음성 / 음악

사용자 제공 WAV 원본을 `assets/narration-original.wav`에 바이트 단위로 보존했습니다.

SHA-256: `b7df1f5391f70b184a9889fa866b401f2747bad8bc41e677d267a24266203d68`

내레이션이 먼저 들리도록 고정 이득 -3.85 dB를 적용하고, 새로 합성한 음악의 음량을 말하는 구간에 낮췄습니다. 배경음악은 부드러운 아르페지오·패드와 120 BPM 펄스로 구성했습니다. 짧은 전환음과 브랜드 엔딩 음도 직접 합성했습니다. 유료 API, 음성 합성 API, 스톡 음원은 사용하지 않았습니다.

최종 파일 실측: **-16.89 LUFS / -4.49 dBTP**, 인코딩된 오디오와 원본 믹스의 상관계수 **0.9999767**. 전체 오디오·비디오 디코딩을 통과했으며 예기치 않은 검정 구간은 발견되지 않았습니다. 자세한 수치는 `dist/validation.json`에 있습니다.

## 파일

| 파일 | 내용 |
|---|---|
| `dist/AIWORKS_LAB_A_Better_Workday_32s_1080x1920.mp4` | 완성 MP4 |
| `dist/contact-sheet.jpg` | 완성 MP4에서 추출한 10개 장면 |
| `dist/poster.jpg` | 브랜드 엔딩 이미지 |
| `dist/validation.json` | 규격·디코딩·오디오·입력 자료 해시 검증 |
| `dist/AIWORKS_LAB_A_Better_Workday_source.zip` | 이미지·음성·폰트·코드·음악·재현 도구를 포함한 소스 ZIP, MP4는 별도 |
| `index.html`, `film.js` | 브라우저 플레이어와 결정론적 모션그래픽 원본 |
| `assets/01…04*.jpg` | 사용자 제공 이미지, 원본 바이트 보존 |
| `assets/narration-original.wav` | 사용자 제공 내레이션 원본 |
| `assets/music.wav`, `assets/final-mix.wav` | 새 배경음악·효과음, 최종 믹스 |
| `assets/audio-manifest.json` | 원본 음성 보존과 처리 기록 |
| `tools/` | 오디오 제작, 렌더링, 조립, 검증, 소스 패키징 |

## 재생과 재현

사용 도구: Canvas 2D / JavaScript, Node 24.19.0, Playwright 1.57.0, Chromium 154, FFmpeg 7.1.5, Python 3.12, NumPy / SciPy / Pillow.

```bash
cd /workspace/my-intro/brand-film-v2
python3 -m http.server 8001 --bind 127.0.0.1
```

로컬 HTTP 서버에서 `index.html`을 열고 재생 버튼을 누릅니다. `Space` 재생/일시정지, `R` 처음으로 이동합니다. 플레이어와 MP4가 같은 `final-mix.wav`와 `film.js` 타임라인을 사용합니다.

```bash
cd /workspace/my-intro/brand-film-v2
python3 -m venv /workspace/scratch/aiworks-film-venv
/workspace/scratch/aiworks-film-venv/bin/pip install -r requirements.txt
npm ci --ignore-scripts --cache /tmp/aiworks-npm

# 제공 음성을 유지하며 배경음악과 믹스만 다시 계산
/workspace/scratch/aiworks-film-venv/bin/python tools/make_mix.py

# 시스템 Chromium 경로가 다르면 CHROMIUM_PATH 환경변수 지정
node tools/render.cjs --stills 1.9,4.9,7.9,10.8,13.3,17.5,20.9,24.4,27.3,30.9
node tools/render.cjs
python3 tools/assemble.py
/workspace/scratch/aiworks-film-venv/bin/python tools/validate.py
python3 tools/package_source.py
```

현재 클라우드에 설치된 Playwright를 쓸 때는 `NODE_PATH=/opt/codex/cua_node/lib/node_modules node tools/render.cjs`로 실행할 수 있습니다. 이번 납품본은 0–16초와 16–32초를 각각 렌더한 뒤 `python3 tools/assemble.py --parts`로 영상 재인코딩 없이 연결했습니다.

## 자산 출처와 범위

- 이미지 네 장과 WAV: 이번 사용자 첨부 자료. 첨부의 `SCENES.txt`는 이미지 설명 자료로 참고했습니다.
- 제공 이미지는 각각 941×1672입니다. 출력 규격에 맞춰 소폭 확대·크롭했으며 얼굴을 생성하거나 바꾸지 않았습니다.
- Noto Sans CJK KR / Montserrat: 로컬 폰트 사용, SIL OFL 동봉.
- 브랜드 심볼: 기존 지정 저장소의 AIWorks 심볼. 영상 합성 중 골드 단색으로 표현했고 원본 PNG는 유지했습니다.
- 음악·전환음·모션그래픽: 이번 작업에서 코드로 새로 제작.
- 첨부 사진은 컨셉 이미지이며 실측 성과나 실제 고객 시스템 화면 녹화를 나타내지 않습니다. 새 대시보드 데모나 성과 수치를 추가하지 않았습니다.
- 선택 프레임과 전환을 시각 확인하고 전체 파일을 기술적으로 검증했습니다. SNS 업로드 후 재압축이나 모든 기기에서의 재생은 검증하지 않았습니다. 오디오 수치·파형 검증은 사람의 최종 청취 평가를 대체하지 않습니다.

원본 음성과 이미지 4장의 해시는 `dist/validation.json`에서 확인할 수 있습니다. 기존 영상과 이 새 영상은 별도 폴더·브랜치에 보관됩니다.
