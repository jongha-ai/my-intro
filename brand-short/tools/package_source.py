"""Create a self-contained source bundle with retained audio and fonts, without models."""
from pathlib import Path
import hashlib,zipfile
ROOT=Path(__file__).resolve().parents[1]
skip_dirs={'node_modules','.venv','__pycache__','models'}
files=[]
for p in sorted(ROOT.rglob('*')):
    if not p.is_file():continue
    rel=p.relative_to(ROOT)
    if any(part in skip_dirs for part in rel.parts):continue
    if p.name=='SOURCE_MANIFEST.sha256':continue
    if rel.parts[0]=='dist' and (p.suffix in {'.mp4','.zip','.png'} or p.name=='concat.txt'):continue
    if p.name=='mix-premaster.wav' or (p.name.startswith('voice-') and p.suffix=='.wav'):continue
    files.append(p)
manifest=ROOT/'SOURCE_MANIFEST.sha256'
manifest.write_text(''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(ROOT).as_posix()}\n' for p in files))
files.append(manifest)
output=ROOT/'dist/AIWORKS_LAB_brand_short_source.zip'
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in files:archive.write(p,'brand-short/'+p.relative_to(ROOT).as_posix())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
print(output,output.stat().st_size,'bytes;',len(files),'source files; CRC passed')
