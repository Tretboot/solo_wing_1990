// Hilfsskript: Zeilen aus site/index.html, die 'CAPTAIN' oder 'log' enthalten
const s = require('fs').readFileSync('site/index.html', 'utf8').split(/\r?\n/);
s.forEach((l, i) => {
  const t = l.trim();
  if (t.indexOf('CAPTAIN') !== -1 || t.indexOf('Captain') !== -1 || t.indexOf('class="log') !== -1 || t.indexOf('log-') !== -1) {
    console.log((i + 1) + ': ' + t.slice(0, 150));
  }
});
