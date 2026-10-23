"""나레이션 트랙 생성.

엔진 두 가지 (출력 형식은 동일하므로 나머지 과정은 그대로입니다)

  espeak (기본)  오프라인 가이드 음성. 무료지만 기계음에 가깝습니다. (apt install espeak-ng)
  edge           Microsoft Edge '소리 내어 읽기' 신경망 음성. 무료이며 API 키가 필요 없습니다.
                 인터넷이 되는 PC에서:  pip install edge-tts

    python3 tools/make_narration.py                                   # 가이드 음성
    python3 tools/make_narration.py --engine edge                     # 자연스러운 음성 (기본 ko-KR-SunHiNeural)
    python3 tools/make_narration.py --engine edge --voice ko-KR-InJoonNeural --rate +5%

음성을 바꾼 뒤에는 tools/make.sh 로 효과음 큐·음악 덕킹·자막 타이밍·프레임을 모두 다시 맞춥니다.
"""
import argparse, json, os, subprocess, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--engine', choices=['espeak', 'edge'], default='espeak')
ap.add_argument('--voice', default='ko-KR-SunHiNeural')
ap.add_argument('--rate', default='+0%')
ARGS = ap.parse_args()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
SPEED, PITCH = 168, 40          # espeak-ng 속도(wpm) / 음높이
MAX_STRETCH = 1.18              # 구간에 안 들어가면 최대 이 배율까지만 빠르게

script = json.load(open(os.path.join(ROOT, 'script.json'), encoding='utf-8'))
os.makedirs(os.path.join(ROOT, 'audio', 'tmp'), exist_ok=True)

# 다음 문장 시작(또는 영상 끝) 직전까지를 각 문장이 쓸 수 있는 구간으로 봅니다.
lines = script['lines']
limits = [l['start'] for l in lines[1:]] + [script['duration'] - 0.6]
# 장면 전환 효과음이 겹치지 않도록 문장 사이에 0.25초 여유를 둡니다.
total = np.zeros(int(SR * script['duration']))
cues = []

def run(*a):
    subprocess.run(a, check=True, capture_output=True)

def synth(text, raw):
    if ARGS.engine == 'espeak':
        run('espeak-ng', '-v', 'ko', '-s', str(SPEED), '-p', str(PITCH), '-g', '3', '-w', raw, text)
    else:
        import asyncio, edge_tts
        mp3 = raw + '.mp3'
        asyncio.run(edge_tts.Communicate(text, ARGS.voice, rate=ARGS.rate).save(mp3))
        run('ffmpeg', '-y', '-loglevel', 'error', '-i', mp3, '-ar', '24000', '-ac', '1', raw)

for line, limit in zip(lines, limits):
    raw = os.path.join(ROOT, 'audio', 'tmp', line['id'] + '_raw.wav')
    out = os.path.join(ROOT, 'audio', 'tmp', line['id'] + '.wav')
    synth(line['tts'], raw)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', raw],
                               capture_output=True, text=True).stdout)
    window = limit - line['start'] - 0.25
    tempo = min(MAX_STRETCH, max(1.0, dur / window))
    chain = [f'atempo={tempo:.4f}', 'aresample=44100', 'highpass=f=110', 'lowpass=f=9000',
             'equalizer=f=220:t=q:w=1.2:g=3', 'equalizer=f=3200:t=q:w=1.5:g=-2',
             'acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=4',
             'aecho=0.8:0.5:35:0.12', 'volume=0.9']
    run('ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', ','.join(chain), '-ac', '1', '-ar', str(SR), out)
    with wave.open(out) as w:
        pcm = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    i = int(line['start'] * SR)
    total[i:i + len(pcm)] += pcm[:len(total) - i]
    end = line['start'] + len(pcm) / SR
    cues.append({'id': line['id'], 'start': line['start'], 'end': round(end, 3), 'text': line['text'], 'tempo': round(tempo, 3)})
    print(f"{line['id']}: {line['start']:.2f}-{end:.2f}s (구간 한도 {limit:.2f}, 배속 {tempo:.2f})")
    assert end <= limit + 0.05, f"{line['id']} 이(가) 구간을 넘습니다"

peak = np.abs(total).max()
total = total / peak * 0.89 if peak > 0 else total
with wave.open(os.path.join(ROOT, 'audio', 'narration.wav'), 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((total * 32767).astype(np.int16).tobytes())
json.dump(cues, open(os.path.join(ROOT, 'audio', 'narration_cues.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('→ audio/narration.wav, audio/narration_cues.json')
