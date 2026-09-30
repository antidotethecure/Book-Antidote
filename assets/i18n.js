/* Language switcher (East/Southeast Asian + Indian languages via Google Translate) + ≈ local-currency hints next to $ prices. */
(function(){var s=document.createElement('style');s.textContent="\n.goog-te-banner-frame,.skiptranslate>iframe,iframe.goog-te-banner-frame,#goog-gt-tt,.goog-te-balloon-frame,.VIpgJd-ZVi9od-ORHb-OEVmcd,.VIpgJd-ZVi9od-aZ2wEe-wOHMyf{display:none!important}\nbody{top:0!important}.goog-text-highlight{background:none!important;box-shadow:none!important}\n#ap-lang{position:fixed;right:14px;bottom:14px;z-index:99999;font-family:'Sora',system-ui,sans-serif}\n#ap-lang>button{display:flex;align-items:center;gap:8px;background:#0b1024ee;color:#fff;border:1px solid #f5c54288;border-radius:999px;padding:10px 14px;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 10px 30px #0008;backdrop-filter:blur(10px)}\n#ap-lang>button b{color:#f5c542}\n#ap-lang ul{position:absolute;right:0;bottom:52px;list-style:none;margin:0;padding:6px;background:#0b1024f5;border:1px solid #ffffff22;border-radius:14px;min-width:220px;max-height:60vh;overflow:auto;display:none;box-shadow:0 20px 50px #000a}\n#ap-lang.open ul{display:block}\n#ap-lang li{padding:9px 12px;border-radius:9px;color:#e8e8ef;cursor:pointer;display:flex;justify-content:space-between;gap:12px;font-size:14px}\n#ap-lang li:hover,#ap-lang li.on{background:#f5c5421f;color:#fff}#ap-lang li small{opacity:.55}\n.ap-fx{opacity:.8;font-size:.82em;font-weight:600;margin-left:4px;white-space:nowrap}\n#ap-lang{bottom:78px!important}";(document.head||document.documentElement).appendChild(s);})();

(function () {
  var LANGS = [['en', 'English', 'English'], ['th', 'ไทย', 'Thai'], ['zh-CN', '简体中文', 'Chinese (Simplified)'], ['zh-TW', '繁體中文', 'Chinese (Traditional)'], ['ja', '日本語', 'Japanese'], ['ko', '한국어', 'Korean'], ['vi', 'Tiếng Việt', 'Vietnamese'], ['id', 'Bahasa Indonesia', 'Indonesian'], ['ms', 'Bahasa Melayu', 'Malay'], ['tl', 'Filipino', 'Filipino'], ['km', 'ខ្មែរ', 'Khmer'], ['lo', 'ລາວ', 'Lao'], ['my', 'မြန်မာ', 'Burmese'], ['hi', 'हिन्दी', 'Hindi (India)'], ['bn', 'বাংলা', 'Bengali'], ['te', 'తెలుగు', 'Telugu'], ['mr', 'मराठी', 'Marathi'], ['ta', 'தமிழ்', 'Tamil'], ['gu', 'ગુજરાતી', 'Gujarati'], ['kn', 'ಕನ್ನಡ', 'Kannada'], ['ml', 'മലയാളം', 'Malayalam'], ['pa', 'ਪੰਜਾਬੀ', 'Punjabi'], ['ur', 'اردو', 'Urdu']];
  function current() { var m = document.cookie.match(/googtrans=\/en\/([^;]+)/); return m ? decodeURIComponent(m[1]) : 'en'; }
  function setLang(code) {
    var host = location.hostname, exp = code === 'en' ? '; expires=Thu, 01 Jan 1970 00:00:00 GMT' : '';
    var val = code === 'en' ? '' : '/en/' + code;
    document.cookie = 'googtrans=' + val + '; path=/' + exp;
    document.cookie = 'googtrans=' + val + '; path=/; domain=' + host + exp;
    document.cookie = 'googtrans=' + val + '; path=/; domain=.' + host.split('.').slice(-2).join('.') + exp;
    try { localStorage.setItem('ap_lang', code); } catch (e) {}
    location.reload();
  }
  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: LANGS.map(function (l) { return l[0]; }).join(','), autoDisplay: false }, 'ap-gte');
  };

  // keep brand & platform names untranslated (e.g. "Antidote" must not become the Thai word for "poison cure")
  var KEEP = /(Antidote(?:\s+(?:The\s+)?Foodie)?|Drizzle\s+Bowl|Drizzle|The\s+Clamp|CLAMP|Instagram|YouTube|TikTok|Kick|Twitch|Spotify|Facebook|Business\s+Promo|WokeDote)/gi;
  function protect(root) {
    var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      var p = n.parentElement; if (!p || p.closest('script,style,textarea,input,.notranslate,[translate=no]')) return NodeFilter.FILTER_REJECT;
      KEEP.lastIndex = 0; return KEEP.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
    var list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(function (n) { KEEP.lastIndex = 0; var f = document.createDocumentFragment(), t = n.nodeValue, last = 0, m;
      while ((m = KEEP.exec(t))) { if (m.index > last) f.appendChild(document.createTextNode(t.slice(last, m.index))); var sp = document.createElement('span'); sp.className = 'notranslate'; sp.setAttribute('translate', 'no'); sp.textContent = m[0]; f.appendChild(sp); last = m.index + m[0].length; }
      if (last < t.length) f.appendChild(document.createTextNode(t.slice(last))); n.parentNode.replaceChild(f, n); });
  }
  function build() {
    var holder = document.createElement('div'); holder.id = 'ap-gte'; holder.style.display = 'none'; document.body.appendChild(holder);
    var cur = current(), curL = LANGS.filter(function (l) { return l[0] === cur; })[0] || LANGS[0];
    var w = document.createElement('div'); w.id = 'ap-lang'; w.className = 'notranslate'; w.setAttribute('translate', 'no');
    w.innerHTML = '<button type="button" aria-label="Change language"><svg width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#f5c542\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"flex:none\"><circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"M2 12h20\"/><path d=\"M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z\"/></svg> <b>' + curL[1] + '</b> ▾</button><ul>' + LANGS.map(function (l) { return '<li data-l="' + l[0] + '"' + (l[0] === cur ? ' class="on"' : '') + '><span>' + l[1] + '</span><small>' + l[2] + '</small></li>'; }).join('') + '</ul>';
    w.querySelector('button').onclick = function (e) { e.stopPropagation(); w.classList.toggle('open'); };
    w.querySelectorAll('li').forEach(function (li) { li.onclick = function () { setLang(li.getAttribute('data-l')); }; });
    document.addEventListener('click', function () { w.classList.remove('open'); });
    document.body.appendChild(w);
    if (cur !== 'en') { var T0 = document.title; setInterval(function () { if (document.title !== T0) document.title = T0; }, 1000); protect(); setTimeout(protect, 1500); var s = document.createElement('script'); s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; document.body.appendChild(s); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();

(function () {
  var m = document.cookie.match(/googtrans=\/en\/([^;]+)/); var lang = m ? decodeURIComponent(m[1]) : 'en';
  var CUR = { th: ['THB', '฿', 0], ja: ['JPY', '¥', 0], ko: ['KRW', '₩', 0], vi: ['VND', '₫', 0], id: ['IDR', 'Rp', 0], ms: ['MYR', 'RM', 2], tl: ['PHP', '₱', 0], 'zh-CN': ['CNY', '¥', 1], 'zh-TW': ['TWD', 'NT$', 0], km: ['KHR', '៛', 0], lo: ['LAK', '₭', 0], my: ['MMK', 'K', 0], hi: ['INR', '₹', 0], bn: ['INR', '₹', 0], te: ['INR', '₹', 0], mr: ['INR', '₹', 0], ta: ['INR', '₹', 0], gu: ['INR', '₹', 0], kn: ['INR', '₹', 0], ml: ['INR', '₹', 0], pa: ['INR', '₹', 0], ur: ['INR', '₹', 0] };
  var c = CUR[lang]; if (!c) return;
  var RE = /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/g, TEST = /\$\s?\d/, rate = null, busy = false;
  function fmt(v) { return c[1] + (c[2] ? v.toFixed(c[2]) : Math.round(v).toLocaleString('en-US')); }
  function convert() {
    if (!rate || busy) return; busy = true;
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      var p = n.parentElement; if (!p || p.closest('script,style,textarea,input,.ap-fx,.ap-px,[contenteditable],#ap-lang')) return NodeFilter.FILTER_REJECT;
      return TEST.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
    var list = []; while (w.nextNode()) list.push(w.currentNode);
    list.forEach(function (n) {
      RE.lastIndex = 0; var html = n.nodeValue.replace(/[&<>]/g, function (x) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[x]; })
        .replace(RE, function (all, num) { var v = parseFloat(num.replace(/,/g, '')) * rate; return '<span class="ap-px notranslate" translate="no">' + all + '<span class="ap-fx">≈ ' + fmt(v) + '</span></span>'; });
      var s = document.createElement('span'); s.innerHTML = html; n.parentNode.replaceChild(s, n);
    });
    busy = false;
  }
  function start() {
    fetch('https://open.er-api.com/v6/latest/USD').then(function (r) { return r.json(); }).then(function (j) {
      rate = j && j.rates && j.rates[c[0]]; if (!rate) return;
      convert(); var t; new MutationObserver(function () { clearTimeout(t); t = setTimeout(convert, 400); }).observe(document.body, { childList: true, subtree: true, characterData: true });
    }).catch(function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
