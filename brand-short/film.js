/* AIWORKS LAB / A NEW KIND OF WORKDAY. Deterministic 44-second motion design. */
'use strict';
const C=document.getElementById('film'),g=C.getContext('2d',{alpha:false});
const W=1080,H=1920,DUR=44;
const INK='#071020',PAPER='#f1f0e8',BLUE='#3262ff',LIME='#d7ff65',MUTED='#a6b2c8';
const CUTS=[0,5,8.5,15,20,25.5,31,36.5,44];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const mix=(a,b,p)=>a+(b-a)*p;
const ease=x=>1-Math.pow(1-clamp(x),3);
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const pop=x=>{x=clamp(x);return 1+Math.pow(2,-7*x)*Math.sin((x-.15)*10)};
const rr=(x,y,w,h,r=22)=>{g.beginPath();g.roundRect(x,y,w,h,r)};
function box(x,y,w,h,color,r=22,stroke){rr(x,y,w,h,r);g.fillStyle=color;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=2;g.stroke()}}
function line(x,y,xx,yy,color,width=2){g.beginPath();g.moveTo(x,y);g.lineTo(xx,yy);g.strokeStyle=color;g.lineWidth=width;g.stroke()}
function txt(s,x,y,size=40,color=PAPER,weight=800,align='left',family='Korean'){
 g.font=`${weight} ${size}px ${family},sans-serif`;g.textAlign=align;g.textBaseline='alphabetic';g.fillStyle=color;g.fillText(s,x,y);
}
function textFit(s,x,y,size,max,color=PAPER,weight=800,align='left',family='Korean'){
 g.font=`${weight} ${size}px ${family},sans-serif`; const w=g.measureText(s).width;
 txt(s,x,y,w>max?size*max/w:size,color,weight,align,family);
}
function label(s,x,y,color=LIME){txt(s,x,y,23,color,800,'left','Brand')}
function reveal(s,x,y,size,t,delay=0,color=PAPER,align='left'){
 const p=ease((t-delay)/.65);g.save();g.beginPath();g.rect(0,y-size*1.2,W,size*1.5);g.clip();
 g.globalAlpha=p;txt(s,x,y+(1-p)*size*1.3,size,color,800,align);g.restore();
}
function pill(s,x,y,w,color=LIME,bg='#172130'){
 box(x,y,w,54,bg,27);txt(s,x+w/2,y+36,24,color,800,'center');
}
function arrow(x,y,size=25,color=PAPER){line(x-size,y,x+size,y,color,3);line(x+size,y,x+size-14,y-14,color,3);line(x+size,y,x+size-14,y+14,color,3)}
function check(x,y,color=LIME,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);g.beginPath();g.moveTo(-15,0);g.lineTo(-4,12);g.lineTo(21,-17);g.strokeStyle=color;g.lineWidth=5;g.lineCap='round';g.stroke();g.restore()}
function glow(x,y,r,color){let a=g.createRadialGradient(x,y,0,x,y,r);a.addColorStop(0,color);a.addColorStop(1,'transparent');g.fillStyle=a;g.fillRect(x-r,y-r,r*2,r*2)}
function grid(t,light=false){
 g.save();g.strokeStyle=light?'rgba(7,16,32,.045)':'rgba(137,160,210,.06)';g.lineWidth=1;
 const dy=(t*18)%90;
 for(let y=-90;y<H;y+=90)line(0,y+dy,W,y+dy,g.strokeStyle,1);
 for(let x=0;x<W;x+=90)line(x,0,x,H,g.strokeStyle,1);
 g.restore();
}
const stars=Array.from({length:80},(_,i)=>({x:(Math.sin(i*789+4)*.5+.5)*W,y:(Math.sin(i*617+7)*.5+.5)*H,r:1+(i%3)}));
function bg(t,light=false){
 g.fillStyle=light?PAPER:INK;g.fillRect(0,0,W,H);
 if(!light){glow(850+Math.sin(t*.3)*130,680,800,'#15306c80');glow(100,1460,600,'#12224260')}
 grid(t,light);
 if(!light){g.fillStyle='#b7d7ff';for(let i=0;i<stars.length;i++){let s=stars[i];g.globalAlpha=.1+.15*Math.sin(t+i);g.fillRect(s.x,(s.y-t*7+H*3)%H,s.r,s.r)}g.globalAlpha=1}
}
function frame(t,idx,light=false){
 const color=light?INK:PAPER;
 txt('AIWORKS',84,119,27,color,800,'left','Brand');txt('LAB',256,119,27,light?BLUE:LIME,800,'left','Brand');
 txt('A NEW KIND OF WORKDAY',996,117,16,light?'#607080':MUTED,500,'right','Brand');
 line(84,153,996,153,light?'#07102025':'#ffffff22',1);
 txt(String(idx+1).padStart(2,'0')+' / 08',84,1795,21,light?INK:MUTED,500,'left','Brand');
 txt('BRAND FILM  /  2026',996,1795,18,light?INK:MUTED,500,'right','Brand');
 box(84,1824,912,3,light?'#07102020':'#ffffff20',1);box(84,1824,912*clamp(t/DUR),3,light?BLUE:LIME,1);
}
function orb(x,y,r,t,alpha=1){
 g.save();g.globalAlpha=alpha;
 glow(x,y,r*1.9,'#3262ff55');
 let a=g.createRadialGradient(x-r*.3,y-r*.5,r*.08,x,y,r);
 a.addColorStop(0,'#abdbff');a.addColorStop(.22,'#608fff');a.addColorStop(.58,'#2549ba');a.addColorStop(.85,'#101d48');a.addColorStop(1,'#030a18');
 g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fillStyle=a;g.fill();
 const rot=t*.38;
 for(let j=0;j<27;j++){
  const lat=(j/26-.5)*Math.PI*.96;
  g.beginPath();
  for(let k=0;k<=90;k++){
   const u=k/90*Math.PI*2;
   const wave=1+.025*Math.sin(u*6+t*2+lat*5);
   let xx=Math.cos(lat)*Math.cos(u)*wave, yy=Math.sin(lat), zz=Math.cos(lat)*Math.sin(u)*wave;
   let X=xx*Math.cos(rot)+zz*Math.sin(rot),Z=zz*Math.cos(rot)-xx*Math.sin(rot);
   let Y=yy*.94+Z*.32;
   const scale=1+Z*.08;
   const px=x+X*r*scale,py=y+Y*r*scale;
   if(k===0)g.moveTo(px,py);else g.lineTo(px,py);
  }
  g.strokeStyle=`rgba(155,216,255,${.1+.19*(j/27)})`;g.lineWidth=1.5;g.stroke();
 }
 // Orbiting luminous trajectories, projected from 3D.
 for(let j=0;j<3;j++){
  g.save();g.translate(x,y);g.rotate(-.5+j*.85+t*.035);g.scale(1,.30+j*.04);
  g.beginPath();g.arc(0,0,r*(1.28+j*.10),0,Math.PI*2);g.strokeStyle=j===0?'#d7ff65aa':'#8ab9ff66';g.lineWidth=3;g.stroke();
  let u=t*(.8+j*.24)+j*2.1;
  g.beginPath();g.arc(Math.cos(u)*r*(1.28+j*.1),Math.sin(u)*r*(1.28+j*.1),7,0,Math.PI*2);g.fillStyle=j===0?LIME:'#fff';g.fill();g.restore();
 }
 txt('AI',x,y+r*.17,r*.67,PAPER,800,'center','Brand');
 g.restore();
}
function taskCard(text,x,y,w,t,angle=0,n=0){
 g.save();g.translate(x,y+Math.sin(t*1.4+n)*9);g.rotate(angle);
 g.shadowColor='#0008';g.shadowBlur=35;g.shadowOffsetY=20;
 box(-w/2,-58,w,116,'#172238',22,'#40516d');g.shadowBlur=0;g.shadowOffsetY=0;
 box(-w/2+22,-28,56,56,n%2?'#e9a84d':'#3262ff',14);
 txt(n%2?'!':'+',-w/2+50,11,34,INK,800,'center','Brand');txt(text,-w/2+100,11,32,PAPER,800);
 box(w/2-43,-9,10,10,LIME,5);g.restore();
}
function coffee(x,y,s,t,kind=0){
 g.save();g.translate(x,y);g.scale(s,s);
 let a=g.createRadialGradient(-20,-90,0,0,0,260);a.addColorStop(0,'#d3ae7d');a.addColorStop(1,'#795a39');
 g.fillStyle=a;g.fillRect(-260,-360,520,660);
 // architectural shadows and saucer
 g.fillStyle='#342a2260';g.beginPath();g.ellipse(28,119,170,43,-.25,0,6.29);g.fill();
 g.fillStyle='#efeee6';g.beginPath();g.ellipse(0,80,155,53,0,0,6.29);g.fill();
 g.strokeStyle='#dedbce';g.lineWidth=23;g.beginPath();g.ellipse(95,-4,42,45,0,0,6.29);g.stroke();
 let cup=g.createLinearGradient(-110,0,110,0);cup.addColorStop(0,'#b8baad');cup.addColorStop(.5,'#ffffff');cup.addColorStop(1,'#c2bfb1');
 g.fillStyle=cup;g.beginPath();g.moveTo(-104,-61);g.bezierCurveTo(-105,120,105,120,104,-61);g.closePath();g.fill();
 g.fillStyle='#f5f1e4';g.beginPath();g.ellipse(0,-61,106,42,0,0,6.29);g.fill();
 g.fillStyle='#8a4a24';g.beginPath();g.ellipse(0,-61,95,33,0,0,6.29);g.fill();
 g.save();g.translate(0,-61);g.scale(1,.37);g.strokeStyle='#f1d6a0';g.lineWidth=7;
 for(let j=0;j<6;j++){g.beginPath();g.ellipse(0,18-j*9,15+j*9,7+j*5,Math.PI*.1,0,Math.PI*2);g.stroke()}
 g.restore();
 for(let j=0;j<3;j++){
  g.beginPath();for(let k=0;k<30;k++){let yy=-112-k*4,xx=(j-1)*33+Math.sin(k*.14+t*2+j)*12;if(k===0)g.moveTo(xx,yy);else g.lineTo(xx,yy)}
  g.strokeStyle='#fff5';g.lineWidth=4;g.stroke();
 }
 g.restore();
}
function phone(x,y,scale,t,variant=0,angle=0){
 g.save();g.translate(x,y);g.rotate(angle);g.scale(scale,scale);
 g.shadowColor='#0008';g.shadowBlur=45;g.shadowOffsetY=30;
 box(-192,-350,384,700,'#0c1423',44,'#6a7890');g.shadowBlur=0;g.shadowOffsetY=0;
 g.save();rr(-178,-334,356,668,34);g.clip();
 g.fillStyle=variant===2?'#e8e6dc':'#efe6d6';g.fillRect(-178,-334,356,668);
 if(variant===0){
  coffee(0,-5,.82,t);g.fillStyle='#0006';g.fillRect(-178,40,356,300);
  txt('새로운 아침,',-145,-210,38,INK);txt('한 잔의 여유.',-145,-156,38,INK);
  pill('NEW MENU',-145,190,194,LIME,INK);txt('바닐라 라테',-145,157,40,PAPER);
  g.beginPath();g.arc(0,-30,43,0,6.29);g.fillStyle='#ffffffcc';g.fill();g.beginPath();g.moveTo(-10,-49);g.lineTo(20,-30);g.lineTo(-10,-11);g.fillStyle=INK;g.fill();
 }else if(variant===1){
  box(-160,-310,36,36,BLUE,18);txt('OUR CAFE',-110,-284,20,INK,800,'left','Brand');
  coffee(0,-12,.65,t);box(-178,172,356,165,'#f3efe4',0);
  txt('이번 주의 작은 행복',-150,214,26,INK);txt('부드러운 바닐라 라테.',-150,257,23,INK,500);
  txt('♡   ◇   ↗',-150,152,30,INK);txt('#신메뉴  #동네카페',-150,297,21,'#526b47',500);
 }else{
  label('CAFE JOURNAL',-145,-276,BLUE);txt('향기로 시작하는',-145,-214,32,INK);txt('우리 동네의 아침',-145,-168,32,INK);
  g.save();rr(-150,-128,300,260,12);g.clip();coffee(0,28,.65,t);g.restore();
  txt('한 잔에 담은 새로운 이야기',-145,183,24,INK);for(let j=0;j<4;j++)box(-145,216+j*25,290-(j%3)*33,7,'#b5b9b1',3);
 }
 g.restore();box(-53,-325,106,15,'#091321',8);
 g.restore();
}
function beam(x,y,xx,yy,t,offset=0,color=LIME){
 g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x,y+(yy-y)*.45,xx,yy-(yy-y)*.45,xx,yy);g.strokeStyle='#53678966';g.lineWidth=2;g.stroke();
 for(let j=0;j<3;j++){
  const p=((t*.5+j/3+offset)%1+1)%1;
  const X=x+(xx-x)*(3*p*p-2*p*p*p),Y=mix(y,yy,p);
  glow(X,Y,22,color+'44');g.beginPath();g.arc(X,Y,4,0,6.29);g.fillStyle=color;g.fill();
 }
}
function heading(a,b,u,size=86,accent=LIME){reveal(a,84,335,size,u,.05);reveal(b,84,451,size,u,.23,accent)}
function scene(i,u,t){
 const light=i===6||i===7;
 bg(t,light);
 // A restrained virtual-camera push gives every composition continuous depth.
 g.save();const zoom=1+.024*clamp(u/(CUTS[i+1]-CUTS[i]));g.translate(540,960);g.scale(zoom,zoom);g.translate(-540,-960);
 switch(i){
 case 0:{
  label('THE OLD WORKDAY',84,226,MUTED);
  reveal('사장님,',84,390,120,u,0);reveal('오늘도',84,546,120,u,.12);reveal('혼자 하세요?',84,702,120,u,.30,LIME);
  txt('09:00',978,886,112,'#2b3a55',800,'right','Brand');
  const tasks=['SNS 홍보','고객 문의','콘텐츠 기획','쇼츠 편집','게시물 작성'];
  const pos=[[332,1018,-.12],[720,1155,.13],[342,1280,-.06],[748,1408,.08],[355,1515,-.10]];
  for(let j=0;j<5;j++){
   const p=ease((u-.3-j*.16)/.6);g.save();g.globalAlpha=p;
   const converge=smooth((u-4.25)/.75);
   g.globalAlpha*=1-converge*.9;
   taskCard(tasks[j],mix(pos[j][0]+(1-p)*(j%2?500:-500),540,converge),mix(pos[j][1],1060,converge),386*(1-converge*.7),t,pos[j][2]+Math.sin(t+j)*.02+converge*(j-2)*.6,j);g.restore();
  }
  label('TOO MANY TABS. ONE OWNER.',84,838,'#7084a8');break;
 }
 case 1:{
  label('A NEW TEAMMATE',84,226);
  heading('AI 직원,','출근 완료.',u,112);
  const p=pop(u/1.25);orb(540,1035,246*p,t);
  g.save();g.globalAlpha=ease((u-.45)/.5);pill('●  ONLINE',415,1396,250,LIME,'#24352c');g.restore();
  const q=ease((u-.2)/.55);box(176,1530+(1-q)*120,728,104,'#14233e',24,'#2e4d80');
  txt('AIWORKS LAB',218,1596+(1-q)*120,31,PAPER,800,'left','Brand');txt('업무 준비 완료',860,1596+(1-q)*120,28,LIME,800,'right');break;
 }
 case 2:{
  label('01 / COLLABORATE',84,226);heading('한마디가','팀의 일이 됩니다.',u,83);
  let p=ease((u-.25)/.6);g.save();g.globalAlpha=p;box(84,552+(1-p)*60,912,146,'#eff0e7',24);
  txt('사장님의 요청',118,596,23,'#5a6370',500);txt('“이번 주 신메뉴, 홍보해 줘.”',118,654,40,INK);g.restore();
  beam(540,720,540,902,t);orb(540,1055,153,t);
  const xs=[228,540,852];const titles=['기획 AI','글쓰기 AI','디자인 AI'];const subs=['방향을 잡고','메시지를 쓰고','시선을 만듭니다'];
  for(let j=0;j<3;j++){
   let p=ease((u-.9-j*.25)/.55);g.save();g.globalAlpha=p;
   beam(540,1160,xs[j],1344,t,j/4,j===1?LIME:'#80aaff');
   box(xs[j]-134,1345+(1-p)*100,268,206,j===1?BLUE:'#15213a',24,j===1?'#6387ff':'#3b506e');
   txt('0'+(j+1),xs[j],1400+(1-p)*100,28,j===1?LIME:'#86abff',800,'center','Brand');
   txt(titles[j],xs[j],1460+(1-p)*100,35,PAPER,800,'center');txt(subs[j],xs[j],1512+(1-p)*100,25,'#d4dcee',500,'center');g.restore();
  }
  txt('역할을 나누고, 결과를 연결합니다.',540,1638,30,MUTED,500,'center');break;
 }
 case 3:{
  label('02 / AUTOMATE',84,226);heading('기획부터 제작까지,','하나의 흐름으로.',u,78);
  g.save();g.translate(540,995);g.rotate(-.075+Math.sin(t*.35)*.02);g.scale(.95,.95);
  box(-414,-375,828,790,'#131e33',32,'#3a4d70');
  txt('CONTENT WORKFLOW',-364,-310,22,MUTED,800,'left','Brand');pill('●  RUNNING',168,-348,194,LIME,'#23332d');
  const rows=[['기획','고객과 메뉴에 맞는 방향'],['카피','브랜드에 맞는 메시지'],['디자인','콘텐츠에 맞는 비주얼'],['쇼츠','세로 영상으로 완성']];
  for(let j=0;j<4;j++){
   const yy=-230+j*140,p=clamp((u-.65-j*.65)/.7);
   box(-364,yy,728,112,p>.98?'#263d38':'#1b2b46',16,p>.98?'#688f57':'#34486a');
   if(p>.98)check(-318,yy+55,LIME,.85);else{
    g.beginPath();g.arc(-318,yy+55,18,t*5,t*5+4.7);g.strokeStyle='#6b9bff';g.lineWidth=3;g.stroke();
   }
   txt(rows[j][0],-265,yy+46,30,PAPER);txt(rows[j][1],-265,yy+83,23,MUTED,500);
   if(j<3){line(-318,yy+114,-318,yy+138,'#5a88ff',3)}
   box(160,yy+32,170,42,p>.98?LIME:'#273a58',21);txt(p>.98?'완료':'처리 중',245,yy+62,22,p>.98?INK:'#9bb6df',800,'center');
  }
  g.restore();
  let phase=(u*.75)%1;box(136,1500,808,84,'#3262ff',18);txt('BRIEF',182,1555,24,PAPER,800,'left','Brand');arrow(365,1541,27);txt('CREATE',444,1555,24,PAPER,800,'left','Brand');arrow(652,1541,27);txt('REVIEW',730,1555,24,PAPER,800,'left','Brand');
  txt('도입 후 활용 흐름을 보여주는 예시입니다.',540,1645,24,MUTED,500,'center');break;
 }
 case 4:{
  label('03 / MULTIPLY',84,226);heading('하나의 아이디어.','여러 개의 콘텐츠.',u,79);
  const p=ease((u-.1)/1.1);
  for(let j of [2,0,1]){
   const xs=[230,540,850],ys=[1070,1160,1060],sc=[.73,.90,.72],angles=[-.14,0,.14];
   const q=ease((u-.2-j*.18)/.8);
   phone(mix(540,xs[j],q),mix(1190,ys[j],q)+Math.sin(t+j)*8,sc[j]*mix(.65,1,p),t,j,angles[j]*q);
  }
  const names=['쇼츠','SNS 게시물','블로그'];
  for(let j=0;j<3;j++){let q=ease((u-1-j*.15)/.5);g.save();g.globalAlpha=q;pill(names[j],116+j*310,1518+(1-q)*50,228,j===1?INK:PAPER,j===1?LIME:'#1a2a44');g.restore()}
  txt('가상의 카페 콘텐츠로 구성한 제작 예시',540,1646,24,MUTED,500,'center');break;
 }
 case 5:{
  label('04 / YOU DECIDE',84,226);heading('AI가 만들고,','사장님이 결정합니다.',u,73);
  phone(330,1070,.93,t,1,-.08);
  const p=ease((u-.4)/.65);g.save();g.translate((1-p)*700,0);
  box(480,850,510,490,'#eff0e7',28,'#d9e2cd');
  label('FINAL REVIEW',524,909,BLUE);txt('최종 확인',524,978,51,INK);txt('브랜드 톤과 내용 확인',524,1042,27,'#535e6f',500);
  txt('✓  메시지 확인',524,1111,27,'#526547',500);txt('✓  이미지 확인',524,1157,27,'#526547',500);
  const approved=u>3.5;
  box(520,1202,432,94,approved?LIME:BLUE,18);
  txt(approved?'승인 완료':'사장님 승인',736,1264,34,approved?INK:PAPER,800,'center');
  if(approved)check(882,1246,INK,.7);
  // animated pointer approaches the approval control; no automatic publish claim.
  if(u>2.5&&u<3.8){const q=ease((u-2.5)/.8);g.save();g.translate(mix(1020,828,q),mix(1450,1267,q));g.beginPath();g.moveTo(0,0);g.lineTo(0,53);g.lineTo(14,38);g.lineTo(29,62);g.lineTo(42,54);g.lineTo(27,30);g.lineTo(51,28);g.closePath();g.fillStyle=INK;g.fill();g.strokeStyle=PAPER;g.lineWidth=3;g.stroke();g.restore()}
  g.restore();
  txt('실행의 중심에는 언제나 사람이 있습니다.',540,1532,34,PAPER,800,'center');
  txt('게시 전 최종 검수와 승인',540,1590,28,MUTED,500,'center');break;
 }
 case 6:{
  label('MORE TIME FOR WHAT MATTERS',84,226,BLUE);
  reveal('반복 업무는',84,390,105,u,0,INK);reveal('줄이고,',84,524,105,u,.2,BLUE);
  // Continuous transformation: task stack collapses into a single delegated card.
  const p=ease((u-.25)/1.9);
  for(let j=3;j>=0;j--){g.save();g.translate(540,930-j*mix(74,16,p));g.rotate(mix((j-1.5)*.075,0,p));
   box(-392,-102,784,204,j===0?BLUE:'#d6d8cf',24,j===0?'#658aff':'#b8bfb3');
   if(j===0){txt(p>.9?'AI 직원과 함께':'기획 · 작성 · 디자인 · 편집',0,-12,38,PAPER,800,'center');txt(p>.9?'반복은 맡기고, 가능성은 넓히고.':'끝없이 이어지던 반복 업무',0,52,28,'#e0e8ff',500,'center')}
   g.restore();}
  let q=ease((u-1.5)/.9);g.save();g.globalAlpha=q;
  txt('고객과 사업에',84,1255+(1-q)*50,92,INK);txt('더 집중하세요.',84,1375+(1-q)*50,92,BLUE);
  line(84,1450,996,1450,'#07102030',2);
  txt('더 가까운 고객.',84,1535,34,INK);txt('더 선명한 다음 전략.',84,1594,34,INK);
  orb(855,1546,60,t);g.restore();break;
 }
 case 7:{
  label('YOUR NEXT WORKDAY STARTS HERE',84,226,BLUE);
  // Brand mark is inherited from the reference repository, not an invented logo.
  const q=ease(u/.9);g.save();g.globalAlpha=q;g.translate(540,681);g.scale(mix(.6,1,q),mix(.6,1,q));
  if(images.mark)g.drawImage(images.mark,-145,-166,290,292);g.restore();
  const p=ease((u-.25)/.85);g.save();g.globalAlpha=p;
  txt('AIWORKS',540,967+(1-p)*70,111,INK,800,'center','Brand');
  txt('LAB',540,1087+(1-p)*70,111,BLUE,800,'center','Brand');g.restore();
  reveal('우리 회사의 첫 AI 직원,',540,1262,59,u,.8,INK,'center');
  reveal('함께 설계하세요.',540,1350,72,u,1.05,INK,'center');
  const r=ease((u-1.8)/.6);g.save();g.globalAlpha=r;
  box(133,1470,814,104,INK,52);txt('AI 직원 도입 · 콘텐츠 자동화 상담',509,1537,34,PAPER,800,'center');arrow(886,1522,19,LIME);g.restore();
  txt('소상공인과 중소기업을 위한 AI 협업 파트너',540,1662,28,'#596779',500,'center');break;
 }
 }
  g.restore();frame(t,i,light);
}
let captions=[];
function subtitles(t,light){
 const s=captions.find(x=>t>=x.start&&t<=x.end);if(!s)return;
 const color=light?INK:PAPER;
 // Two short centered lines, safely above the platform's lower UI area.
 let words=s.caption.split(' '),lines=[''];g.font='500 31px Korean';
 for(let w of words){let n=lines[lines.length-1];if(g.measureText(n+' '+w).width>850)lines.push(w);else lines[lines.length-1]=(n?n+' ':'')+w}
 let yy=1711-(lines.length-1)*21;
 for(let j=0;j<lines.length;j++)txt(lines[j],540,yy+j*42,31,color,500,'center');
}
function draw(t){
 t=clamp(t,0,DUR-1/30);let i=0;while(i<7&&t>=CUTS[i+1])i++;
 let u=t-CUTS[i];
 if(i>0&&u<.45){
  scene(i-1,t-CUTS[i-1],t);
  const p=smooth(u/.45),edge=-260+(W+520)*p;
  g.save();g.beginPath();g.moveTo(0,0);g.lineTo(edge+210,0);g.lineTo(edge-210,H);g.lineTo(0,H);g.closePath();g.clip();scene(i,u,t);g.restore();
  g.save();g.globalAlpha=Math.sin(p*Math.PI)*.6;g.beginPath();g.moveTo(edge+210,0);g.lineTo(edge+270,0);g.lineTo(edge-150,H);g.lineTo(edge-210,H);g.closePath();g.fillStyle=i===7?LIME:BLUE;g.fill();g.restore();
 }else scene(i,u,t);
 subtitles(t,i>=6);
}
const images={};
window.__ready=(async()=>{
 await document.fonts.load('800 80px Korean');await document.fonts.load('500 40px Korean');await document.fonts.load('800 80px Brand');await document.fonts.load('500 40px Brand');await document.fonts.ready;
 const im=new Image();im.src='assets/aiworks-mark.png';await im.decode();images.mark=im;
 captions=await(await fetch('narration.json')).json();draw(0);
})();
window.__seek=draw;
if(location.search.includes('render'))document.body.classList.add('render');
else{
 const audio=document.getElementById('audio');let playing=false;
 document.getElementById('play').onclick=async()=>{await window.__ready;if(playing){audio.pause();playing=false}else{if(audio.currentTime>=43.9)audio.currentTime=0;await audio.play();playing=true}};
 function tick(){if(playing){draw(audio.currentTime);if(audio.ended)playing=false}requestAnimationFrame(tick)}tick();
 window.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();document.getElementById('play').click()}if(e.key==='r'){audio.currentTime=0;draw(0)}});
}
