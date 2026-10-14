// ===== SOLO WING 1990 — SMOKE TEST (temporär, wird gelöscht) =====
// Lädt alle Skripte in index.html-Reihenfolge in einer Node-VM (DOM-Stubs)
// und fährt die State Machine durch: INTRO → SHIP → CHEAT_MAP → MENU →
// COCKPIT (Nav-Karte + Roll) → LANDING → HANGAR → DEBRIEFING → CREDITS → SHIP.
// Skript-Liste AMT 29 Dateien = index.html (2026-10-13 synchronisiert:
// + js/savegame.js (Save-Load, Quartier-Deckplan und Schema-Migration).
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
const storedValues = new Map();
sandbox.localStorage = {
  getItem: (key) => storedValues.has(key) ? storedValues.get(key) : null,
  setItem: (key, value) => storedValues.set(key, String(value)),
  removeItem: (key) => storedValues.delete(key)
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
  'js/entities.js', 'js/systems.js', 'js/ship.js', 'js/quests.js', 'js/dialogue.js', 'js/savegame.js',
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
check('alle 12 besetzten Raeume haben NPCs; Quartiere bleiben privat (' + roomsWithNpcs + '/12)', roomsWithNpcs === 12);
for (const n of ['Archiv','Löffel','Stille','Mutters','Spiegel','Rohr','Nadel']) {
  check('RoomNPCs: ' + n, !!SW.RoomNPCs[n]);
}
check('Alle Raum-Crew-NPCs haben ein eigenes Gesicht im Registry',
  Object.keys(SW.RoomNPCs).every(name => {
    const id = SW.NPC.resolve(name);
    return !!id && !!SW.NPC.registry[id];
  }));
SW.Ship.currentRoom = 'kantine';
let roomFaceCount = 0;
const drawNpcFeatures = SW.NPC._drawFeatures;
SW.NPC._drawFeatures = function(ctx, x, y, size, npc) {
  roomFaceCount++;
  return drawNpcFeatures.call(this, ctx, x, y, size, npc);
};
SW.Ship.render(ctxStub);
SW.NPC._drawFeatures = drawNpcFeatures;
check('Raum-Porträts zeichnen Augen und Gesichtszüge', roomFaceCount === SW.World.npcInRoom('kantine').length);
SW.Ship.startDialogue(); pump(3);
const kantineLines = SW.Dialogues.rooms.kantine.map(l => l.npc).join(',');
check('Kantine-Dialog hat LÖFFEL', kantineLines.includes('LÖFFEL'));
check('Beobachtung hat NPC (Spiegel)', SW.World.npcInRoom('beobachtung').length >= 1);
check('Schulraum ZWEIG ist der 12. Raum', !!SW.Rooms.find(r => r.id === 'schule'));
check('Quartiere + persoenliches Pilotenzimmer sind implementiert', SW.Rooms.length === 14 &&
  !!SW.Rooms.find(r => r.id === 'quartiere') && !!SW.Rooms.find(r => r.id === 'player_quarters'));
check('Quartiere sind vom Aufzug und Oberdeck erreichbar', (() => {
  const q = SW.Rooms.find(r => r.id === 'quartiere'), k = SW.Rooms.find(r => r.id === 'kantine');
  const o = SW.Rooms.find(r => r.id === 'beobachtung');
  return q.toren.includes('player_quarters') && q.toren.includes('beobachtung') &&
    q.toren.includes('kantine') && k.toren.includes('quartiere') && o.toren.includes('quartiere');
})());
check('Eigenes Quartier ist nur ueber den Quartier-Hub erreichbar', (() => {
  const q = SW.Rooms.find(r => r.id === 'quartiere'), c = SW.Rooms.find(r => r.id === 'player_quarters');
  return c.toren.length === 1 && c.toren[0] === q.id && c.deck === 3 &&
    c.name === 'QUARTIER {spielername}' && c.mapLabel === '{spielername}';
})());
check('Räume sind auf genau drei Decks verteilt', [1,2,3].every(deck =>
  SW.Rooms.some(room => room.deck === deck)) && SW.Rooms.every(room => [1,2,3].includes(room.deck)));
SW.World.pilotName = 'TESTPILOT';
let allRoomsRender = true;
let allDoorwaysInBulkheads = true;
for (const room of SW.Rooms) {
  SW.Ship.currentRoom = room.id;
  try { SW.Ship.render(ctxStub); } catch (e) { allRoomsRender = false; }
  if (SW.Ship._doorRects.some(rect =>
    !(rect.x + rect.w <= 50 || rect.x >= SW.W - 50) || rect.y > SW.H - 50)) allDoorwaysInBulkheads = false;
}
check('Alle 14 Raumgrafiken und Schiffsschotts rendern', allRoomsRender);
check('Raumtüren sitzen seitlich in den Bulkheads statt am Boden', allDoorwaysInBulkheads);
check('Eigenes Quartier zeigt den Namen des Spielers', SW.Ship.roomLabel(SW.Rooms.find(r => r.id === 'player_quarters')) === 'QUARTIER TESTPILOT');
SW.Ship.currentRoom = 'quartiere';
SW.Ship.render(ctxStub);
const ownQuarters = SW.Ship._ownQuartersRect;
if (ownQuarters) SW.Ship.handleClick(ownQuarters.x + 4, ownQuarters.y + 4);
check('Erste Quartiertuer oeffnet das eigene Pilotenzimmer', SW.Ship.currentRoom === 'player_quarters');
SW.Ship.currentRoom = 'quartiere';
SW.Ship.render(ctxStub);
const lockedQuarters = SW.Ship._lockedQuartersRects[0];
if (lockedQuarters) SW.Ship.handleClick(lockedQuarters.x + 4, lockedQuarters.y + 4);
check('Fremde Quartiere bleiben gesperrt und antworten mit Hinweis',
  SW.Ship.currentRoom === 'quartiere' && !!SW.Ship._roomNotice && /Abgeschlossen|Zugriff/.test(SW.Ship._roomNotice.text));
SW.Ship.navigateTo('player_quarters');
SW.Ship.render(ctxStub);
const saveTerminal = SW.Ship._saveTerminalRect;
if (saveTerminal) SW.Ship.handleClick(saveTerminal.x + 2, saveTerminal.y + 2);
check('Savegame-Terminal ist im eigenen Pilotenzimmer erreichbar', SW.Ship.savePanelOpen === true);
SW.Ship.saveAction('5');
SW.Ship.currentRoom = 'kantine';
check('Save/Load: SW.SaveGame existiert', !!SW.SaveGame);
check('Save/Load: API komplett', ['save','load','export','delete','hasSave','lastSaveTime'].every(k => typeof SW.SaveGame[k] === 'function'));
check('Save/Load: leerer Start (kein Save)', SW.SaveGame.hasSave() === false);
check('Ship: Save-Panel- und Quartier-Funktionen vorhanden', ['renderSavePanel','saveAction','handleSavePanelClick','artPlayerQuarters','artQuartersLobby'].every(k => typeof SW.Ship[k] === 'function'));
check('index.html: js/savegame.js eingebunden', fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('js/savegame.js'));
check('Handbuch: Flugkapitel ist im Spiel vorhanden', SW.Manual.chapters.length === 7 &&
  SW.Manual.chapters[6].id === 'flight');
const manualText=[];
const manualTestCtx=new Proxy({}, {
  get(target,key) {
    if (key==='fillText') return text => manualText.push(text);
    if (!(key in target)) target[key]=()=>{};
    return target[key];
  },
  set(target,key,value) { target[key]=value; return true; }
});
SW.Game.state='COCKPIT';SW.Manual.open();SW.Manual.currentChapter=6;SW.Manual.render(manualTestCtx);SW.Manual.close();
check('Handbuch: Flugkapitel rendert Vorschub und Reparaturhinweise',
  manualText.includes('VORSCHUB: SHIFT = Nachbrenner.') &&
  manualText.includes('Bolt repariert im Hangar mit [R].'));
check('Web-Handbuch: Flugkapitel ist verlinkt',
  fs.existsSync(path.join(root,'site','manual','chapter7.html')) &&
  fs.readFileSync(path.join(root,'site','manual','index.html'),'utf8').includes('chapter7.html'));
// Ältere Saves ohne schemaVersion müssen weiter laden; der alte Kabinen-ID-Alias
// wird auf das persoenliche Pilotenzimmer abgebildet.
storedValues.set(SW.SaveGame.STORAGE_KEY, JSON.stringify({
  version: '0.6.9-final',
  timestamp: 1234,
  currentRoom: 'spinde',
  world: { pilotName: 'TESTPILOT', systemId: 's2', missionProgress: ['m1'], nachrufe: [] },
  game: { score: 42 }
}));
const migratedSave = SW.SaveGame.load();
check('Savegame: Legacy-Format ohne Versionsfeld geladen', !!migratedSave && migratedSave.schemaVersion === 1);
check('Savegame: alte Spinde werden zum persoenlichen Quartier', SW.Ship.currentRoom === 'player_quarters');
check('Savegame: alter Kapitaensraum-Alias bleibt kompatibel',
  SW.SaveGame._canonicalRoomId('captains_quarters') === 'player_quarters');
check('Savegame: Legacy-Spielstandsdaten bleiben erhalten', SW.World.pilotName === 'TESTPILOT' &&
  SW.World.systemId === 's2' && SW.Game.score === 42 && SW.World.missionProgress[0] === 'm1');
SW.Player.init();
check('Savegame: Legacy-Saves ohne Systemdaten starten mit intakten Systemen',
  ['engines','weapons','shields','sensors'].every(key => SW.Player.systems[key] === 100));
SW.Player.damageSystem(37);
check('Schaden: Treffer mindern den Systemzustand', SW.Player.systems.engines === 63);
SW.Player.init();
check('Schaden: Systemzustand bleibt bei Missionsinitialisierung erhalten', SW.Player.systems.engines === 63);
SW.Ship.currentRoom = 'player_quarters';
check('Savegame: neue Raumposition und Systemzustand werden gespeichert', SW.SaveGame.save() &&
  JSON.parse(storedValues.get(SW.SaveGame.STORAGE_KEY)).ship.currentRoom === 'player_quarters' &&
  JSON.parse(storedValues.get(SW.SaveGame.STORAGE_KEY)).world.shipSystems.engines === 63);
SW.Ship.currentRoom = 'bar';
SW.Player.systems.engines=100;
check('Savegame: gespeicherte Raumposition wird wiederhergestellt',
  !!SW.SaveGame.load() && SW.Ship.currentRoom === 'player_quarters' && SW.Player.systems.engines === 63);
SW.Player.systems.shields=50;
check('Schaden: Schildsystem senkt die maximale Ladung', SW.Player.shieldCapacity() === SW.SHIELD_MAX*0.75);
SW.Player.systems.weapons=0;
const projectilesBeforeOfflineFire=SW.Projectiles.list.length;
SW.Player.fire();
check('Schaden: ausgefallene Waffen feuern nicht', SW.Projectiles.list.length === projectilesBeforeOfflineFire);
SW.Player.systems.weapons=50;
SW.Player.fire();
check('Schaden: beeinträchtigte Waffen verursachen weniger Schaden',
  SW.Projectiles.list.length>projectilesBeforeOfflineFire &&
  SW.Projectiles.list[SW.Projectiles.list.length-1].damage === SW.LASER_DAMAGE*0.75);
SW.Projectiles.clear();
const radarBlipColors=[];
const radarTestCtx=new Proxy({}, {
  get(target,key) {
    if (key==='fillRect') return () => radarBlipColors.push(target.fillStyle);
    if (!(key in target)) target[key]=()=>{};
    return target[key];
  },
  set(target,key,value) { target[key]=value; return true; }
});
const previousRadarEnemies=SW.Enemies.list;
SW.Enemies.list=[{alive:true,x:1,y:1}];
SW.Player.systems.sensors=0;
SW.UI.renderRadar(radarTestCtx);
check('Schaden: Sensorausfall blendet Gegner-Radarblips aus', !radarBlipColors.includes('#f00'));
SW.Enemies.list=previousRadarEnemies;
SW.Ship.currentRoom = 'bar';
SW.Player.systems.engines=71;
storedValues.set(SW.SaveGame.STORAGE_KEY, JSON.stringify({
  schemaVersion: 1, world: { shipSystems: { engines: 101 } }
}));
check('Savegame: ungültiger Systemzustand verändert den laufenden Zustand nicht',
  SW.SaveGame.load() === null && SW.Player.systems.engines === 71);
storedValues.set(SW.SaveGame.STORAGE_KEY, JSON.stringify({ schemaVersion: 99, world: { pilotName: 'FUTURE' } }));
check('Savegame: unbekannte Zukunftsversion verändert keinen Zustand', SW.SaveGame.load() === null &&
  SW.World.pilotName === 'TESTPILOT' && SW.Ship.currentRoom === 'bar');
SW.Player.repairSystems();
SW.SaveGame.delete();
check('Schulraum: Git-Tutorial-Dialog (9 Zeilen)', (SW.Dialogues.rooms.schule || []).length === 9);
check('Schulraum: Toere nach Maschinenraum/Buero/Bar', ['maschinenraum','buerro','bar'].every(t => SW.Rooms.find(r => r.id === t).toren.includes('schule')));
check('Schulraum: NPCs Diskettens + Archiv', SW.World.npcInRoom('schule').length >= 2);

// Die kleine Karte ist als Wanddisplay im Raum platziert und öffnet per Klick
// den separaten, großen Deckplan.
SW.Game.state = 'SHIP';
SW.Ship.currentRoom = 'bar';
SW.Ship.render(ctxStub);
const wallMap = SW.Ship._mapRect;
check('SHIP: Minimap bleibt kleine Wandkarte', !!wallMap && wallMap.w <= 60 && wallMap.h <= 30);
if (wallMap) SW.Ship.handleClick(wallMap.x + wallMap.w / 2, wallMap.y + wallMap.h / 2);
check('SHIP: Klick auf Wandkarte öffnet großen Deckplan', SW.Game.state === 'CHEAT_MAP');

// --- 4. CHEAT_MAP (Wandkarte) ---
SW.Game.state = 'CHEAT_MAP'; pump(3);
check('Deckplan rendert, 14 Klick-Regionen auf 3 Decks', SW.Ship._cheatMapRects.length === 14 &&
  [1,2,3].every(deck => SW.Ship._cheatMapRects.filter(rect =>
    SW.Rooms.find(room => room.id === rect.room).deck === deck).length > 0));
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

// --- 6b. IM RAUM (v0.75-dev): Vorschub, relative Projektion, Brains, Wingman ---
check('IM RAUM: Cruise-Speed gesetzt', Math.abs(SW.Player.speed - SW.FORWARD_BASE) < 0.01);
SW.Input.keys['ShiftLeft'] = true;
for (let i = 0; i < 200; i++) SW.Player.update(i);
check('IM RAUM: Nachbrenner [SHIFT] hebt Speed', SW.Player.speed > SW.FORWARD_BASE + 1.5 && SW.Player.burning === true);
check('IM RAUM: Spieler fliegt vorwärts (z wächst)', SW.Player.z > 300);
SW.Input.keys['ShiftLeft'] = false;
const fp = SW.Engine.project(SW.Player.x, SW.Player.y, SW.Player.z + 100);
check('IM RAUM: Projektion relativ (geradeaus = Bildschirmmitte)', fp && Math.abs(fp.sx - SW.CX) < 2 && Math.abs(fp.sy - SW.CY) < 2);
const star0 = SW.Engine.stars.find(s => s.z > 5);
const starZ0 = star0.z;
SW.Engine.updateStars();
check('IM RAUM: Sterne fließen mit dem Vorschub', star0.z < starZ0);
const previousStars = SW.Engine.stars;
const previousPlayerZ = SW.Player.z;
let projectedStarCount = 0;
SW.Player.z = 5000;
SW.Engine.stars = [{ x: SW.Player.x, y: SW.Player.y, z: 100 }];
SW.Engine.renderStars({ fillRect: () => { projectedStarCount++; } }, 0, 0);
check('IM RAUM: Sternfeld bleibt auch nach langem Flug vor dem Cockpit', projectedStarCount === 1);
SW.Engine.stars = previousStars;
SW.Player.z = previousPlayerZ;
// Brains + Wingman: frische Mission (Takeoff → COCKPIT)
SW.Game.startMission('m1');
SW.Game.setState('TAKEOFF');
for (let i = 0; i < 400 && SW.Flight.mode; i++) SW.Flight.update();
check('IM RAUM: Takeoff → COCKPIT', SW.Game.state === 'COCKPIT');
check('IM RAUM: Träger steht im Feld (sichtbar, vorne)', SW.Carrier.visible === true && SW.Carrier.z > SW.Player.z);
check('IM RAUM: Wingman Sechs aktiv', SW.Wingman.active === true);
const fighter = { x: SW.Player.x, y: SW.Player.y, z: SW.Player.z + 250, hp: 30, fireTimer: 9999, speed: 2.5, damage: 8, fireMin: 9999, fireMax: 9999, pattern: 'strafe', strafeAmp: 0, strafeFreq: 0, shipId: 'Jäger', alive: true, state: 'approach', t: 0, strafeDir: 1, wab: 0, range: 90, burst: 2 };
SW.Enemies.list.push(fighter);
for (let i = 0; i < 400; i++) { SW.Player.update(i); SW.Enemies.update(i); SW.Engine.updateStars(); }
const frz = fighter.z - SW.Player.z;
check('IM RAUM: Brains hält Distanz (15..160)', fighter.alive && frz > 15 && frz < 160);
check('IM RAUM: Brains hat State gewechselt (strafe/break)', fighter.state === 'strafe' || fighter.state === 'break');
for (let i = 0; i < 60; i++) SW.Wingman.update(i);
check('IM RAUM: Wingman folgt Formation (z ± 20)', Math.abs((SW.Wingman.z - SW.Player.z) - SW.Wingman.offZ) < 20);
check('IM RAUM: Sechs-Idle-Funkzeilen vorhanden', Array.isArray(SW.Dialogues.wingmanIdle) && SW.Dialogues.wingmanIdle.length >= 3);

    // --- 6c. IM RAUM (v0.75-dev, NAV): Route, Gegner an den WPs, Autopilot-Flyby ---
    check('IM RAUM (NAV): m1 hat 4 Nav-Punkte mit z', SW.Missions.get('m1').navPoints.length === 4 && SW.Missions.get('m1').navPoints.every(np => np.z !== undefined));
    // Frische Mission für deterministische Checks
    SW.Game.startMission('m1');
    SW.Game.setState('TAKEOFF');
    for (let i = 0; i < 400 && SW.Flight.mode; i++) SW.Flight.update();
    // Browser-Realität: JUMP/Intro haben Frames gefressen — beim COCKPIT-
    // Einstieg ist frame > FIRST_WAVE_DELAY (Welle 0 spawnt also sofort)
    SW.Game.frame = 500;
    check('IM RAUM (NAV): frische Mission im COCKPIT', SW.Game.state === 'COCKPIT');
    check('IM RAUM (NAV): Autopilot mit 4 WPs initialisiert', SW.Autopilot.navPoints.length === 4 && SW.Autopilot.active === false);
    // Welle 0 → WP1 (z 250)
    pump(3);
    check('IM RAUM (NAV): Welle 0 am WP1 (z≈250)', SW.Enemies.list.length >= 2 && SW.Enemies.list.every(e => Math.abs(e.z - 250) < 30));
    // Welle 0 erledigt (Spiel-Logik zählt die Welle ab) → Welle 1 am WP2 (z 1500)
    for (const e of SW.Enemies.list) e.alive = false;
    for (let i = 0; i < 420; i++) pump(1);
    check('IM RAUM (NAV): Welle 1 am WP2 (z≈1500)', SW.Enemies.list.some(e => e.alive && Math.abs(e.z - 1500) < 60));
    // Autopilot [T]: Flyby zum nächsten WP (Burn auf der Ausstreckung)
    SW.Player.frontShield = SW.SHIELD_MAX; SW.Player.rearShield = SW.SHIELD_MAX;
    SW.Autopilot.toggle();
    check('IM RAUM (NAV): Autopilot engagiert', SW.Autopilot.active === true && SW.Player.autopilot === true);
    let sawBurn = false;
    for (let i = 0; i < 200; i++) { pump(1); if (SW.Player.burning && SW.Player.burnAuto) sawBurn = true; }
    check('IM RAUM (NAV): Flyby-Burn auf der Ausstreckung', sawBurn === true);
    check('IM RAUM (NAV): Autopilot arbeitet WP ab (>=2 durch)', SW.Autopilot.currentNavIndex >= 2);
    SW.Autopilot.toggle();
    check('IM RAUM (NAV): Autopilot getrennt', SW.Autopilot.active === false && SW.Player.autopilot === false);
    // [A] driftet links (Menü sagt WASD — A muss funktionieren)
    SW.Input.keys['KeyA'] = true;
    for (let i = 0; i < 20; i++) SW.Player.update(i);
    SW.Input.keys['KeyA'] = false;
    check('IM RAUM (NAV): [A] driftet links (vx < 0)', SW.Player.vx < 0);

// --- 7. LANDING -> HANGAR -> DEBRIEFING (Sieg) -> CREDITS -> SHIP ---
SW.Game.setState('LANDING');
for (let i = 0; i < 400 && SW.Flight.mode; i++) SW.Flight.update();
check('Landing -> HANGAR', SW.Game.state === 'HANGAR');
check('_hangarLines gefuellt (' + (SW.Game._hangarLines||[]).length + ' Zeilen)', (SW.Game._hangarLines||[]).length >= 2);
pump(5);
check('Hangar rendert', SW.Game.state === 'HANGAR');
SW.Game._hangarTimer = 99999;
SW.Player.systems.engines=42;
SW.Player.frontShield=20;
SW.Game._hangarLines=SW.Game._hangarDialog();
check('Hangar: Diagnose nennt beschädigte Schiffssysteme',
  SW.Game._hangarLines.some(line => line.includes('ANTRIEB')));
SW.Input.keys['KeyR'] = true; pump(1);
SW.Input.keys['KeyR'] = false; pump(1);
check('Hangar: R repariert Systeme und Schilde', SW.Game._hangarRepaired &&
  ['engines','weapons','shields','sensors'].every(key => SW.Player.systems[key] === 100) &&
  SW.Player.frontShield === SW.SHIELD_MAX && SW.Player.rearShield === SW.SHIELD_MAX);
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false;
check('Hangar -> DEBRIEFING (Taste)', SW.Game.state === 'DEBRIEFING');
check('Sieg-Flag fuer Debriefing', SW.Game.victory === true);
pump(2);
check('Debriefing rendert', SW.Game.state === 'DEBRIEFING');
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false; pump(1);
check('Debriefing(Sieg) -> CREDITS (Taste)', SW.Game.state === 'CREDITS');
check('CREDITS: Abspann-Text gebaut (Crew-Liste inkl.)', SW.Game._credits && SW.Game._credits.lines.length > 25);
pump(10);
check('CREDITS: scroll laeuft', SW.Game._credits.scroll > 0 && !SW.Game._credits.done);
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false; pump(1);
check('CREDITS: Space skippt zum Ende', SW.Game._credits.done === true);
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false; pump(1);
check('CREDITS -> SHIP (Taste)', SW.Game.state === 'SHIP');
// Tod: Debriefing (KONTAKT VERLOREN) ohne Abspann, direkt zum Träger
SW.Game.victory = false; SW._debHeld = false;
SW.Game.setState('DEBRIEFING'); pump(1);
SW.Input.keys['Space'] = true; pump(1);
SW.Input.keys['Space'] = false; pump(1);
check('Debriefing(Tod) -> SHIP (keine Credits)', SW.Game.state === 'SHIP');

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
// 492 Zeichen bei Umbruch 62 = 9 Zeilen = 3 Seiten (4/Seite)
check('Dialog: langer Text = 3 Seiten', SW.Ship._dialoguePages === 3);
SW.Ship.advanceDialogue();
check('Dialog: scrollt auf Seite 2', SW.Ship.dialoguePage === 1);
SW.Ship.advanceDialogue();
check('Dialog: scrollt auf Seite 3', SW.Ship.dialoguePage === 2);
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
SW.Comm.clear();
SW.Comm.add('COMMANDER: Kurs bestätigt. Öffentlicher Funk steht.');
SW.Comm.add('SECHS: Staffel hört dich. Bleib auf meiner Flanke.');
SW.Comm.update(); SW.Comm.update();
check('Cockpit-Funk trennt Public und Staffelfunk', SW.Comm.messages.some(m => m.channel === 'public') &&
  SW.Comm.messages.some(m => m.channel === 'squadron'));
let oversizedVideoCalls = 0;
const cockpitVideoRenderer = SW.NPC.renderCockpitVideo;
SW.NPC.renderCockpitVideo = function() { oversizedVideoCalls++; };
SW.Comm.render(ctxStub);
SW.NPC.renderCockpitVideo = cockpitVideoRenderer;
check('Cockpit-Funk rendert ohne bildschirmfuellendes NPC-Fenster',
  typeof SW.Comm.renderChannel === 'function' && oversizedVideoCalls === 0);
SW.Comm.clear();
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
check('Tube: Träger steht im Feld (IM RAUM: sichtbar, vorne)', SW.Carrier.visible === true && SW.Carrier.z > SW.Player.z);

// --- 15. Theme-System (Terminal/Corporate, Website) ---
check('style-fancy.css existiert', fs.existsSync(path.join(root, 'site', 'style-fancy.css')));
const fancyCss = fs.readFileSync(path.join(root, 'site', 'style-fancy.css'), 'utf8');
const fOb = (fancyCss.match(/{/g) || []).length, fCl = (fancyCss.match(/}/g) || []).length;
check('style-fancy.css Klammern (' + fOb + '/' + fCl + ')', fOb === fCl && fOb >= 60);
check('theme.js existiert (localStorage-Key sw1990_theme)', fs.existsSync(path.join(root, 'site', 'theme.js')) && fs.readFileSync(path.join(root, 'site', 'theme.js'), 'utf8').includes('sw1990_theme'));
check('index.html: theme.js eingebunden', fs.readFileSync(path.join(root, 'site', 'index.html'), 'utf8').includes('theme.js'));
check('manual/index.html: ../theme.js eingebunden', fs.readFileSync(path.join(root, 'site', 'manual', 'index.html'), 'utf8').includes('../theme.js'));

// --- 16. Sektor-Licht + Cheat-Sektortasten [3][4][5] ---
check('World.systemInfo: s1 = blau', SW.World.systemInfo().farbe === '#3366ff');
SW.Game.setSector('s2');
check('setSector s2: SEKTOR 9 rot', SW.World.systemId === 's2' && SW.World.systemInfo().farbe === '#ff3333');
SW.Game.state = 'MENU'; pump(3);
check('Menü: Sektoren-Cheat-Rechtecke gesetzt', !!SW.Game._cheatSysRect0 && !!SW.Game._cheatSysRect2);
SW.Input.keys['Digit5'] = true; pump(1); SW.Input.keys['Digit5'] = false;
check('Cheat [5] -> SEKTOR 12', SW.World.systemId === 's3' && SW.World.systemInfo().farbe === '#cccccc');
SW.Input.keys['Digit3'] = true; pump(1); SW.Input.keys['Digit3'] = false;
check('Cheat [3] -> SEKTOR 7', SW.World.systemId === 's1');
// Fenster-Räume mit Sektor-Licht in jedem Sektor rendern
SW.Game.state = 'SHIP';
for (const sid of ['s1','s2','s3']) {
  SW.Game.setSector(sid);
  for (const rid of ['bar','beobachtung','schule']) { SW.Ship.currentRoom = rid; pump(2); }
}
check('Bar/Beobachtung/Schule rendern in allen 3 Sektoren', SW.Game.state === 'SHIP');
SW.Game.setSector('s1');

// --- 17. Glass-Theme, Aufsatz + Release Candidate v0.6.9-rc ---
check('Glass-Design: style-fancy.css mit backdrop-filter', fancyCss.indexOf('backdrop-filter') !== -1);
check('Glass-Design: Umschalter-Label GLASS', fs.readFileSync(path.join(root, 'site', 'theme.js'), 'utf8').includes('GLASS'));
check('Aufsatz entwicklung.html existiert', fs.existsSync(path.join(root, 'site', 'entwicklung.html')));
check('Aufsatz: Nav-Link in index.html', fs.readFileSync(path.join(root, 'site', 'index.html'), 'utf8').includes('entwicklung.html'));
const inRc = /v0\.6\.9-rc$/.test(path.basename(root));
const rcSelf = fs.existsSync(path.join(root, 'index.html')) && fs.existsSync(path.join(root, 'js', 'main.js')) &&
  fs.existsSync(path.join(root, 'data', 'missions.js')) && fs.existsSync(path.join(root, 'site', 'style.css'));
if (inRc) {
  check('RC: dieser Ordner ist das komplette Spiel (index.html+js+data+site)', rcSelf);
} else {
  const rcDir = path.join(root, 'release', 'v0.6.9-rc');
  check('RC: release/v0.6.9-rc komplett (index.html+js+data+site+Test)',
    fs.existsSync(path.join(rcDir, 'index.html')) && fs.existsSync(path.join(rcDir, 'js', 'main.js')) &&
    fs.existsSync(path.join(rcDir, 'data', 'missions.js')) && fs.existsSync(path.join(rcDir, 'site', 'style.css')) &&
    fs.existsSync(path.join(rcDir, '_smoke_test.js')));
  check('RC: Zip vorhanden (release/v0.6.9-rc.zip)', fs.existsSync(path.join(root, 'release', 'v0.6.9-rc.zip')));
}

console.log(failures === 0 ? '\nALLE TESTS OK' : '\n' + failures + ' TESTS FEHLGESCHLAGEN');
process.exit(failures === 0 ? 0 : 1);
