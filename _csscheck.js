const fs = require('fs');
const files = [
  'site/index.html', 'site/crew.html', 'site/raeume.html', 'site/design.html',
  'site/ethikrat.html', 'site/konzepte.html', 'site/team.html', 'site/agent_benchmarks.html',
  'site/manual/index.html', 'site/manual/chapter1.html', 'site/manual/chapter2.html',
  'site/manual/chapter3.html', 'site/manual/chapter4.html', 'site/manual/chapter5.html',
  'site/manual/chapter6.html'
];
const classes = new Set();
for (const f of files) {
  if (!fs.existsSync(f)) { console.log('FEHLT:', f); continue; }
  const s = fs.readFileSync(f, 'utf8');
  const re = /class\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    for (const c of m[1].split(/\s+/).filter(Boolean)) classes.add(c);
  }
  const hasCss = s.indexOf('style.css') !== -1;
  const rel = s.match(/<link[^>]*style\.css[^>]*>/);
  console.log(f.padEnd(30), '| style.css-Link:', hasCss ? (rel ? rel[0].slice(0, 60) : 'ja (seltsam)') : 'NEIN!');
}
console.log('\nALLE CLASSES:', [...classes].sort().join(', '));
console.log('\n--- BACKTICK-n-SCHADEN-SCAN ---');
const path = require('path');
function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
let bad = 0;
for (const f of walk('site')) {
  const s = fs.readFileSync(f, 'utf8');
  const hits = (s.match(/`n/g) || []).length;
  const lines = s.split('\n').length;
  if (hits > 0) bad++;
  console.log(f.padEnd(35), '| `n-Hits:', String(hits).padStart(3), '| Zeilen:', String(lines).padStart(3), hits > 0 ? '  <<<< KAPUTT' : '');
}
console.log(bad === 0 ? 'SCAN: SÄUBER (0 kaputte Dateien)' : 'SCAN: ' + bad + ' DATEI(EN) NOCH KAPUTT');
// CSS: geschweifte Klammern ausbalanciert?
const css = fs.readFileSync('site/style.css', 'utf8');
const ob = (css.match(/{/g) || []).length, cb = (css.match(/}/g) || []).length;
console.log('CSS Klammern:', ob, '/', cb, ob === cb ? 'OK' : 'FALSCH!');
// HTML: Tag-Balance der Haupt-Tags
for (const f of ['site/manual/index.html', 'site/index.html']) {
  const s = fs.readFileSync(f, 'utf8');
  for (const t of ['div', 'p', 'nav', 'ul', 'li', 'span', 'a']) {
    const o = (s.match(new RegExp('<' + t + '[ >]', 'g')) || []).length;
    const c = (s.match(new RegExp('</' + t + '>', 'g')) || []).length;
    if (o !== c) console.log('HTML-BALANCE', f, t + ':', o, '/', c, 'FALSCH!');
  }
  console.log('HTML-BALANCE', f, 'geprüft');
}
