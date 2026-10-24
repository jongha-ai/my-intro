"""Assemble this new 32-second film; preserve the video stream without re-encoding."""
from pathlib import Path
import argparse,subprocess
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--parts',action='store_true');args=p.parse_args()
dist=ROOT/'dist';picture=dist/'picture.mp4'
if args.parts:
    parts=[dist/'part-a.mp4',dist/'part-b.mp4']
    if not all(x.exists() for x in parts):raise SystemExit('Both 0–16s and 16–32s parts are required.')
    (dist/'concat.txt').write_text("file 'part-a.mp4'\nfile 'part-b.mp4'\n")
    subprocess.run(['ffmpeg','-y','-v','error','-f','concat','-safe','0','-i',str(dist/'concat.txt'),'-c','copy',str(picture)],check=True)
elif not picture.exists():raise SystemExit('Render picture.mp4 or pass --parts after rendering both parts.')
output=dist/'AIWORKS_LAB_A_Better_Workday_32s_1080x1920.mp4'
subprocess.run(['ffmpeg','-y','-v','error','-i',str(picture),'-i',str(ROOT/'assets/final-mix.wav'),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','256k','-ar','48000','-t','32','-movflags','+faststart',str(output)],check=True)
print(output)
