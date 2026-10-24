"""Bundle editable source plus supplied assets, excluding movie and frame intermediates."""
from pathlib import Path
import hashlib,zipfile
ROOT=Path(__file__).resolve().parents[1]
files=[]
for p in sorted(ROOT.rglob('*')):
    if not p.is_file():continue
    rel=p.relative_to(ROOT)
    if any(x in {'node_modules','.venv','__pycache__','stills','revised-stills'} for x in rel.parts):continue
    if p.name=='SOURCE_MANIFEST.sha256':continue
    if rel.parts[0]=='dist' and (p.suffix in {'.mp4','.zip'} or p.name=='concat.txt'):continue
    files.append(p)
manifest=ROOT/'SOURCE_MANIFEST.sha256'
manifest.write_text(''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(ROOT).as_posix()}\n' for p in files))
files.append(manifest)
output=ROOT/'dist/AIWORKS_LAB_A_Better_Workday_source.zip'
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in files:archive.write(p,'brand-film-v2/'+p.relative_to(ROOT).as_posix())
with zipfile.ZipFile(output) as archive:assert archive.testzip() is None
print(output,output.stat().st_size,'bytes; source CRC passed')
