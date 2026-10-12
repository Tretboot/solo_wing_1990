// Hilfsskript: Steuerungs-Angaben in js/manual.js finden (plain indexOf)
const s = require('fs').readFileSync('js/manual.js', 'utf8').split(/\r?\n/);
const marks = ['Q/E', 'Rollen', 'NAV', 'AUTOPILOT', 'Steuerung', 'TASTE', '[T]', '[N]', 'LEER', 'ESCAPE', 'WASD'];
s.forEach((l, i) => {
  const t = l.trim();
  for (const m of marks) { if (t.indexOf(m) !== -1) { console.log((i + 1) + ': ' + t.slice(0, 160)); break; } }
});
