"""오프닝 영상용 배경음악/효과음을 합성합니다 (저작권 걱정 없는 자체 제작 사운드).

    pip install numpy
    python3 tools/make_audio.py      ->  assets/soundtrack.wav, assets/soundtrack.mp3

구성
  0 ~ 28.1s   웜톤 시네마틱 패드 + 피아노 아르페지오 (A minor)
  28.1~28.6s  암전 (무음)
  28.6 ~ 65s  120BPM 일렉트로닉 비트, 장면 전환마다 임팩트
  65 ~ 70s    다시 따뜻한 패드로 마무리 (C major 해결)
"""
import os
import subprocess
import wave

import numpy as np

SR = 44100
DUR = 70.0
N = int(SR * DUR)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(7)

dry = np.zeros((2, N))   # 리버브 없이
wet = np.zeros((2, N))   # 리버브 보낼 신호


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def add(buf, t0, sig, pan=0.0, gain=1.0):
    i = int(t0 * SR)
    if i >= N or len(sig) == 0:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    sig = sig[: N - i] * gain
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    buf[0, i:i + len(sig)] += sig * l * 1.414
    buf[1, i:i + len(sig)] += sig * r * 1.414


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a, d, s, r, sustain_len):
    t = np.arange(n) / SR
    e = np.zeros(n)
    e = np.where(t < a, t / max(a, 1e-4), 1.0)
    dec = (t >= a) & (t < a + d)
    e = np.where(dec, 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where((t >= a + d) & (t < sustain_len), s, e)
    rel = t >= sustain_len
    e = np.where(rel, s * np.exp(-(t - sustain_len) / max(r, 1e-4) * 3), e)
    return e


def onepole_lp(x, alpha):
    """alpha: 스칼라 또는 샘플별 배열 (0~1, 클수록 밝음)"""
    y = np.empty_like(x)
    acc = 0.0
    a = np.broadcast_to(alpha, x.shape)
    for i in range(len(x)):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    return y


def box_lp(x, k):
    return np.convolve(x, np.ones(k) / k, mode='same')


def noise(dur):
    return rng.standard_normal(int(dur * SR))


# ---------------- 악기 ----------------
def pad_note(f, dur, bright=0.35, detune=5, attack=1.4, release=1.6, harmonics=7):
    t = tt(dur + release)
    sig = np.zeros_like(t)
    for cents in (-detune, 0, detune):
        ff = f * 2 ** (cents / 1200)
        ph = rng.random() * 6.28
        for h in range(1, harmonics + 1):
            sig += np.sin(2 * np.pi * ff * h * t + ph * h) / h * np.exp(-h * (1 - bright) * 0.9)
    sig /= 3
    e = env_adsr(len(t), attack, 0.5, 0.85, release, dur)
    lfo = 1 + 0.08 * np.sin(2 * np.pi * 0.25 * t + rng.random() * 6)
    return sig * e * lfo


def pluck(f, dur=1.6, decay=1.1, bright=1.0):
    t = tt(dur)
    sig = np.sin(2 * np.pi * f * t) + 0.45 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) \
        + 0.2 * bright * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 6) + 0.08 * np.sin(2 * np.pi * 4.01 * f * t) * np.exp(-t * 8)
    e = np.minimum(t / 0.004, 1) * np.exp(-t / decay)
    return sig * e


def kick(amp=1.0):
    t = tt(0.45)
    f = 45 + 110 * np.exp(-t * 38)
    ph = 2 * np.pi * np.cumsum(f) / SR
    sig = np.sin(ph) * np.exp(-t * 7.5)
    click = noise(0.45) * np.exp(-t * 300) * 0.25
    return np.tanh((sig + click) * 1.6) * amp


def hat(amp=0.1, dec=60):
    t = tt(0.12)
    n = np.diff(noise(0.12), prepend=0)
    return n * np.exp(-t * dec) * amp


def clap(amp=0.3):
    t = tt(0.3)
    n = noise(0.3)
    n = n - box_lp(n, 12)
    e = np.exp(-t * 18) * (1 + 0.6 * np.exp(-((t - 0.012) ** 2) / 0.00002) + 0.5 * np.exp(-((t - 0.024) ** 2) / 0.00002))
    tone = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4
    return (n * e * 0.6 + tone) * amp


def boom(amp=1.0, dur=2.6, f0=55, f1=30):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t * 1.4)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    n = box_lp(noise(dur), 30) * np.exp(-t * 4) * 0.8
    return np.tanh((sig + n) * 1.4) * amp


def crash(amp=0.25, dur=2.2):
    t = tt(dur)
    n = np.diff(noise(dur), prepend=0)
    return n * np.exp(-t * 2.2) * amp


def whoosh(dur=0.6, amp=0.25, reverse=True):
    t = tt(dur)
    n = noise(dur)
    alpha = 0.02 + 0.35 * (t / dur) ** 2 if reverse else 0.37 - 0.35 * (t / dur) ** 0.5
    sig = onepole_lp(n, alpha)
    e = (t / dur) ** 2 if reverse else np.exp(-t * 6)
    return sig * e * amp * 3


def arp_note(f, dur=0.16, amp=0.08, bright=1.0):
    t = tt(dur + 0.1)
    sig = sum(np.sin(2 * np.pi * f * h * t) / h * (bright ** (h // 2)) for h in (1, 3, 5, 7))
    e = np.minimum(t / 0.003, 1) * np.exp(-t * 16)
    return sig * e * amp


def bass_note(f, dur=0.24, amp=0.25):
    t = tt(dur)
    sig = sum(np.sin(2 * np.pi * f * h * t) / h * np.exp(-h * 0.25) for h in range(1, 9))
    e = np.minimum(t / 0.004, 1) * np.exp(-t * 7)
    return np.tanh(sig * 1.5) * e * amp


def clink(amp=0.15):
    t = tt(1.4)
    sig = np.zeros_like(t)
    for f, d, a in ((2637, 0.9, 1), (3951, 0.6, 0.7), (5274, 0.45, 0.5), (6923, 0.3, 0.35), (1760, 1.2, 0.3)):
        sig += np.sin(2 * np.pi * f * t) * np.exp(-t / d) * a
    sig += noise(1.4) * np.exp(-t * 200) * 0.6
    return sig * amp


# ---------------- 0 ~ 28.1 : 웜톤 ----------------
CUT = 28.15
chords_warm = [  # (시작, 끝, 근음, 화음)
    (0.0, 6.0, 33, [57, 60, 64]),
    (6.0, 9.5, 41, [53, 57, 60, 64]),
    (9.5, 14.0, 36, [55, 60, 64, 67]),
    (14.0, 17.0, 31, [55, 59, 62, 67]),
    (17.0, 20.0, 33, [57, 60, 64, 69]),
    (20.0, 24.0, 29, [53, 57, 60, 65]),
    (24.0, CUT, 31, [55, 60, 62, 67]),
]
for a, b, root, notes in chords_warm:
    for m in notes:
        add(wet, a, pad_note(mtof(m), b - a, bright=0.3), pan=rng.uniform(-0.5, 0.5), gain=0.055)
    add(wet, a, pad_note(mtof(root + 12), b - a, bright=0.2, harmonics=4), gain=0.09)
    add(dry, a, pad_note(mtof(root), b - a, bright=0.1, harmonics=3), gain=0.12)

# 피아노 아르페지오 (80BPM 8분음표 = 0.375s)
step = 0.375
pattern = [0, 2, 1, 3, 2, 1]
for a, b, root, notes in chords_warm[1:]:
    tones = sorted(notes) + [notes[0] + 12, notes[1] + 12]
    k = 0
    t = a
    while t < b - 0.05:
        m = tones[pattern[k % len(pattern)] + (2 if (k // 6) % 2 else 0)]
        vel = 0.12 + 0.05 * (k % 2 == 0)
        if t > 20:
            vel *= 0.8
        add(wet, t, pluck(mtof(m + 12), decay=0.9), pan=(-0.35 if k % 2 else 0.35), gain=vel)
        t += step
        k += 1
# 첫 시작 피아노 한 음
add(wet, 1.6, pluck(mtof(69), dur=3, decay=1.8), gain=0.14)
add(wet, 3.0, pluck(mtof(76), dur=3, decay=1.8), gain=0.12)

# 택시 구간 심장박동 같은 저음
t = 20.0
while t < 26.2:
    add(dry, t, kick(0.35), gain=0.8)
    add(dry, t + 0.22, kick(0.2), gain=0.6)
    t += 1.5

add(wet, 14.3, clink(), pan=0.4, gain=1.0)        # 열쇠 소리
add(dry, 14.3, boom(0.25, 1.2, 70, 40))
for ts in (5.6, 13.5, 19.5):                      # 장면 전환 바람소리
    add(wet, ts, whoosh(0.7, 0.12), pan=rng.uniform(-0.3, 0.3))

# 라이저 → 빛 속으로
rd = CUT - 26.0
t = tt(rd)
riser = onepole_lp(noise(rd), 0.01 + 0.5 * (t / rd) ** 2.5) * (t / rd) ** 2 * 0.9
sweep_f = 180 * (1400 / 180) ** ((t / rd) ** 1.5)
riser += np.sin(2 * np.pi * np.cumsum(sweep_f) / SR) * (t / rd) ** 3 * 0.25 * (1 + 0.5 * np.sin(2 * np.pi * (4 + 18 * t / rd) * t))
add(wet, 26.0, riser, gain=0.5)

# 암전: CUT 이후 웜톤 전부 제거 (짧은 페이드)
ci = int(CUT * SR)
fade = np.linspace(1, 0, int(0.012 * SR))
for buf in (dry, wet):
    buf[:, ci:ci + len(fade)] *= fade
    buf[:, ci + len(fade): int(28.6 * SR)] = 0
    buf[:, int(28.6 * SR): int(29.4 * SR)] = 0   # 남은 꼬리 제거
    buf[:, :ci] *= 1.7                            # 웜톤 구간 레벨 보정


# ---------------- 28.6 ~ 65 : 일렉트로닉 ----------------
B0 = 28.6
BEAT = 0.5
def b(k):
    return B0 + BEAT * k


prog = [(45, [69, 72, 76]), (41, [65, 69, 72, 76]), (48, [67, 72, 76, 79]), (43, [67, 71, 74, 79])]  # Am F C G
END_GROOVE = 64.6


def chord_at(t):
    idx = int((t - B0) // 2.0) % 4
    return prog[idx]


# 임팩트
add(dry, 28.6, boom(1.0, 3.0, 58, 28))
add(wet, 28.6, crash(0.22, 2.5))

# 패드 (마디마다)
k = 0
while b(k * 4) < END_GROOVE:
    t0 = b(k * 4)
    root, notes = chord_at(t0)
    for m in notes:
        add(wet, t0, pad_note(mtof(m - 12), 2.0, bright=0.55, attack=0.3, release=0.8), pan=rng.uniform(-0.6, 0.6), gain=0.03)
    k += 1

# 아르페지오 16분
t = B0
k = 0
while t < END_GROOVE:
    root, notes = chord_at(t)
    seq = notes + [notes[1] + 12]
    m = seq[k % len(seq)] + (12 if (k // 8) % 2 else 0)
    amp = 0.05 if t < 33.1 else 0.065
    bright = min(1.0, 0.3 + (t - B0) / 5)
    add(wet, t, arp_note(mtof(m), amp=amp, bright=bright), pan=(-0.5 if k % 2 else 0.5))
    t += BEAT / 4
    k += 1

# 킥, 베이스, 하이햇, 클랩
for k in range(0, 200):
    t = b(k)
    if t >= END_GROOVE:
        break
    brand_light = 51.1 <= t < 55.6
    if t >= 31.1 and not (brand_light and k % 2):
        add(dry, t, kick(0.75 if t >= 33.1 else 0.5))
    if t >= 31.1:
        root, _ = chord_at(t)
        for j in range(2):
            add(dry, t + j * 0.25, bass_note(mtof(root - 12 + (12 if j else 0)), amp=0.16 if brand_light else 0.2))
    if t >= 33.1:
        add(dry, t + 0.25, hat(0.07), pan=0.3)
    if t >= 41.1 and not brand_light:
        add(dry, t + 0.125, hat(0.035, 90), pan=-0.3)
        add(dry, t + 0.375, hat(0.035, 90), pan=-0.3)
    if t >= 37.6 and k % 2 == 1 and not brand_light:
        add(wet, t, clap(0.28))

# 단어 등장 효과음
for ts in (33.1, 34.6, 36.1):
    add(wet, ts - 0.35, whoosh(0.35, 0.1))
    add(dry, ts, np.sin(2 * np.pi * 1320 * tt(0.08)) * np.exp(-tt(0.08) * 60), gain=0.12)
add(dry, 37.6, boom(0.6, 1.6, 70, 35))
add(wet, 37.6, crash(0.14, 1.5))

# 성과 장면 임팩트
for ts in (41.1, 43.6, 46.1, 48.6):
    add(wet, ts - 0.5, whoosh(0.5, 0.16))
    add(dry, ts, boom(0.7, 1.8, 65, 32))
    add(wet, ts, crash(0.16, 1.8))
add(dry, 49.6, boom(0.5, 0.8, 90, 45))              # 도장 쾅

# 브랜드 전환
add(wet, 50.6, whoosh(0.5, 0.22))
add(dry, 51.1, boom(0.9, 2.6, 60, 30))
add(wet, 51.1, crash(0.22, 2.6))
for m in (72, 76, 79, 84):
    add(wet, 51.1, pluck(mtof(m), dur=2.5, decay=1.4), gain=0.1)
for ts in (55.6, 56.1, 56.6, 57.1, 57.6, 58.1):      # 사진 컷 셔터감
    add(dry, ts, hat(0.12, 40), pan=rng.uniform(-0.4, 0.4))

# 정체성: 라이저 → 히트 → 스네어 롤 → 클라이맥스
rd = 1.0
t = tt(rd)
add(wet, 58.1, onepole_lp(noise(rd), 0.02 + 0.4 * (t / rd) ** 2) * (t / rd) ** 2, gain=0.5)
add(dry, 59.1, boom(0.7, 2.0, 60, 30))
roll_t = 60.1
while roll_t < 61.1:
    u = (roll_t - 60.1) / 1.0
    add(wet, roll_t, clap(0.08 + 0.25 * u))
    roll_t += 0.125 if u < 0.5 else 0.0625
add(dry, 61.1, boom(1.0, 3.0, 62, 28))
add(wet, 61.1, crash(0.28, 3.0))
for m in (69, 72, 76, 81):
    add(wet, 61.1, pad_note(mtof(m), 1.5, bright=0.7, attack=0.02, release=1.2), gain=0.05)

# 그루브 종료: 리버스 심벌
add(wet, 64.1, whoosh(0.6, 0.15))


# ---------------- 65 ~ 70 : 마무리 ----------------
chords_end = [(64.9, 66.85, 41, [57, 60, 65, 69]), (66.85, 68.4, 43, [59, 62, 67, 71]), (68.4, 70.0, 36, [60, 64, 67, 72, 76])]
for a, bb, root, notes in chords_end:
    for m in notes:
        add(wet, a, pad_note(mtof(m), bb - a + 0.2, bright=0.35, attack=0.9, release=1.0), pan=rng.uniform(-0.5, 0.5), gain=0.08)
    add(dry, a, pad_note(mtof(root), bb - a + 0.2, bright=0.1, harmonics=3, attack=0.8), gain=0.18)
for i, m in enumerate((72, 76, 79, 84)):
    add(wet, 65.0 + i * 0.375, pluck(mtof(m), decay=1.0), gain=0.15, pan=(-0.3 if i % 2 else 0.3))
for i, m in enumerate((74, 79, 83, 86)):
    add(wet, 66.85 + i * 0.375, pluck(mtof(m), decay=1.0), gain=0.15, pan=(-0.3 if i % 2 else 0.3))
add(dry, 68.45, boom(0.35, 1.5, 60, 35))
for m in (84, 88, 91, 96):                          # 타이틀 벨
    add(wet, 68.45, pluck(mtof(m), dur=2.0, decay=1.3, bright=0.6), gain=0.12)


# ---------------- 믹스 ----------------
def reverb(x, secs=2.4):
    n = int(secs * SR)
    t = np.arange(n) / SR
    out = np.zeros_like(x)
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-t / secs * 5)
        ir = box_lp(ir, 6)
        ir[: int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
        ir /= np.sqrt(np.sum(ir ** 2))
        size = 1 << int(np.ceil(np.log2(len(x[ch]) + n)))
        y = np.fft.irfft(np.fft.rfft(x[ch], size) * np.fft.rfft(ir, size), size)[: len(x[ch])]
        out[ch] = y
    return out


rv = reverb(wet)
mix = dry + wet * 0.75 + rv * 0.45
# 암전 구간은 리버브 꼬리까지 완전 무음
mix[:, int(CUT * SR) + 600: int(28.6 * SR)] = 0
# 마지막 페이드아웃
fo = int(0.9 * SR)
mix[:, N - fo:] *= np.linspace(1, 0, fo) ** 1.5
fi = int(0.05 * SR)
mix[:, :fi] *= np.linspace(0, 1, fi)

peak = np.max(np.abs(mix))
mix = np.tanh(mix / peak * 1.25) / np.tanh(1.25) * 0.93

wav_path = os.path.join(ROOT, 'assets', 'soundtrack.wav')
pcm = (mix.T * 32767).astype(np.int16)
with wave.open(wav_path, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav_path, '-c:a', 'libmp3lame', '-b:a', '192k',
                os.path.join(ROOT, 'assets', 'soundtrack.mp3')], check=True)
print('saved', wav_path)
