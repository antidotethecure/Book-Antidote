// DGS intro: dragon swirls in, breathes fire, security boot-up, then the app. ~2.8 s, tap to skip.
// Plays once per app open (sessionStorage), shortened for people who turn on "Reduce Motion".
(function () {
  const me = document.currentScript, mode = me.dataset.mode || 'guard';
  const STAMP = { guard: 'GUARD ON DUTY', hub: 'COMMAND ONLINE', client: 'CLIENT SECURE' }[mode];
  let seen = false;
  try { seen = sessionStorage.getItem('dgs_intro') === '1'; sessionStorage.setItem('dgs_intro', '1'); } catch (e) {}
  if (seen) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
#dgs-intro{position:fixed;inset:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;font-family:system-ui,sans-serif;color:#fff;cursor:pointer}
#dgs-intro canvas{position:absolute;inset:0;width:100%;height:100%}
#dgs-intro .glow{position:absolute;width:140vmin;height:140vmin;border-radius:50%;background:radial-gradient(circle,rgba(224,48,32,.45),rgba(224,48,32,0) 60%);animation:dgsPulse 1.4s ease-in-out infinite alternate;opacity:0;animation-delay:.2s}
#dgs-intro .grid{position:absolute;inset:-50%;background-image:linear-gradient(rgba(224,48,32,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(224,48,32,.12) 1px,transparent 1px);background-size:44px 44px;transform:perspective(500px) rotateX(62deg) translateY(30%);animation:dgsGrid 2.8s linear forwards;opacity:0}
#dgs-intro .stage{position:relative;width:min(58vmin,300px);aspect-ratio:1;animation:dgsShake .45s 1.05s 2}
#dgs-intro .ring{position:absolute;inset:-14%;border-radius:50%;border:2px solid rgba(224,48,32,.0);border-top-color:#e03020;border-right-color:rgba(224,48,32,.35);animation:dgsSpin 1.1s linear infinite,dgsIn .5s .25s both}
#dgs-intro .ring.r2{inset:-24%;border-width:1px;border-top-color:rgba(255,160,60,.7);animation:dgsSpin 1.8s linear infinite reverse,dgsIn .5s .35s both}
#dgs-intro .logo{position:absolute;inset:0;width:100%;height:100%;filter:drop-shadow(0 0 30px rgba(224,48,32,.9));animation:dgsSwirl 1.05s cubic-bezier(.2,.9,.25,1.15) both}
#dgs-intro .flash{position:absolute;inset:0;background:radial-gradient(circle at 70% 40%,rgba(255,200,120,.9),rgba(224,48,32,.4) 30%,transparent 65%);opacity:0;animation:dgsFlash .7s 1.0s both;pointer-events:none}
#dgs-intro h1{position:relative;margin:7vmin 0 0;font:900 clamp(20px,6.4vmin,40px)/1 system-ui;letter-spacing:.5em;text-transform:uppercase;text-shadow:0 0 18px rgba(224,48,32,.9);animation:dgsSlam .5s 1.3s both;text-align:center;padding:0 12px}
#dgs-intro .sub{position:relative;margin-top:10px;font:800 clamp(11px,3vmin,15px) system-ui;letter-spacing:.45em;color:#e03020;animation:dgsFade .4s 1.55s both;text-align:center}
#dgs-intro .boot{position:relative;margin-top:4vmin;font:600 clamp(11px,3vmin,14px) ui-monospace,Menlo,monospace;color:#9ca3af;min-height:4.8em;text-align:left;white-space:pre}
#dgs-intro .boot b{color:#4ade80;font-weight:800}
#dgs-intro .scan{position:absolute;left:0;right:0;height:22vmin;background:linear-gradient(180deg,transparent,rgba(224,48,32,.18),rgba(255,90,60,.55) 50%,rgba(224,48,32,.18),transparent);top:-25vmin;animation:dgsScan 1s 1.5s ease-in-out both;mix-blend-mode:screen}
#dgs-intro .stamp{position:absolute;bottom:12vmin;padding:10px 18px;border:3px solid #e03020;color:#fff;background:rgba(224,48,32,.18);font:900 clamp(14px,4.2vmin,22px) system-ui;letter-spacing:.3em;transform:rotate(-6deg) scale(2.4);opacity:0;animation:dgsStamp .35s 2.25s cubic-bezier(.3,1.6,.5,1) forwards;box-shadow:0 0 30px rgba(224,48,32,.6)}
#dgs-intro .skip{position:absolute;bottom:max(14px,env(safe-area-inset-bottom));font:600 11px system-ui;color:#555;letter-spacing:.2em}
#dgs-intro.out{animation:dgsOut .45s ease-in forwards}
@keyframes dgsSwirl{0%{transform:scale(.15) rotate(-720deg);opacity:0;filter:blur(12px) drop-shadow(0 0 0 #e03020)}70%{opacity:1;filter:blur(0) drop-shadow(0 0 40px rgba(224,48,32,1))}100%{transform:scale(1) rotate(0);opacity:1}}
@keyframes dgsSpin{to{transform:rotate(360deg)}}
@keyframes dgsIn{from{opacity:0;transform:scale(.6)}to{opacity:1}}
@keyframes dgsPulse{from{opacity:.5;transform:scale(.9)}to{opacity:1;transform:scale(1.05)}}
@keyframes dgsGrid{0%{opacity:0}30%{opacity:.8}100%{opacity:.6;background-position:0 220px}}
@keyframes dgsFlash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
@keyframes dgsShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-6px,3px)}40%{transform:translate(5px,-4px)}60%{transform:translate(-4px,-2px)}80%{transform:translate(3px,4px)}}
@keyframes dgsSlam{0%{opacity:0;letter-spacing:1.4em;transform:scale(1.4)}100%{opacity:1;letter-spacing:.14em;transform:scale(1)}}
@keyframes dgsFade{from{opacity:0;transform:translateY(8px)}to{opacity:1}}
@keyframes dgsScan{0%{top:-25vmin}100%{top:110vh}}
@keyframes dgsStamp{to{opacity:1;transform:rotate(-6deg) scale(1)}}
@keyframes dgsOut{to{opacity:0;transform:scale(1.08);filter:blur(6px)}}
@media (prefers-reduced-motion:reduce){#dgs-intro *{animation-duration:.01s!important;animation-delay:0s!important}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'dgs-intro'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="grid"></div><div class="glow"></div><canvas></canvas><div class="scan"></div>
    <div class="stage"><div class="ring"></div><div class="ring r2"></div><img class="logo" src="/img/dgs-logo.png" alt=""><div class="flash"></div></div>
    <h1>Dragons Guard Staffing</h1><div class="sub">SOLID SECURITY \u00b7 LA &amp; OC</div><div class="boot"></div>
    <div class="stamp">\u{1F6E1} ${STAMP}</div><div class="skip">TAP TO SKIP</div>`;
  (document.body || document.documentElement).appendChild(el);

  // fire + embers on a canvas (stops itself when the intro ends)
  const cv = el.querySelector('canvas'), cx = cv.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
  const size = () => { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
  size(); addEventListener('resize', size);
  const parts = [], t0 = performance.now();
  let running = true;
  function mouth() { // the dragon's open jaw sits at about 80% across, 27% down the logo
    const r = el.querySelector('.logo').getBoundingClientRect();
    return [(r.left + r.width * 0.8) * dpr, (r.top + r.height * 0.27) * dpr, r.width * dpr];
  }
  function frame(now) {
    if (!running) return;
    const t = (now - t0) / 1000;
    cx.globalCompositeOperation = 'source-over';
    cx.clearRect(0, 0, cv.width, cv.height);
    const [mx, my, w] = mouth();
    // fire breath between 0.95 s and 1.9 s
    if (!reduce && t > 0.95 && t < 1.9) for (let i = 0; i < 9; i++) {
      const a = -0.35 + (Math.random() - 0.5) * 0.5, sp = (9 + Math.random() * 10) * dpr;
      parts.push({ x: mx, y: my, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1, r: (6 + Math.random() * 14) * dpr * (w / 600 + .6), fire: 1 });
    }
    // embers drift up the whole time
    if (!reduce && Math.random() < 0.5) parts.push({ x: Math.random() * cv.width, y: cv.height + 10, vx: (Math.random() - .5) * dpr, vy: -(1 + Math.random() * 2.5) * dpr, life: 1, r: (1 + Math.random() * 2.2) * dpr, fire: 0 });
    cx.globalCompositeOperation = 'lighter';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.life -= p.fire ? 0.028 : 0.006;
      if (p.fire) { p.vx *= 0.985; p.vy -= 0.06 * dpr; p.r *= 1.03; }
      if (p.life <= 0 || p.y < -20) { parts.splice(i, 1); continue; }
      const L = p.life, g = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      if (p.fire) { g.addColorStop(0, `rgba(255,${180 + 60 * L | 0},${90 * L | 0},${.9 * L})`); g.addColorStop(.4, `rgba(255,${70 + 60 * L | 0},20,${.6 * L})`); g.addColorStop(1, 'rgba(224,48,32,0)'); }
      else { g.addColorStop(0, `rgba(255,160,60,${L})`); g.addColorStop(1, 'rgba(224,48,32,0)'); }
      cx.fillStyle = g; cx.beginPath(); cx.arc(p.x, p.y, p.r, 0, 6.283); cx.fill();
    }
    if (parts.length > 900) parts.splice(0, parts.length - 900);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // security boot-up typing
  const lines = ['> VERIFYING IDENTITY ....... <b>OK</b>', '> GPS LOCK ................. <b>OK</b>', '> ENCRYPTED CHANNEL ........ <b>OK</b>'];
  const boot = el.querySelector('.boot');
  lines.forEach((l, i) => setTimeout(() => { boot.innerHTML += (i ? '\n' : '') + l; try { navigator.vibrate && navigator.vibrate(18); } catch (e) {} }, reduce ? 0 : 1650 + i * 200));
  setTimeout(() => { try { navigator.vibrate && navigator.vibrate([30, 40, 60]); } catch (e) {} }, reduce ? 0 : 2250);

  let done = false;
  function finish() {
    if (done) return; done = true;
    el.classList.add('out');
    setTimeout(() => { running = false; el.remove(); st.remove(); removeEventListener('resize', size); }, 450);
  }
  el.addEventListener('click', finish);
  setTimeout(finish, reduce ? 600 : 2900);
})();
