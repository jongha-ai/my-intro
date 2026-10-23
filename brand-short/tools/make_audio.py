"""Local Korean TTS + original 124 BPM music. No paid APIs. See README."""
from pathlib import Path
import argparse, json, subprocess, wave, sys
import numpy as np
from scipy.signal import resample_poly, lfilter

ROOT=Path(__file__).resolve().parents[1]
SR=48000
DURATION=44
N=SR*DURATION
rng=np.random.default_rng(2718)

def save(path, x):
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1 if x.ndim==1 else x.shape[1]); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x,-1,1)*32767).astype('<i2').tobytes())

def synthesize(model, only=None):
    import onnxruntime as ort
    from supertonic_helper import UnicodeProcessor, Style, TextToSpeech
    model=Path(model)
    index=np.fromfile(model/'unicode_indexer.bin',dtype='<i4')
    (model/'unicode_indexer.json').write_text(json.dumps(index.tolist()))
    with open(model/'voice.bin','rb') as f:
        shapes=np.frombuffer(f.read(48),dtype='<i8'); n,a,b,m,c,d=map(int,shapes)
        ttl=np.frombuffer(f.read(n*a*b*4),dtype='<f4').reshape(n,a,b)
        dp=np.frombuffer(f.read(m*c*d*4),dtype='<f4').reshape(m,c,d)
    # Preset voice, not cloned from a real person. Voice 5 is fixed for reproducibility.
    style=Style(ttl[5:6].copy(),dp[5:6].copy())
    opts=ort.SessionOptions();opts.intra_op_num_threads=4; opts.inter_op_num_threads=1
    sessions=[ort.InferenceSession(str(model/(name+'.onnx')),sess_options=opts,providers=['CPUExecutionProvider'])
              for name in ['duration_predictor','text_encoder','vector_estimator','vocoder']]
    tts=TextToSpeech(json.loads((model/'tts.json').read_text()),UnicodeProcessor(str(model/'unicode_indexer.json')),*sessions)
    script=json.loads((ROOT/'narration.json').read_text())
    voice=np.zeros(N)
    timings=[]
    if only:
        with wave.open(str(ROOT/'assets/narration.wav')) as w:
            voice=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
        timings=json.loads((ROOT/'assets/voice-timing.json').read_text())
    for i,seg in enumerate(script):
        if only and i+1!=only:continue
        np.random.seed(100+i)
        parts=seg.get('parts',[{'text':seg['text'],'lang':'ko'}])
        chunks=[]
        for part in parts:
            wav,dur=tts(part['text'],part['lang'],style,16,1.12)
            chunks.append(wav[0,:int(tts.sample_rate*float(dur[0]))])
            chunks.append(np.zeros(int(tts.sample_rate*.16)))
        raw=np.concatenate(chunks[:-1])
        raw=resample_poly(raw,160,147) if tts.sample_rate==44100 else resample_poly(raw,SR,tts.sample_rate)
        # Trim only silence, retain a short natural breath at each end.
        active=np.flatnonzero(abs(raw)>0.008)
        if not len(active): raise RuntimeError('Empty TTS segment')
        raw=raw[max(0,active[0]-int(.06*SR)):min(len(raw),active[-1]+int(.12*SR))]
        save(ROOT/'assets'/f'voice-{i+1:02}.wav',raw)
        budget=seg['end']-seg['start']
        factor=max(.94,len(raw)/SR/budget)
        if factor>1.30: print('WARNING: fast narration',i+1,factor,flush=True)
        fitted=ROOT/'assets'/f'voice-{i+1:02}-fit.wav'
        subprocess.run(['ffmpeg','-y','-v','error','-i',str(ROOT/'assets'/f'voice-{i+1:02}.wav'),'-af',f'atempo={factor:.7f},loudnorm=I=-18:TP=-3:LRA=7','-ar',str(SR),'-ac','1',str(fitted)],check=True)
        with wave.open(str(fitted)) as w: arr=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
        assert len(arr)/SR < budget+.03,(i,len(arr)/SR,budget)
        ix=round(seg['start']*SR);voice[ix:round(seg['end']*SR)]=0;voice[ix:ix+len(arr)]+=arr
        timing={**seg,'actual_duration':round(len(arr)/SR,3),'tempo_adjustment':round(factor,3)}
        if only:timings[i]=timing
        else:timings.append(timing)
        print('Voice',i+1,'seconds',round(len(arr)/SR,2),'tempo',round(factor,3),flush=True)
    save(ROOT/'assets/narration.wav',voice)
    (ROOT/'assets/voice-timing.json').write_text(json.dumps(timings,ensure_ascii=False,indent=2))

def music():
    dry=np.zeros((N,2)); wet=np.zeros((N,2))
    def add(t,sig,gain=1,pan=0,verb=False):
        idx=round(t*SR)
        if idx<0: sig=sig[-idx:];idx=0
        sig=sig[:N-idx]*gain
        target=wet if verb else dry
        target[idx:idx+len(sig),0]+=sig*np.sqrt((1-pan)/2)
        target[idx:idx+len(sig),1]+=sig*np.sqrt((1+pan)/2)
    def tt(d):return np.arange(round(d*SR))/SR
    def note(m,d=.5):
        t=tt(d); f=440*2**((m-69)/12)
        return (np.sin(2*np.pi*f*t)+.24*np.sin(2*np.pi*f*2.003*t)+.10*np.sin(2*np.pi*f*3*t))*np.minimum(t/.006,1)*np.exp(-t*7)
    beat=60/124
    chords=[[57,60,64,71],[53,57,60,67],[48,55,59,64],[55,59,62,69]]
    for k in range(int(DURATION/beat*4)):
        at=k*beat/4
        chord=chords[int(at/(beat*8))%4]
        if at>43:break
        add(at,note(chord[[0,2,1,3,2,1,3,2][k%8]]+12,.75),.052 if at>5 else .025,(-.5 if k%2 else .5),True)
    for k in range(int(43/beat)):
        at=k*beat
        if at<5:continue
        t=tt(.38);f=47+120*np.exp(-t*45)
        kick=np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*10)
        add(at,kick,.25)
        chord=chords[int(at/(beat*8))%4]
        add(at,note(chord[0]-24,.4),.16)
        t=tt(.13);n=rng.normal(0,1,len(t));n=n-lfilter([.1],[1,-.9],n)
        add(at+beat*.5,n*np.exp(-t*65),.025,.4)
        if k%2:
            t=tt(.2);clap=rng.normal(0,1,len(t))*np.exp(-t*28)
            add(at,clap,.046,-.2,True)
    for at in [5,8.5,15,20,25.5,31,36.5]:
        t=tt(.36);u=t/.36
        n=lfilter([.15],[1,-.85],rng.normal(0,1,len(t)))
        add(at-.36,n*u*u,.20, -.4,True)
        t=tt(.8); sub=np.sin(2*np.pi*(62*t-19*t*t))*np.exp(-t*6)
        add(at,sub,.22)
        for j,m in enumerate([81,88,93]):add(at+j*.065,note(m,1),.065,(-.4+j*.4),True)
    # Confirmation and logo sound signatures.
    for at in [29.4,38.0]:
        for j,m in enumerate([76,83,88]):add(at+j*.1,note(m,1.5),.11,0,True)
    for delay,gain in [(.11,.25),(.23,.15),(.37,.08)]:
        offset=int(delay*SR);dry[offset:]+=wet[:-offset,::-1]*gain
    out=dry+wet
    fade=np.clip(np.arange(N)/SR/.18,0,1)*np.clip((DURATION-np.arange(N)/SR)/1.2,0,1)
    out*=fade[:,None]
    save(ROOT/'assets/music.wav',out)
    with wave.open(str(ROOT/'assets/narration.wav')) as w:
        voice=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float)/32768
    # Smooth narration-aware ducking. Narration always takes priority.
    active=(abs(voice)>.012).astype(float)
    env=lfilter([.0005],[1,-.9995],active)
    duck=1-.65*np.clip(env*3,0,1)
    mixed=voice[:,None]+out*duck[:,None]*.62
    save(ROOT/'assets/mix-premaster.wav',mixed)
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(ROOT/'assets/mix-premaster.wav'),'-af','loudnorm=I=-16:TP=-1.5:LRA=8','-ar',str(SR),'-c:a','pcm_s16le',str(ROOT/'assets/mix.wav')],check=True)

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--model');p.add_argument('--only',type=int);args=p.parse_args()
    if args.model:synthesize(args.model,args.only)
    elif not (ROOT/'assets/narration.wav').exists():p.error('--model required for first synthesis')
    music()
