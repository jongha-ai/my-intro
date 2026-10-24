"""Original understated music + supplied narration, with no speech synthesis or time stretching."""
from pathlib import Path
import json,hashlib,subprocess,wave
import numpy as np
from scipy.signal import resample_poly,lfilter
from scipy.ndimage import maximum_filter1d

ROOT=Path(__file__).resolve().parents[1]
SR=48000;DUR=32;N=SR*DUR;rng=np.random.default_rng(241026)
bed=np.zeros((N,2),dtype=np.float64)
def save(path,x):
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1 if x.ndim==1 else x.shape[1]);w.setframerate(SR);w.setsampwidth(2)
        w.writeframes((np.clip(x,-1,1)*32767).astype('<i2').tobytes())
def add(at,x,gain=1,pan=0):
    i=round(at*SR)
    if i<0:x=x[-i:];i=0
    x=x[:max(0,N-i)]*gain
    if not len(x):return
    bed[i:i+len(x),0]+=x*np.sqrt((1-pan)/2)
    bed[i:i+len(x),1]+=x*np.sqrt((1+pan)/2)
def tt(d):return np.arange(round(d*SR))/SR
def note(m,d=1.5,decay=2.5):
    t=tt(d);f=440*2**((m-69)/12)
    x=np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t)*np.exp(-t*3)+.08*np.sin(2*np.pi*f*3*t)*np.exp(-t*5)
    return x*np.minimum(t/.008,1)*np.exp(-t*decay)
progression=[[50,57,60,64],[53,57,60,67],[48,55,59,64],[55,59,62,69]]
# Soft analogue chords and felt-like arpeggio. Music remains well below the provided voice.
for bar in range(16):
    at=bar*2;chord=progression[bar%4]
    for j,m in enumerate(chord):
        t=tt(3.2);f=440*2**((m-69)/12)
        pad=(np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*f*1.002*t))*np.sin(np.pi*np.minimum(t/3.2,1))**1.5
        add(at,pad,.018,j/3-0.5)
    for j,k in enumerate([0,2,1,3]):
        add(at+j*.5,note(chord[k]+12),.024,(-.45 if j%2 else .45))
# Delicate 120 BPM pulse enters with the AI collaboration turn.
for k in range(42):
    at=8.9+k*.5
    if at>29:break
    t=tt(.30);f=45+62*np.exp(-t*50)
    add(at,np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*15),.070)
    if k%2:
        t=tt(.06);noise=rng.normal(size=len(t));rim=(noise*.2+np.sin(2*np.pi*720*t)) *np.exp(-t*85)
        add(at,rim,.021,-.30)
    t=tt(.075);n=rng.normal(size=len(t));n=n-lfilter([.16],[1,-.84],n)
    add(at+.25,n*np.exp(-t*100),.006,.4)
# Gentle transition air and a restrained brand signature, not a loud cinematic trailer hit.
for at in [3.6,6.6,8.9,12.3,18.25,21.95,25.7,28.7]:
    t=tt(.32);u=t/.32;n=lfilter([.07],[1,-.93],rng.normal(size=len(t)))
    add(at-.32,n*np.sin(np.pi*u)**2,.028,-.25)
for j,m in enumerate([69,76,81]):add(28.8+j*.12,note(m,2.8,1.8),.031,j*.3-.3)
for delay,gain in [(.13,.14),(.27,.075),(.43,.04)]:
    offset=round(delay*SR);bed[offset:]+=bed[:-offset,::-1].copy()*gain
time=np.arange(N)/SR
bed*= (np.minimum(time/.30,1)*np.minimum((DUR-time)/1.15,1))[:,None]
with wave.open(str(ROOT/'assets/narration-original.wav')) as w:
    assert w.getframerate()==24000 and w.getnchannels()==1 and w.getsampwidth()==2
    source=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
voice=resample_poly(source,2,1)
voice=np.pad(voice,(0,N-len(voice)))
# Only constant gain and sample-rate conversion affect the supplied narration; no cutting or atempo.
voice_gain=10**(-3.85/20)
voice*=voice_gain
active=maximum_filter1d((abs(voice)>.012).astype(float),size=int(.16*SR))
active=lfilter([.0008],[1,-.9992],active)
duck=1-.58*np.clip(active,0,1)
music=bed*duck[:,None]
mix=np.repeat(voice[:,None],2,axis=1)+music
assert abs(mix).max()<.96,'Unexpected clipping risk'
save(ROOT/'assets/music.wav',bed)
save(ROOT/'assets/final-mix.wav',mix)
manifest={'source_audio_sha256':hashlib.sha256((ROOT/'assets/narration-original.wav').read_bytes()).hexdigest(),
          'source_duration_seconds':len(source)/24000,'output_duration_seconds':32,
          'speech_time_stretch':False,'speech_replacement':False,'speech_constant_gain_db':-3.85,
          'output_sample_rate':SR,'music':'original procedural composition; 120 BPM pulse',
          'sample_peak_dbfs':float(20*np.log10(abs(mix).max()))}
(ROOT/'assets/audio-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps(manifest,indent=2))
