// ===== SOLO WING 1990 — Theme-Umschalter (Terminal / Corporate) =====
// Wird direkt NACH dem style.css-Link im <head> eingebunden (FOUC-frei).
// 'terminal'  = grünes Terminal-Look (style.css, Standard)
// 'fancy'     = Corporate Design v0.6.9 (style-fancy.css, darüber)
// Auswahl bleibt im localStorage. Button erscheint unten rechts.
(function () {
  var KEY = 'sw1990_theme';
  function baseHref() {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].href && links[i].href.indexOf('style.css') !== -1) return links[i].href;
    }
    return 'style.css';
  }
  function current() { try { return localStorage.getItem(KEY) || 'terminal'; } catch (e) { return 'terminal'; } }
  function ensureLink(on) {
    var l = document.getElementById('sw-theme-fancy');
    if (on && !l) {
      l = document.createElement('link');
      l.id = 'sw-theme-fancy'; l.rel = 'stylesheet';
      l.href = baseHref().replace('style.css', 'style-fancy.css');
      document.head.appendChild(l);
    } else if (!on && l) { l.parentNode.removeChild(l); }
  }
  function makeBtn() {
    if (document.getElementById('sw-theme-btn')) return;
    var b = document.createElement('button');
    b.id = 'sw-theme-btn';
    b.type = 'button';
    b.style.cssText = 'position:fixed;bottom:12px;right:12px;z-index:9999;font-family:inherit;font-size:10px;padding:6px 10px;cursor:pointer;background:rgba(0,0,0,0.85);';
    function paint() {
      var fancy = current() === 'fancy';
      var c = fancy ? '#00aaff' : '#0f0';
      b.textContent = '\u25D0 ' + (fancy ? 'CORPORATE' : 'TERMINAL');
      b.style.color = c;
      b.style.borderColor = c;
      b.style.border = '1px solid ' + c;
    }
    b.onclick = function () {
      var next = current() === 'fancy' ? 'terminal' : 'fancy';
      try { localStorage.setItem(KEY, next); } catch (e) {}
      ensureLink(next === 'fancy');
      paint();
    };
    document.body.appendChild(b);
    paint();
  }
  ensureLink(current() === 'fancy');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', makeBtn);
  else makeBtn();
})();