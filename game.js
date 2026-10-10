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
const P={x:0,y:0,vy:0,w:34,h:56,jumps:0,slide:0,onGround:true,trail:[]};
let obs=[],coins=[],parts=[],segs=[],stars=[],nextObs=0;
for(let i=0;i<120;i++)stars.push({x:Math.random(),y:Math.random()*.7,s:Math.random()*2+.3,p:Math.random()*6});
function bld(n,seed){const a=[];let x=0;for(let i=0;i<n;i++){const w=40+((seed*i*7919)%90),h=.15+((seed*i*104729)%100)/100*.45;a.push({x,w,h});x+=w+4;}return{a,len:x};}
function reset(){score=0;coinsGot=0;speed=6;dist=0;shake=0;obs=[];coins=[];parts=[];P.x=W*.2;P.y=GROUND;P.vy=0;P.jumps=0;P.slide=0;P.onGround=true;P.trail=[];segs=[{x:-100,w:W+600}];nextObs=W;}
function groundAt(x){for(const s of segs)if(x>=s.x&&x<=s.x+s.w)return true;return false;}
function jump(){if(loaded<NAMES.length)return;if(state!=='play'){start();return;}if(P.onGround){P.vy=-15;P.jumps=1;P.onGround=false;P.slide=0;sfx.jump();burst(P.x,P.y,'#0ff',10);}else if(P.jumps<2){P.vy=-13;P.jumps=2;djAt=t;sfx.djump();burst(P.x,P.y-20,'#f0f',16);}}
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
   let ox=nx+150;while(ox<nx+w-120){const r=Math.random();if(r<.45)obs.push(Math.random()<.6?{x:ox,w:30,h:46,type:'block'}:{x:ox,w:30,h:62,type:'block'});else if(r<.75)obs.push({x:ox,w:60,h:34,type:'laser',y:GROUND-80});
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
const IMG={},NAMES=['player','coin','crate','barrier','emitter','tiles','bg_sky','bg_far','bg_near','logo','button'];let loaded=0;
NAMES.forEach(n=>{const i=new Image();i.onload=i.onerror=()=>{loaded++;};i.src='assets/'+n+'.png';IMG[n]=i;});
function spr(im,sx,sy,sw,sh,dx,dy,s){ctx.drawImage(im,sx,sy,sw,sh,Math.round(dx),Math.round(dy),sw*s,sh*s);}
function layer(im,f,y,h){const s=h/im.height,w=im.width*s;let off=-((dist*f)%w);for(let x=off;x<W;x+=w)ctx.drawImage(im,Math.floor(x),Math.round(y),Math.ceil(w)+1,Math.round(h));}
function glow(c,b){ctx.shadowColor=c;ctx.shadowBlur=b;}
let djAt=0;
function pFrame(){if(state==='over')return 15;if(P.slide>0&&P.onGround)return 14;if(!P.onGround){if(P.jumps===2&&t-djAt<24)return 10+(((t-djAt)/6)|0)%4;return P.vy<0?8:9;}return ((dist/22)|0)%8;}
function draw(){ctx.imageSmoothingEnabled=false;
 if(loaded<NAMES.length){ctx.fillStyle='#07001a';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.font='bold 20px monospace';ctx.fillStyle='#0ff';ctx.fillText('加载中 '+Math.round(loaded/NAMES.length*100)+'%',W/2,H/2-20);ctx.strokeStyle='#f0f';ctx.strokeRect(W/2-120,H/2,240,14);ctx.fillStyle='#f0f';ctx.fillRect(W/2-118,H/2+2,236*loaded/NAMES.length,10);return;}
 ctx.save();if(shake>.5)ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 const sk=IMG.bg_sky,ss=Math.max((W+60)/sk.width,(GROUND+40)/sk.height);ctx.drawImage(sk,(W-sk.width*ss)/2-((dist*.01)%10),GROUND+20-sk.height*ss,sk.width*ss,sk.height*ss);
 {const ab=ctx.createLinearGradient(0,GROUND,0,H);ab.addColorStop(0,'#3a0050');ab.addColorStop(1,'#020008');ctx.fillStyle=ab;ctx.fillRect(-30,GROUND,W+60,H);}
 for(const st of stars){if(st.s<1.8)continue;ctx.globalAlpha=Math.max(0,Math.sin(st.p));ctx.fillStyle='#fff';ctx.fillRect(((st.x*W-dist*.02)%W+W)%W|0,st.y*GROUND*.6|0,2,2);}ctx.globalAlpha=1;
 const bh=Math.max(1,H/360);layer(IMG.bg_far,.12,GROUND-120*bh*1.6+8,120*bh*1.6);layer(IMG.bg_near,.3,GROUND-140*bh*1.5+6,140*bh*1.5);
 // haze
 const hz=ctx.createLinearGradient(0,GROUND-60,0,GROUND);hz.addColorStop(0,'rgba(255,40,160,0)');hz.addColorStop(1,'rgba(255,40,160,.35)');ctx.fillStyle=hz;ctx.fillRect(0,GROUND-60,W,60);
 // rooftops
 const TS=64,ti=IMG.tiles;for(const s of segs){if(s.x>W||s.x+s.w<0)continue;ctx.save();ctx.beginPath();ctx.rect(s.x,GROUND,s.w,H-GROUND+40);ctx.clip();
  const n=Math.ceil(s.w/TS);for(let i=0;i<n;i++){const x=s.x+i*TS;if(x>W||x+TS<0)continue;const k=i===0?1:(i===n-1?2:0);spr(ti,k*32,0,32,32,x,GROUND,2);for(let y=GROUND+TS;y<H+shake+20;y+=TS)spr(ti,96,0,32,32,x,y,2);}
  if(s.x+s.w-n*TS<0){}ctx.restore();ctx.fillStyle='#0ff';ctx.fillRect(s.x+s.w-3,GROUND,3,H-GROUND);ctx.fillRect(s.x,GROUND,3,H-GROUND);}
 // obstacles
 for(const o of obs){if(o.x>W+40||o.x+o.w<-40)continue;if(o.type==='block'){const im=o.h>56?IMG.barrier:IMG.crate;glow('#f06',12);ctx.drawImage(im,Math.round(o.x-1),GROUND-im.height*2,im.width*2,im.height*2);}
  else{const y=GROUND-80,e=IMG.emitter;const pul=.6+.4*Math.sin(t*.5);glow('#f0f',18);ctx.strokeStyle=`rgba(255,80,255,${pul})`;ctx.lineWidth=3;for(let k=0;k<3;k++){const ly=y+12+k*16;ctx.beginPath();ctx.moveTo(o.x+4,ly);ctx.lineTo(o.x+o.w-4,ly);ctx.stroke();}
   ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,230,255,.9)';ctx.lineWidth=1;for(let k=0;k<3;k++){const ly=y+12+k*16;ctx.beginPath();ctx.moveTo(o.x+4,ly);ctx.lineTo(o.x+o.w-4,ly);ctx.stroke();}
   ctx.drawImage(e,Math.round(o.x-10),GROUND-e.height*2,e.width*2,e.height*2);ctx.drawImage(e,Math.round(o.x+o.w-10),GROUND-e.height*2,e.width*2,e.height*2);}
  ctx.shadowBlur=0;}
 // coins
 for(const c of coins){if(c.x<-20||c.x>W+20)continue;const f=((t/5+c.x/40)|0)%8;spr(IMG.coin,f*16,0,16,16,c.x-16,c.y-16+Math.sin(t*.08+c.x*.02)*2,2);}
 // player
 if(state==='play'||state==='start'||state==='over'){if(state==='start'){P.x=W*.2;P.y=GROUND;}
  const fr=pFrame();
  P.trail.forEach((p,i)=>{if(i%3)return;ctx.globalAlpha=i/P.trail.length*.25;spr(IMG.player,fr*32,0,32,32,p.x-40,p.y-50,2.5);});ctx.globalAlpha=1;
  if(!(state==='over'&&P.y>H)){glow(P.jumps===2?'#f0f':'#0ff',14);spr(IMG.player,fr*32,0,32,32,P.x-40,P.y-78,2.5);ctx.shadowBlur=0;}}
 for(const p of parts){ctx.globalAlpha=Math.min(1,p.l/30);ctx.fillStyle=p.c;ctx.fillRect(p.x|0,p.y|0,4,4);}ctx.globalAlpha=1;
 ctx.restore();
 // HUD
 ctx.textAlign='left';ctx.font='bold 20px monospace';ctx.fillStyle='rgba(10,0,30,.6)';ctx.fillRect(10,10,170,state==='play'?112:92);ctx.strokeStyle='#0ff';ctx.lineWidth=2;ctx.strokeRect(10,10,170,state==='play'?112:92);
 spr(IMG.coin,((t/5)|0)%8*16,0,16,16,18,44,1.5);
 glow('#0ff',8);ctx.fillStyle='#0ff';ctx.fillText('分数 '+score,20,34);ctx.fillStyle='#ff0';ctx.fillText(''+coinsGot,48,62);ctx.fillStyle='#f0f';ctx.fillText('最高 '+best,20,90);ctx.shadowBlur=0;
 if(state==='play'){ctx.font='14px monospace';ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillText('速度 x'+(speed/6).toFixed(1),20,112);}
 if(state!=='play'){ctx.fillStyle='rgba(5,0,20,.5)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';
  if(state==='start'){const lg=IMG.logo,ls=Math.max(1,Math.min(5,Math.floor(W*.8/lg.width)));glow('#f0f',25);ctx.drawImage(lg,Math.round(W/2-lg.width*ls/2),Math.round(H*.3-lg.height*ls/2+Math.sin(t*.05)*4),lg.width*ls,lg.height*ls);ctx.shadowBlur=0;}
  else{ctx.font=`bold ${Math.min(64,W/9)}px sans-serif`;glow('#f06',30);ctx.fillStyle='#f06';ctx.fillText('游戏结束',W/2,H*.33);ctx.shadowBlur=0;}
  ctx.font=`${Math.min(20,W/24)}px sans-serif`;ctx.fillStyle='#fff';
  if(state==='over'){ctx.fillText(`本局分数 ${score}　金币 ${coinsGot}　最高分 ${best}`,W/2,H*.43);if(score>=best&&score>0){ctx.fillStyle='#ff0';ctx.fillText('★ 新纪录！★',W/2,H*.49);ctx.fillStyle='#fff';}}
  else{ctx.fillText('空格 / ↑ 跳跃（可二段跳）　↓ 滑铲',W/2,H*.5);ctx.fillText('手机：轻点跳跃，下滑或点左下角滑铲',W/2,H*.55);}
  const bw=Math.min(300,W*.7),bhh=bw/3,bx=W/2-bw/2,by=H*.63;glow('#0ff',Math.sin(t*.1)>0?20:8);ctx.drawImage(IMG.button,bx,by,bw,bhh);ctx.shadowBlur=0;
  ctx.font=`bold ${Math.min(26,bw/10)}px sans-serif`;ctx.fillStyle='#ff0';ctx.textBaseline='middle';ctx.fillText(state==='start'?'▶ 开始游戏':'↻ 再来一局',W/2,by+bhh/2+1);ctx.textBaseline='alphabetic';}
}
function loop(){update();draw();requestAnimationFrame(loop);}
reset();loop();
window.__nr={get state(){return state},get score(){return score},jump,slide};
})();
