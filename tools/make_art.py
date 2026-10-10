# Build game art from AI-painted sources in ../art_src (white backgrounds -> alpha)
import numpy as np, os
from PIL import Image, ImageFilter
from scipy import ndimage as nd
SRC='/workspace/art_src'; OUT=os.path.join(os.path.dirname(__file__),'..','assets')
def load(n): return np.asarray(Image.open(f'{SRC}/{n}.jpg').convert('RGB')).astype(np.float32)
def matte(a):
    d=255-a.min(2)                      # distance from white
    bgc=d<28                            # candidate background
    lab,_=nd.label(bgc); edge=np.unique(np.r_[lab[0],lab[-1],lab[:,0],lab[:,-1]]); edge=edge[edge>0]
    bg=np.isin(lab,edge)                # only white connected to border is background
    fg=~bg
    # soft alpha band near boundary
    dist=nd.distance_transform_edt(fg)
    soft=np.clip((d-6)/60,0,1)
    alpha=np.where(dist>3,1.0,np.minimum(soft*1.0,1.0)*fg)
    alpha=np.clip(alpha,0,1); alpha=nd.gaussian_filter(alpha,0.6)*fg
    alpha[dist>3]=1
    # unpremultiply from white, then pull rim colour toward darker interior to kill halos
    a3=np.maximum(alpha,1e-3)[...,None]
    col=np.clip((a-(1-a3)*255)/a3,0,255)
    rim=(dist<=3)&fg
    blur=nd.grey_erosion(col,size=(5,5,1))
    col[rim]=col[rim]*0.5+blur[rim]*0.5
    alpha=np.where(alpha<0.08,0,alpha)
    return np.dstack([col,alpha*255]).astype(np.uint8), fg
def comps(fg,minarea,merge=9):
    m=nd.binary_dilation(fg,iterations=merge); lab,n=nd.label(m)
    out=[]
    for i,s in enumerate(nd.find_objects(lab)):
        if (lab[s]==i+1).sum()>=minarea: out.append((s,i+1))
    return sorted(out,key=lambda c:c[0][1].start),lab
def crop(rgba,s,lab,i,pad=4):
    y,x=s; sub=rgba[y,x].copy(); sub[...,3]*=(lab[y,x]==i)
    return np.pad(sub,((pad,pad),(pad,pad),(0,0)))
def save(arr,name): Image.fromarray(arr).save(f'{OUT}/{name}.png',optimize=True)
for f in os.listdir(OUT): os.remove(f'{OUT}/{f}')
# --- run cycle: common foot baseline, common height, fixed cell
rgba,fg=matte(load('player_run'))
def strips(rgba,fg,n):
    col=fg.sum(0).astype(float); W=fg.shape[1]; xs=np.nonzero(col)[0]; x0,x1=xs[0],xs[-1]; step=(x1-x0)/n
    cuts=[x0]+[int(x0+step*k-step*.25+np.argmin(nd.uniform_filter1d(col,5)[int(x0+step*k-step*.25):int(x0+step*k+step*.25)])) for k in range(1,n)]+[x1+1]
    out=[]
    for a,b in zip(cuts,cuts[1:]):
        m=fg[:,a:b]; lab,_=nd.label(nd.binary_dilation(m,iterations=2)); sz=np.bincount(lab.ravel()); sz[0]=0
        keep=np.isin(lab,np.nonzero(sz>sz.max()*0.05)[0])&m
        ys,xx=np.nonzero(keep); sub=rgba[:,a:b].copy(); sub[...,3]=(sub[...,3]*keep).astype(np.uint8)
        out.append(sub[ys.min():ys.max()+1,xx.min():xx.max()+1])
    return out
frames=strips(rgba,fg,8)
# anchor = horizontal centre of torso (columns of top 45%), baseline = bottom
cw=max(f.shape[1] for f in frames)+40; ch=max(f.shape[0] for f in frames)+8
sheet=np.zeros((ch,cw*8,4),np.uint8)
for k,f in enumerate(frames):
    a=f[...,3]>128; top=a[:int(a.shape[0]*.45)]; cx=int(np.nonzero(top.any(0))[0].mean())
    ox=cw//2-cx; oy=ch-4-f.shape[0]
    sheet[oy:oy+f.shape[0],k*cw+ox:k*cw+ox+f.shape[1]]=f
save(sheet,'run'); print('run cell',cw,ch)
rgba,fg=matte(load('player_poses')); cs,lab=comps(fg,3000,14)
poses=[crop(rgba,s,lab,i,0) for s,i in cs]
sl=poses[3]; c=sl[...,:3].astype(int); pale=(c.min(2)>120)&(c.max(2)-c.min(2)<40); pale[:int(sl.shape[0]*.8)]=False
sl[...,3][pale]=0; sl[...,3]=nd.grey_erosion(sl[...,3],size=(1,1)); ys=np.nonzero(sl[...,3].any(1))[0]; poses[3]=sl[:ys[-1]+1]; print('poses',len(poses),[p.shape for p in poses])
pw=max(p.shape[1] for p in poses)+8; ph=max(p.shape[0] for p in poses)+8
ps=np.zeros((ph,pw*len(poses),4),np.uint8)
for k,p in enumerate(poses):
    oy=ph-4-p.shape[0]; ox=(pw-p.shape[1])//2; ps[oy:oy+p.shape[0],k*pw+ox:k*pw+ox+p.shape[1]]=p
save(ps,'poses'); print('pose cell',pw,ph)
rgba,fg=matte(load('props')); cs,lab=comps(fg,1500,3)
print('props',len(cs),[(s[1].start,s[1].stop,s[0].start,s[0].stop) for s,_ in cs])
names={0:'crate',1:'barrier',3:'coin',4:'platform'}
for k,(s,i) in enumerate(cs):
    if k in names: save(crop(rgba,s,lab,i),names[k])
    if k==2:
        y,x=s; m=(lab[y,x]==i); colc=m.sum(0); posts=colc>40
        lab2,_=nd.label(posts); xs=np.nonzero(lab2==1)[0]
        sub=rgba[y,x][:,xs[0]-2:xs[-1]+3].copy(); mm=m[:,xs[0]-2:xs[-1]+3]; sub[...,3]=(sub[...,3]*mm).astype(np.uint8)
        cc=(sub[...,3]>128).sum(0); keepc=np.nonzero(cc>cc.max()*.3)[0]; sub=sub[:,:keepc[-1]+2]
        ys=np.nonzero(sub[...,3].any(1))[0]; save(np.pad(sub[ys[0]:ys[-1]+1],((4,4),(4,4),(0,0))),'emitter')
        print('emitter cols',xs[0],xs[-1])
# --- background
bg=Image.open(f'{SRC}/bg_city.jpg').convert('RGB'); A=np.asarray(bg).astype(np.float32)
rows=A.mean((1,2)); print('rows',[int(r) for r in rows[560:620:4]])
H0=596; sky=A[:H0]
def mirror(x): return np.concatenate([x,x[:,::-1]],1)
far=mirror(sky); Image.fromarray(far.astype(np.uint8)).save(f'{OUT}/bg_far.jpg',quality=86,optimize=True,progressive=True)
# near layer: dark foreground building mass from lower city, luminance/depth mask
lum=sky@np.array([.3,.5,.2]); yy=np.arange(H0)[:,None]
depth=np.clip((yy-400)/90,0,1)
al=np.clip((95-lum)/45,0,1)*depth
al=nd.grey_opening(al,size=(3,3)); al=nd.gaussian_filter(al,1.0)
# keep window lights where they sit inside the mass
lit=(sky.max(2)>150)&(nd.gaussian_filter(al,4)>.5); al=np.maximum(al,lit*1.0)
y0=380; near=np.dstack([sky*0.85,al*255])[y0:]
Image.fromarray(mirror(near).astype(np.uint8)).save(f'{OUT}/bg_near.webp',quality=82,method=6)
Image.fromarray(A.astype(np.uint8)).resize((960,540),Image.LANCZOS).save(f'{OUT}/title_bg.jpg',quality=85,optimize=True)
