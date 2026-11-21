// Demo-only role switcher. The server answers {demo:false} unless DEMO_MODE=1, so this shows nothing on the real app.
fetch('/api/demo').then(r => r.json()).then(d => {
  if (!d.demo) return;
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:max(6px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:9000;display:flex;gap:4px;padding:4px;border-radius:99px;background:rgba(20,20,20,.92);border:1px solid #e03020;font:800 11px system-ui;box-shadow:0 4px 18px rgba(0,0,0,.6)';
  const here = /hub\.html$/.test(location.pathname) ? 'hub' : /client\.html$/.test(location.pathname) ? 'client' : 'guard';
  bar.innerHTML = '<span style="color:#e03020;padding:6px 6px 6px 10px;letter-spacing:.1em">DEMO</span>' +
    [['guard', 'Guard', 'index.html'], ['hub', 'Manager', 'hub.html'], ['client', 'Client', 'client.html']].map(([r, l, u]) =>
      `<button data-r="${r}" data-u="${u}" style="border:0;border-radius:99px;padding:6px 11px;font:800 11px system-ui;cursor:pointer;color:#fff;background:${r === here ? '#e03020' : '#2a2a2a'}">${l}</button>`).join('');
  bar.onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    await fetch('/api/demo/login', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({role: b.dataset.r})});
    try { localStorage.setItem('dgs_consent', '1'); } catch (x) {}
    location.href = b.dataset.u;
  };
  document.body.appendChild(bar);
}).catch(() => {});
