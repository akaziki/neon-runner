# Generates all pixel-art assets for Neon Runner (pure Pillow, deterministic).
import math, random
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops
OUT='assets/'
random.seed(7)
OUTLINE=(10,5,24,255)
def outline(img,col=OUTLINE):
    a=img.split()[3].point(lambda v:255 if v>0 else 0)
    d=a.filter(ImageFilter.MaxFilter(3))
    ring=ImageChops.subtract(d,a)
    o=Image.new('RGBA',img.size,col);base=Image.new('RGBA',img.size,(0,0,0,0))
    base.paste(o,mask=ring);base.alpha_composite(img);return base
def px(d,x,y,c):d.point((int(round(x)),int(round(y))),fill=c)
def thick(d,a,b,c,w=3):
    (x0,y0),(x1,y1)=a,b;n=int(max(abs(x1-x0),abs(y1-y0))*2)+1
    for i in range(n+1):
        x=x0+(x1-x0)*i/n;y=y0+(y1-y0)*i/n
        r=(w-1)/2
        d.rectangle([round(x-r),round(y-r),round(x-r)+w-1,round(y-r)+w-1],fill=c)
def pt(o,ang,l):  # angle deg from straight down, + = forward(right)
    r=math.radians(ang);return (o[0]+math.sin(r)*l,o[1]+math.cos(r)*l)
# ---------- player ----------
HOOD=(34,44,92,255);HOOD2=(56,72,140,255);CY=(0,240,255,255);MAG=(255,40,190,255)
PANTS=(40,30,70,255);SKIN=(255,206,170,255);SHOE=(255,40,150,255);SHOE2=(255,255,255,255)
VIS=(0,255,230,255);HAIR=(255,60,200,255)
def figure(lean=10,hip=(15,20),legs=((30,40),(-25,10)),arms=((-40,60),(40,70)),head_tilt=0,dead=False,scarf=0):
    im=Image.new('RGBA',(32,32),(0,0,0,0));d=ImageDraw.Draw(im)
    neck=pt(hip,180+lean,9)  # up the torso
    def leg(th,bend,col,shoe):
        k=pt(hip,th,5);f=pt(k,th-bend,5);thick(d,hip,k,col,3);thick(d,k,f,col,3)
        sx,sy=f;d.rectangle([round(sx)-1,round(sy),round(sx)+2,round(sy)+1],fill=shoe);px(d,sx+2,sy+1,SHOE2)
    def arm(a,b,col):
        sh=pt(neck,lean+180,-1);e=pt(sh,a,4);h=pt(e,a-b if a<0 else a+b,4)
        thick(d,sh,e,col,2);thick(d,e,h,col,2);d.rectangle([round(h[0]),round(h[1]),round(h[0])+1,round(h[1])+1],fill=SKIN)
    # back limbs darker
    arm(arms[0][0],arms[0][1],(28,34,70,255));leg(legs[1][0],legs[1][1],(30,22,52,255),(190,20,110,255))
    # scarf trailing
    sc=pt(neck,180+lean,-0.5)
    for i in range(7):
        x=sc[0]-1-i;y=sc[1]+ (math.sin(i*0.9+scarf)*1.2)+i*0.25
        d.rectangle([round(x),round(y),round(x),round(y)+1],fill=MAG)
    # torso
    thick(d,hip,neck,HOOD,5)
    mid=pt(hip,180+lean,4.5);thick(d,pt(hip,180+lean,1),pt(hip,180+lean,8),HOOD2,1)
    px(d,mid[0]+1,mid[1],CY);px(d,mid[0]+1,mid[1]+1,CY)
    leg(legs[0][0],legs[0][1],PANTS,SHOE)
    # head
    hc=pt(neck,180+lean+head_tilt,3.5);x,y=round(hc[0]),round(hc[1])
    d.ellipse([x-3,y-3,x+3,y+3],fill=SKIN)
    d.rectangle([x-3,y-4,x+3,y-2],fill=HAIR);d.rectangle([x-4,y-3,x-3,y+1],fill=HAIR);px(d,x-5,y-2,HAIR)
    if dead:
        px(d,x+1,y,(20,0,30,255));px(d,x+3,y,(20,0,30,255));px(d,x+2,y-1,(20,0,30,255));px(d,x+2,y+1,(20,0,30,255))
    else:
        d.rectangle([x,y-1,x+4,y],fill=VIS);px(d,x+4,y-1,(255,255,255,255))
    arm(arms[1][0],arms[1][1],HOOD2)
    return outline(im)
frames=[]
for i in range(8):
    p=i/8*2*math.pi
    def L(ph):
        th=32*math.sin(ph);bend=15+45*max(0,math.cos(ph))
        return (th,bend)
    bob=round(abs(math.sin(p))*-1)
    frames.append(figure(lean=-12,hip=(15,20+bob),legs=(L(p),L(p+math.pi)),arms=((-40*math.sin(p),70),(40*math.sin(p),70)),scarf=p*2))
jump=figure(lean=-6,hip=(15,18),legs=((50,90),(-20,40)),arms=((-120,30),(120,40)))
fall=figure(lean=-2,hip=(15,18),legs=((20,20),(-10,30)),arms=((-150,10),(150,10)),scarf=2)
tuck=figure(lean=-20,hip=(15,19),legs=((80,130),(60,120)),arms=((60,90),(70,90)))
flips=[tuck.rotate(-90*k,resample=Image.NEAREST,center=(15.5,15.5)) for k in range(4)]
slide=figure(lean=62,hip=(17,27),legs=((92,-5),(82,-15)),arms=((-160,0),(140,20)),head_tilt=0,scarf=1)
dead=figure(lean=92,hip=(19,28),legs=((80,20),(100,40)),arms=((-150,20),(150,30)),dead=True)
allf=frames+[jump,fall]+flips+[slide,dead]  # 0-7 run,8 jump,9 fall,10-13 flip,14 slide,15 dead
sheet=Image.new('RGBA',(32*len(allf),32))
for i,f in enumerate(allf):sheet.paste(f,(32*i,0))
sheet.save(OUT+'player.png')
# ---------- coin 8 frames 16x16 ----------
cs=Image.new('RGBA',(16*8,16))
for i in range(8):
    im=Image.new('RGBA',(16,16));d=ImageDraw.Draw(im)
    w=abs(math.cos(i/8*math.pi))*6+1
    d.ellipse([8-w,2,8+w-1,13],fill=(255,170,0,255))
    if w>2.5:d.ellipse([8-w+1.5,3.5,8+w-2.5,11.5],fill=(255,220,40,255));d.rectangle([7,5,8,10],fill=(255,150,0,255))
    d.line([8-w+1.5,4,8-w+1.5,8],fill=(255,255,220,255))
    cs.paste(outline(im,(80,30,0,255)),(16*i,0))
cs.save(OUT+'coin.png')
# ---------- crate 16x24 & barrier 16x32 ----------
def crate(h,stripe):
    im=Image.new('RGBA',(16,h));d=ImageDraw.Draw(im)
    d.rectangle([0,0,15,h-1],fill=(40,18,48,255));d.rectangle([1,1,14,h-2],fill=(66,28,74,255))
    d.rectangle([0,0,15,h-1],outline=(255,40,120,255))
    d.line([1,1,14,1],fill=(255,150,200,255))
    if stripe:
        for y in range(3,9):
            for x in range(1,15):
                if ((x+y)//2)%2==0:px(d,x,y,(255,210,0,255))
                else:px(d,x,y,(30,20,30,255))
        d.rectangle([4,12,11,h-4],fill=(30,12,40,255));d.rectangle([5,13,10,h-5],outline=(255,40,120,255))
        d.text((6,13),"!",fill=(255,230,0,255)) if h>=30 else None
    else:
        d.line([2,2,13,h-3],fill=(255,40,120,255));d.line([13,2,2,h-3],fill=(255,40,120,255))
        d.rectangle([5,h//2-2,10,h//2+1],fill=(0,240,255,255))
    for (x,y) in [(2,2),(13,2),(2,h-3),(13,h-3)]:px(d,x,y,(220,220,255,255))
    return outline(im)
crate(24,False).save(OUT+'crate.png');crate(32,True).save(OUT+'barrier.png')
# laser emitter 8x40
im=Image.new('RGBA',(8,40));d=ImageDraw.Draw(im)
d.rectangle([2,6,5,39],fill=(70,70,100,255));d.line([2,6,2,39],fill=(130,130,170,255))
d.rectangle([0,0,7,6],fill=(40,40,60,255));d.rectangle([1,1,6,5],fill=(255,0,220,255));d.rectangle([2,2,3,3],fill=(255,200,255,255))
for y in (12,20,28):d.rectangle([1,y,6,y+2],fill=(255,0,220,255))
d.rectangle([0,36,7,39],fill=(40,40,60,255))
outline(im).save(OUT+'emitter.png')
# ---------- rooftop tiles 32x32 ----------
def roof(edge=None):
    im=Image.new('RGBA',(32,32),(20,8,40,255));d=ImageDraw.Draw(im)
    d.rectangle([0,0,31,3],fill=(70,60,110,255));d.line([0,0,31,0],fill=(0,255,255,255));d.line([0,1,31,1],fill=(150,250,255,255))
    d.line([0,4,31,4],fill=(10,4,20,255))
    for y in (10,20):d.line([0,y,31,y],fill=(34,16,62,255))
    for x in (8,24):d.line([x,5,x,9],fill=(34,16,62,255))
    d.line([16,11,16,19],fill=(34,16,62,255));d.line([4,21,4,31],fill=(34,16,62,255))
    d.rectangle([20,24,27,27],fill=(60,20,80,255));
    for x in range(21,27,2):px(d,x,25,(255,40,190,255))
    if edge=='L':d.rectangle([0,0,2,31],fill=(70,60,110,255));d.line([0,0,0,31],fill=(0,255,255,255))
    if edge=='R':d.rectangle([29,0,31,31],fill=(70,60,110,255));d.line([31,0,31,31],fill=(0,255,255,255))
    return im
def wall():
    im=Image.new('RGBA',(32,32),(14,6,30,255));d=ImageDraw.Draw(im)
    for y in range(0,32,8):
        d.line([0,y,31,y],fill=(24,10,46,255))
        o=4 if (y//8)%2 else 0
        for x in range(o,32,8):d.line([x,y,x,y+7],fill=(24,10,46,255))
    d.rectangle([10,10,12,13],fill=(90,50,40,255));d.rectangle([22,18,24,21],fill=(20,60,90,255))
    return im
t=Image.new('RGBA',(32*4,32));[t.paste(x,(32*i,0)) for i,x in enumerate([roof(),roof('L'),roof('R'),wall()])];t.save(OUT+'tiles.png')
# ---------- backgrounds ----------
W,H=320,180
sky=Image.new('RGBA',(W,H));d=ImageDraw.Draw(sky)
top=(8,0,30);mid=(50,0,80);bot=(255,40,140)
for y in range(H):
    f=y/H
    c=[int(top[i]+(mid[i]-top[i])*min(1,f/0.6)) if f<0.6 else int(mid[i]+(bot[i]-mid[i])*(f-0.6)/0.4) for i in range(3)]
    for x in range(W):
        dq=((x+y)%2)*3  # dither
        d.point((x,y),fill=(min(255,c[0]+dq),c[1],min(255,c[2]+dq),255))
for i in range(140):
    x,y=random.randrange(W),random.randrange(int(H*.6));b=random.choice([120,180,255])
    d.point((x,y),fill=(b,b,255,255))
    if random.random()<.08:[d.point(p,fill=(180,180,255,255)) for p in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]]
# sun
cx,cy,r=220,112,42
for y in range(cy-r,cy+r):
    for x in range(cx-r,cx+r):
        if (x-cx)**2+(y-cy)**2<r*r:
            f=(y-(cy-r))/(2*r)
            if y>cy-5 and ((y-cy)%8)<(2+(y-cy)//10):continue
            d.point((x,y),fill=(255,int(230-170*f),int(90+60*f),255))
sky.save(OUT+'bg_sky.png')
def city(w,h,cols,wincol,minh,maxh,deco,seed):
    rnd=random.Random(seed);im=Image.new('RGBA',(w,h));d=ImageDraw.Draw(im);x=0
    while x<w:
        bw=rnd.randint(18,42);bh=rnd.randint(minh,maxh)
        if x+bw>w:bw=w-x
        y0=h-bh;d.rectangle([x,y0,x+bw-2,h],fill=cols[0]);d.line([x,y0,x+bw-2,y0],fill=cols[1])
        for wy in range(y0+4,h-2,5):
            for wx in range(x+3,x+bw-4,4):
                if rnd.random()<(.35 if not deco else .22):d.rectangle([wx,wy,wx+1,wy+1],fill=rnd.choice(wincol))
        if deco and bw>14:
            r=rnd.random()
            if r<.3:d.line([x+bw//2,y0-10,x+bw//2,y0],fill=cols[0]);d.point((x+bw//2,y0-11),fill=(255,40,80,255))
            elif r<.55:
                sc=rnd.choice([(255,40,190,255),(0,240,255,255),(255,220,0,255)])
                sx=x+3;sy=y0+rnd.randint(6,20);d.rectangle([sx,sy,sx+6,sy+14],fill=(20,0,30,255),outline=sc)
                for k in range(sy+3,sy+12,3):d.line([sx+2,k,sx+4,k],fill=sc)
            elif r<.75:d.rectangle([x+4,y0-6,x+12,y0-1],fill=cols[0]);d.line([x+5,y0-1,x+5,y0+1],fill=cols[0]);d.line([x+11,y0-1,x+11,y0+1],fill=cols[0])
        x+=bw
    return im
city(320,120,[(48,10,90,255),(90,40,150,255)],[(120,60,200,255),(90,40,160,255)],30,100,False,1).save(OUT+'bg_far.png')
city(320,140,[(22,4,44,255),(0,200,230,255)],[(0,220,255,255),(255,60,200,255),(255,210,90,255)],40,120,True,2).save(OUT+'bg_near.png')
# ---------- logo ----------
f=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',30,index=2)
txt='霓虹跑酷';tmp=Image.new('L',(160,44));ImageDraw.Draw(tmp).text((4,-4),txt,font=f,fill=255)
m=tmp.point(lambda v:255 if v>110 else 0);bb=m.getbbox();m=m.crop((bb[0]-3,bb[1]-3,bb[2]+3,bb[3]+3))
lw,lh=m.size;logo=Image.new('RGBA',(lw,lh+16))
grad=Image.new('RGBA',(lw,lh))
for y in range(lh):
    f2=y/lh;ImageDraw.Draw(grad).line([0,y,lw,y],fill=(int(0+255*f2),int(255-200*f2),255,255))
shadow=Image.new('RGBA',(lw,lh),(255,0,150,255));logo.paste(shadow,(2,2),m);logo.paste(grad,(0,0),m)
sub=ImageFont.truetype('/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',10,index=2)
st=Image.new('L',(lw,16));ImageDraw.Draw(st).text((lw//2,7),'N E O N   R U N N E R',font=sub,fill=255,anchor='mm')
st=st.point(lambda v:255 if v>100 else 0);logo.paste(Image.new('RGBA',(lw,16),(255,230,0,255)),(0,lh),st)
outline(logo).save(OUT+'logo.png')
# ---------- button (9-slice-ish, 48x16) ----------
im=Image.new('RGBA',(48,16));d=ImageDraw.Draw(im)
d.rectangle([1,1,46,14],fill=(40,0,70,255));d.rectangle([0,0,47,15],outline=(0,255,255,255))
d.line([2,2,45,2],fill=(120,60,200,255));d.line([2,13,45,13],fill=(20,0,40,255))
for x in (0,47):
    for y in (0,15):px(d,x,y,(0,0,0,0))
im.save(OUT+'button.png')
print('ok')
