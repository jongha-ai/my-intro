"""Subset system Noto Sans CJK Korean face; retain all Hangul syllables for edits."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
ROOT=Path(__file__).resolve().parents[1]
for weight in ['Bold','Regular']:
    source=Path('/usr/share/fonts/opentype/noto')/f'NotoSansCJK-{weight}.ttc'
    font=TTFont(source,fontNumber=1)
    opts=subset.Options();opts.flavor='woff2';opts.desubroutinize=True
    sub=subset.Subsetter(options=opts)
    sub.populate(unicodes=list(range(32,127))+list(range(0xAC00,0xD7A4))+list(range(0x2000,0x2070))+[0x2192,0x25CF,0x2713,0x2661,0x25C7,0x2197])
    sub.subset(font);font.flavor='woff2'
    path=ROOT/'assets/fonts'/f'korean-{weight.lower()}.woff2'
    font.save(path);print(path.name,path.stat().st_size,flush=True)
