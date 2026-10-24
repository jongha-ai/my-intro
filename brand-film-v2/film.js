/* A BETTER WORKDAY / AIWORKS LAB / photographic editorial motion film.
   Every frame is a function of time. All four photographs and the voice are supplied assets. */
'use strict';
const canvas=document.getElementById('film'),c=canvas.getContext('2d',{alpha:false});
const W=1080,H=1920,DURATION=32;
const BLACK='#141310',WHITE='#f8f4eb',GOLD='#dabc85',GRAY='#b8b2a5';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,p)=>a+(b-a)*p;
const ease=x=>1-Math.pow(1-clamp(x),4);
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const images=[],mark={};
function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h)}
function line(x,y,xx,yy,color=GOLD,width=2){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function text(s,x,y,size=50,color=WHITE,weight=800,align='left',font='KR'){
 c.font=`${weight} ${size}px ${font},sans-serif`;c.fillStyle=color;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(s,x,y);
}
function fit(s,x,y,size,width,color=WHITE,weight=800,align='left',font='KR'){
 c.font=`${weight} ${size}px ${font},sans-serif`;const measure=c.measureText(s).width;
 text(s,x,y,measure>width?size*width/measure:size,color,weight,align,font);
}
function tracked(s,x,y,size=20,spacing=4,color=GOLD,align='left'){
 c.font=`500 ${size}px EN,sans-serif`;
 const width=[...s].reduce((n,v)=>n+c.measureText(v).width+spacing,0)-spacing;
 let xx=align==='center'?x-width/2:align==='right'?x-width:x;
 for(let v of s){text(v,xx,y,size,color,500,'left','EN');xx+=c.measureText(v).width+spacing}
}
function reveal(s,x,y,size,u,delay=0,color=WHITE,weight=800){
 const p=ease((u-delay)/.65);
 c.save();c.beginPath();c.rect(0,y-size*1.17,W,size*1.35);c.clip();c.globalAlpha=p;
 text(s,x,y+(1-p)*size*1.32,size,color,weight);c.restore();
}
function roundBox(x,y,w,h,color,r=12){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=color;c.fill()}
function glow(x,y,r,color){const a=c.createRadialGradient(x,y,0,x,y,r);a.addColorStop(0,color);a.addColorStop(1,'transparent');c.fillStyle=a;c.fillRect(x-r,y-r,r*2,r*2)}

// Crop photographs as moving camera shots; portrait source pixels are retained intact.
function photo(n,t,{zoom=1.04,cx=.5,cy=.5,x=0,y=0,w=W,h=H,alpha=1,angle=0}={}){
 const im=images[n],scale=Math.max(w/im.width,h/im.height)*zoom;
 c.save();c.globalAlpha=alpha;c.beginPath();c.rect(x,y,w,h);c.clip();
 c.translate(x+w/2,y+h/2);c.rotate(angle);
 const dw=im.width*scale,dh=im.height*scale;
 const dx=clamp(cx*dw-w/2,0,Math.max(0,dw-w));
 const dy=clamp(cy*dh-h/2,0,Math.max(0,dh-h));
 c.drawImage(im,-w/2-dx,-h/2-dy,dw,dh);c.restore();
}
function shade({top=.65,bottom=.83,middle=0,left=0}={}){
 let a=c.createLinearGradient(0,0,0,H);
 a.addColorStop(0,`rgba(10,10,10,${top})`);a.addColorStop(.34,`rgba(10,10,10,${middle})`);a.addColorStop(.57,`rgba(10,10,10,${middle})`);a.addColorStop(1,`rgba(10,10,10,${bottom})`);
 c.fillStyle=a;c.fillRect(0,0,W,H);
 if(left){a=c.createLinearGradient(0,0,W,0);a.addColorStop(0,`rgba(8,10,12,${left})`);a.addColorStop(1,'transparent');c.fillStyle=a;c.fillRect(0,0,W,H)}
}
function grain(t,opacity=.025){
 c.save();c.globalAlpha=opacity;c.globalCompositeOperation='soft-light';
 const dx=(Math.floor(t*12)*37)%96,dy=(Math.floor(t*12)*19)%96;
 c.fillStyle=grainPattern;c.translate(-dx,-dy);c.fillRect(0,0,W+96,H+96);c.restore();
}
let grainPattern;
function makeGrain(){
 const tile=document.createElement('canvas');tile.width=tile.height=96;
 const k=tile.getContext('2d'),im=k.createImageData(96,96);
 let seed=16;
 for(let i=0;i<im.data.length;i+=4){seed=(seed*1664525+1013904223)>>>0;let v=seed>>>24;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}
 k.putImageData(im,0,0);grainPattern=c.createPattern(tile,'repeat');
}
function dust(t,intensity=.5){
 c.save();for(let i=0;i<34;i++){
  const x=(Math.sin(i*87.33)*.5+.5)*W+Math.sin(t*.3+i)*18;
  const y=((Math.sin(i*24.7)*.5+.5)*H-t*(9+i%5)+H*3)%H;
  c.globalAlpha=intensity*(.06+.08*Math.sin(i+t));c.beginPath();c.arc(x,y,1+i%2,0,Math.PI*2);c.fillStyle=GOLD;c.fill();
 }c.restore();
}
function brandHeader(t,{dark=false,section=''}={}){
 const col=dark?BLACK:WHITE;
 tracked('AIWORKS LAB',76,112,22,3,col);
 if(section)tracked(section,1004,111,16,2,dark?'#6c6558':'#e5ddcd','right');
 // Cinematic corner marks, no dashboard chrome or progress indicators.
 line(76,158,126,158,dark?'#14131066':'#f8f4eb77',1);
 line(1004,158,954,158,dark?'#14131066':'#f8f4eb77',1);
}
function footer(s,t,sub=''){
 tracked(s,76,1758,17,3,'#ddd2bc');
 if(sub)text(sub,76,1805,25,'#c5beb0',500);
}
function lightLeak(t,opacity=.4){
 c.save();c.globalCompositeOperation='screen';c.globalAlpha=opacity;
 const x=-400+(t%1)*1900;
 let a=c.createLinearGradient(x-320,0,x+320,0);a.addColorStop(0,'transparent');a.addColorStop(.47,'#9d633a22');a.addColorStop(.5,'#ffe3ad66');a.addColorStop(.53,'#9d633a22');a.addColorStop(1,'transparent');
 c.fillStyle=a;c.fillRect(0,0,W,H);c.restore();
}
function motif(x,y,r,t,alpha=.7){
 c.save();c.globalAlpha=alpha;c.translate(x,y);c.rotate(t*.1);
 for(let j=0;j<3;j++){
  c.save();c.rotate(j*1.05);c.scale(1,.35+.07*j);c.beginPath();c.arc(0,0,r+j*20,0,Math.PI*2);c.strokeStyle=j===0?'#dfc28f77':'#9dc8ee66';c.lineWidth=2;c.stroke();
  const a=t*(.45+j*.12)+j;
  c.beginPath();c.arc(Math.cos(a)*(r+j*20),Math.sin(a)*(r+j*20),5,0,Math.PI*2);c.fillStyle=j===0?GOLD:'#e8f2ff';c.fill();c.restore();
 }c.restore();
}

function busyHook(t){
 const u=t;
 photo(0,t,{zoom:1.035+.020*t,cx:.51,cy:.47});shade({top:.70,bottom:.62,middle:.04});
 brandHeader(t,{section:'A FAMILIAR MORNING'});
 reveal('사장님,',76,304,98,u,.07);
 reveal('오늘도',76,1330,128,u,.62);
 reveal('혼자 하세요?',76,1490,128,u,1.1,GOLD);
 // Oversized outline word dissolves into the desk, editorial rather than interface-like.
 c.save();c.globalAlpha=.05*ease((u-.7)/.8);c.font='800 180px EN';c.strokeStyle=WHITE;c.lineWidth=1;c.strokeText('ALONE?',60,480);c.restore();
 const p=ease((u-1.6)/.7);line(76,1635,76+330*p,1635,GOLD,3);
 footer('ONE OWNER. TOO MANY ROLES.',t);
 dust(t,.5);grain(t);
}
function workload(t){
 const u=t-3.6;
 rect(0,0,W,H,BLACK);
 // Three crop windows slide at different speeds, turning the same photograph into a montage.
 const bands=[{y:0,h:660,cx:.49,cy:.31,z:1.45},{y:674,h:610,cx:.53,cy:.63,z:1.60},{y:1298,h:622,cx:.55,cy:.84,z:1.42}];
 for(let j=0;j<3;j++){
  let b=bands[j];const p=ease((u-j*.08)/.42);
  c.save();c.beginPath();c.rect(0,b.y,W,b.h);c.clip();
  photo(0,t,{x:lerp(j%2?-160:160,0,p),y:b.y,w:W,h:b.h,zoom:b.z+.03*u,cx:b.cx+.008*Math.sin(t),cy:b.cy});
  let a=c.createLinearGradient(0,b.y,W,b.y);a.addColorStop(0,'#10100f90');a.addColorStop(1,'#10100f20');c.fillStyle=a;c.fillRect(0,b.y,W,b.h);
  const yy=b.y+b.h-95;
  tracked('0'+(j+1),77,yy-107,22,3,GOLD);
  const active=j===0?u<.8:j===1?u>=.8&&u<1.65:u>=1.65;
  reveal(['고객 문의','자료 조사','블로그까지'][j],76,yy,105,u,j*.45,active?GOLD:WHITE);
  c.restore();
 }
 line(0,667,W,667,GOLD,2);line(0,1291,W,1291,GOLD,2);
 brandHeader(t,{section:'THE REALITY'});grain(t);
}
function noTime(t){
 const u=t-6.6;
 photo(0,t,{zoom:1.21+.025*u,cx:.54,cy:.60});shade({top:.40,bottom:.88,middle:.17});
 brandHeader(t,{section:'THE REALITY'});
 tracked('SO MUCH TO DO.',76,295,24,5,GOLD);
 reveal('하루가',76,1360,138,u,.03);
 reveal('모자랍니다.',76,1522,138,u,.18,WHITE);
 line(76,1598,76+ease(u/.7)*515,1598,GOLD,3);
 footer('IT IS TIME FOR A DIFFERENT WAY.',t);grain(t);
}
function shift(t){
 const u=t-8.9;
 photo(1,t,{zoom:1.08+.015*u,cx:.48,cy:.49});shade({top:.40,bottom:.82,middle:.04});
 // Shimmering light follows the paths already present in the supplied AI-team photograph.
 motif(613,671,259,t,.25*ease(u/.9));
 c.save();c.globalCompositeOperation='screen';glow(250,800,260,'#6fb7f022');glow(820,420,240,'#f5ca7f22');c.restore();
 brandHeader(t,{section:'A BETTER WORKDAY'});
 tracked('BUT NOW,',76,290,30,6,GOLD);
 reveal('일하는 방식이',76,1390,105,u,.42);
 reveal('달라집니다.',76,1530,120,u,.65,GOLD);
 footer('WITH AI. WITH POSSIBILITY.',t);
 dust(t,.7);grain(t);
}
function collaborate(t){
 const u=t-12.3;
 // Slight counter-movement between crop and light trails suggests depth without distorting faces.
 photo(1,t,{zoom:1.12+.012*u,cx:.45+.014*Math.sin(u*.5),cy:.50+.005*u});shade({top:.78,bottom:.70,middle:.02});
 brandHeader(t,{section:'WORKING TOGETHER'});
 const beats=[
  {a:12.3,b:14.26,k:'01 / DELEGATE',s:['일을','나누고.']},
  {a:14.26,b:15.97,k:'02 / RESEARCH',s:['조사하고.']},
  {a:15.97,b:16.86,k:'03 / PLAN',s:['기획하고.']},
  {a:16.86,b:18.25,k:'04 / CREATE',s:['콘텐츠를','만듭니다.']}
 ];
 const beat=beats.find(b=>t>=b.a&&t<b.b)||beats[beats.length-1],v=t-beat.a;
 tracked(beat.k,76,270,24,4,GOLD);
 if(beat.s.length===2){reveal(beat.s[0],76,410,113,v,0);reveal(beat.s[1],76,554,125,v,.12,GOLD)}
 else reveal(beat.s[0],76,431,123,v,0,GOLD);
 // Floating light fragments form a coordinated team, never a new dashboard.
 c.save();c.globalCompositeOperation='screen';
 for(let j=0;j<24;j++){
  const p=((t*.22+j/24)%1),x=lerp(215,895,p)+Math.sin(p*Math.PI*2+j)*60,y=1370-Math.sin(p*Math.PI)*640+j%4*25;
  c.globalAlpha=.15+.30*Math.sin(p*Math.PI);glow(x,y,9+j%3*3,j%2?'#e7c78c77':'#87c9ee88');
 }c.restore();
 tracked('RESEARCH  /  PLAN  /  CREATE',76,1655,23,3,GOLD);
 footer('ONE TEAM. CONNECTED POSSIBILITIES.',t);dust(t,.5);grain(t);
}
function outputs(t){
 const u=t-18.25;
 photo(2,t,{zoom:1.035+.025*u,cx:.57,cy:.54});shade({top:.64,bottom:.74,middle:.05});
 brandHeader(t,{section:'IDEAS IN MOTION'});
 tracked('ONE IDEA. MANY POSSIBILITIES.',76,272,22,3,GOLD);
 reveal('글 하나가,',76,423,118,u,.0);
 // Type changes exactly as the narration names the formats; giant photographic strips take over.
 const format=t<20.28?'카드뉴스로.':'영상으로.';
 const since=t<20.28?t-19.18:t-20.28;
 reveal(format,76,569,118,since,.0,GOLD);
 const p=ease((u-.45)/.9);
 c.save();c.globalAlpha=p;
 const panels=[{x:68,y:826,w:434,h:660,cx:.29,cy:.64,z:2.35,label:'STORY'},
               {x:540,y:713,w:473,h:762,cx:.76,cy:.57,z:2.65,label:'MOTION'}];
 panels.forEach((b,j)=>{
  const yy=b.y+(1-p)*(j?260:400)+Math.sin(t*.9+j)*8;
  // Actual content from the supplied results image, not fabricated UI or stock cards.
  rect(b.x-3,yy-3,b.w+6,b.h+6,'#dfc48c');
  photo(2,t,{x:b.x,y:yy,w:b.w,h:b.h,zoom:b.z+.05*clamp(u/3),cx:b.cx,cy:b.cy});
  rect(b.x,yy+b.h-77,b.w,77,'#171510d9');tracked(b.label,b.x+27,yy+b.h-27,22,4,WHITE);
 });
 c.restore();
 reveal('더 넓게 이어집니다.',76,1621,63,u,1.40,WHITE,500);
 footer('CONTENT, REIMAGINED.',t);grain(t);
}
function decide(t){
 const u=t-21.95;
 photo(3,t,{zoom:1.14-.012*u,cx:.55,cy:.49});shade({top:.30,bottom:.82,middle:.0});
 brandHeader(t,{section:'BACK TO WHAT MATTERS'});
 const p=ease(u/.8);line(76,1213,76+235*p,1213,GOLD,3);
 reveal('결과를 확인하고,',76,1360,87,u,.1);
 reveal('중요한 결정에',76,1480,93,u,.45);
 reveal('집중하세요.',76,1610,111,u,.7,GOLD);
 footer('YOUR BUSINESS. YOUR DECISION.',t);dust(t,.3);grain(t);
}
function timeBack(t){
 const u=t-25.7;
 // Match-dissolve from the stressed owner to the relaxed owner, framed as a new workday.
 photo(0,t,{zoom:1.11,cx:.55,cy:.49});
 photo(3,t,{zoom:1.09-.012*u,cx:.55,cy:.49,alpha:smooth(u/.85)});
 shade({top:.78,bottom:.68,middle:.04});
 brandHeader(t,{section:'MAKE ROOM FOR TOMORROW'});
 reveal('AI와 함께 일하는',76,342,86,u,.12);
 reveal('새로운 일상.',76,466,111,u,.34,GOLD);
 tracked('MORE SPACE FOR WHAT MATTERS.',76,1644,22,3,WHITE);
 footer('A BETTER WORKDAY, TOGETHER.',t);grain(t);
}
function end(t){
 const u=t-28.7;
 photo(3,t,{zoom:1.08,cx:.55,cy:.49});
 rect(0,0,W,H,`rgba(20,19,16,${lerp(.78,.97,ease(u/1.5))})`);
 glow(540,740,620,'#92714218');
 // An expanding fine-line frame carries the final photographic image into a brand signature.
 const p=ease(u/.9),r=lerp(80,365,p);
 c.save();c.globalAlpha=.35*(1-clamp((u-1.5)/1.5));c.translate(540,800);c.rotate(-.05+u*.02);
 c.strokeStyle=GOLD;c.lineWidth=1;c.strokeRect(-r,-r*1.10,r*2,r*2.20);c.restore();
 tracked('A BETTER WORKDAY.',540,300,25,5,GOLD,'center');
 c.save();c.globalAlpha=p;
 const size=220,yy=lerp(650,590,p);c.drawImage(mark.gold,540-size/2,yy,size,size);c.restore();
 const q=ease((u-.15)/.9);c.save();c.globalAlpha=q;
 fit('AIWORKS',540,1003+(1-q)*60,131,930,WHITE,800,'center','EN');
 tracked('LAB',540,1120+(1-q)*60,75,25,GOLD,'center');c.restore();
 const v=ease((u-.5)/.8);c.save();c.globalAlpha=v;
 text('함께 일하는 AI.',540,1310+(1-v)*40,59,WHITE,500,'center');
 text('달라지는 비즈니스.',540,1395+(1-v)*40,59,WHITE,500,'center');
 line(276,1490,804,1490,'#dabc8555',1);
 text('AI 직원 협업 · 콘텐츠 자동화',540,1573,33,GOLD,500,'center');c.restore();
 tracked('AIWORKS LAB',540,1777,20,5,'#a89a80','center');grain(t,.035);
}

const SHOTS=[
 {at:0,draw:busyHook},{at:3.6,draw:workload},{at:6.6,draw:noTime},{at:8.9,draw:shift},
 {at:12.3,draw:collaborate},{at:18.25,draw:outputs},{at:21.95,draw:decide},{at:25.7,draw:timeBack},{at:28.7,draw:end}
];
function draw(t){
 t=clamp(t,0,DURATION-1/30);let idx=0;while(idx<SHOTS.length-1&&t>=SHOTS[idx+1].at)idx++;
 const u=t-SHOTS[idx].at;
 c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';
 if(idx>0&&u<.34){
  const p=ease(u/.34);
  SHOTS[idx-1].draw(t);
  c.save();const e=-220+(W+440)*p;c.beginPath();c.moveTo(0,0);c.lineTo(e+170,0);c.lineTo(e-170,H);c.lineTo(0,H);c.closePath();c.clip();SHOTS[idx].draw(t);c.restore();
  c.save();c.globalAlpha=Math.sin(Math.PI*p)*.55;line(e+170,0,e-170,H,GOLD,5);c.restore();
 }else SHOTS[idx].draw(t);
 if(t>=8.9&&t<9.55)lightLeak((t-8.9)/.65,.66*Math.sin(Math.PI*clamp((t-8.9)/.65)));
 // A subtle final fade resolves into charcoal, preserving the full supplied narration.
 if(t>31.6)rect(0,0,W,H,`rgba(20,19,16,${.08*smooth((t-31.6)/.4)})`);
}
window.__seek=draw;
window.__duration=DURATION;
window.__ready=(async()=>{
 await Promise.all([document.fonts.load('800 80px KR'),document.fonts.load('500 60px KR'),document.fonts.load('800 80px EN'),document.fonts.load('500 30px EN')]);await document.fonts.ready;
 for(const name of ['01_overloaded_owner.jpg','02_ai_team.jpg','03_content_results.jpg','04_owner_relaxed.jpg']){
  const im=new Image();im.src='assets/'+name;await im.decode();images.push(im);
 }
 const im=new Image();im.src='assets/aiworks-mark.png';await im.decode();
 const m=document.createElement('canvas');m.width=im.width;m.height=im.height;const g=m.getContext('2d');g.drawImage(im,0,0);g.globalCompositeOperation='source-in';g.fillStyle=GOLD;g.fillRect(0,0,m.width,m.height);mark.gold=m;
 makeGrain();draw(0);
})();
if(location.search.includes('render'))document.body.classList.add('render');
else{
 const audio=document.getElementById('audio');let playing=false,endedAt=0;
 document.getElementById('play').onclick=async()=>{await window.__ready;if(playing){audio.pause();playing=false}else{if(audio.currentTime>=31.95)audio.currentTime=0;await audio.play();playing=true}};
 function tick(){if(playing){draw(audio.currentTime);if(audio.ended)playing=false}requestAnimationFrame(tick)}tick();
 addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();document.getElementById('play').click()}if(e.key==='r'){audio.currentTime=0;draw(0)}});
}
