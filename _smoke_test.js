// ===== SOLO WING 1990 — SMOKE TEST (temporär, wird gelöscht) =====
// Lädt alle Skripte in index.html-Reihenfolge in einer Node-VM (DOM-Stubs)
// und fährt die State Machine durch: INTRO → SHIP → CHEAT_MAP → MENU →
// COCKPIT (Nav-Karte + Roll) → LANDING → HANGAR → SHIP.
// Skript-Liste AMT 28 Dateien = index.html (2026-10-12 synchronisiert:
// js/npc.js + js/manual.js + js/dialogue.js + js/newspaper.js ergänzt).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = __dirname;
let failures = 0;
function check(name, cond) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name);
  if (!cond) failures++;
}

// --- Canvas-2D-Stub: alle Methoden no-op, alle Properties setzbar ---
const ctxStub = new Proxy({}, {
  get(t, k) {
    if (typeof k === 'symbol') return undefined;
    if (!(k in t)) t[k] = () => ctxStub;
    return t[k];
  },
  set(t, k, v) { t[k] = v; return true; }
});
const makeCanvas = () => ({
  getContext: () => ctxStub,
  addEventListener: () => {},
  removeEventListener: () => {},
  style: {},
  width: 640, height: 400,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 640, height: 400 })
});
const gameCanvas = makeCanvas();
const documentStub = {
  getElementById: (id) => (id === 'game' ? gameCanvas : null),
  addEventListener: () => {},
  createElement: () => makeCanvas(),
  body: { appendChild: () => {} }
};
let rafCb = null;
const sandbox = {
  console,
  document: documentStub,
  navigator: { getGamepads: () => [] },
  requestAnimationFrame: (cb) => { rafCb = cb; return 1; },
  setTimeout, clearTimeout, setInterval, clearInterval,
  Date, Math, Object, Array, String, Number, JSON, Promise, Symbol, Proxy,
  performance: { now: () => 0 }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.addEventListener = () => {};
sandbox.removeEventListener = () => {};
sandbox.innerWidth = 1280; sandbox.innerHeight = 800;
vm.createContext(sandbox);

// --- Skripte in index.html-Reihenfolge laden ---
const scripts = [
  'js/config.js', 'data/missions.js', 'data/dialogues.js', 'data/systems.js',
  'data/crew.js', 'data/rooms.js', 'data/lore.js', 'data/ships.js',
  'data/quests.js', 'data/akademie.js',
  'js/audio.js', 'js/tts.js', 'js/npc.js', 'js/input.js', 'js/engine.js', 'js/sprites.js',
  'js/entities.js', 'js/systems.js', 'js/ship.js', 'js/quests.js', 'js/dialogue.js',
  'js/newspaper.js', 'js/akademie.js', 'js/intro.js', 'js/ui.js', 'js/states.js',
  'js/manual.js', 'js/main.js'
];
console.log('Lade ' + scripts.length + ' Skripte ...');
for (const s of scripts) {
  try {
    vm.runInContext(fs.readFileSync(path.join(root, s), 'utf8'), sandbox, { filename: s });
  } catch (e) {
    console.log('  FAIL Load ' + s + ': ' + e.message);
    failures++;
  }
}
// SW ist ein globaler `const` (globaler lexikalischer Scope, kein Sandbox-Property)
const SW = vm.runInContext('SW', sandbox);
check('SW namespace existiert', !!SW);
function pump(n) { for (let i = 0; i < n; i++) { const cb = rafCb; rafCb = null; if (cb) cb(); } }

// --- 1. Start in INTRO ---
check('Start-State ist INTRO', SW.Game.state === 'INTRO');
pump(5);
check('INTRO laeuft ohne Fehler', SW.Game.state === 'INTRO');

// --- 2. AKADEMIE + BAR ---
SW.Game.setState('AKADEMIE'); pump(3);
SW.Game.setState('BAR'); pump(2);
check('BAR laeuft ohne Fehler', SW.Game.state === 'BAR');

// --- 3. SHIP: Raeume, neue NPCs, Wandkarte ---
SW.Game.setState('SHIP'); pump(3);
check('SHIP laeuft ohne Fehler', SW.Game.state === 'SHIP');
const roomsWithNpcs = SW.Rooms.filter(r => r.npcs.length >= 1).length;
check('alle 11 Raeume haben NPCs (' + roomsWithNpcs + '/11)', roomsWithNpcs === 11);
for (const n of ['Archiv','Löffel','Stille','Mutters','Spiegel','Rohr','Nadel']) {
  check('RoomNPCs: ' + n, !!SW.RoomNPCs[n]);
}
SW.Ship.currentRoom = 'kantine';
SW.Ship.startDialogue(); pump(3);
const kantineLines = SW.Dialogues.rooms.kantine.map(l => l.npc).join(',');
check('Kantine-Dialog hat LÖFFEL', kantineLines.includes('LÖFFEL'));
check('Beobachtung hat NPC (Spiegel)', SW.World.npcInRoom('beobachtung').length >= 1);

// --- 4. CHEAT_MAP (Wandkarte) ---
SW.Game.state = 'CHEAT_MAP'; pump(3);
check('Cheat-Map rendert, 11 Klick-Regionen', SW.Ship._cheatMapRects.length === 11);
const first = SW.Ship._cheatMapRects[0];
SW.Ship.handleCheatMapClick(first.x + 5, first.y + 5);
check('Klick auf Raum -> SHIP', SW.Game.state === 'SHIP' && SW.Ship.currentRoom === SW.Rooms[0].id);
pump(2);
check('_mapRect gesetzt (Wandkarte klickbar)', !!(SW.Ship._mapRect && SW.Ship._mapRect.w > 0));

// --- 5. MENU mit Cheatmenue ---
SW.Game.state = 'MENU'; pump(3);
check('Menu rendert', SW.Game.state === 'MENU');
check('_cheatShipRect gesetzt', !!(SW.Game._cheatShipRect && SW.Game._cheatShipRect.w > 0));
check('_cheatMapRect gesetzt', !!(SW.Game._cheatMapRect && SW.Game._cheatMapRect.w > 0));
check('cheatEnabled-Flag = true', SW.Config.cheatEnabled === true);
SW.Config.cheatEnabled = false; SW.Game._cheatShipRect = null; pump(2);
check('cheatEnabled=false -> kein Cheat-Block', SW.Game._cheatShipRect === null);
SW.Config.cheatEnabled = true;

// --- 6. Mission: TAKEOFF -> COCKPIT (Nav-Karte + Roll) ---
SW.Game.startMission('m1');
check('startMission -> SHIP', SW.Game.state === 'SHIP');
SW.Game.setState('TAKEOFF');
for (let i = 0; i < 400 && SW.Flight.mode; i++) SW.Flight.update();
check('Takeoff -> COCKPIT', SW.Game.state === 'COCKPIT');
pump(5);
SW.UI.navMapVisible = true; pump(2);
check('Nav-Karte rendert', SW.UI.navMapVisible === true);
const r0 = SW.Player.rollAngle;
SW.Input.keys['KeyQ'] = true;
for (let i = 0; i < 30; i++) SW.Player.update(i);
check('Q rollt negativ', SW.Player.rollAngle < r0);
SW.Input.keys['KeyQ'] = false;
for (let i = 0; i < 120; i++) SW.Player.update(i);
check('Roll federt zurueck zu 0', SW.Player.rollAngle === 0);
SW.Player.rollAngle = 0.4; pump(3);
check('Cockpit mit Roll rendert', SW.Game.state === 'COCKPIT');

// --- 7. LANDING -> HANGAR -> DEBRIEFING (Sieg) -> SHIP ---
SW.Game.setState('LANDING');
for (let i = 0; i < 400 && SW.Flight.mode; i++) SW.Flight.update();
check('Landing -> HANGAR', SW.Game.state === 'HANGAR');
check('_hangarLines gefuellt (' + (SW.Game._hangarLines||[]).length + ' Zeilen)', (SW.Game._hangarLines||[]).length >= 2);
pump(5);
check('Hangar rendert', SW.Game.state === 'HANGAR');
SW.Game._hangarTimer = 99999;
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false;
check('Hangar -> DEBRIEFING (Taste)', SW.Game.state === 'DEBRIEFING');
check('Sieg-Flag fuer Debriefing', SW.Game.victory === true);
pump(2);
check('Debriefing rendert', SW.Game.state === 'DEBRIEFING');
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false;
check('Debriefing -> SHIP (Taste)', SW.Game.state === 'SHIP');

// --- 8. Schadensdialog ---
SW.Player.frontShield = 20; SW.Player.rearShield = 90;
const lines = SW.Game._hangarDialog();
check('Schadensdialog (niedrig) erwahnt Schildwerte', lines.some(l => l.indexOf('20') >= 0));

// --- 9. BUG-FIX: Sim-Flug endet nicht mehr im ewigen COCKPIT ---
SW.Game.setState('AKADEMIE');
SW.Akademie.startFlight();
check('Sim-Flug startet im COCKPIT', SW.Game.state === 'COCKPIT' && SW.Game._simMode === true);
// Wave erledigt -> triggerVictory wuerde nach 500ms bestanden() rufen:
SW.Akademie.bestanden();
check('bestanden() -> State AKADEMIE (kein ewiges COCKPIT)', SW.Game.state === 'AKADEMIE');
check('bestanden() -> Phase bestanden', SW.Akademie.phase === 'bestanden');
check('bestanden() -> _simMode aus', SW.Game._simMode === false);
pump(260);  // Akademie.update zaehlt after(210) herunter
check('Ergebnis -> ARRIVAL (Transfer)', SW.Game.state === 'ARRIVAL');
pump(110);  // _arrivalT > 90
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false;
check('ARRIVAL -> BAR (Taste)', SW.Game.state === 'BAR');
// durchgefallen() pfad
SW.Game.setState('AKADEMIE'); SW.Akademie.startFlight();
SW.Akademie.durchgefallen();
check('durchgefallen() -> State AKADEMIE', SW.Game.state === 'AKADEMIE' && SW.Akademie.phase === 'durchgefallen');

// --- 10. INFO-Panel ---
SW.Game.state = 'MENU'; pump(2);
SW.Input.keys['KeyI'] = true; pump(1);
SW.Input.keys['KeyI'] = false;
check('Menu -> INFO (I)', SW.Game.state === 'INFO');
pump(2);
check('INFO rendert', SW.Game.state === 'INFO');
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false;
check('INFO -> MENU (Taste)', SW.Game.state === 'MENU');

// --- 11. Briefing-Szene (Commander an der Tafel) -> JUMP (6 Phasen) ---
SW.Game.startMission('m1');
SW.Game.setState('BRIEFING_BOARD');
check('Briefing: startet mit 3 Commander-Zeilen', SW.BriefingBoard.active && SW.BriefingBoard.lines.length === 3);
check('Briefing: missionSystemId m1 = s1', SW.Game.missionSystemId() === 's1');
pump(2);
check('Briefing: Szene rendert', SW.Game.state === 'BRIEFING_BOARD');
// 3 Zeilen x (Typing abschliessen + weiter) = 6 Kraefte
for (let i = 0; i < 6; i++) {
  SW.Input.keys['Space'] = true; pump(1);
  SW.Input.keys['Space'] = false; pump(1);
}
check('Briefing: nach allen Zeilen -> JUMP (Phase 1)', SW.Game.state === 'JUMP' && SW.Game._jumpPhase === 1);
check('JUMP: Ziel SEKTOR 7', SW.Game._jumpSystem.name === 'SEKTOR 7');
check('JUMP: 3 Story-Zeilen', SW.Game._jumpLines.length === 3);
pump(120);
check('JUMP: Phase 2 (Blase)', SW.Game._jumpPhase === 2);
pump(200);
check('JUMP: Phase 5 (Ankunft)', SW.Game._jumpPhase >= 5);
check('JUMP: Story-Zeile 2 an der Ankunft', SW.Game._jumpLineIdx >= 1);
pump(300);
check('JUMP: Hold (Phase 7)', SW.Game._jumpPhase === 7);
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false;
check('JUMP: Hold -> TAKEOFF', SW.Game.state === 'TAKEOFF');
SW.Game.mission = SW.Missions.list.find(m => m.id === 'm4');
check('JUMP: m4 -> SEKTOR 9 (s2)', SW.Game.missionSystemId() === 's2');

// --- 12. Dialog-Paging + Scrollbar (kein abgeschnittener Text) ---
SW.Game.setState('SHIP');
SW.Ship.startDialogue();
// startDialogue() belegt dialogueLines mit den Raum-Dialogen -> hier ersetzen:
SW.Ship.dialogueLines = [{ npc: 'COMMANDER', text: 'Formular 83-B hat zweiundvierzig Seiten. '.repeat(12) }];
SW.Ship.dialogueIndex = 0;
SW.Ship.dialoguePage = 0;
SW.Ship.dialogueActive = true;
SW.Ship.typing = false;
SW.Ship.charIndex = SW.Ship.dialogueLines[0].text.length;
pump(2);
check('Dialog: langer Text = 2 Seiten', SW.Ship._dialoguePages === 2);
SW.Ship.advanceDialogue();
check('Dialog: scrollt auf Seite 2', SW.Ship.dialoguePage === 1);
SW.Ship.advanceDialogue();
check('Dialog: nach letzter Seite endet Dialog', SW.Ship.dialogueActive === false);

// --- 13. Smart Dialogues: m4 Kältekammer-Klimax (Schreib-Block 2b) ---
check('SmartDialogues existiert (js/dialogue.js geladen)', !!SW.SmartDialogues);
check('Newspaper existiert (js/newspaper.js geladen)', !!SW.Newspaper);
if (SW.SmartDialogues) {
  const npcKeys = ['commander','sechs','neun','zwo','vier','barkeep','bolt','pflaster','diskettens','klo','system'];
  let m4s = 0, m4t = 0;
  for (const k of npcKeys) {
    const m = ((SW.Dialogues.smart || {})[k] || {}).mission || [];
    if (m.some(l => l.req === 'm4_sieg')) m4s++;
    if (m.some(l => l.req === 'm4_tod')) m4t++;
  }
  check('m4_sieg-Zeile bei allen 11 NPCs', m4s === 11);
  check('m4_tod-Zeile bei allen 11 NPCs', m4t === 11);
  // A/B-Gates + noteMission (die Brücke, die states.js aufruft)
  if (SW.World) {
    SW.World.missionResults = {};
    check('A/B-Gate: m4_sieg ZU ohne Ergebnis', SW.SmartDialogues.checkReq('m4_sieg') === false);
    check('A/B-Gate: m4_tod ZU ohne Ergebnis', SW.SmartDialogues.checkReq('m4_tod') === false);
    SW.SmartDialogues.noteMission('m4', 'sieg');
    check('noteMission(m4,sieg) -> m4_sieg OFFEN', SW.SmartDialogues.checkReq('m4_sieg') === true);
    check('noteMission(m4,sieg) -> m4 in missionProgress', (SW.World.missionProgress || []).indexOf('m4') !== -1);
    check('noteMission -> Event mission_sieg', SW.SmartDialogues.hasEvent('mission_sieg'));
    SW.SmartDialogues.noteMission('m4', 'tod');
    check('noteMission(m4,tod) -> m4_tod OFFEN', SW.SmartDialogues.checkReq('m4_tod') === true);
  }
  check('states.js: Sieg-Brücke vorhanden', fs.readFileSync(path.join(root, 'js/states.js'), 'utf8').indexOf("noteMission(this.mission.id, 'sieg')") !== -1);
  check('states.js: Tod-Brücke vorhanden', fs.readFileSync(path.join(root, 'js/states.js'), 'utf8').indexOf("noteMission(this.mission.id, 'tod')") !== -1);
}
check('index.html: js/dialogue.js eingebunden', fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('js/dialogue.js'));
check('index.html: js/newspaper.js eingebunden', fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('js/newspaper.js'));

// --- 14. Kamera-System + Launch-Tube (v0.6.9-dev) ---
check('ViewState existiert (SW.Engine.view)', !!SW.Engine.view && SW.Engine.view.mode === 'cockpit');
SW.Game.setState('COCKPIT'); pump(2);
SW.Engine.nextView();
check('V: cockpit -> chase (weitere Brennweite)', SW.Engine.view.mode === 'chase' && SW.Engine.view.focal === SW.Engine.view.chaseFocal);
pump(3);
check('Chase-Cam rendert (COCKPIT)', SW.Game.state === 'COCKPIT');
SW.Engine.nextView();
check('V: chase -> topdown', SW.Engine.view.mode === 'topdown');
pump(3);
check('Top-Down rendert (COCKPIT)', SW.Game.state === 'COCKPIT');
check('Top-Down-Sprite vorhanden', !!SW.Sprites.playerShipTop);
SW.Input.mouseX = 100; SW.Input.mouseY = 40;
const aimTop = SW.Input.getAimDirection();
check('Top-Down-Aim: z > 0 und links (Maus 100,40)', aimTop.z > 0 && aimTop.x < 0);
SW.Engine.nextView();
check('V: topdown -> cockpit (Runde geschlossen)', SW.Engine.view.mode === 'cockpit' && SW.Engine.view.focal === SW.FOCAL);
// Launch-Tube: TAKEOFF durchlaufen (Tube -> Freigang -> Flash -> COCKPIT)
SW.Game.startMission('m1');
SW.Game.setState('TAKEOFF');
check('Tube: 12 Ringe + 48 Lichter initialisiert', SW.Flight.tubeRings.length === 12 && SW.Flight.tubeLights.length === 48);
let tubeFrames = 0;
while (SW.Game.state === 'TAKEOFF' && tubeFrames < 400) { pump(1); tubeFrames++; }
check('Tube: Takeoff -> COCKPIT (' + tubeFrames + ' Frames)', SW.Game.state === 'COCKPIT' && tubeFrames <= 230);
check('Tube: Fokal wiederhergestellt', SW.Engine.view.focal === SW.FOCAL);
check('Tube: Carrier danach unsichtbar', SW.Carrier.visible === false);

console.log(failures === 0 ? '\nALLE TESTS OK' : '\n' + failures + ' TESTS FEHLGESCHLAGEN');
process.exit(failures === 0 ? 0 : 1);
