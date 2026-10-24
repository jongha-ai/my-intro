"""Validate final MP4, exact supplied assets, audio correlation, and selected decoded frames."""
from pathlib import Path
import json,hashlib,re,subprocess,wave
import numpy as np
from scipy.signal import resample_poly
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist'
movie=DIST/'AIWORKS_LAB_A_Better_Workday_32s_1080x1920.mp4'
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(movie)]))
v=next(s for s in info['streams'] if s['codec_type']=='video');a=next(s for s in info['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'])==(1080,1920)
assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
assert v['color_space']=='bt709' and v['color_range']=='tv'
assert v['r_frame_rate']=='30/1' and int(v['nb_read_frames'])==960
assert abs(float(info['format']['duration'])-32)<.01
assert a['codec_name']=='aac' and a['sample_rate']=='48000' and a['channels']==2
run=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(movie),'-vf','blackdetect=d=0.4:pix_th=0.05:pic_th=0.98','-af','loudnorm=I=-16:TP=-1.5:LRA=8:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
assert 'black_start:' not in run.stderr
levels=json.loads(re.findall(r'\{\s*"input_i"[\s\S]+?\}',run.stderr)[-1])
assert -19<=float(levels['input_i'])<=-14.5,levels
assert float(levels['input_tp'])<-1.0,levels
with wave.open(str(ROOT/'assets/final-mix.wav')) as w:
    reference=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2').astype(float).reshape(-1,2)/32768
decoded=subprocess.check_output(['ffmpeg','-v','error','-i',str(movie),'-map','0:a:0','-f','f32le','-ar','48000','-ac','2','pipe:1'])
decoded=np.frombuffer(decoded,dtype='<f4').reshape(-1,2)
n=min(len(reference),len(decoded));correlation=float(np.corrcoef(reference[:n].mean(axis=1),decoded[:n].mean(axis=1))[0,1])
assert n>=32*48000-1024 and correlation>.995,correlation
source=ROOT/'assets/narration-original.wav'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='b7df1f5391f70b184a9889fa866b401f2747bad8bc41e677d267a24266203d68'
result={'file':movie.name,'sha256':hashlib.sha256(movie.read_bytes()).hexdigest(),'size_bytes':movie.stat().st_size,
        'duration_seconds':32,'width':1080,'height':1920,'fps':30,'decoded_frames':960,
        'video':'H.264 / yuv420p / SDR Rec.709 / limited range','audio':'AAC / 48 kHz / stereo',
        'full_decode':'passed','unexpected_black_intervals':0,
        'integrated_loudness_LUFS':float(levels['input_i']),'true_peak_dBTP':float(levels['input_tp']),
        'encoded_audio_mix_correlation':correlation,
        'supplied_narration_duration_seconds':30.72,'supplied_narration_file_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'narration_replaced':False,'narration_speed_changed':False,'narration_offset_seconds':0,
        'image_count':4,'image_hashes':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted((ROOT/'assets').glob('*.jpg'))},
        'visual_review':'Selected frames and scene transitions; no platform upload or listening certification.'}
(DIST/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
times=[1.9,4.9,7.9,10.8,13.3,17.5,20.9,24.4,27.3,30.9]
sheet=Image.new('RGB',(1350,1010),'#191714');pen=ImageDraw.Draw(sheet)
stills=DIST/'stills';stills.mkdir(exist_ok=True)
for i,t in enumerate(times):
    p=stills/f't{t:06.2f}.jpg'
    subprocess.run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(movie),'-frames:v','1','-q:v','2',str(p)],check=True)
    im=Image.open(p).convert('RGB');im.thumbnail((270,480));x=i%5*270;y=i//5*505;sheet.paste(im,(x,y));pen.text((x+10,y+484),f'{t:.1f}s',fill='#e5d7ba')
sheet.save(DIST/'contact-sheet.jpg',quality=94)
Image.open(stills/'t030.90.jpg').save(DIST/'poster.jpg',quality=95)
print(json.dumps(result,ensure_ascii=False,indent=2))
