"""AI Studio 등에서 만든 나레이션 wav를 영상 타임라인에 맞게 배치합니다.

    python3 tools/import_narration.py            # narration_map.json 을 읽습니다

입력  narration_map.json (원본 wav 경로, 문장별 원본 구간 / 영상 시작 시각 / 자막 문구)
출력  audio/narration.wav (44.1kHz 모노, 전체 길이), audio/narration_cues.json (문장·덩어리별 시작/끝)

문장 안의 쉼은 원본 그대로 두고, 문장 사이 간격만 영상에 맞게 조정합니다.
새 음성으로 바꿀 때는 wav를 audio/source/ 에 넣고 narration_map.json 의 구간(초)만 고치세요.
"""
import json, os, wave
import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
script = json.load(open(os.path.join(ROOT, 'script.json'), encoding='utf-8'))
m = json.load(open(os.path.join(ROOT, 'narration_map.json'), encoding='utf-8'))

with wave.open(os.path.join(ROOT, m['source'])) as w:
    sr_in, ch = w.getframerate(), w.getnchannels()
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
if ch > 1: x = x.reshape(-1, ch).mean(1)
g = np.gcd(SR, sr_in)
x = signal.resample_poly(x, SR // g, sr_in // g)             # 24kHz → 44.1kHz

N = int(SR * script['duration'])
out = np.zeros(N)
cues = []
for ln in m['lines']:
    a0 = ln['chunks'][0][0] - m['pad_before']
    a1 = ln['chunks'][-1][1] + m['pad_after']
    seg = x[int(a0 * SR):int(a1 * SR)].copy()
    f = int(.012 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)   # 클릭 방지 페이드
    t0 = ln['start'] - m['pad_before']
    i = int(round(t0 * SR))
    assert i >= 0 and i + len(seg) <= N, f"{ln['id']} 이(가) 영상 길이를 벗어납니다"
    out[i:i + len(seg)] += seg
    chunks = [{'start': round(ln['start'] + (a - ln['chunks'][0][0]), 3), 'end': round(ln['start'] + (b - ln['chunks'][0][0]), 3), 'text': t}
              for a, b, t in ln['chunks']]
    cues.append({'id': ln['id'], 'start': chunks[0]['start'], 'end': chunks[-1]['end'],
                 'text': ' '.join(c['text'] for c in chunks), 'chunks': chunks})
    print(f"{ln['id']}: {chunks[0]['start']:6.2f}-{chunks[-1]['end']:6.2f}s  ({len(chunks)}덩어리)")

peak = np.abs(out).max()
out = out / peak * .95 if peak > 0 else out
with wave.open(os.path.join(ROOT, 'audio', 'narration.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((out * 32767).astype(np.int16).tobytes())
json.dump(cues, open(os.path.join(ROOT, 'audio', 'narration_cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('→ audio/narration.wav, audio/narration_cues.json')
