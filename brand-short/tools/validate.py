"""Validate the delivered MP4 and extract evidence from that file, not the browser."""
from pathlib import Path
import json,re,subprocess,hashlib
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
dist=ROOT/'dist'
film=dist/'AIWORKS_LAB_AI_Employee_44s_1080x1920.mp4'
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(film)]))
video=next(s for s in probe['streams'] if s['codec_type']=='video')
audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
assert (video['width'],video['height'])==(1080,1920)
assert video['codec_name']=='h264' and video['pix_fmt']=='yuv420p'
assert video['r_frame_rate']=='30/1' and int(video['nb_read_frames'])==1320
assert abs(float(probe['format']['duration'])-44)<.01
assert audio['codec_name']=='aac' and audio['sample_rate']=='48000' and audio['channels']==2
run=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(film),'-vf','blackdetect=d=0.4:pix_th=0.05:pic_th=0.98','-af','loudnorm=I=-16:TP=-1.5:LRA=8:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
assert 'black_start:' not in run.stderr,'Unexpected black interval'
stats=json.loads(re.findall(r'\{\s*"input_i"[\s\S]+?\}',run.stderr)[-1])
assert -17.5<=float(stats['input_i'])<=-14.5,stats
assert float(stats['input_tp'])<=-1.0,stats
result={
    'file':film.name,'sha256':hashlib.sha256(film.read_bytes()).hexdigest(),
    'duration_seconds':44,'width':1080,'height':1920,'fps':30,'decoded_video_frames':1320,
    'video_codec':'H.264','pixel_format':'yuv420p','audio_codec':'AAC','sample_rate':48000,'channels':2,
    'size_bytes':film.stat().st_size,'full_decode':'passed','unexpected_black_intervals':0,
    'measured_integrated_loudness_LUFS':float(stats['input_i']),
    'measured_true_peak_dBTP':float(stats['input_tp']),
    'measured_loudness_range_LU':float(stats['input_lra']),
    'checks_scope':'Technical checks plus selected-frame visual inspection; no platform upload or human listening certification.'
}
(dist/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
times=[2,6.8,12.3,18.8,23.2,29.8,34.5,40.8]
stills=dist/'stills';stills.mkdir(exist_ok=True)
sheet=Image.new('RGB',(1080,1010),'#152039');pen=ImageDraw.Draw(sheet)
for i,t in enumerate(times):
    p=stills/f't{t:06.2f}.png'
    subprocess.run(['ffmpeg','-y','-v','error','-ss',str(t),'-i',str(film),'-frames:v','1',str(p)],check=True)
    image=Image.open(p).convert('RGB');image.thumbnail((270,480));x=i%4*270;y=i//4*505
    sheet.paste(image,(x,y));pen.text((x+12,y+483),f'{t:.1f}s',fill='white')
sheet.save(dist/'contact-sheet.jpg',quality=93)
Image.open(stills/'t040.80.png').convert('RGB').save(dist/'poster.jpg',quality=95)
def stamp(s):
    ms=round(s*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
script=json.loads((ROOT/'narration.json').read_text())
(dist/'narration.srt').write_text('\n\n'.join(f"{i+1}\n{stamp(s['start'])} --> {stamp(s['end'])}\n{s['caption']}" for i,s in enumerate(script))+'\n')
print(json.dumps(result,ensure_ascii=False,indent=2))
