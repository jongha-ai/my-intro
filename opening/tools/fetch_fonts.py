"""index.html에 쓰인 글자만 담은 웹폰트를 내려받아 assets/fonts 에 저장합니다.

문구를 바꾼 뒤에는 이 스크립트를 다시 실행하세요:  python3 tools/fetch_fonts.py
(인터넷이 되는 환경이면, 새로 추가된 글자는 Google Fonts에서 자동으로 보충됩니다.)
"""
import os
import re
import subprocess
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'fonts')
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'

# (Google 패밀리 이름, 로컬 이름, 축 지정, 파일 접두어)
FACES = [
    ('Noto Sans KR', 'wght@300', 'nsk-300'), ('Noto Sans KR', 'wght@500', 'nsk-500'),
    ('Noto Sans KR', 'wght@700', 'nsk-700'), ('Noto Sans KR', 'wght@900', 'nsk-900'),
    ('Noto Serif KR', 'wght@300', 'nserif-300'), ('Noto Serif KR', 'wght@500', 'nserif-500'),
    ('Noto Serif KR', 'wght@700', 'nserif-700'), ('Noto Serif KR', 'wght@900', 'nserif-900'),
    ('Montserrat', 'wght@500', 'mont-500'), ('Montserrat', 'wght@700', 'mont-700'),
    ('Montserrat', 'wght@800', 'mont-800'), ('Montserrat', 'wght@900', 'mont-900'),
    ('Cormorant Garamond', 'ital,wght@1,500', 'corm-500i'),
]


def curl(url, binary=False):
    return subprocess.run(['curl', '-sSfL', '-A', UA, url], check=True, capture_output=True).stdout if binary else \
        subprocess.run(['curl', '-sSfL', '-A', UA, url], check=True, capture_output=True, text=True).stdout


def main():
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    chars = set(ch for ch in html if ord(ch) > 0x7e)
    chars |= set(chr(c) for c in range(0x20, 0x7f))
    chars |= set('·→「」₩♪,.')
    text = ''.join(sorted(chars))
    os.makedirs(OUT, exist_ok=True)
    css_out = []
    for family, axis, prefix in FACES:
        q = urllib.parse.urlencode({'family': f'{family}:{axis}', 'text': text, 'display': 'block'})
        css = curl('https://fonts.googleapis.com/css2?' + q)
        src = re.search(r'src: url\((.*?)\)', css).group(1)
        weight = re.search(r'font-weight: (\d+)', css).group(1)
        style = re.search(r'font-style: (\w+)', css).group(1)
        fn = prefix + '.woff2'
        with open(os.path.join(OUT, fn), 'wb') as f:
            f.write(curl(src, binary=True))
        css_out.append(
            "@font-face { font-family: '%s Local'; font-style: %s; font-weight: %s; font-display: block; src: url('%s') format('woff2'); }"
            % (family, style, weight, fn))
        print('ok', fn)
    with open(os.path.join(OUT, 'fonts.css'), 'w', encoding='utf-8') as f:
        f.write('/* tools/fetch_fonts.py 로 생성됨 */\n' + '\n'.join(css_out) + '\n')


if __name__ == '__main__':
    main()
