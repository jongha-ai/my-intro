// 오프닝 HTML을 프레임 단위로 캡처해 MP4로 만듭니다.
//   전체 렌더:  NODE_PATH=$(npm root -g) node tools/render.js
//   미리보기:   NODE_PATH=$(npm root -g) node tools/render.js --stills 3,10,17 --out stills
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const ROOT = path.resolve(__dirname, '..');
const FPS = Number(opt('fps', 30));
const FROM = Number(opt('from', 0));
const TO = Number(opt('to', 70));
const stills = opt('stills', null);
const out = path.resolve(ROOT, opt('out', stills ? 'stills' : 'dist/opening.mp4'));
const audio = ['assets/soundtrack.wav', 'assets/soundtrack.mp3'].map(f => path.join(ROOT, f)).find(f => fs.existsSync(f)) || '';

// 간단한 로컬 정적 서버 (file:// 보다 폰트/이미지 로딩이 안정적)
const http = require('http');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

(async () => {
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', m => console.log('[page]', m.text()));
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());   // 렌더링은 로컬 폰트만 사용
  await page.goto(`http://127.0.0.1:${srv.address().port}/index.html?render`, { waitUntil: 'load' });
  await page.evaluate(() => window.__ready);

  if (stills) {
    fs.mkdirSync(out, { recursive: true });
    for (const s of stills.split(',')) {
      const t = Number(s);
      await page.evaluate(t => window.__seek(t), t);
      await page.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(6, '0')}.jpg`), type: 'jpeg', quality: 85 });
    }
    await browser.close(); srv.close();
    return;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const ffArgs = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-'];
  if (fs.existsSync(audio) && FROM === 0) ffArgs.push('-i', audio);
  ffArgs.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart');
  if (fs.existsSync(audio) && FROM === 0) ffArgs.push('-c:a', 'aac', '-b:a', '256k', '-shortest');
  ffArgs.push(out);
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

  const total = Math.round((TO - FROM) * FPS);
  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    const t = FROM + f / FPS;
    await page.evaluate(t => window.__seek(t), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 150 === 0) console.log(`frame ${f}/${total}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close(); srv.close();
  console.log('done →', out);
})();
