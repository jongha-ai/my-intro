"""Join either two render parts or the single picture render, then mux final audio."""
from pathlib import Path
import subprocess,argparse,json
parser=argparse.ArgumentParser();parser.add_argument('--parts',action='store_true');args=parser.parse_args()
ROOT=Path(__file__).resolve().parents[1]
dist=ROOT/'dist'
parts=[dist/'part-a.mp4',dist/'part-b.mp4']
picture=dist/'picture.mp4'
if args.parts:
    if not all(p.exists() for p in parts):raise SystemExit('Both part-a.mp4 and part-b.mp4 are required.')
    listing=dist/'concat.txt'
    listing.write_text(''.join("file '"+p.name+"'\n" for p in parts))
    subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(listing),'-c','copy',str(picture)],check=True)
elif not picture.exists():raise SystemExit('Render picture.mp4 first, or pass --parts to join two render parts.')
output=dist/'AIWORKS_LAB_AI_Employee_44s_1080x1920.mp4'
info=json.loads(subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_streams','-of','json',str(picture)]))['streams'][0]
video_args=['-c:v','copy']
if info.get('color_range')=='pc' or info.get('pix_fmt','').startswith('yuvj'):
    # Normalize legacy JPEG-range renders to SDR Rec.709 for predictable MP4 playback.
    video_args=['-vf','scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','slow','-crf','16','-threads','4','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709']
subprocess.run(['ffmpeg','-y','-v','error','-i',str(picture),'-i',str(ROOT/'assets/mix.wav'),'-map','0:v:0','-map','1:a:0',*video_args,'-c:a','aac','-b:a','256k','-ar','48000','-t','44','-movflags','+faststart',str(output)],check=True)
print(output)
