(()=>{
const cv=document.getElementById('game'),ctx=cv.getContext('2d');
let W=0,H=0,DPR=1,GROUND=0;
function resize(){DPR=Math.min(window.devicePixelRatio||1,2);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);GROUND=H*0.78;}
addEventListener('resize',resize);resize();
// audio
let AC=null,muted=localStorage.getItem('nr_muted')==='1';
const muteBtn=document.getElementById('mute');
function updMute(){muteBtn.textContent=muted?'🔇':'🔊';}updMute();
muteBtn.addEventListener('click',e=>{e.stopPropagation();muted=!muted;localStorage.setItem('nr_muted',muted?'1':'0');updMute();});
muteBtn.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});
function beep(f,d,type='square',v=.08,slide=0){if(muted)return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d);}catch(e){}}
const sfx={jump:()=>beep(420,.15,'square',.07,400),djump:()=>beep(600,.18,'triangle',.08,600),coin:()=>{beep(988,.08,'square',.06);setTimeout(()=>beep(1319,.12,'square',.06),60)},slide:()=>beep(200,.15,'sawtooth',.05,-100),die:()=>beep(300,.6,'sawtooth',.12,-260)};
// state
let state='start',best=+localStorage.getItem('nr_best')||0,score=0,coinsGot=0,speed,dist,shake=0,t=0;
const P={x:0,y:0,vy:0,w:34,h:48,jumps:0,slide:0,onGround:true,trail:[]};
let obs=[],coins=[],parts=[],segs=[],stars=[],nextObs=0;
for(let i=0;i<120;i++)stars.push({x:Math.random(),y:Math.random()*.7,s:Math.random()*2+.3,p:Math.random()*6});
function bld(n,seed){const a=[];let x=0;for(let i=0;i<n;i++){const w=40+((seed*i*7919)%90),h=.15+((seed*i*104729)%100)/100*.45;a.push({x,w,h});x+=w+4;}return{a,len:x};}
const city1=bld(40,3),city2=bld(40,7);
function reset(){score=0;coinsGot=0;speed=6;dist=0;shake=0;obs=[];coins=[];parts=[];P.x=W*.2;P.y=GROUND;P.vy=0;P.jumps=0;P.slide=0;P.onGround=true;P.trail=[];segs=[{x:-100,w:W+600}];nextObs=W;}
function groundAt(x){for(const s of segs)if(x>=s.x&&x<=s.x+s.w)return true;return false;}
function jump(){if(state!=='play'){start();return;}if(P.onGround){P.vy=-15;P.jumps=1;P.onGround=false;P.slide=0;sfx.jump();burst(P.x,P.y,'#0ff',10);}else if(P.jumps<2){P.vy=-13;P.jumps=2;sfx.djump();burst(P.x,P.y-20,'#f0f',16);}}
function slide(){if(state!=='play')return;if(P.onGround){if(P.slide<=0)sfx.slide();P.slide=40;}else P.vy=Math.max(P.vy,14);}
function start(){if(state==='over'&&t-overAt<40)return;reset();state='play';}
let overAt=0;
function die(){state='over';overAt=t;shake=25;sfx.die();burst(P.x,P.y-24,'#f06',60);if(score>best){best=score;localStorage.setItem('nr_best',best);}}
function burst(x,y,c,n){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=Math.random()*6+1;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:30+Math.random()*30,c});}}
addEventListener('keydown',e=>{if(['Space','ArrowUp','KeyW'].includes(e.code)){e.preventDefault();if(!e.repeat)jump();}else if(['ArrowDown','KeyS'].includes(e.code)){e.preventDefault();slide();}else if(e.code==='Enter'&&state!=='play')start();});
let ty=null;
cv.addEventListener('touchstart',e=>{e.preventDefault();ty=e.touches[0].clientY;const x=e.touches[0].clientX;if(state==='play'&&ty>H*.5&&x<W*.35){slide();ty=null;}},{passive:false});
cv.addEventListener('touchend',e=>{e.preventDefault();if(ty===null)return;const dy=e.changedTouches[0].clientY-ty;ty=null;if(dy>40)slide();else jump();},{passive:false});
cv.addEventListener('mousedown',e=>{if(e.button===2)slide();else jump();});
cv.addEventListener('contextmenu',e=>e.preventDefault());
function update(){t++;
 for(const s of stars)s.p+=.05;
 if(state!=='play'){updParts();if(shake>0)shake*=.9;return;}
 speed=Math.min(18,6+dist/2500);dist+=speed;score=Math.floor(dist/10)+coinsGot*50;
 // world scroll
 for(const s of segs)s.x-=speed;for(const o of obs)o.x-=speed;for(const c of coins)c.x-=speed;
 segs=segs.filter(s=>s.x+s.w>-50);obs=obs.filter(o=>o.x+o.w>-50);coins=coins.filter(c=>c.x>-50&&!c.got);
 let last=segs[segs.length-1];
 while(last.x+last.w<W+300){const gap=Math.random()<Math.min(.5,.2+dist/30000)?80+Math.random()*speed*8:0;const nx=last.x+last.w+gap;const w=400+Math.random()*700;segs.push({x:nx,w});
   // obstacles on segment
   let ox=nx+150;while(ox<nx+w-120){const r=Math.random();if(r<.45)obs.push({x:ox,w:30,h:40+Math.random()*25,type:'block'});else if(r<.75)obs.push({x:ox,w:60,h:34,type:'laser',y:GROUND-80});
     if(Math.random()<.7){const n=4+(Math.random()*4|0),cy=GROUND-(Math.random()<.5?40:130);for(let k=0;k<n;k++)coins.push({x:ox+60+k*34,y:cy-Math.sin(k/(n-1)*Math.PI)*30});}
     ox+=260+Math.random()*300+speed*10;}
   if(gap>0){for(let k=0;k<3;k++)coins.push({x:last.x+last.w+gap*(k+1)/4,y:GROUND-110-Math.sin((k+1)/4*Math.PI)*40});}
   last=segs[segs.length-1];}
 // physics
 P.vy+=.8;P.y+=P.vy;const supported=groundAt(P.x-10)||groundAt(P.x+10);
 if(P.y>=GROUND&&supported&&P.y-P.vy<=GROUND+2){if(!P.onGround){burst(P.x,GROUND,'#0ff',6);}P.y=GROUND;P.vy=0;P.onGround=true;P.jumps=0;}else P.onGround=false;
 if(P.y>H+100){die();return;}
 if(P.slide>0)P.slide--;
 const ph=P.slide>0?24:P.h,pw=P.slide>0?46:P.w;const px=P.x-pw/2,py=P.y-ph;
 for(const o of obs){let ox=o.x,oy,ow=o.w,oh;if(o.type==='block'){oy=GROUND-o.h;oh=o.h;}else{oy=GROUND-70;oh=36;}
   if(px+4<ox+ow&&px+pw-4>ox&&py+4<oy+oh&&py+ph>oy+2){die();return;}}
 for(const c of coins){if(Math.abs(c.x-P.x)<26&&Math.abs(c.y-(P.y-ph/2))<ph/2+12){c.got=true;coinsGot++;sfx.coin();burst(c.x,c.y,'#ff0',12);}}
 P.trail.push({x:P.x,y:P.y-ph/2});if(P.trail.length>14)P.trail.shift();for(const p of P.trail)p.x-=speed;
 if(P.onGround&&t%3===0)parts.push({x:P.x-12,y:P.y,vx:-Math.random()*3-speed*.3,vy:-Math.random()*2,l:20,c:P.slide>0?'#f0f':'#0ff'});
 updParts();if(shake>0)shake*=.9;}
function updParts(){for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=.15;p.l--;}parts=parts.filter(p=>p.l>0);}
function drawCity(c,f,col,alpha){const off=(dist*f)%c.len;ctx.fillStyle=col;ctx.globalAlpha=alpha;for(let rep=0;rep<3;rep++)for(const b of c.a){const x=b.x-off+rep*c.len;if(x>W||x+b.w<0)continue;const h=b.h*H*.6;ctx.fillRect(x,GROUND-h,b.w,h);}
 ctx.globalAlpha=1;}
function glow(c,b){ctx.shadowColor=c;ctx.shadowBlur=b;}
function draw(){ctx.save();if(shake>.5)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0a0020');g.addColorStop(.6,'#2a0045');g.addColorStop(1,'#ff2a8a');ctx.fillStyle=g;ctx.fillRect(-30,-30,W+60,H+60);
 for(const s of stars){ctx.globalAlpha=.4+.6*Math.abs(Math.sin(s.p));ctx.fillStyle='#fff';ctx.fillRect(((s.x*W-dist*.02)%W+W)%W,s.y*H,s.s,s.s);}ctx.globalAlpha=1;
 // sun
 const sx=W*.7,sy=GROUND-H*.25,sr=Math.min(W,H)*.18;const sg=ctx.createLinearGradient(0,sy-sr,0,sy+sr);sg.addColorStop(0,'#ffe066');sg.addColorStop(1,'#ff2a8a');ctx.fillStyle=sg;glow('#f0a',40);ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.fillStyle='#2a0045';for(let i=0;i<6;i++)ctx.fillRect(sx-sr,sy+i*sr/6+((t*.3)%(sr/6)),sr*2,3+i);
 drawCity(city1,.15,'#3b0a66',.9);drawCity(city2,.35,'#1a0533',1);
 // windows layer
 ctx.fillStyle='#0ff';ctx.globalAlpha=.25;const off=(dist*.35)%city2.len;for(let rep=0;rep<3;rep++)for(const b of city2.a){const x=b.x-off+rep*city2.len;if(x>W||x+b.w<0)continue;const h=b.h*H*.6;for(let wy=GROUND-h+10;wy<GROUND-10;wy+=18)for(let wx=x+6;wx<x+b.w-8;wx+=14)if(((wx*7+wy*3)|0)%5===0)ctx.fillRect(wx,wy,6,8);}ctx.globalAlpha=1;
 // ground
 for(const s of segs){ctx.fillStyle='#0d0221';ctx.fillRect(s.x,GROUND,s.w,H-GROUND);glow('#0ff',15);ctx.strokeStyle='#0ff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s.x,GROUND);ctx.lineTo(s.x+s.w,GROUND);ctx.stroke();ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(255,0,200,.35)';ctx.lineWidth=1;for(let gx=s.x-((dist)%40)+40;gx<s.x+s.w;gx+=40){ctx.beginPath();ctx.moveTo(gx,GROUND);ctx.lineTo(gx+(gx-W/2)*.6,H);ctx.stroke();}
  for(let gy=GROUND+12;gy<H;gy+=(gy-GROUND)*.4+10){ctx.beginPath();ctx.moveTo(s.x,gy);ctx.lineTo(s.x+s.w,gy);ctx.stroke();}}
 // obstacles
 for(const o of obs){if(o.type==='block'){glow('#f06',20);ctx.fillStyle='#300018';ctx.strokeStyle='#f06';ctx.lineWidth=3;ctx.fillRect(o.x,GROUND-o.h,o.w,o.h);ctx.strokeRect(o.x,GROUND-o.h,o.w,o.h);}
  else{const y=GROUND-70;glow('#f0f',20);ctx.fillStyle='#888';ctx.fillRect(o.x-4,y-6,6,GROUND-y+6);ctx.fillRect(o.x+o.w-2,y-6,6,GROUND-y+6);ctx.strokeStyle=`rgba(255,0,255,${.7+.3*Math.sin(t*.5)})`;ctx.lineWidth=4;for(let k=0;k<3;k++){ctx.beginPath();ctx.moveTo(o.x,y+k*16);ctx.lineTo(o.x+o.w,y+k*16);ctx.stroke();}}
  ctx.shadowBlur=0;}
 // coins
 for(const c of coins){const sw=Math.abs(Math.cos(t*.1+c.x*.01));glow('#ff0',15);ctx.fillStyle='#ffd400';ctx.beginPath();ctx.ellipse(c.x,c.y,9*sw+2,10,0,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;}
 // player
 if(state==='play'||state==='start'){if(state==='start'){P.x=W*.2;P.y=GROUND;}
  P.trail.forEach((p,i)=>{ctx.globalAlpha=i/P.trail.length*.4;ctx.fillStyle=P.jumps===2?'#f0f':'#0ff';ctx.fillRect(p.x-14,p.y-10,28,20);});ctx.globalAlpha=1;
  const sl=P.slide>0,ph=sl?24:P.h,pw=sl?46:P.w,x=P.x-pw/2,y=P.y-ph;glow('#0ff',25);ctx.fillStyle='#071a2a';ctx.strokeStyle='#0ff';ctx.lineWidth=3;ctx.fillRect(x,y,pw,ph);ctx.strokeRect(x,y,pw,ph);
  ctx.fillStyle='#f0f';glow('#f0f',15);ctx.fillRect(x+pw-14,y+6,10,5);ctx.shadowBlur=0;
  if(!sl&&P.onGround){const lg=Math.sin(t*.4)*6;ctx.strokeStyle='#0ff';ctx.beginPath();ctx.moveTo(P.x-6,P.y);ctx.lineTo(P.x-6+lg,P.y+0);ctx.stroke();}}
 for(const p of parts){ctx.globalAlpha=Math.min(1,p.l/30);ctx.fillStyle=p.c;ctx.fillRect(p.x,p.y,3,3);}ctx.globalAlpha=1;
 ctx.restore();
 // HUD
 ctx.textAlign='left';ctx.font='bold 22px monospace';glow('#0ff',10);ctx.fillStyle='#0ff';ctx.fillText('分数 '+score,16,34);ctx.fillStyle='#ff0';ctx.fillText('金币 '+coinsGot,16,62);ctx.fillStyle='#f0f';ctx.fillText('最高 '+best,16,90);ctx.shadowBlur=0;
 if(state==='play'){ctx.font='14px monospace';ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillText('速度 x'+(speed/6).toFixed(1),16,114);}
 if(state!=='play'){ctx.fillStyle='rgba(5,0,20,.55)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';const fs=Math.min(72,W/9);
  ctx.font=`bold ${fs}px sans-serif`;glow(state==='start'?'#0ff':'#f06',30);ctx.fillStyle=state==='start'?'#0ff':'#f06';ctx.fillText(state==='start'?'霓虹跑酷':'游戏结束',W/2,H*.35);ctx.shadowBlur=0;
  ctx.font=`${Math.min(22,W/22)}px sans-serif`;ctx.fillStyle='#fff';
  if(state==='over'){ctx.fillText(`本局分数 ${score}　金币 ${coinsGot}　最高分 ${best}`,W/2,H*.45);if(score>=best&&score>0){ctx.fillStyle='#ff0';ctx.fillText('★ 新纪录！★',W/2,H*.51);ctx.fillStyle='#fff';}}
  else{ctx.fillText('空格 / ↑ 跳跃（可二段跳）　↓ 滑铲',W/2,H*.47);ctx.fillText('手机：轻点跳跃，下滑或点左下角滑铲',W/2,H*.53);}
  if(Math.sin(t*.1)>-.3){ctx.font=`bold ${Math.min(28,W/18)}px sans-serif`;ctx.fillStyle='#ff0';ctx.fillText(state==='start'?'点击或按空格开始':'点击或按空格重新开始',W/2,H*.65);}}
}
function loop(){update();draw();requestAnimationFrame(loop);}
reset();loop();
window.__nr={get state(){return state},get score(){return score},jump,slide};
})();
