"""배경음악 + 효과음 합성, 나레이션과 믹스 (저작권 걱정 없는 자체 제작 사운드).

    pip install numpy scipy
    python3 tools/make_audio.py

입력  script.json, audio/sfx_cues.json (render.js 가 화면 타임라인에서 기록), audio/narration.wav, audio/narration_cues.json
출력  audio/stem_music.wav, audio/stem_sfx.wav, audio/mix.wav

구성 (120 BPM, A minor → C major 해결). 모든 시각은 script.json 의 장면 구간과 효과음 큐에서 가져옵니다.
  장면1(chaos)    긴장: 저음 드론 + 점점 빨라지는 시계 틱 + 라이저, 드롭 직전 0.2초 무음
  장면2(checkin)  드롭: 임팩트, 킥/베이스/클랩 진입 (AI 직원 출근)
  이후            4마디 코드 순환(Am-F-C-G) 아르페지오 그루브, 장면4(content)부터 리드 추가
  장면5(approve)  가벼운 구간: 킥만 약하게, 아르페지오는 로우패스 → 끝에서 라이저로 재상승
  장면6(brand)    풀 그루브 → CTA 순간에 마지막 코드(C add9)와 잔향 (F-G-Am-C 로 해결)
나레이션이 나오는 동안 음악이 자동으로 살짝 내려가고, 킥마다 베이스/패드가 눌렸다 올라오는(사이드체인) 느낌을 줍니다.
"""
import json, os, wave
import numpy as np
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100
script = json.load(open(os.path.join(ROOT, 'script.json'), encoding='utf-8'))
D = script['duration']
N = int(SR * D)
BEAT = 60 / script['bpm']
rng = np.random.default_rng(11)

# 장면 구성 (script.json) 과 마무리 시각 (화면 타임라인이 기록한 'final' 효과음 큐)
SC = script['scenes']
DROP, CONTENT0, APPROVE, BRAND = SC['checkin'][0], SC['content'][0], SC['approve'], SC['brand'][0]
FINAL = next(c['t'] for c in json.load(open(os.path.join(ROOT, 'audio', 'sfx_cues.json'))) if c['name'] == 'final')

def tt(dur): return np.arange(int(SR * dur)) / SR
def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

def lp(x, fc, order=2): return signal.sosfilt(signal.butter(order, fc, 'low', fs=SR, output='sos'), x)
def lp_env(x, t, f_lo, f_hi, tau):
    """컷오프가 f_hi에서 f_lo로 내려오는 필터 느낌 (두 필터 결과를 섞는 근사)."""
    e = np.exp(-t / tau); return lp(x, f_lo) * (1 - e) + lp(x, f_hi) * e

def hp(x, fc, order=2): return signal.sosfilt(signal.butter(order, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)

def put(bus, t0, sig, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= N or len(sig) == 0: return
    if i < 0: sig = sig[-i:]; i = 0
    sig = sig[:N - i] * gain
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    bus[0, i:i + len(sig)] += sig * l
    bus[1, i:i + len(sig)] += sig * r

def sweep_noise(dur, f0, f1, q=1.2, shape=None):
    """주파수가 움직이는 밴드패스 노이즈 (휘잉 / 라이저)."""
    n = int(SR * dur); out = np.zeros(n); noise = rng.standard_normal(n)
    zi = None; blk = 1024
    for s in range(0, n, blk):
        f = f0 * (f1 / f0) ** (s / max(n, 1))
        lo, hi = f / (1 + .5 / q), min(f * (1 + .5 / q), SR / 2 * .95)
        sos = signal.butter(2, [lo, hi], 'band', fs=SR, output='sos')
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        y, zi = signal.sosfilt(sos, noise[s:s + blk], zi=zi)
        out[s:s + blk] = y
    out /= (np.abs(out).max() + 1e-9)
    if shape is not None: out *= shape(np.linspace(0, 1, n))
    return out

# ─── 악기 ───
def kick(v=1.0):
    t = tt(.5); f = 46 + 120 * np.exp(-t / .03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / .16)
    x += hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / .004) * .25
    return np.tanh(x * 1.6) * v

def clap(v=1.0):
    t = tt(.32); x = np.zeros(len(t))
    for d in (0, .011, .023):
        i = int(d * SR); x[i:] += rng.standard_normal(len(t) - i) * np.exp(-np.arange(len(t) - i) / SR / .012)
    x = bp(x, 1100, 4200) * 1.0
    x += bp(rng.standard_normal(len(t)), 900, 3000) * np.exp(-t / .09) * .5
    return x / (np.abs(x).max() + 1e-9) * v

def hat(open_=False, v=1.0):
    t = tt(.22 if open_ else .06); x = hp(rng.standard_normal(len(t)), 7500) * np.exp(-t / (.07 if open_ else .012))
    return x / (np.abs(x).max() + 1e-9) * v

def bass(freq, dur, v=1.0):
    t = tt(dur); x = signal.sawtooth(2 * np.pi * freq * t) * .6 + np.sin(2 * np.pi * freq * t)
    x = lp_env(x, t, 260, 760, .08) * np.minimum(1, t / .004) * np.exp(-np.maximum(0, t - dur * .6) / .05)
    return x * v

def pluck(freq, v=1.0, bright=1.0):
    t = tt(.34)
    x = sum(signal.sawtooth(2 * np.pi * freq * (1 + d) * t) for d in (-.006, 0, .006)) / 3
    x = lp_env(x, t, 900 * bright, 5100 * bright, .07) * np.exp(-t / .11) * np.minimum(1, t / .002)
    return x * v

def lead(freq, dur=.28, v=1.0):
    t = tt(dur)
    x = (signal.square(2 * np.pi * freq * t, duty=.35) * .5 + signal.sawtooth(2 * np.pi * freq * 1.004 * t) * .5)
    x = lp(x, 3200) * np.exp(-t / .2) * np.minimum(1, t / .003)
    return x * v

def pad(freqs, dur, v=1.0):
    t = tt(dur); x = np.zeros(len(t))
    for f in freqs:
        for d in (-.007, 0, .007): x += signal.sawtooth(2 * np.pi * f * (1 + d) * t + rng.uniform(0, 6))
    x = lp(x / (len(freqs) * 3), 1400)
    a, r = min(.5, dur / 3), min(.8, dur / 3)
    env = np.minimum(1, t / a) * np.minimum(1, (dur - t) / r)
    return x * env * v

def bell(freq, dur=1.0, v=1.0, partials=((1, 1), (2.76, .35), (5.4, .15))):
    t = tt(dur); x = sum(a * np.sin(2 * np.pi * freq * m * t) * np.exp(-t / (dur / (2.2 + m * .6))) for m, a in partials)
    return x / (np.abs(x).max() + 1e-9) * v * np.minimum(1, t / .002)

def reverb_ir(sec=1.8, decay=3.2):
    n = int(SR * sec); t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-t * decay)
    ir[:, :int(.012 * SR)] *= np.linspace(0, 1, int(.012 * SR))
    return lp(ir, 7000)

# ─── 버스 ───
music = np.zeros((2, N)); sfxb = np.zeros((2, N)); wet_m = np.zeros((2, N)); wet_s = np.zeros((2, N)); risb = np.zeros((2, N))
kick_times = []

# (루트 베이스 MIDI, 아르페지오 음 4개)
CH = {'Am': (33, [57, 60, 64, 69]), 'F': (29, [53, 57, 60, 65]), 'C': (36, [60, 64, 67, 72]), 'G': (31, [55, 59, 62, 67])}
PROG = ['Am', 'F', 'C', 'G']
ARP = [0, 1, 2, 3, 2, 1, 2, 3, 0, 1, 2, 3, 2, 1, 3, 2]

CLOSE = ['F', 'G', 'Am', 'C']                      # 마지막 4마디는 C 로 해결
def chord_at(t):
    if t >= FINAL - 6: return CLOSE[min(int((t - (FINAL - 6)) // 2), 3)]
    return PROG[int((t - DROP) // 2) % 4]

# 장면1: 드론 + 시계 틱
drone = lp(signal.sawtooth(2 * np.pi * 55 * tt(DROP + .4)) + signal.sawtooth(2 * np.pi * 55.4 * tt(DROP + .4)), 180)
drone *= np.minimum(1, tt(DROP + .4) / 1.5) * (0.5 + 0.5 * np.minimum(1, tt(DROP + .4) / DROP))
put(music, 0, drone, .13); put(wet_m, 0, drone, .04)
k = 0
t = 0.1
while t < DROP - .1:                              # 점점 빨라지는 틱
    v = .08 + .14 * (t / DROP) ** 1.5
    put(music, t, bell(1900 if k % 2 else 1400, .09, 1.0, ((1, 1), (3.1, .4))) * 0.5, v, pan=-.3 if k % 2 else .3)
    gap = BEAT * (1 - .62 * (t / DROP) ** 1.3)
    t += max(gap / 1, .09); k += 1
for t0 in np.arange(max(0, DROP - 4.0), DROP, BEAT):   # 심장박동 서브
    k_ = kick(.5); put(music, t0, lp(k_, 120), .3 * min(1, (t0 - (DROP - 4.5)) / 3))

# 드롭~마무리: 그루브
t = DROP
end_groove = FINAL
bar_steps = int(round((end_groove - DROP) / (BEAT / 4)))
calm = (APPROVE[0], APPROVE[1] - 1.5)
for s in range(bar_steps + 1):
    ts = DROP + s * BEAT / 4
    if ts > end_groove + 1e-6: break
    ch = CH[chord_at(ts)]
    in_calm = calm[0] <= ts < calm[1]
    step16 = s % 16; beat_pos = step16 / 4
    # 킥
    if step16 % 4 == 0 and not (in_calm and (step16 // 4) % 2 == 1):
        kv = .62 if in_calm else (.95 if ts < BRAND + .5 or ts > FINAL - .5 else 1.0)
        put(music, ts, kick(kv), .9); kick_times.append(ts)
    # 클랩 (2, 4박)
    if step16 in (4, 12) and not in_calm and ts >= DROP:
        put(music, ts, clap(.9), .42, pan=.1); put(wet_m, ts, clap(.9), .14)
    # 하이햇
    if (step16 % 4 == 2) and not in_calm: put(music, ts, hat(True, .6), .15, pan=.25)
    if ts >= DROP + 4 and (step16 % 2 == 0 or ts >= CONTENT0) and not in_calm: put(music, ts, hat(False, .5), .09, pan=-.2 if step16 % 4 == 1 else .2)
    # 베이스 (8분음표 싱코페이션)
    if step16 in (0, 3, 6, 8, 11, 14):
        bf = mtof(ch[0]); bd = BEAT * (.38 if step16 not in (0, 8) else .62)
        put(music, ts, bass(bf * (2 if step16 in (6, 14) else 1), bd), .5 * (.7 if in_calm else 1))
    # 아르페지오 플럭 (8초부터)
    if ts >= DROP + 2:
        note = ch[1][ARP[step16]] + (12 if (ts >= CONTENT0 and step16 % 8 == 6) else 0)
        accent = 1.25 if step16 % 4 == 0 else .85
        pk = pluck(mtof(note), accent, .45 if in_calm else 1.0)
        put(music, ts, pk, .17, pan=-.45 if step16 % 2 else .45); put(wet_m, ts, pk, .09)
    # 리드 (콘텐츠 장면, 브랜드 장면)
    if (CONTENT0 <= ts < APPROVE[0] or BRAND + .5 <= ts < FINAL) and step16 in (0, 6, 10) and not in_calm:
        ln = ch[1][[2, 3, 1][(0, 6, 10).index(step16)]] + 12
        ld = lead(mtof(ln), .28); put(music, ts, ld, .12, pan=.0); put(wet_m, ts, ld, .12)

# 패드 (마디별)
for bar_t in np.arange(DROP, D, 2.0):
    ch = CH[chord_at(bar_t)]
    pv = .09 if bar_t < 10 else .13
    if calm[0] - 1 <= bar_t < calm[1]: pv = .2
    pd = pad([mtof(n - 12) for n in ch[1][:3]], 2.3, 1.0)
    put(music, bar_t, pd, pv); put(wet_m, bar_t, pd, pv * .8)

# 승인 장면 끝 → 브랜드 장면 라이저
r = sweep_noise(1.8, 400, 9000, 1.0, shape=lambda x: x ** 2.2)
put(risb, BRAND - 1.8, r, .4)

# 마지막: C add9 + 잔향
fin = pad([mtof(n) for n in (48, 55, 60, 64, 67, 74)], 2.3, 1.0)
put(music, FINAL, fin, .22); put(wet_m, FINAL, fin, .3)
for i, n in enumerate((72, 76, 79, 84, 88)):
    put(sfxb, FINAL + i * .06, bell(mtof(n), 1.6, 1.0), .12 - i * .01, pan=-.5 + i * .25)

# ─── 효과음 큐 ───
cues = json.load(open(os.path.join(ROOT, 'audio', 'sfx_cues.json')))
CHIME = [76, 79, 83]
for c in cues:
    n, t0, v = c['name'], c['t'], c.get('v', 1.0)
    if n == 'pop':
        x = tt(.12); f = 480 + 520 * np.exp(-x / .03)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .035) + hp(rng.standard_normal(len(x)), 3000) * np.exp(-x / .004) * .25
        put(sfxb, t0, s, .2 * v, pan=rng.uniform(-.4, .4))
    elif n == 'ping':
        b = bell(rng.choice([1568, 1760, 1976]), .35, 1.0, ((1, 1), (2.4, .3))); put(sfxb, t0, b, .1 * v, pan=rng.uniform(-.6, .6)); put(wet_s, t0, b, .05 * v)
    elif n in ('whoosh', 'swoosh'):
        d = .42 if n == 'whoosh' else .7
        w = sweep_noise(d, 250, 5200, .9, shape=lambda x: np.sin(np.pi * x) ** 1.6)
        put(sfxb, t0 - .02, w, .45 * v); put(wet_s, t0 - .02, w, .1)
    elif n == 'hit':
        x = tt(.5); f = 90 * np.exp(-x / .08) + 38
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .17) + lp(rng.standard_normal(len(x)), 4500) * np.exp(-x / .03) * .5
        put(sfxb, t0, np.tanh(s * 1.4), .36 * v); put(wet_s, t0, s, .08 * v)
    elif n == 'impact':
        x = tt(1.6); f = 70 * np.exp(-x / .2) + 32
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .32) + lp(rng.standard_normal(len(x)), 2500) * np.exp(-x / .18) * .45
        s += hp(rng.standard_normal(len(x)), 5000) * np.exp(-x / .5) * .12
        put(sfxb, t0, np.tanh(s * 1.5), .5 * v); put(wet_s, t0, s, .14 * v)
    elif n == 'tick':
        x = tt(.05); s = hp(rng.standard_normal(len(x)), 4000) * np.exp(-x / .006) * .6 + np.sin(2 * np.pi * 2300 * x) * np.exp(-x / .012) * .5
        put(sfxb, t0, s, .17 * v, pan=rng.uniform(-.3, .3))
    elif n == 'ding':
        b = bell(1318.5, 1.5, 1.0, ((1, 1), (2.0, .5), (3.0, .3), (4.1, .15))); put(sfxb, t0, b, .17 * v); put(wet_s, t0, b, .12 * v)
    elif n == 'chime':
        b = bell(mtof(CHIME[c.get('n', 0) % 3]), .8, 1.0, ((1, 1), (2.0, .4), (3.0, .2))); put(sfxb, t0, b, .13 * v); put(wet_s, t0, b, .09 * v)
    elif n == 'success':
        base = 83 + 2 * c.get('n', 0)
        for i, nn in enumerate((base, base + 4)):
            b = bell(mtof(nn), .5, 1.0, ((1, 1), (2.0, .35))); put(sfxb, t0 + i * .07, b, .14 * v)
    elif n == 'click':
        x = tt(.18); s = np.sin(2 * np.pi * 150 * x) * np.exp(-x / .03) * .8 + hp(rng.standard_normal(len(x)), 2500) * np.exp(-x / .004) * .7
        put(sfxb, t0, s, .5 * v); b = bell(1760, .4, 1.0, ((1, 1), (2.7, .3))); put(sfxb, t0 + .015, b, .12)
    elif n == 'riser':
        d = c.get('dur', 3.0)
        w = sweep_noise(d, 300, 8500, .8, shape=lambda x: x ** 2.4)
        x = tt(d); f = 180 * (10 ** (np.linspace(0, 1, len(x)))); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (np.linspace(0, 1, len(x)) ** 3) * .5
        put(risb, t0, w * .6 + s, .34 * v); put(wet_s, t0, w, .06)
    elif n == 'fall':
        x = tt(.55); f = 700 * np.exp(-x / .16) + 55
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / .25) * .6 + lp(rng.standard_normal(len(x)), 1800) * np.exp(-x / .15) * .5
        put(sfxb, t0, s, .45 * v)
    elif n == 'shimmer':
        for i, nn in enumerate((84, 88, 91, 96, 100)):
            b = bell(mtof(nn), 1.0, 1.0, ((1, 1), (2.0, .25))); put(sfxb, t0 + i * .05, b, .09, pan=-.6 + i * .3)
    elif n == 'final':
        pass   # 마지막 코드는 위에서 이미 연주

# ─── 리버브 / 사이드체인 / 나레이션 덕킹 ───
ir = reverb_ir()
def rv(bus): return np.stack([signal.fftconvolve(bus[ch], ir[ch])[:N] for ch in range(2)])
music = music + rv(wet_m) * .8
sfxb = sfxb + rv(wet_s) * .8

t_axis = np.arange(N) / SR
# 킥 사이드체인
sc = np.ones(N)
for kt in kick_times:
    i = int(kt * SR); seg = min(int(.3 * SR), N - i)
    sc[i:i + seg] = np.minimum(sc[i:i + seg], 1 - .5 * np.exp(-np.arange(seg) / SR / .09))
music *= sc

narr = None
nw = os.path.join(ROOT, 'audio', 'narration.wav')
duck = np.ones(N)
if os.path.exists(nw):
    with wave.open(nw) as w:
        narr = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    narr = np.pad(narr, (0, max(0, N - len(narr))))[:N]
    narr = np.tanh(narr * 2.1) / np.tanh(2.1) * .95          # 합성음은 음량 편차가 커서 한 번 눌러 줍니다
    for c in json.load(open(os.path.join(ROOT, 'audio', 'narration_cues.json'))):
        a, b = int((c['start'] - .08) * SR), int((c['end'] + .25) * SR)
        duck[a:b] = .47                                   # 음악 약 -6.5dB
    duck = signal.sosfiltfilt(signal.butter(2, 7, 'low', fs=SR, output='sos'), duck)
    music *= duck
    sfxb *= (0.5 + 0.5 * duck)                             # 효과음은 덜 내림

# 드롭 직전 0.2초 음악·라이저를 비워 드롭 임팩트를 살립니다
gap = np.ones(N); ga, gb = int((DROP - .2) * SR), int((DROP - .01) * SR)
gap[ga:gb] = 0; gap = signal.sosfiltfilt(signal.butter(2, 90, 'low', fs=SR, output='sos'), gap).clip(0, 1)
music *= gap; risb *= gap; sfxb += risb

# 마지막 1.2초 페이드
fade = np.ones(N); fi = int((D - 1.2) * SR); fade[fi:] = np.linspace(1, 0, N - fi) ** 1.5
music *= fade; sfxb *= fade

def save(name, x):
    x = np.clip(x, -1, 1)
    with wave.open(os.path.join(ROOT, 'audio', name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x.T * 32767).astype(np.int16).tobytes())

# 나레이션 구간에서 목소리가 음악보다 VOICE_OVER dB 높도록 음악·효과음 전체 음량을 자동으로 맞춥니다.
VOICE_OVER = 9.0
if narr is not None:
    wins = [(int(c['start'] * SR), int(c['end'] * SR)) for c in json.load(open(os.path.join(ROOT, 'audio', 'narration_cues.json')))]
    pw = lambda x: np.mean(np.concatenate([x[..., a:b].ravel() ** 2 for a, b in wins]))
    g = 10 ** ((10 * np.log10(pw(narr)) - VOICE_OVER - 10 * np.log10(pw(music * .9))) / 20)
    music *= g; sfxb *= g
    print(f"  음악·효과음 자동 보정 {20 * np.log10(g):+.1f} dB")
mix = music * .9 + sfxb
if narr is not None:
    for c in json.load(open(os.path.join(ROOT, 'audio', 'narration_cues.json'))):
        a, b = int(c['start'] * SR), int(c['end'] * SR)
        r = lambda x: 20 * np.log10(np.sqrt((x[..., a:b] ** 2).mean()) + 1e-9)
        print(f"  {c['id']} 나레이션 {r(narr):6.1f} dB | 음악 {r(music * .9):6.1f} dB | 효과음 {r(sfxb):6.1f} dB  → 목소리가 음악보다 {r(narr) - r(music * .9):+.1f} dB")
if narr is not None: mix = mix + np.stack([narr, narr]) * 1.0
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix = mix / (np.abs(mix).max() + 1e-9) * .93
save('stem_music.wav', music / (np.abs(music).max() + 1e-9) * .9)
save('stem_sfx.wav', sfxb / (np.abs(sfxb).max() + 1e-9) * .9)
save('mix.wav', mix)
print('→ audio/mix.wav (%.1fs), stem_music.wav, stem_sfx.wav' % D)
