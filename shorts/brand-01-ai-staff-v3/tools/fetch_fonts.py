"""화면에 쓰인 글자만 담은 웹폰트(woff2)를 Google Fonts에서 받아 assets/fonts 에 저장합니다.

    python3 tools/fetch_fonts.py        # 문구를 바꾼 뒤에는 다시 실행

서체 (모두 SIL OFL 무료 라이선스)
  Anton               압축된 굵은 영문 대문자 — 큰 숫자·헤드라인 (홈페이지 히어로 영상의 RESEARCH / WORKS 느낌)
  Playfair Display    이탤릭 세리프 — "good morning," "AI, works." 같은 악센트
  Noto Serif KR       한글 세리프 — 홈페이지의 주 서체. 제목·카드 이름
  IBM Plex Mono       작은 라벨·숫자
  Pretendard          한글 고딕 본문 (assets/fonts/Pretendard-*.woff2, 별도 파일)
"""
import os, re, subprocess, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'fonts')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
SOURCES = ['index.html', 'main.js', 'narration_map.json', 'script.json']
FAMILIES = [
    ('Anton', 'Anton'),
    ('Playfair Display', 'Playfair+Display:ital,wght@1,800;1,900'),
    ('Noto Serif KR', 'Noto+Serif+KR:wght@600;700;900'),
    ('IBM Plex Mono', 'IBM+Plex+Mono:wght@500;600'),
]

def curl(url, binary=False):
    r = subprocess.run(['curl', '-sSfL', '-m', '60', '-A', UA, url], check=True, capture_output=True)
    return r.stdout if binary else r.stdout.decode('utf-8')

def main():
    chars = set(chr(c) for c in range(0x20, 0x7f)) | set('·→←↗↑↓✓✦★—–…「」“”‘’×')
    for f in SOURCES:
        chars |= set(ch for ch in open(os.path.join(ROOT, f), encoding='utf-8').read() if ord(ch) > 0x7e)
    text = ''.join(sorted(chars))
    os.makedirs(OUT, exist_ok=True)
    css_out = []
    for name, spec in FAMILIES:
        css = curl(f'https://fonts.googleapis.com/css2?family={spec}&text={urllib.parse.quote(text)}&display=block')
        for k, block in enumerate(re.findall(r'@font-face\s*\{(.*?)\}', css, re.S)):
            weight = re.search(r'font-weight:\s*(\d+)', block).group(1)
            style = re.search(r'font-style:\s*(\w+)', block).group(1)
            url = re.search(r'src:\s*url\((.*?)\)', block).group(1)
            fn = f"{name.replace(' ', '')}-{weight}{'i' if style == 'italic' else ''}.woff2"
            open(os.path.join(OUT, fn), 'wb').write(curl(url, True))
            css_out.append(f"@font-face {{ font-family: '{name}'; font-style: {style}; font-weight: {weight}; font-display: block; src: url('{fn}') format('woff2'); }}")
            print('ok', fn)
    open(os.path.join(OUT, 'fonts.css'), 'w', encoding='utf-8').write('/* tools/fetch_fonts.py 로 생성됨 */\n' + '\n'.join(css_out) + '\n')

if __name__ == '__main__':
    main()
