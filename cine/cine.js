/* =====================================================================
   CINE — scroll-pinned cinematic scenes between sections.
   Drop-in for any site: include cine.css + cine.js, then either
     CINE.mount({scenes:[{type:'star-zoom',before:'#team',image:'star.jpg',title:'…'}]})
   or mark sections up with data attributes:
     <section id="team" data-cine="star-zoom" data-cine-image="star.jpg" data-cine-title="…">
   Each scene pins a full-screen canvas for `length` viewport heights and drives a
   renderer with progress p (0→1). Renderers are registered by type; add your own
   with CINE.register(type,{init,draw}). Respects prefers-reduced-motion (scenes skipped).
   ===================================================================== */
(function(){
"use strict";
const R={};                                   /* renderer registry */
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const seg=(p,a,b)=>clamp((p-a)/(b-a),0,1);   /* progress within a sub-range */
const sm=(p,a,b)=>{const t=seg(p,a,b);return t*t*(3-2*t);};
const loadImg=src=>new Promise(res=>{if(!src)return res(null);const i=new Image();i.decoding='async';i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src;});
/* draw an image covering a box, zoomed about a focus point (fx,fy in 0..1 of the image) */
function cover(ctx,img,x,y,w,h,zoom,fx,fy){
  if(!img)return;const s=Math.max(w/img.width,h/img.height)*zoom;const iw=img.width*s,ih=img.height*s;
  const ox=x+w/2-fx*iw,oy=y+h/2-fy*ih;
  const dx=clamp(ox,x+w-iw,x),dy=clamp(oy,y+h-ih,y);
  ctx.drawImage(img,dx,dy,iw,ih);
}
function caption(ctx,W,H,kicker,title,a,mono,display){
  if(a<=0)return;ctx.save();ctx.globalAlpha=a;ctx.textAlign='center';
  const y=H*0.86;
  if(kicker){ctx.font='500 '+Math.round(clamp(W*0.014,11,15))+'px '+mono;ctx.fillStyle='#5ee7ff';ctx.shadowColor='rgba(94,231,255,.6)';ctx.shadowBlur=14;
    ctx.fillText(kicker.toUpperCase().split('').join(' '),W/2,y-Math.round(clamp(W*0.032,26,46)));}
  if(title){ctx.font='800 '+Math.round(clamp(W*0.038,24,54))+'px '+display;ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.8)';ctx.shadowBlur=24;ctx.fillText(title.toUpperCase(),W/2,y);}
  ctx.restore();
}
function vignette(ctx,W,H,a){const g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+a+')');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
/* ---------------- 1. CHEESE DRIP — thick molten cheese: a sagging sheet, teardrop drips on thin necks, wet highlights, drops that let go ---------------- */
R['cheese-drip-2d']={
  init(s){const rnd=()=>Math.random();const mk=(n,back)=>{const arr=[];let x=0.02+rnd()*0.03;while(x<0.98&&arr.length<n){const w=(back?0.075:0.055)+rnd()*0.06;
      arr.push({x:x+w/2,w0:w*(back?0.78:0.72),len:0.18+Math.pow(rnd(),0.7)*0.8,spd:0.7+rnd()*0.6,ph:rnd()*6.3,det:0.32+rnd()*0.4,drop:rnd()<0.55,wob:0.6+rnd()*0.8});x+=w*(0.9+rnd()*0.6);}return arr;};
    s.front=mk(18,false);s.back=mk(9,true);s.off=document.createElement('canvas');},
  draw(s,p,t){const {ctx,W,H}=s;ctx.clearRect(0,0,W,H);
    const pour=Math.pow(sm(p,0,0.62),1.15);              /* slow, heavy pour */
    const run=Math.pow(sm(p,0.66,1),1.8);                /* then it all runs down off the bottom, gathering speed */
    const shift=run*H*2.6;
    /* offscreen liquid pass: silhouette first, then shading clipped to it */
    const off=s.off;if(off.width!==s.cv.width||off.height!==s.cv.height){off.width=s.cv.width;off.height=s.cv.height;}
    const o=off.getContext('2d');o.setTransform(s.dpr,0,0,s.dpr,0,0);o.clearRect(0,0,W,H);
    const layer=(drips,back)=>{
      const base=H*(back?0.13:0.085)*(0.35+0.65*pour)+H*0.03;
      /* the sheet edge: a smooth sag that dips toward every drip */
      const N=Math.max(60,Math.round(W/8)),edge=new Float32Array(N+1);
      for(let k=0;k<=N;k++){const x=k/N;let y=base+Math.sin(x*11+t*0.35)*H*0.006+Math.sin(x*29+1.7)*H*0.004;
        for(const d of drips){const u=(x-d.x)/(d.w0*1.6);y+=Math.exp(-u*u)*d.w0*W*0.55*Math.min(1,pour*1.5);}edge[k]=y;}
      const dripGeo=drips.map(d=>{const cx=d.x*W,w0=d.w0*W;const k=Math.round(d.x*N);const y0=edge[Math.max(0,Math.min(N,k))];
        const grow=Math.pow(clamp(pour*1.15-(1-d.len)*0.12,0,1),1.7);const L=H*d.len*grow+w0*0.6;const rb=w0*(0.44+0.14*grow),wn=w0*(0.92-0.3*grow);
        const sway=Math.sin(t*d.wob+d.ph)*w0*0.06*grow;return {d,cx,w0,y0,L,rb,wn,sway,by:y0+L-rb};});
      o.save();o.translate(0,shift);
      /* silhouette */
      o.beginPath();o.moveTo(0,-H*2);o.lineTo(0,edge[0]);for(let k=1;k<=N;k++)o.lineTo(k/N*W,edge[k]);o.lineTo(W,-H*2);o.closePath();
      for(const g of dripGeo){const {cx,w0,y0,L,rb,wn,sway,by}=g;
        o.moveTo(cx-w0/2,y0-2);o.bezierCurveTo(cx-w0/2,y0+L*0.45,cx-wn/2+sway*0.5,by-rb*2.6,cx-wn/2+sway,by-rb*1.1);
        o.quadraticCurveTo(cx-rb*1.02+sway,by-rb*0.7,cx-rb+sway,by);o.arc(cx+sway,by,rb,Math.PI,0,true);
        o.quadraticCurveTo(cx+rb*1.02+sway,by-rb*0.7,cx+wn/2+sway,by-rb*1.1);o.bezierCurveTo(cx+wn/2+sway*0.5,by-rb*2.6,cx+w0/2,y0+L*0.45,cx+w0/2,y0-2);o.closePath();}
      /* drops that have let go of the bulb and are falling */
      for(const g of dripGeo){const d=g.d;if(!d.drop)continue;const q=seg(pour,d.det,d.det+0.32);if(q<=0)continue;const r=g.rb*0.55*(0.6+0.4*q),fy=g.by+g.rb*0.3+q*q*H*0.9;
        o.moveTo(g.cx+g.sway,fy-r*1.9);o.quadraticCurveTo(g.cx+g.sway+r*1.05,fy-r*0.6,g.cx+g.sway+r,fy);o.arc(g.cx+g.sway,fy,r,0,Math.PI,false);o.quadraticCurveTo(g.cx+g.sway-r*1.05,fy-r*0.6,g.cx+g.sway,fy-r*1.9);o.closePath();}
      const c1=back?'#c77a1c':'#f5b62a',c2=back?'#d98a22':'#ffc63c',c3=back?'#a95f0e':'#e3941c';
      const g=o.createLinearGradient(0,-H,0,H*1.2);g.addColorStop(0,c1);g.addColorStop(0.5,c2);g.addColorStop(1,c3);o.fillStyle=g;o.fill();
      /* shading, clipped to the liquid: cylinder shade on every drip, a darker rim, highlights */
      o.globalCompositeOperation='source-atop';
      for(const gd of dripGeo){const {cx,w0,y0,L,rb,by,sway}=gd;const lg=o.createLinearGradient(cx-rb,0,cx+rb,0);
        lg.addColorStop(0,'rgba(110,50,0,.62)');lg.addColorStop(0.16,'rgba(255,236,170,.30)');lg.addColorStop(0.32,'rgba(255,255,255,0)');lg.addColorStop(0.72,'rgba(140,65,0,.22)');lg.addColorStop(1,'rgba(95,40,0,.66)');
        o.fillStyle=lg;o.fillRect(cx-rb-2+sway,y0-4,rb*2+4,by-y0+rb+4);
        /* bulb: darker underside, wet specular */
        const rg=o.createRadialGradient(cx+sway-rb*0.3,by-rb*0.35,rb*0.1,cx+sway,by,rb*1.05);rg.addColorStop(0,'rgba(255,255,255,.42)');rg.addColorStop(0.4,'rgba(255,240,200,.06)');rg.addColorStop(0.85,'rgba(120,55,0,.10)');rg.addColorStop(1,'rgba(90,40,0,.30)');
        o.fillStyle=rg;o.beginPath();o.arc(cx+sway,by,rb*1.06,0,7);o.fill();
        if(by-y0>4){o.fillStyle='rgba(255,255,255,.22)';o.beginPath();o.ellipse(cx-w0*0.2,y0+(by-y0)*0.5,w0*0.06,(by-y0)*0.42,0,0,7);o.fill();}}
      /* the sheet: soft top light, a darker band right above the edge so it reads thick */
      o.save();o.beginPath();o.moveTo(0,-H*2);o.lineTo(0,edge[0]);for(let k=1;k<=N;k++)o.lineTo(k/N*W,edge[k]);o.lineTo(W,-H*2);o.closePath();o.clip(); /* sheet-only shading: no seam across the drips */
      for(let k=0;k<14;k++){const x=((k*173)%1000)/1000*W;const wg=o.createLinearGradient(x-W*0.02,0,x+W*0.02,0);wg.addColorStop(0,'rgba(255,255,255,0)');wg.addColorStop(0.5,'rgba(255,240,180,.10)');wg.addColorStop(1,'rgba(255,255,255,0)');o.fillStyle=wg;o.fillRect(x-W*0.02,-H*2,W*0.04,H*2.3);}
      const sg=o.createLinearGradient(0,-H,0,H*0.25);sg.addColorStop(0,'rgba(255,255,255,.18)');sg.addColorStop(0.75,'rgba(255,255,255,0)');sg.addColorStop(1,'rgba(120,55,0,.25)');o.fillStyle=sg;o.fillRect(0,-H*2,W,H*2.3);o.restore();
      o.lineWidth=3;o.strokeStyle='rgba(95,42,0,.32)';o.beginPath();o.moveTo(0,edge[0]);for(let k=1;k<=N;k++)o.lineTo(k/N*W,edge[k]);o.stroke();
      o.lineWidth=1.5;o.strokeStyle='rgba(255,245,200,.35)';o.beginPath();o.moveTo(0,edge[0]-4);for(let k=1;k<=N;k++)o.lineTo(k/N*W,edge[k]-4);o.stroke();
      if(back){o.fillStyle='rgba(60,25,0,.22)';o.fillRect(0,-H*2,W,H*4);}   /* the back layer sits in shadow */
      o.globalCompositeOperation='source-over';o.restore();};
    /* back layer is painted, then composited with a shadow; front layer on top with its own shadow */
    layer(s.back,true);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=26;ctx.shadowOffsetY=12;ctx.drawImage(off,0,0,W,H);ctx.restore();
    o.setTransform(s.dpr,0,0,s.dpr,0,0);o.clearRect(0,0,W,H);layer(s.front,false);
    ctx.save();ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=30;ctx.shadowOffsetY=16;ctx.drawImage(off,0,0,W,H);ctx.restore();
    /* warm spill of light from the cheese onto the dark below */
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.18*(1-run);const gl=ctx.createLinearGradient(0,0,0,H);gl.addColorStop(0,'rgba(255,170,40,.6)');gl.addColorStop(1,'rgba(255,170,40,0)');ctx.fillStyle=gl;ctx.fillRect(0,0,W,H);ctx.restore();
    const a=Math.min(1,pour*2.2)*(1-sm(p,0.62,0.75));
    caption(ctx,W,H,s.o.kicker||'',s.o.title||'',a,s.mono,s.display);}
};
/* ---------------- 1. CHEESE DRIP (GPU) — one continuous fluid field: sheet, tongues, bulbs and falling drops melt into each other, lit as a wet surface ---------------- */
const CHEESE_VS='#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
const CHEESE_FS=`#version 300 es
precision highp float;
out vec4 O;
uniform vec2 R;uniform float T,SHIFT,BASEF,BASEB,GLOW;uniform int N;
uniform vec4 A[32];   /* cx, y0, L, w0            (px) */
uniform vec4 B[32];   /* rb, wn, sway, dropY(-1)  (px) */
uniform vec4 C[32];   /* back(0/1), dropR, pinch, det */
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*f*(f*(f*6.0-15.0)+10.0);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float smin(float a,float b,float k){float h=clamp(0.5+0.5*(b-a)/k,0.0,1.0);return mix(b,a,h)-k*h*(1.0-h);}
/* signed distance to the liquid of one layer (negative inside). rr receives a local radius for the shading */
float field(vec2 p,float back,float base,out float rr){
  float x=p.x,y=p.y;
  /* the sheet edge sags and dips toward every drip */
  float e=base+sin(x*0.011+T*0.35)*R.y*0.007+sin(x*0.029+1.7)*R.y*0.004+(noise(vec2(x*0.02,T*0.2))-0.5)*R.y*0.012;
  for(int i=0;i<32;i++){if(i>=N)break;if(C[i].x!=back)continue;float u=(x-A[i].x)/(A[i].w*1.7);e+=exp(-u*u)*A[i].w*0.5;}
  float d=y-e;rr=R.y*0.045;
  for(int i=0;i<32;i++){if(i>=N)break;if(C[i].x!=back)continue;
    float cx=A[i].x,y0=A[i].y-A[i].w*0.4,L=A[i].z,w0=A[i].w*0.5,rb=B[i].x,wn=B[i].y*0.5,sw=B[i].z,pinch=C[i].z;
    float by=y0+L;                                     /* bulb centre */
    float s=clamp((y-y0)/max(L,1.0),0.0,1.0);
    float xc=cx+sw*s*s;                                /* the tongue sways more toward the tip */
    float r=mix(w0,wn,smoothstep(0.0,0.75,s));
    r*=1.0-pinch*smoothstep(0.55,0.92,s)*0.95;          /* the neck thins before a drop lets go */
    r+=(noise(vec2(cx*0.1,y*0.02-T*0.35))-0.5)*w0*0.05;  /* viscous ripple down the tongue */
    float dt=length(vec2(x-xc,clamp(y,y0,by)-y))-r;     /* capsule-ish tongue */
    float db=length(vec2(x-xc,y-by))-rb;                 /* the bulb */
    float dd=smin(dt,db,rb*0.9);
    float k=w0*0.9;float nd=smin(d,dd,k);
    if(nd<d){float wgt=clamp((d-nd)/max(k,1.0),0.0,1.0);rr=mix(rr,max(rb,w0),wgt);}
    d=nd;
    if(B[i].w>0.0){float dr=length(vec2(x-xc,y-B[i].w))-C[i].y;float top=length(vec2(x-xc,y-B[i].w+C[i].y*1.1))-C[i].y*0.45;dr=smin(dr,top,C[i].y*0.8);
      float nd2=smin(d,dr,C[i].y*0.6);if(nd2<d){rr=mix(rr,C[i].y,clamp((d-nd2)/max(C[i].y*0.6,1.0),0.0,1.0));}d=nd2;}
  }
  return d;
}
vec3 shade(vec2 p,float d,float rr,float back,vec2 gr){
  float t=clamp(-d/max(rr,4.0),0.0,1.0);                 /* 0 at the edge, 1 deep inside */
  float h=sqrt(max(0.0,1.0-(1.0-t)*(1.0-t)));            /* spherical cap height */
  float dh=(1.0-t)/max(h,0.06);                            /* slope of a round cross-section: steep at the edge, flat on the crown */
  vec3 n=normalize(vec3(gr*dh,1.0));
  vec3 L1=normalize(vec3(-0.45,-0.55,0.72)),L2=normalize(vec3(0.6,0.2,0.5)),V=vec3(0,0,1);
  float dif=max(dot(n,L1),0.0)*0.85+max(dot(n,L2),0.0)*0.25;
  float spec=pow(max(dot(n,normalize(L1+V)),0.0),90.0)*1.0+pow(max(dot(n,normalize(L1+V)),0.0),12.0)*0.22+pow(max(dot(n,normalize(L2+V)),0.0),30.0)*0.14;
  float fres=pow(1.0-max(n.z,0.0),4.0);
  float flow=noise(vec2(p.x*0.035,p.y*0.006-T*0.35))*0.12+noise(vec2(p.x*0.12,p.y*0.02-T*0.9))*0.05;
  vec3 c1=vec3(1.0,0.78,0.22),c2=vec3(0.93,0.60,0.12);          /* cheddar: bright melt to a deeper orange in the shadows */
  vec3 base=mix(c1,c2,clamp(p.y/R.y*0.6+0.2,0.0,1.0))*(1.0+flow-0.06);
  vec3 col=base*(0.36+0.70*dif);
  col+=vec3(1.0,0.95,0.8)*spec;
  col*=1.0-fres*0.38;                                     /* thick edge goes darker */
  col+=vec3(1.0,0.55,0.15)*0.10*(1.0-t);                  /* thin edges glow warm (subsurface) */
  if(back>0.5)col*=0.62;
  return col;
}
void main(){
  vec2 p=vec2(gl_FragCoord.x,R.y-gl_FragCoord.y)-vec2(0.0,SHIFT);
  float rrB,rrF;float dB=field(p,1.0,BASEB,rrB);float dF=field(p,0.0,BASEF,rrF);
  vec2 gB=vec2(dFdx(dB),dFdy(dB));vec2 gF=vec2(dFdx(dF),dFdy(dF));
  float aa=1.2;float mB=1.0-smoothstep(-aa,aa,dB);float mF=1.0-smoothstep(-aa,aa,dF);
  vec3 cB=shade(p,dB,rrB,1.0,gB);vec3 cF=shade(p,dF,rrF,0.0,gF);
  /* the front layer drops a soft shadow onto the back layer and the stage */
  float rrS;float dS=field(p-vec2(5.0,14.0),0.0,BASEF,rrS);float sh=(1.0-smoothstep(-2.0,18.0,dS))*0.42;
  cB*=1.0-sh;
  vec3 col=mix(cB,cF,mF);float a=max(mB,mF);
  /* warm light spill onto the dark below */
  float g=exp(-max(min(dB,dF),0.0)/(R.y*0.05))*0.35*GLOW;
  col=col*a+vec3(1.0,0.62,0.18)*g*(1.0-a);a=clamp(a+g*0.9*(1.0-a)+sh*(1.0-a)*0.45,0.0,1.0);
  col=mix(col,vec3(0.0),sh*(1.0-max(mB,mF))*0.6*0.0);
  O=vec4(col,a);
}`;
R['cheese-drip']={gl:true,
  init(s){const rnd=()=>Math.random();const port=s.W<s.H,ws=port?2.1:1;  /* portrait screens: fewer, fatter tongues so they stay thick */
    const mk=(n,back)=>{const arr=[];let x=0.02+rnd()*0.03;while(x<0.98&&arr.length<n){const w=((back?0.075:0.055)+rnd()*0.06)*ws;
      arr.push({x:x+w/2,w0:w*(back?0.78:0.72),len:0.18+Math.pow(rnd(),0.7)*0.8,ph:rnd()*6.3,det:0.32+rnd()*0.4,drop:rnd()<0.6,wob:0.6+rnd()*0.8,back:back?1:0});x+=w*(0.9+rnd()*0.6);}return arr;};
    s.drips=mk(port?9:18,false).concat(mk(port?5:9,true));
    const gl=s.gl;const P=gl.createProgram();const mkS=(t,src)=>{const sh=gl.createShader(t);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(sh));gl.attachShader(P,sh);};
    mkS(gl.VERTEX_SHADER,CHEESE_VS);mkS(gl.FRAGMENT_SHADER,CHEESE_FS);gl.linkProgram(P);if(!gl.getProgramParameter(P,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(P));
    gl.useProgram(P);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);const loc=gl.getAttribLocation(P,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    s.P=P;s.U={};['R','T','SHIFT','BASEF','BASEB','GLOW','N','A','B','C'].forEach(k=>s.U[k]=gl.getUniformLocation(P,k));
    s.FA=new Float32Array(32*4);s.FB=new Float32Array(32*4);s.FC=new Float32Array(32*4);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);},
  draw(s,p,t){const {gl,W,H,dpr,ctx}=s;
    const pour=Math.pow(sm(p,0,0.62),1.15),run=Math.pow(sm(p,0.66,1),1.8);const shift=run*H*2.6;
    const baseF=H*0.085*(0.35+0.65*pour)+H*0.03,baseB=H*0.13*(0.35+0.65*pour)+H*0.03;
    const {FA,FB,FC}=s;let n=0;
    for(const d of s.drips){const cx=d.x*W,w0=d.w0*W;const grow=Math.pow(clamp(pour*1.15-(1-d.len)*0.12,0,1),1.7);const L=H*d.len*grow+w0*0.6;
      const rb=w0*(0.44+0.14*grow),wn=w0*(0.92-0.3*grow),sway=Math.sin(t*d.wob+d.ph)*w0*0.35*grow;
      const y0=(d.back?baseB:baseF);
      let dropY=-1,dropR=0,pinch=0;
      if(d.drop){const q=seg(pour,d.det,d.det+0.34);pinch=sm(q,0,0.35);if(q>0.3){const q2=(q-0.3)/0.7;dropR=rb*0.55*(0.7+0.3*q2);dropY=y0+L+rb*0.4+q2*q2*H*1.0;}}
      FA.set([cx,y0,L,w0],n*4);FB.set([rb,wn,sway,dropY],n*4);FC.set([d.back,dropR,pinch,d.det],n*4);n++;}
    gl.viewport(0,0,s.cv.width,s.cv.height);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(s.P);
    gl.uniform2f(s.U.R,s.cv.width,s.cv.height);gl.uniform1f(s.U.T,t);gl.uniform1f(s.U.SHIFT,shift*dpr);gl.uniform1f(s.U.BASEF,baseF*dpr);gl.uniform1f(s.U.BASEB,baseB*dpr);gl.uniform1f(s.U.GLOW,1-run);gl.uniform1i(s.U.N,n);
    /* px → device px */
    const sc=(arr,idx)=>{for(let i=0;i<n;i++)for(const j of idx)arr[i*4+j]*=dpr;};sc(FA,[0,1,2,3]);sc(FB,[0,1,2,3]);sc(FC,[1]);for(let i=0;i<n;i++){if(FB[i*4+3]<0)FB[i*4+3]=-1;}
    gl.uniform4fv(s.U.A,FA);gl.uniform4fv(s.U.B,FB);gl.uniform4fv(s.U.C,FC);
    gl.drawArrays(gl.TRIANGLES,0,3);
    ctx.clearRect(0,0,W,H);const a=Math.min(1,pour*2.2)*(1-sm(p,0.62,0.75));caption(ctx,W,H,s.o.kicker||'',s.o.title||'',a,s.mono,s.display);}
};
/* ---------------- 2. STAR ZOOM — tight on the food, pull back over the Walk of Fame star, faces fly in ---------------- */
R['star-zoom']={
  init(s){s.faces=[];const list=typeof s.o.faces==='function'?s.o.faces():(s.o.faces||[]);Promise.all(list.slice(0,14).map(loadImg)).then(a=>{s.faces=a.filter(Boolean);});},
  draw(s,p,t){const {ctx,W,H,img}=s;ctx.clearRect(0,0,W,H);ctx.fillStyle='#05060b';ctx.fillRect(0,0,W,H);
    const z=lerp(2.9,1.0,ease(sm(p,0,0.62)));const fx=lerp(s.o.fx!=null?s.o.fx:0.5,0.5,sm(p,0,0.62)),fy=lerp(s.o.fy!=null?s.o.fy:0.2,0.5,sm(p,0,0.62));
    cover(ctx,img,0,0,W,H,z,fx,fy);
    vignette(ctx,W,H,0.55);
    /* a star-shaped glow blooms as the star comes into frame */
    const bloom=sm(p,0.45,0.7)*(1-sm(p,0.85,1));
    if(bloom>0){ctx.save();ctx.globalAlpha=bloom*0.55;ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(W/2,H*0.62,10,W/2,H*0.62,W*0.28);g.addColorStop(0,'rgba(255,215,120,.9)');g.addColorStop(1,'rgba(255,170,40,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();}
    /* the co-signs fly in and orbit */
    const fin=sm(p,0.62,0.9),fout=sm(p,0.9,1);
    if(fin>0&&s.faces.length){const n=s.faces.length,rad=Math.min(W,H)*0.36,cx=W/2,cy=H*0.5;
      s.faces.forEach((f,i)=>{const a=i/n*Math.PI*2+t*0.12,d=ease(clamp(fin*1.4-i/n*0.4,0,1));const r=lerp(Math.max(W,H)*0.9,rad,d);
        const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*0.62,sz=Math.min(W,H)*0.11*(1-fout*0.6);
        ctx.save();ctx.globalAlpha=(1-fout);ctx.shadowColor='rgba(255,180,60,.6)';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(x,y,sz/2,0,7);ctx.closePath();ctx.fillStyle='#000';ctx.fill();ctx.clip();
        const sc=Math.max(sz/f.width,sz/f.height);ctx.drawImage(f,x-f.width*sc/2,y-f.height*sc/2+sz*0.1,f.width*sc,f.height*sc);ctx.restore();
        ctx.save();ctx.globalAlpha=(1-fout);ctx.strokeStyle='rgba(255,209,102,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,sz/2,0,7);ctx.stroke();ctx.restore();});}
    caption(ctx,W,H,s.o.kicker||'',s.o.title||'',sm(p,0.15,0.35)*(1-fout),s.mono,s.display);}
};
/* ---------------- 3. STREAM CAM — inside the stream's viewfinder, then pull out to the whole set ---------------- */
R['stream-cam']={
  init(s){s.chat=(s.o.chat||['🔥🔥🔥','DRIZZLE IT','CLAMPPPP','W stream','he really did that','LET IT POUR','🧀🧀','LMAOOO','notis on','run it back']).map((m,i)=>({m,u:['dre_','kaylaeats','foodie_j','yung_v','bigmike','LB_tay','sauce','nova','kiki','trell'][i%10],ph:i*0.11}));},
  draw(s,p,t){const {ctx,W,H,img}=s;ctx.clearRect(0,0,W,H);ctx.fillStyle='#03060a';ctx.fillRect(0,0,W,H);
    const zo=ease(sm(p,0.08,0.75));const z=lerp(2.7,1.0,zo);cover(ctx,img,0,0,W,H,z,lerp(s.o.fx!=null?s.o.fx:0.36,0.5,zo),lerp(s.o.fy!=null?s.o.fy:0.32,0.5,zo));
    /* camera feel: green cast, scan lines, vignette, that fade with the pull-out */
    const cam=1-sm(p,0.6,0.92);
    ctx.save();ctx.globalAlpha=0.16*cam;ctx.fillStyle='#53fc18';ctx.fillRect(0,0,W,H);ctx.restore();
    ctx.save();ctx.globalAlpha=0.08*cam;ctx.fillStyle='#000';for(let y=0;y<H;y+=4)ctx.fillRect(0,y,W,1.5);ctx.restore();
    vignette(ctx,W,H,0.35+0.35*cam);
    /* viewfinder UI */
    if(cam>0){ctx.save();ctx.globalAlpha=cam;const m=Math.min(W,H)*0.05,L=Math.min(W,H)*0.09;ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=2;
      [[m,m,1,1],[W-m,m,-1,1],[m,H-m,1,-1],[W-m,H-m,-1,-1]].forEach(([x,y,sx,sy])=>{ctx.beginPath();ctx.moveTo(x,y+sy*L);ctx.lineTo(x,y);ctx.lineTo(x+sx*L,y);ctx.stroke();});
      const on=Math.sin(t*4)>0;ctx.fillStyle=on?'#ff2d2d':'rgba(255,45,45,.35)';ctx.beginPath();ctx.arc(m+L+14,m+12,7,0,7);ctx.fill();
      ctx.fillStyle='#fff';ctx.font='700 14px '+s.mono;ctx.textAlign='left';ctx.fillText('REC  '+new Date(t*1000).toISOString().substr(14,5)+':'+String(Math.floor((t%1)*30)).padStart(2,'0'),m+L+28,m+17);
      /* LIVE chip + watching */
      const chip='LIVE · '+(1204+Math.floor(Math.sin(t*0.7)*40+t*3))+' watching';ctx.font='700 13px '+s.mono;const cw=ctx.measureText(chip).width+26;ctx.fillStyle='#53fc18';ctx.beginPath();ctx.roundRect(W-m-cw,m,cw,26,13);ctx.fill();ctx.fillStyle='#04120a';ctx.textAlign='right';ctx.fillText(chip,W-m-13,m+18);
      /* bitrate bars */
      ctx.textAlign='left';for(let i=0;i<5;i++){ctx.fillStyle=i<3+(Math.sin(t*3+i)>0.3?1:0)?'#53fc18':'rgba(255,255,255,.25)';ctx.fillRect(m+i*7,H-m-6-i*4,5,6+i*4);}ctx.fillStyle='rgba(255,255,255,.8)';ctx.font='600 12px '+s.mono;ctx.fillText('6000 kbps · 1080p60',m+42,H-m);
      /* chat rolling up the right side */
      ctx.font='600 13px '+s.mono;const n=s.chat.length;for(let i=0;i<n;i++){const c=s.chat[i];const y=H-m-40-((i*46+t*26)%(H*0.6));const a=clamp((H*0.6-(y-H*0.3))/(H*0.6),0,1)*clamp((y-m-40)/60,0,1);if(a<=0)continue;ctx.globalAlpha=cam*a;ctx.textAlign='right';ctx.fillStyle='#53fc18';ctx.fillText(c.u,W-m-8,y);ctx.fillStyle='#fff';ctx.fillText(c.m,W-m-8-ctx.measureText(c.u).width-8,y);}
      ctx.restore();}
    caption(ctx,W,H,s.o.kicker||'',s.o.title||'',sm(p,0.55,0.75)*(1-sm(p,0.92,1)),s.mono,s.display);}
};
/* ---------------- 4. STAGE ZOOM — tight on the mic, pull out until the crowd wraps around ---------------- */
R['stage-zoom']={
  init(s){s.crowd=null;loadImg(s.o.crowd).then(i=>s.crowd=i);},
  draw(s,p,t){const {ctx,W,H,img}=s;ctx.clearRect(0,0,W,H);ctx.fillStyle='#05060b';ctx.fillRect(0,0,W,H);
    const zo=ease(sm(p,0,0.6));cover(ctx,img,0,0,W,H,lerp(2.6,1.0,zo),lerp(s.o.fx!=null?s.o.fx:0.5,0.5,zo),lerp(s.o.fy!=null?s.o.fy:0.4,0.5,zo));
    /* stage light sweeps */
    ctx.save();ctx.globalCompositeOperation='lighter';for(let i=0;i<3;i++){const a=Math.sin(t*0.7+i*2.1)*0.5;const g=ctx.createLinearGradient(W*(0.2+i*0.3)+a*W*0.2,0,W*(0.2+i*0.3)+a*W*0.2+W*0.18,H);g.addColorStop(0,'rgba(120,80,255,0)');g.addColorStop(0.5,'rgba('+(i?'255,60,120':'80,140,255')+',.12)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}ctx.restore();
    /* the crowd wraps in over the bottom and sides */
    const cw=sm(p,0.55,0.9);
    if(s.crowd&&cw>0){ctx.save();ctx.globalAlpha=cw;const cz=lerp(1.35,1.0,ease(cw));cover(ctx,s.crowd,0,0,W,H,cz,0.5,0.55);
      const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'rgba(5,6,11,'+(0.85*(1-cw)+0.15)+')');g.addColorStop(0.5,'rgba(5,6,11,0)');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.restore();}
    vignette(ctx,W,H,0.5);
    caption(ctx,W,H,s.o.kicker||'',s.o.title||'',sm(p,0.3,0.5)*(1-sm(p,0.9,1)),s.mono,s.display);}
};
/* ---------------- 5. BOOK CLOSE — the book opens, closes, and the money starts coming in ---------------- */
R['book-close']={
  init(s){s.bills=[];for(let i=0;i<70;i++)s.bills.push({x:Math.random(),y:-Math.random()*1.4,r:Math.random()*6.3,sp:0.35+Math.random()*0.5,sw:0.4+Math.random()*0.6,w:0.7+Math.random()*0.5});},
  draw(s,p,t){const {ctx,W,H,img}=s;ctx.clearRect(0,0,W,H);
    const g=ctx.createRadialGradient(W/2,H*0.5,10,W/2,H*0.5,Math.max(W,H)*0.7);g.addColorStop(0,'#1a1408');g.addColorStop(1,'#05060b');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    const open=Math.sin(sm(p,0.05,0.62)*Math.PI);          /* opens then closes */
    const bh=Math.min(H*0.62,W*0.7),bw=bh*0.667,cx=W/2,cy=H*0.5;
    ctx.save();ctx.translate(cx,cy);
    /* pages */
    ctx.fillStyle='#f4ead6';ctx.fillRect(-bw/2+6,-bh/2+4,bw-6,bh-8);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(-bw/2+6,-bh/2+4,10,bh-8);
    ctx.fillStyle='#c9a24a';ctx.font='700 '+Math.round(bh*0.05)+'px '+s.display;ctx.textAlign='center';
    ['KNOWLEDGE','+ MINDSET','+ STRATEGY','+ ACTION','= WEALTH'].forEach((l,i)=>{ctx.globalAlpha=clamp(open*1.5-i*0.15,0,1);ctx.fillText(l,bw*0.08,-bh*0.22+i*bh*0.12);});ctx.globalAlpha=1;
    /* the cover, hinged on the left: a 2D perspective fold */
    const a=open*Math.PI*0.95,k=Math.cos(a);
    ctx.save();ctx.translate(-bw/2,0);
    if(k>=0){ctx.transform(k,0.18*Math.sin(a)*(1-k),0,1,0,0);if(img)cover(ctx,img,0,-bh/2,bw,bh,1,0.5,0.5);else{ctx.fillStyle='#111';ctx.fillRect(0,-bh/2,bw,bh);}
      const sh=ctx.createLinearGradient(0,0,bw,0);sh.addColorStop(0,'rgba(0,0,0,.45)');sh.addColorStop(0.25,'rgba(0,0,0,0)');ctx.fillStyle=sh;ctx.fillRect(0,-bh/2,bw,bh);}
    else{ctx.transform(k,-0.18*Math.sin(a)*(1+k),0,1,0,0);ctx.fillStyle='#e9dcc0';ctx.fillRect(0,-bh/2,bw,bh);}
    ctx.restore();
    /* spine + glow */
    ctx.fillStyle='#8a6a2a';ctx.fillRect(-bw/2-4,-bh/2,8,bh);
    ctx.restore();
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=0.35+0.2*Math.sin(t*2);const gg=ctx.createRadialGradient(cx,cy,bh*0.3,cx,cy,bh*0.8);gg.addColorStop(0,'rgba(245,166,35,.35)');gg.addColorStop(1,'rgba(245,166,35,0)');ctx.fillStyle=gg;ctx.fillRect(0,0,W,H);ctx.restore();
    /* money comes in once the book closes */
    const rain=sm(p,0.6,0.85);
    if(rain>0){ctx.save();for(const b of s.bills){const y=((b.y+t*b.sp*0.35)%1.4)-0.2;if(y>1.1)continue;const x=b.x*W+Math.sin(t*b.sw+b.r)*W*0.03;const bwid=W*0.06*b.w,bhei=bwid*0.45;
      ctx.save();ctx.globalAlpha=rain*clamp(1.2-y,0,1);ctx.translate(x,y*H);ctx.rotate(Math.sin(t*b.sw*1.3+b.r)*0.6);ctx.scale(Math.abs(Math.cos(t*b.sw*2+b.r))*0.7+0.3,1);
      ctx.fillStyle='#2f8f4e';ctx.fillRect(-bwid/2,-bhei/2,bwid,bhei);ctx.strokeStyle='#bfe8c8';ctx.lineWidth=1.5;ctx.strokeRect(-bwid/2+3,-bhei/2+3,bwid-6,bhei-6);ctx.fillStyle='#d9f5df';ctx.font='700 '+Math.round(bhei*0.6)+'px '+s.display;ctx.textAlign='center';ctx.fillText('$',0,bhei*0.22);ctx.restore();}ctx.restore();}
    caption(ctx,W,H,s.o.kicker||'',s.o.title||'',sm(p,0.65,0.85)*(1-sm(p,0.93,1)),s.mono,s.display);}
};
/* ---------------- 6. COIN RAIN — push in on the ride while coins and cash pour down ---------------- */
R['coin-rain']={
  init(s){s.coins=[];for(let i=0;i<90;i++)s.coins.push({x:Math.random(),y:-Math.random()*1.5,r:Math.random()*6.3,sp:0.3+Math.random()*0.6,k:Math.random()<0.35?'$':(Math.random()<0.5?'₿':'X'),sz:0.55+Math.random()*0.7});},
  draw(s,p,t){const {ctx,W,H,img}=s;ctx.clearRect(0,0,W,H);ctx.fillStyle='#03050c';ctx.fillRect(0,0,W,H);
    const zo=ease(sm(p,0,0.7));cover(ctx,img,0,0,W,H,lerp(1.9,1.02,zo),lerp(s.o.fx!=null?s.o.fx:0.5,0.5,zo),lerp(s.o.fy!=null?s.o.fy:0.5,0.5,zo));
    /* blue lightning flicker */
    if(Math.sin(t*9)>0.94){ctx.save();ctx.globalAlpha=0.16;ctx.fillStyle='#7cc9ff';ctx.fillRect(0,0,W,H);ctx.restore();}
    vignette(ctx,W,H,0.55);
    const rain=sm(p,0.12,0.4)*(1-sm(p,0.92,1));
    if(rain>0){ctx.save();for(const c of s.coins){const y=((c.y+t*c.sp*0.3)%1.5)-0.25;if(y>1.15)continue;const x=c.x*W+Math.sin(t*0.8+c.r)*W*0.02;const r=Math.min(W,H)*0.028*c.sz;
      ctx.save();ctx.globalAlpha=rain*clamp(1.3-y,0,1);ctx.translate(x,y*H);const sq=Math.abs(Math.cos(t*1.6+c.r))*0.8+0.2;
      if(c.k==='$'){ctx.rotate(Math.sin(t+c.r)*0.5);ctx.scale(1,sq);ctx.fillStyle='#2f8f4e';ctx.fillRect(-r*1.6,-r*0.75,r*3.2,r*1.5);ctx.strokeStyle='#bfe8c8';ctx.lineWidth=1.2;ctx.strokeRect(-r*1.4,-r*0.55,r*2.8,r*1.1);ctx.fillStyle='#d9f5df';ctx.font='700 '+Math.round(r*1.1)+'px '+s.display;ctx.textAlign='center';ctx.fillText('$',0,r*0.4);}
      else{ctx.scale(sq,1);const gold=c.k==='₿';const g=ctx.createRadialGradient(-r*0.3,-r*0.3,r*0.1,0,0,r);g.addColorStop(0,gold?'#ffe9a8':'#bfe6ff');g.addColorStop(0.6,gold?'#f2b233':'#3aa9e8');g.addColorStop(1,gold?'#8a5307':'#0c3a66');ctx.fillStyle=g;ctx.shadowColor=gold?'rgba(255,190,60,.7)':'rgba(90,190,255,.7)';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*0.78,0,7);ctx.stroke();ctx.fillStyle=gold?'#5a3405':'#062a4a';ctx.font='800 '+Math.round(r*1.15)+'px '+s.display;ctx.textAlign='center';ctx.fillText(c.k,0,r*0.42);}
      ctx.restore();}ctx.restore();}
    caption(ctx,W,H,s.o.kicker||'',s.o.title||'',sm(p,0.3,0.5)*(1-sm(p,0.9,1)),s.mono,s.display);}
};
/* ---------------- engine ---------------- */
const scenes=[];let raf=0;
function build(o){
  const target=document.querySelector(o.before);if(!target||!R[o.type])return null;
  const wrap=document.createElement('div');wrap.className='cine cine-'+o.type;wrap.style.height=(o.length||200)+'vh';
  const pin=document.createElement('div');pin.className='cine-pin';const cv=document.createElement('canvas');cv.className='cine-cv';pin.appendChild(cv);wrap.appendChild(pin);
  target.parentNode.insertBefore(wrap,target);
  let gl=null,cv2=null;
  if(R[o.type].gl){try{gl=cv.getContext('webgl2',{alpha:true,premultipliedAlpha:true,antialias:false,powerPreference:'high-performance'});}catch(e){gl=null;}
    if(gl){cv2=document.createElement('canvas');cv2.className='cine-cv';pin.appendChild(cv2);}else if(R[o.type+'-2d'])o=Object.assign({},o,{type:o.type+'-2d'});}
  const s={o,el:wrap,pin,cv,cv2,gl,ctx:(cv2||cv).getContext('2d'),W:0,H:0,img:null,ready:false,inview:false,mono:o.mono||"'JetBrains Mono',monospace",display:o.display||"'Orbitron','Anton',Impact,sans-serif"};
  loadImg(o.image).then(i=>{s.img=i;});
  return s;
}
function size(s){const dpr=Math.min(devicePixelRatio||1,1.5);const w=innerWidth,h=innerHeight;if(s.W===w&&s.H===h&&s.dpr===dpr)return;s.W=w;s.H=h;s.dpr=dpr;s.cv.width=Math.round(w*dpr);s.cv.height=Math.round(h*dpr);
  if(s.cv2){s.cv2.width=s.cv.width;s.cv2.height=s.cv.height;}s.ctx.setTransform(dpr,0,0,dpr,0,0);
  if(!s.ready){try{R[s.o.type].init(s);}catch(e){console.warn('cine: '+s.o.type+' failed, falling back: '+(e&&e.message||e));if(s.gl&&R[s.o.type+'-2d']){s.gl=null;s.o=Object.assign({},s.o,{type:s.o.type+'-2d'});s.cv.style.display='none';s.ctx.setTransform(dpr,0,0,dpr,0,0);R[s.o.type].init(s);} /* the 2D overlay canvas becomes the scene canvas */}s.ready=true;}}
function tick(){raf=0;const t=performance.now()/1000;let any=false;
  for(const s of scenes){if(!s.inview)continue;any=true;size(s);const r=s.el.getBoundingClientRect();const p=clamp(-r.top/(r.height-innerHeight),0,1);R[s.o.type].draw(s,p,t);}
  if(any)raf=requestAnimationFrame(tick);}
function wake(){if(!raf)raf=requestAnimationFrame(tick);}
function mount(cfg){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let list=(cfg&&cfg.scenes)||[];
  if(!list.length){document.querySelectorAll('[data-cine]').forEach(el=>{const o={type:el.dataset.cine,before:'#'+el.id};for(const k in el.dataset){if(k.startsWith('cine')&&k!=='cine'){const key=k.slice(4);o[key.charAt(0).toLowerCase()+key.slice(1)]=el.dataset[k];}}if(o.faces&&typeof o.faces==='string'){const sel=o.faces;o.faces=()=>[...document.querySelectorAll(sel)].map(i=>i.currentSrc||i.src);}list.push(o);});}
  for(const o of list){const s=build(o);if(s)scenes.push(s);}
  const io=new IntersectionObserver(es=>{es.forEach(e=>{const s=scenes.find(x=>x.el===e.target);if(s){s.inview=e.isIntersecting;if(s.inview)wake();}});},{rootMargin:'40% 0px 40% 0px'});
  scenes.forEach(s=>io.observe(s.el));
  addEventListener('scroll',wake,{passive:true});addEventListener('resize',wake);
}
window.CINE={mount,register:(t,r)=>{R[t]=r;},types:()=>Object.keys(R)};
})();
