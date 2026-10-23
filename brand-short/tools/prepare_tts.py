"""Reconstruct Supertonic 3 quantized ONNX files from pinned npm data packages.

No JavaScript is executed. Every downloaded tarball must match SHA-512 SRI.
Model payloads are redistributed by @3sln; original model: Supertone/supertonic-3.
"""
import argparse,base64,hashlib,io,json,tarfile,urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def prepare(out):
    lock=json.loads((ROOT/'tools/tts-model-lock.json').read_text())
    packages={}
    for item in lock:
        with urllib.request.urlopen(item['url'],timeout=120) as response:data=response.read()
        algorithm,digest=item['integrity'].split('-',1)
        if algorithm!='sha512' or base64.b64encode(hashlib.sha512(data).digest()).decode()!=digest:
            raise RuntimeError('Integrity check failed: '+item['name'])
        with tarfile.open(fileobj=io.BytesIO(data),mode='r:gz') as tar:
            # Read known data members only; never extract arbitrary archive paths.
            content={m.name:tar.extractfile(m).read() for m in tar.getmembers() if m.isfile() and (m.name.startswith('package/c/') or m.name in ['package/voice.js','package/LICENSE-LICENSE','package/LICENSE-README-md'])}
        packages[item['name']+'@'+item['version']]=content
        print('SHA-512 verified:',item['name'],flush=True)
    first=packages[lock[0]['name']+'@'+lock[0]['version']]
    js=first['package/voice.js'].decode();meta=json.loads(js[js.index('{'):js.rindex('}')+1])
    out.mkdir(parents=True,exist_ok=True)
    for name,info in meta['files'].items():
        data=bytearray()
        for part in info['parts']:
            pkg,relative=part.split('/c/')
            js=packages[pkg]['package/c/'+relative].decode()
            data+=base64.b64decode(js.split('"')[1],validate=True)
        if len(data)!=info['size']:raise RuntimeError('Size mismatch: '+name)
        (out/name).write_bytes(data)
        print('Prepared:',name,len(data),flush=True)
    for name in ['LICENSE-LICENSE','LICENSE-README-md']:
        (out/name).write_bytes(first['package/'+name])
    (out/'model-provenance.json').write_text(json.dumps({'packages':lock,'files':{n:hashlib.sha256((out/n).read_bytes()).hexdigest() for n in meta['files']}},indent=2))

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True)
    prepare(parser.parse_args().output)
