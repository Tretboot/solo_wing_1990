// Hilfsskript: zeigt alle <script>-Zeilen von index.html mit Zeilennummer
const s = require('fs').readFileSync('index.html', 'utf8').split(/\r?\n/);
s.forEach((l, i) => { if (l.includes('<script')) console.log((i + 1) + ': ' + l.trim()); });
