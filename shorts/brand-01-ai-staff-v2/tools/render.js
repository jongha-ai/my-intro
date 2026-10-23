// 쇼츠 HTML을 프레임 단위로 캡처합니다 (병렬). 기존 강의 오프닝의 render.js 방식을 세로형·병렬로 확장했습니다.
//
//   미리보기 (정지 화면):  NODE_PATH=$(npm root -g) node tools/render.js --stills 1,6.8,12 --out /tmp/stills
//   전체 프레임 렌더:      NODE_PATH=$(npm root -g) node tools/render.js --frames /tmp/frames --workers 4
//   효과음 큐만 저장:      NODE_PATH=$(npm root -g) node tools/render.js --sfx-only
//
// 렌더가 끝나면 tools/build.sh 가 프레임 + 오디오를 MP4로 합칩니다.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const flag = name => args.includes('--' + name);
const ROOT = path.resolve(__dirname, '..');
const FPS = 30;
const WORKERS = Number(opt('workers', 4));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };

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

async function open(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[pageerror]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
  await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  return page;
}

(async () => {
  const srv = await serve();
  const port = srv.address().port;
  const browser = await chromium.launch();
  const first = await open(browser, port);
  const duration = await first.evaluate(() => window.__duration);
  const sfx = await first.evaluate(() => window.__sfx);
  fs.mkdirSync(path.join(ROOT, 'audio'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'audio', 'sfx_cues.json'), JSON.stringify(sfx, null, 1));
  console.log(`효과음 큐 ${sfx.length}개 저장 (audio/sfx_cues.json), 길이 ${duration}s`);

  if (flag('sfx-only')) { await browser.close(); srv.close(); return; }

  const stills = opt('stills', null);
  if (stills) {
    const out = path.resolve(opt('out', '/tmp/stills'));
    fs.mkdirSync(out, { recursive: true });
    for (const t of stills.split(',').map(Number).sort((a, b) => a - b)) {   // 타임라인은 앞으로만 이동해야 정확합니다
      await first.evaluate(t => window.__seek(t), t);
      await first.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(6, '0')}.png`) });
    }
    console.log('정지 화면 →', out);
    await browser.close(); srv.close();
    return;
  }

  const outDir = path.resolve(opt('frames', '/tmp/frames'));
  fs.mkdirSync(outDir, { recursive: true });
  const total = Math.round(duration * FPS);
  const t0 = Date.now();
  let doneCount = 0;
  const pages = [first];
  for (let i = 1; i < WORKERS; i++) pages.push(await open(browser, port));
  const per = Math.ceil(total / WORKERS);
  await Promise.all(pages.map(async (page, w) => {
    for (let f = w * per; f < Math.min(total, (w + 1) * per); f++) {
      await page.evaluate(t => window.__seek(t), f / FPS);
      await page.screenshot({ path: path.join(outDir, `${String(f).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 });
      if (++doneCount % 150 === 0) console.log(`frame ${doneCount}/${total}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }));
  console.log(`완료: ${total}프레임 → ${outDir}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  await browser.close(); srv.close();
})();
