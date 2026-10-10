/* Second Shift AI — universal game PAUSE. Loaded by gamelock.js (or include it on its own: <script src="gamepause.js"></script>).
   Once someone plays (touch/click in a game area) a "⏸ Pause" button shows while that game is on screen.
   Pausing freezes the whole game without touching the game's code:
     - requestAnimationFrame callbacks are held, and performance.now() / rAF timestamps stop advancing,
       so the game resumes exactly where it was (no time jump, timers don't run down).
     - setTimeout / setInterval callbacks that come due while paused wait until resume.
     - Web Audio is suspended and playing <audio>/<video> pause, then pick back up.
     - CSS animations freeze.
   Keys: P pauses/resumes (window.GAMEPAUSE_KEY = "" turns the P key off for games that need it), Esc/Enter/Space resume. Switching apps or tabs mid-game auto-pauses.
   Game areas: canvas#game, canvas#cv, canvas[data-game], [data-game], .gamebox, plus window.GAMEPAUSE_AREA.
   Button position: window.GAMEPAUSE_POS = "top-left" | "top-right" | "bottom-left" | "bottom-right"
   (default: the bottom corner opposite the screen-lock pill). API: window.GamePause.pause() / resume() / paused. */
(function () {
  "use strict";
  if (window.__ssaiGamePause) return;
  window.__ssaiGamePause = 1;
  var AREA = "canvas#game, canvas#cv, canvas[data-game], [data-game]:not(#champs), .gamebox:not(.keybox)" + (window.GAMEPAUSE_AREA ? ", " + window.GAMEPAUSE_AREA : "");
  var lockPos = (window.GAMELOCK_POS || "bottom-left").split("-");
  var POS = (window.GAMEPAUSE_POS || ("bottom-" + (lockPos[1] === "right" ? "left" : "right"))).split("-");

  var KEY = window.GAMEPAUSE_KEY == null ? "p" : String(window.GAMEPAUSE_KEY).toLowerCase();
  var paused = false, pausedAt = 0, offset = 0, active = null, seen = false, btn = null, ov = null;
  var W = window, perf = W.performance;

  /* ---------- clock ---------- */
  var realNow = perf.now.bind(perf);
  perf.now = function () { return (paused ? pausedAt : realNow()) - offset; };

  /* ---------- animation frames ---------- */
  var rAF = W.requestAnimationFrame.bind(W), cAF = W.cancelAnimationFrame.bind(W);
  var held = [], nid = 1, map = {};
  W.requestAnimationFrame = function (cb) {
    var id = nid++;
    if (paused) { held.push({ id: id, cb: cb }); return id; }
    map[id] = rAF(function (t) { delete map[id]; if (paused) { held.push({ id: id, cb: cb }); return; } cb(t - offset); });
    return id;
  };
  W.cancelAnimationFrame = function (id) {
    if (map[id] != null) { cAF(map[id]); delete map[id]; }
    for (var i = held.length - 1; i >= 0; i--) if (held[i].id === id) held.splice(i, 1);
  };

  /* ---------- timers ---------- */
  var sT = W.setTimeout.bind(W), sI = W.setInterval.bind(W), cT = W.clearTimeout.bind(W), cI = W.clearInterval.bind(W);
  var dueT = [], dead = {};
  W.setTimeout = function (fn, ms) {
    if (typeof fn !== "function") return sT.apply(W, arguments);
    var args = [].slice.call(arguments, 2), id;
    id = sT(function run() { if (dead[id]) { delete dead[id]; return; } if (paused) { dueT.push({ id: id, f: function () { fn.apply(W, args); } }); return; } fn.apply(W, args); }, ms);
    return id;
  };
  W.clearTimeout = function (id) { cT(id); for (var i = dueT.length - 1; i >= 0; i--) if (dueT[i].id === id) dueT.splice(i, 1); };
  W.setInterval = function (fn, ms) {
    if (typeof fn !== "function") return sI.apply(W, arguments);
    var args = [].slice.call(arguments, 2);
    return sI(function () { if (!paused) fn.apply(W, args); }, ms);
  };
  W.clearInterval = function (id) { cI(id); };

  /* ---------- sound ---------- */
  var ctxs = [], media = [], wasRunning = [], wasPlaying = [];
  ["AudioContext", "webkitAudioContext"].forEach(function (k) {
    var C = W[k]; if (!C) return;
    var P = function () { var c = new (Function.prototype.bind.apply(C, [null].concat([].slice.call(arguments))))(); ctxs.push(c); return c; };
    P.prototype = C.prototype; W[k] = P;
  });
  if (W.HTMLMediaElement) {
    var play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (media.indexOf(this) < 0) media.push(this);
      if (paused) { if (wasPlaying.indexOf(this) < 0) wasPlaying.push(this); return Promise.resolve(); }
      return play.apply(this, arguments);
    };
  }
  function allMedia() { var a = media.slice(); [].forEach.call(document.querySelectorAll("audio,video"), function (m) { if (a.indexOf(m) < 0) a.push(m); }); return a; }

  /* ---------- UI ---------- */
  var st = document.createElement("style");
  st.textContent =
    ".ssai-pausebtn{position:fixed;" + (POS[0] === "top" ? "top:calc(10px + env(safe-area-inset-top))" : "bottom:calc(12px + env(safe-area-inset-bottom))") + ";" +
    (POS[1] === "left" ? "left:calc(10px + env(safe-area-inset-left))" : "right:calc(10px + env(safe-area-inset-right))") + ";" +
    "z-index:2147483001;display:none;align-items:center;gap:7px;padding:9px 15px;border-radius:999px;border:1px solid rgba(255,255,255,.22);" +
    "background:rgba(14,17,30,.86);color:#fff;font:700 13px/1 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;letter-spacing:.3px;" +
    "box-shadow:0 6px 20px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}" +
    ".ssai-pausebtn.on{display:inline-flex}.ssai-pausebtn i{display:inline-block;width:10px;height:11px;border-left:3.5px solid currentColor;border-right:3.5px solid currentColor;box-sizing:border-box}" +
    ".ssai-pauseov{position:fixed;inset:0;z-index:2147483002;display:none;align-items:center;justify-content:center;flex-direction:column;gap:18px;" +
    "background:rgba(6,8,16,.72);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:#fff;text-align:center;touch-action:none;" +
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}" +
    ".ssai-pauseov.on{display:flex}.ssai-pauseov h2{margin:0;font-size:44px;font-weight:900;letter-spacing:6px;text-shadow:0 4px 18px rgba(0,0,0,.6)}" +
    ".ssai-pauseov button{font:800 20px/1 inherit;font-family:inherit;padding:16px 38px;border-radius:999px;border:0;background:#fff;color:#111;cursor:pointer;" +
    "box-shadow:0 8px 26px rgba(0,0,0,.45);display:inline-flex;align-items:center;gap:10px}" +
    ".ssai-pauseov button b{display:inline-block;width:0;height:0;border-left:15px solid currentColor;border-top:9px solid transparent;border-bottom:9px solid transparent}" +
    ".ssai-pauseov p{margin:0;font-size:13px;opacity:.7}" +
    "html.ssai-paused *,html.ssai-paused *::before,html.ssai-paused *::after{animation-play-state:paused!important}" +
    "html.ssai-paused .ssai-pauseov,html.ssai-paused .ssai-pauseov *{animation-play-state:running!important}";
  document.head.appendChild(st);

  function build() {
    if (btn) return;
    btn = document.createElement("button");
    btn.type = "button"; btn.className = "ssai-pausebtn"; btn.setAttribute("aria-label", "Pause the game");
    btn.innerHTML = "<i></i>Pause";
    btn.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); pause(); });
    ov = document.createElement("div");
    ov.className = "ssai-pauseov"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Game paused");
    ov.innerHTML = "<h2>PAUSED</h2><button type=\"button\"><b></b>Resume</button><p>Tap anywhere to keep playing</p>";
    ov.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); resume(); });
    ["pointerdown", "pointerup", "touchstart", "touchend", "mousedown", "mouseup"].forEach(function (ev) {
      ov.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
    });
    document.body.appendChild(btn); document.body.appendChild(ov);
  }

  function pause() {
    if (paused) return;
    paused = true; pausedAt = realNow();
    document.documentElement.classList.add("ssai-paused");
    wasRunning = ctxs.filter(function (c) { return c.state === "running"; });
    wasRunning.forEach(function (c) { try { c.suspend(); } catch (e) {} });
    wasPlaying = allMedia().filter(function (m) { return !m.paused && !m.ended; });
    wasPlaying.forEach(function (m) { try { m.pause(); } catch (e) {} });
    build(); btn.classList.remove("on"); ov.classList.add("on");
    try { ov.querySelector("button").focus({ preventScroll: true }); } catch (e) {}
  }
  function resume() {
    if (!paused) return;
    offset += realNow() - pausedAt;
    paused = false;
    document.documentElement.classList.remove("ssai-paused");
    ov.classList.remove("on");
    wasRunning.forEach(function (c) { try { c.resume(); } catch (e) {} });
    wasPlaying.forEach(function (m) { try { play.call(m).catch(function () {}); } catch (e) {} });
    wasRunning = []; wasPlaying = [];
    var h = held; held = [];
    h.forEach(function (x) { map[x.id] = rAF(function (t) { delete map[x.id]; x.cb(t - offset); }); });
    var d = dueT; dueT = [];
    d.forEach(function (x) { sT(x.f, 0); });
    show();
  }

  /* Show the button only once someone has played, and only while a game they touched is on screen. */
  var vis = typeof IntersectionObserver === "function" ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.target === active) { active.__ssaiVis = e.isIntersecting && e.intersectionRatio > 0.25; show(); } });
  }, { threshold: [0, 0.25, 0.5] }) : null;
  function show() {
    if (!seen || paused) return;
    build();
    btn.classList.toggle("on", !!active && (active.__ssaiVis !== false));
  }
  function grab(e) {
    if ((btn && (e.target === btn || btn.contains(e.target))) || (ov && ov.contains(e.target))) return;
    var a = e.target && e.target.closest ? e.target.closest(AREA) : null;
    if (!a) return;
    var box = a.closest(".gamebox") || a;
    if (box !== active) {
      if (vis && active) vis.unobserve(active);
      active = box; active.__ssaiVis = true;
      if (vis) vis.observe(active);
    }
    seen = true; show();
  }
  document.addEventListener("pointerdown", grab, true);
  document.addEventListener("touchstart", grab, { passive: true, capture: true });

  W.addEventListener("keydown", function (e) {
    var t = e.target, typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (paused) {
      if ((KEY && (e.key || "").toLowerCase() === KEY) || e.key === "Escape" || e.key === "Enter" || e.key === " ") resume();
      e.preventDefault(); e.stopImmediatePropagation();
      return;
    }
    if (KEY && !typing && seen && (e.key || "").toLowerCase() === KEY && !e.metaKey && !e.ctrlKey && !e.altKey) {
      pause(); e.preventDefault(); e.stopImmediatePropagation();
    }
  }, true);
  ["keyup", "keypress"].forEach(function (ev) { W.addEventListener(ev, function (e) { if (paused) { e.preventDefault(); e.stopImmediatePropagation(); } }, true); });
  document.addEventListener("visibilitychange", function () { if (document.hidden && seen && active && active.__ssaiVis !== false) pause(); });

  W.GamePause = { pause: function () { seen = true; pause(); }, resume: resume, get paused() { return paused; } };
})();
