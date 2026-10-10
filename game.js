(()=>{
'use strict';
const V='3';
const cv=document.getElementById('game'),ctx=cv.getContext('2d');
const $=id=>document.getElementById(id);
let W=0,H=0,DPR=1,GROUND=0;
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);GROUND=Math.round(H*0.76);vig=null;}
let vig=null;addEventListener('resize',resize);resize();
// ---------- audio
let AC=null,muted=localStorage.getItem('nr_muted')==='1';
const muteBtn=$('mute');function updMute(){muteBtn.classList.toggle('off',muted);}updMute();
muteBtn.addEventListener('click',e=>{e.stopPropagation();muted=!muted;localStorage.setItem('nr_muted',muted?'1':'0');updMute();});
['touchstart','touchend','mousedown'].forEach(ev=>muteBtn.addEventListener(ev,e=>e.stopPropagation(),{passive:true}));
function tone(f,d,type='sine',v=.06,slide=0){if(muted)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d);}catch(e){}}
const sfx={jump:()=>tone(380,.18,'triangle',.07,300),djump:()=>{tone(520,.25,'triangle',.06,500);tone(780,.2,'sine',.03,600)},coin:()=>{tone(1175,.12,'sine',.05);setTimeout(()=>tone(1568,.18,'sine',.05),55)},slide:()=>tone(180,.2,'sawtooth',.03,-80),die:()=>tone(260,.7,'sawtooth',.08,-220)};
// ---------- assets
const IMG={},LIST=[['run','png'],['poses','png'],['crate','png'],['barrier','png'],['emitter','png'],['coin','png'],['platform','png'],['bg_far','jpg'],['bg_near','webp']];
let loaded=0,ready=false;
LIST.forEach(([n,e])=>{const i=new Image();i.onload=i.onerror=()=>{loaded++;$('lbar').style.width=(loaded/LIST.length*100)+'%';$('lpct').textContent='加载中 '+Math.round(loaded/LIST.length*100)+'%';if(loaded===LIST.length)onReady();};i.src=`assets/${n}.${e}?v=${V}`;IMG[n]=i;});
function onReady(){ready=true;reset();const l=$('loader');l.style.opacity=0;setTimeout(()=>l.remove(),650);showMenu();}
// sprite metrics (source pixels)
const RUN={cw:229,ch:307,n:8},POSE={cw:327,ch:343};
const PS=.47;               // player draw scale
const PL={h:124};           // platform tile draw height
const TOPOFF=.2;            // fraction of tile height above walking line
// ---------- state
let state='start',best=+localStorage.getItem('nr_best')||0,score=0,coinsGot=0,speed=6,dist=0,shake=0,t=0,overAt=0,djAt=0,flash=0;
const P={x:0,y:0,vy:0,w:42,h:116,jumps:0,slide:0,onGround:true,trail:[]};
let obs=[],coins=[],parts=[],segs=[],rain=[],dust=[],lines=[];
for(let i=0;i<90;i++)rain.push({x:Math.random(),y:Math.random(),l:8+Math.random()*16,s:.6+Math.random()*.8});
for(let i=0;i<40;i++)dust.push({x:Math.random(),y:Math.random(),r:Math.random()*1.6+.4,p:Math.random()*7,s:Math.random()*.4+.1});
function TW(){const p=IMG.platform;return p.width*PL.h/p.height;}
function reset(){score=0;coinsGot=0;speed=6;dist=0;shake=0;obs=[];coins=[];parts=[];P.x=Math.max(120,W*.2);P.y=GROUND;P.vy=0;P.jumps=0;P.slide=0;P.onGround=true;P.trail=[];const tw=TW();segs=[{x:-tw,n:Math.ceil((W+600)/tw)+1}];}
const segW=s=>s.n*TW();
function groundAt(x){for(const s of segs)if(x>=s.x+6&&x<=s.x+segW(s)-6)return true;return false;}
function jump(){if(!ready)return;if(state!=='play'){if(state==='start')start();return;}if(P.onGround){P.vy=-15.5;P.jumps=1;P.onGround=false;P.slide=0;sfx.jump();burst(P.x,P.y,'#7ff',10,3);}else if(P.jumps<2){P.vy=-13.5;P.jumps=2;djAt=t;sfx.djump();burst(P.x,P.y-50,'#ff5adc',22,4);}}
function slide(){if(state!=='play')return;if(P.onGround){if(P.slide<=0)sfx.slide();P.slide=42;}else P.vy=Math.max(P.vy,14);}
function start(){if(state==='over'&&t-overAt<40)return;reset();state='play';hideMenu();}
function die(){state='over';overAt=t;shake=22;flash=1;sfx.die();burst(P.x,P.y-50,'#ff4fd8',50,6);if(score>best){best=score;localStorage.setItem('nr_best',best);}setTimeout(showMenu,650);}
function burst(x,y,c,n,v=5){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=Math.random()*v+.5;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:30+Math.random()*30,m:60,c,r:Math.random()*2+1});}}
// ---------- UI
function showMenu(){if(!ready)return;$('menu').classList.remove('hide');$('hud').classList.toggle('hide',state!=='over');const over=state==='over';$('overBox').classList.toggle('hide',!over);$('startBox').classList.toggle('hide',over);$('go').textContent=over?'再来一局':'开始奔跑';$('sBest').textContent=best;if(over){$('oScore').textContent=score;$('oCoins').textContent=coinsGot;$('oBest').textContent=best;$('newRec').classList.toggle('hide',!(score>=best&&score>0));}}
function hideMenu(){$('menu').classList.add('hide');$('hud').classList.remove('hide');}
$('go').addEventListener('click',e=>{e.stopPropagation();start();});
['touchstart','touchend','mousedown'].forEach(ev=>$('menu').addEventListener(ev,e=>e.stopPropagation(),{passive:true}));
addEventListener('keydown',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(e.repeat)return;if(state==='over')start();else jump();}else if(['ArrowDown','KeyS'].includes(e.code)){e.preventDefault();slide();}else if(e.code==='Enter'&&state!=='play')start();});
let ty=null;
cv.addEventListener('touchstart',e=>{e.preventDefault();ty=e.touches[0].clientY;},{passive:false});
cv.addEventListener('touchend',e=>{e.preventDefault();if(ty===null)return;const dy=e.changedTouches[0].clientY-ty;ty=null;if(dy>35)slide();else jump();},{passive:false});
cv.addEventListener('mousedown',e=>{if(e.button===2)slide();else jump();});
cv.addEventListener('contextmenu',e=>e.preventDefault());
// ---------- obstacles
const OB={crate:{w:104},barrier:{h:122},laser:{span:96,eh:142}};
function spawnSeg(){const tw=TW();let last=segs[segs.length-1];
 while(last.x+segW(last)<W+400){const gap=dist>600&&Math.random()<Math.min(.45,.18+dist/30000)?90+Math.random()*speed*8:0;const nx=last.x+segW(last)+gap;const n=2+(Math.random()*3|0);const s={x:nx,n};segs.push(s);const w=segW(s);
  let ox=nx+200;while(ox<nx+w-180){const r=Math.random();let ow=0;
   if(r<.3){const c=IMG.crate,h=OB.crate.w*c.height/c.width;obs.push({type:'crate',x:ox,w:OB.crate.w,h});ow=OB.crate.w;}
   else if(r<.5){const b=IMG.barrier,w2=OB.barrier.h*b.width/b.height;obs.push({type:'barrier',x:ox,w:w2,h:OB.barrier.h});ow=w2;}
   else if(r<.75){obs.push({type:'laser',x:ox,w:OB.laser.span,h:0});ow=OB.laser.span;}
   if(Math.random()<.75){const k=4+(Math.random()*4|0),hi=Math.random()<.5,cy=GROUND-(hi?150:50);const cx=ow?ox+ow/2-(k-1)*20:ox;for(let i=0;i<k;i++)coins.push({x:cx+i*40,y:cy-(ow&&hi?0:Math.sin(i/(k-1)*Math.PI)*(ow?95:30))});}
   ox+=300+Math.random()*320+speed*12;}
  if(gap>0)for(let k=0;k<3;k++)coins.push({x:last.x+segW(last)+gap*(k+1)/4,y:GROUND-120-Math.sin((k+1)/4*Math.PI)*40});
  last=s;}}
function hitRects(o){if(o.type==='laser'){const ey=GROUND-OB.laser.eh+OB.laser.eh*.315;return[[o.x,ey-11,o.w,22]];}return[[o.x+6,GROUND-o.h+6,o.w-12,o.h-6]];}
// ---------- update
function update(){t++;for(const d of dust){d.p+=.02;}
 if(flash>0)flash*=.9;if(shake>0)shake*=.88;
 if(state!=='play'){if(state==='start'){dist+=2.2;}updParts();return;}
 speed=Math.min(17,6+dist/2600);dist+=speed;score=Math.floor(dist/10)+coinsGot*50;
 for(const s of segs)s.x-=speed;for(const o of obs)o.x-=speed;for(const c of coins)c.x-=speed;
 segs=segs.filter(s=>s.x+segW(s)>-50);obs=obs.filter(o=>o.x+o.w>-80);coins=coins.filter(c=>c.x>-50&&!c.got);spawnSeg();
 P.vy+=.8;P.y+=P.vy;const sup=groundAt(P.x-12)||groundAt(P.x+12);
 if(P.y>=GROUND&&sup&&P.y-P.vy<=GROUND+2){if(!P.onGround){burst(P.x,GROUND,'#cfe',6,2);}P.y=GROUND;P.vy=0;P.onGround=true;P.jumps=0;}else P.onGround=false;
 if(P.y>H+150){die();return;}
 if(P.slide>0)P.slide--;
 const sl=P.slide>0&&P.onGround,ph=sl?50:P.h,pw=sl?84:P.w,px=P.x-pw/2+(sl?6:0),py=P.y-ph;
 for(const o of obs)for(const [rx,ry,rw,rh] of hitRects(o))if(px<rx+rw&&px+pw>rx&&py<ry+rh&&py+ph>ry){die();return;}
 for(const c of coins)if(Math.abs(c.x-P.x)<34&&Math.abs(c.y-(P.y-ph/2))<ph/2+16){c.got=true;coinsGot++;sfx.coin();burst(c.x,c.y,'#ffd76a',14,3);}
 P.trail.push({x:P.x,y:P.y,f:pFrame()});if(P.trail.length>10)P.trail.shift();for(const p of P.trail)p.x-=speed;
 if(P.onGround&&t%2===0)parts.push({x:P.x-18,y:P.y-2,vx:-Math.random()*2-speed*.35,vy:-Math.random()*1.5,l:22,m:22,c:sl?'#ff8ae6':'#b8c8ff',r:Math.random()*2+1});
 if(t%3===0&&speed>8)lines.push({x:W+20,y:Math.random()*GROUND*.95,l:80+Math.random()*160,v:speed*(2+Math.random()),a:Math.min(.35,(speed-8)/20)});
 for(const l of lines)l.x-=l.v;lines=lines.filter(l=>l.x+l.l>0);
 $('hScore').textContent=score;$('hCoins').textContent=coinsGot;$('hSpeed').textContent=(speed/6).toFixed(1)+'×';
 updParts();}
function updParts(){for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=.12;p.l--;}parts=parts.filter(p=>p.l>0);}
// ---------- draw helpers
function pFrame(){if(state==='over')return{k:'pose',i:2};const sl=P.slide>0&&P.onGround;if(sl)return{k:'pose',i:3};
 if(!P.onGround&&state==='play'){if(P.jumps===2&&t-djAt<26)return{k:'pose',i:1};return{k:'pose',i:P.vy<2?0:2};}
 return{k:'run',i:((dist/26)|0)%8};}
function drawPlayer(f,x,y,alpha=1,rot=0){const isRun=f.k==='run',im=isRun?IMG.run:IMG.poses,cw=isRun?RUN.cw:POSE.cw,ch=isRun?RUN.ch:POSE.ch;const s=PS*(isRun?1:.96);
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(rot)ctx.rotate(rot);ctx.drawImage(im,f.i*cw,0,cw,ch,-cw*s/2,-(ch-4)*s,cw*s,ch*s);ctx.restore();}
function tileLayer(im,off,y,h){const s=h/im.height,w=im.width*s;let x=-(off%w);if(x>0)x-=w;for(;x<W;x+=w)ctx.drawImage(im,x,y,w+1,h);}
function glowDot(x,y,r,c,a){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,c.replace('A',a));g.addColorStop(1,c.replace('A',0));ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
// ---------- draw
function draw(){if(!ready){ctx.fillStyle='#0b0618';ctx.fillRect(0,0,W,H);return;}
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const bob=state==='play'&&P.onGround?Math.sin(dist/26*Math.PI/2)*1.2:0;
 ctx.save();if(shake>.5)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);ctx.translate(0,bob);
 // sky + far city (mirror-tiled art)
 const far=IMG.bg_far,fh=Math.max(GROUND+30,W/(far.width/2)*far.height)+4,fy=GROUND+26-fh;
 tileLayer(far,dist*.04+t*.05,fy,fh);
 // near buildings (luminance-extracted mass) faster parallax
 const near=IMG.bg_near,sc=fh/far.height,nh=near.height*sc;ctx.globalAlpha=.95;tileLayer(near,dist*.16,fy+fh-nh+18*sc,nh);ctx.globalAlpha=1;
 // atmospheric haze + horizon bloom
 let g=ctx.createLinearGradient(0,GROUND-H*.35,0,GROUND+10);g.addColorStop(0,'rgba(255,90,210,0)');g.addColorStop(1,'rgba(255,90,210,.28)');ctx.fillStyle=g;ctx.fillRect(0,GROUND-H*.35,W,H*.35+10);
 // dust motes (far)
 ctx.globalCompositeOperation='lighter';for(const d of dust){const x=((d.x*W-dist*d.s*.3)%W+W)%W,y=d.y*GROUND+Math.sin(d.p)*8;ctx.fillStyle=`rgba(255,200,255,${.25+.25*Math.sin(d.p*3)})`;ctx.beginPath();ctx.arc(x,y,d.r,0,7);ctx.fill();}ctx.globalCompositeOperation='source-over';
 // void below
 g=ctx.createLinearGradient(0,GROUND,0,H);g.addColorStop(0,'#1a0d33');g.addColorStop(1,'#05020c');ctx.fillStyle=g;ctx.fillRect(-40,GROUND+20,W+80,H);
 // platforms
 const tw=TW(),pi=IMG.platform,top=GROUND-PL.h*TOPOFF;
 for(const s of segs){const w=segW(s);if(s.x>W||s.x+w<0)continue;
  g=ctx.createLinearGradient(0,top+PL.h*.8,0,H);g.addColorStop(0,'#150b2a');g.addColorStop(1,'#040108');ctx.fillStyle=g;ctx.fillRect(s.x+10,top+PL.h*.8,w-20,H);
  for(let i=0;i<s.n;i++){const x=s.x+i*tw;if(x>W||x+tw<0)continue;ctx.drawImage(pi,x,top,tw+1,PL.h);}
  ctx.globalCompositeOperation='lighter';glowDot(s.x+w/2,top+PL.h*.62,w*.6,'rgba(255,60,210,A)',.08);ctx.globalCompositeOperation='source-over';}
 // obstacles
 for(const o of obs){if(o.x>W+80||o.x+o.w<-80)continue;
  if(o.type==='laser'){const e=IMG.emitter,eh=OB.laser.eh,ew=e.width*eh/e.height,ey=GROUND-OB.laser.eh*.315-0;const by=GROUND-eh+eh*.315,pul=.75+.25*Math.sin(t*.4);
   ctx.drawImage(e,o.x-ew/2,GROUND-eh+4,ew,eh);ctx.save();ctx.translate(o.x+o.w,0);ctx.scale(-1,1);ctx.drawImage(e,-ew/2,GROUND-eh+4,ew,eh);ctx.restore();
   ctx.globalCompositeOperation='lighter';const x0=o.x+ew*.3,x1=o.x+o.w-ew*.3;
   g=ctx.createLinearGradient(0,by-14,0,by+14);g.addColorStop(0,'rgba(255,40,200,0)');g.addColorStop(.5,`rgba(255,60,220,${.55*pul})`);g.addColorStop(1,'rgba(255,40,200,0)');ctx.fillStyle=g;ctx.fillRect(x0,by-14+4,x1-x0,28);
   ctx.fillStyle=`rgba(255,${200+40*pul|0},255,${pul})`;ctx.fillRect(x0,by+3,x1-x0,2.5);
   glowDot(x0,by+4,22,'rgba(255,80,230,A)',.8*pul);glowDot(x1,by+4,22,'rgba(255,80,230,A)',.8*pul);
   for(let k=0;k<2;k++){const sx=x0+Math.random()*(x1-x0);ctx.fillStyle='rgba(255,220,255,.8)';ctx.fillRect(sx,by+2+(Math.random()-.5)*6,2,2);}
   ctx.globalCompositeOperation='source-over';}
  else{const im=IMG[o.type];ctx.drawImage(im,o.x,GROUND-o.h+4,o.w,o.h);ctx.globalCompositeOperation='lighter';glowDot(o.x+o.w/2,GROUND-o.h*.5,o.h*.8,o.type==='crate'?'rgba(60,220,255,A)':'rgba(255,60,220,A)',.12);ctx.globalCompositeOperation='source-over';}}
 // coins: scaleX spin + glow
 const ci=IMG.coin,cs=40;for(const c of coins){if(c.x<-30||c.x>W+30)continue;const fy2=c.y+Math.sin(t*.07+c.x*.02)*3,ph=t*.09+c.x*.015,sx=Math.cos(ph);
  ctx.globalCompositeOperation='lighter';glowDot(c.x,fy2,30,'rgba(255,200,80,A)',.35);ctx.globalCompositeOperation='source-over';
  ctx.save();ctx.translate(c.x,fy2);ctx.scale(Math.max(.08,Math.abs(sx)),1);if(sx<0)ctx.filter='brightness(.75)';ctx.drawImage(ci,-cs/2,-cs/2,cs,cs*ci.height/ci.width);ctx.restore();
  if(Math.abs(sx)>.97){ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,255,230,.6)';ctx.fillRect(c.x-cs*.28,fy2-1,cs*.56,1.5);ctx.globalCompositeOperation='source-over';}}
 // player
 if(state==='start'){P.x=Math.max(120,W*.2);P.y=GROUND;P.onGround=true;}
 if(!(state==='over'&&P.y>H)){const f=pFrame();
  if(state==='play')P.trail.forEach((p,i)=>{if(i%3||!P.trail.length)return;ctx.globalCompositeOperation='lighter';drawPlayer(p.f,p.x,p.y,i/P.trail.length*.18);ctx.globalCompositeOperation='source-over';});
  // soft contact shadow
  if(P.onGround||P.y<GROUND){const hgt=Math.max(0,GROUND-P.y),a=Math.max(0,.5-hgt/300);ctx.fillStyle=`rgba(0,0,0,${a})`;ctx.beginPath();ctx.ellipse(P.x,GROUND+2,34-hgt/10,6,0,0,7);ctx.fill();}
  ctx.globalCompositeOperation='lighter';glowDot(P.x,P.y-60,90,P.jumps===2?'rgba(255,70,220,A)':'rgba(90,220,255,A)',.2);ctx.globalCompositeOperation='source-over';
  drawPlayer(f,P.x,P.y,1,state==='over'?Math.min(.6,(t-overAt)*.03):0);}
 // particles
 ctx.globalCompositeOperation='lighter';for(const p of parts){ctx.globalAlpha=Math.min(1,p.l/p.m*1.4);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fill();}ctx.globalAlpha=1;
 // rain + speed lines
 ctx.strokeStyle='rgba(190,170,255,.22)';ctx.lineWidth=1;ctx.beginPath();for(const r of rain){r.y+=.012*r.s;if(r.y>1.05)r.y=-.05;const x=((r.x*W-dist*.6*r.s-t*1.5*r.s)%W+W)%W,y=r.y*H;ctx.moveTo(x,y);ctx.lineTo(x-3-speed*.3,y+r.l);}ctx.stroke();
 for(const l of lines){g=ctx.createLinearGradient(l.x,0,l.x+l.l,0);g.addColorStop(0,`rgba(200,240,255,${l.a})`);g.addColorStop(1,'rgba(200,240,255,0)');ctx.fillStyle=g;ctx.fillRect(l.x,l.y,l.l,1.2);}
 ctx.globalCompositeOperation='source-over';ctx.restore();
 // cinematic grade: cool shadows / warm magenta highlights
 ctx.globalCompositeOperation='soft-light';g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(40,60,200,.55)');g.addColorStop(.6,'rgba(255,60,190,.35)');g.addColorStop(1,'rgba(20,0,60,.6)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 ctx.globalCompositeOperation='source-over';
 if(!vig){vig=ctx.createRadialGradient(W/2,H*.45,Math.min(W,H)*.35,W/2,H*.5,Math.hypot(W,H)*.62);vig.addColorStop(0,'rgba(5,0,15,0)');vig.addColorStop(1,'rgba(5,0,15,.72)');}
 ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
 if(state!=='play'){ctx.fillStyle=state==='start'?'rgba(10,4,30,.35)':'rgba(10,4,30,.5)';ctx.fillRect(0,0,W,H);}
 if(flash>.02){ctx.fillStyle=`rgba(255,80,200,${flash*.35})`;ctx.fillRect(0,0,W,H);}
}
function loop(){update();draw();requestAnimationFrame(loop);}
reset();loop();
window.__nr={get state(){return state},get score(){return score},jump,slide,start,get P(){return P},get obs(){return obs}};
})();
