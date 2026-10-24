/* Frame-accurate browser rendering. Requires Playwright and system Chromium. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const { once } = require('events');
const ROOT = path.resolve(__dirname,'..');
const args=process.argv.slice(2);
const opt=(name,def)=>args.includes('--'+name)?args[args.indexOf('--'+name)+1]:def;
const from=Number(opt('from',0)),to=Number(opt('to',32)),fps=30;
const stills=opt('stills','');
const output=path.resolve(ROOT,opt('output',stills?'dist/stills':'dist/picture.mp4'));
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2','.png':'image/png','.wav':'audio/wav'};
(async()=>{
 let browser,server,ff;
 try{
  server=http.createServer((req,res)=>{
   const file=path.resolve(ROOT,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
   if(!file.startsWith(ROOT+path.sep)){res.writeHead(403);res.end();return}
   fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return}res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream'});res.end(data)});
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--font-render-hinting=none']});
  const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`)});
  await page.goto(`http://127.0.0.1:${server.address().port}/index.html?render`,{waitUntil:'load'});
  await page.evaluate(()=>window.__ready);
  const fonts=await page.evaluate(()=>[document.fonts.check('800 80px KR'),document.fonts.check('500 40px KR'),document.fonts.check('800 80px EN')]);
  if(fonts.some(x=>!x))throw Error('Required font unavailable');
  if(stills){
   fs.mkdirSync(output,{recursive:true});
   for(const t of stills.split(',').map(Number)){
    await page.evaluate(t=>window.__seek(t),t);
    await page.screenshot({path:path.join(output,`t${t.toFixed(2).padStart(6,'0')}.png`)});
   }
  }else{
   fs.mkdirSync(path.dirname(output),{recursive:true});
   ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',String(fps),'-c:v','mjpeg','-i','pipe:0','-an','-vf','scale=in_range=pc:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-preset','fast','-crf','17','-threads','2','-pix_fmt','yuv420p','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',output],{stdio:['pipe','inherit','inherit']});
   const result=new Promise((resolve,reject)=>{ff.on('error',reject);ff.on('close',c=>c===0?resolve():reject(Error(`ffmpeg exit ${c}`)))});
   // Avoid unhandled stream errors and preserve ffmpeg's failure status.
   ff.stdin.on('error',e=>errors.push(e.message));
   const total=Math.round((to-from)*fps);
   for(let f=0;f<total;f++){
    await page.evaluate(t=>window.__seek(t),from+f/fps);
    const jpeg=await page.screenshot({type:'jpeg',quality:97});
    if(!ff.stdin.write(jpeg))await once(ff.stdin,'drain');
    if(f%90===0)console.log(`${path.basename(output)} ${f}/${total}`);
    if(errors.length)throw Error(errors.join('\n'));
   }
   ff.stdin.end();await result;
  }
  if(errors.length)throw Error(errors.join('\n'));
  console.log('PASS: local fonts loaded; no browser/HTTP errors; saved',output);
 }finally{
  if(ff&&!ff.killed)ff.kill();if(browser)await browser.close();if(server)server.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1});
