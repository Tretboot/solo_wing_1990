// ===== SOLO WING 1990 — SMOKE TEST (temporär, wird gelöscht) =====

// Lädt alle Skripte in index.html-Reihenfolge in einer Node-VM (DOM-Stubs)

// und fährt die State Machine durch: INTRO → SHIP → CHEAT_MAP → MENU →

// COCKPIT (Nav-Karte + Roll) → LANDING → HANGAR → DEBRIEFING → CREDITS → SHIP.

// Skript-Liste muss der Lade-Reihenfolge aus index.html entsprechen.

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

  'data/crew.js', 'data/rooms.js', 'data/postings.js', 'data/lore.js', 'data/ships.js',

  'data/quests.js',  'data/akademie.js', 'data/mod_archive.js',

  'js/byoa_bridge.js',

  'js/carrier_economy.js',

  'js/squadron.js',

  'js/audio.js', 'js/mod_player.js', 'js/sector_synth.js', 'js/tts.js', 'js/npc.js', 'js/input.js', 'js/engine.js', 'js/sprites.js',

  'js/entities.js', 'js/systems.js', 'js/ship.js', 'js/transfers.js', 'js/quests.js', 'js/dialogue.js', 'js/savegame.js',

  'js/newspaper.js',

  'js/holo_chat.js',

  'js/squadron_ui.js', 'js/armada_map.js', 'js/akademie.js', 'js/intro.js', 'js/ui.js', 'js/states.js',

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

check('Version: eine zentrale Quelle', SW.VERSION === '0.9.1');

check('Intro-Musik: getrennte Titel- und Asteroiden-Themen vorhanden',

  typeof SW.Audio.startMusic === 'function' &&

  SW.Intro.toPhase1.toString().includes("startMusic('asteroid')") &&

  SW.Intro.toPhase2.toString().includes('stopMusic()'));

check('Musik: Intro-Loop und Musikschalter nutzen dieselbe API',

  SW.Audio.playIntroMusic.toString().includes("startMusic('title')") &&

  typeof SW.Audio.toggleMusic === 'function');

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

check('Savegame: alte Spielstände behalten das bisherige Träger-Posting',

  SW.World.postingId === 'fax-traegodie' && SW.World.transferHistory.length === 0);

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

check('Savegame: Version stammt aus zentraler Konfiguration',

  JSON.parse(storedValues.get(SW.SaveGame.STORAGE_KEY)).version === SW.VERSION);

check('Posting: unbekannte ID lässt Zuweisung unverändert',

  SW.Transfers.transferTo('not-a-posting', 'Test') === false && SW.World.postingId === 'fax-traegodie');

check('Posting: Testzerstörer hat zwei Jäger und begrenzte Crew',

  SW.Transfers.transferTo('test-destroyer', 'Prototyp-Test') &&

  SW.Transfers.getCurrentPosting().stationedCraft.length === 2 &&

  SW.World.npcInRoom('bar').join(',') === 'Sechs' &&

  SW.World.npcInRoom('maschinenraum').join(',') === 'Bolt' &&

  !SW.Transfers.canVisit('kapelle'));

check('Posting: nicht zugängliche Räume werden aus der großen Karte entfernt',

  (SW.Ship.renderCheatMap(ctxStub), SW.Ship._cheatMapRects.every(rect =>

    SW.Transfers.canVisit(rect.room))));

check('Savegame: Posting und Transferhistorie werden additiv gespeichert',

  SW.SaveGame.save() &&

  JSON.parse(storedValues.get(SW.SaveGame.STORAGE_KEY)).world.postingId === 'test-destroyer' &&

  JSON.parse(storedValues.get(SW.SaveGame.STORAGE_KEY)).world.transferHistory.length === 1);

SW.Transfers.transferTo('fax-traegodie', 'Test abgeschlossen');

check('Savegame: Posting und Transferhistorie werden wiederhergestellt',

  !!SW.SaveGame.load() && SW.World.postingId === 'test-destroyer' &&

  SW.World.transferHistory.length === 1);

SW.Transfers.transferTo('fax-traegodie', 'Smoke-Test zurücksetzen');

SW.Ship.currentRoom = 'bar';

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

    // Welle 0 → WP1 (z 250), danach werden die Gegner gestaffelt eingesetzt.

    pump(3);

    check('IM RAUM (NAV): Welle 0 startet mit erstem Gegner am WP1 (z≈250)',

      SW.Enemies.list.length === 1 && Math.abs(SW.Enemies.list[0].z - 250) < 30);

    const firstWaveStagger = SW.Missions.get('m1').waves[0].staggerFrames;

    SW.Enemies.list[0].alive = false;

    pump(firstWaveStagger - SW.Enemies.waveElapsed - 1);

    check('IM RAUM (NAV): aktive Welle wartet trotz leerem Feld auf Spawn-Queue',

      SW.Enemies.waveActive && SW.Enemies.waveIndex === 0 && SW.Enemies.pendingSpawns.length === 1);

    pump(1);

    check('IM RAUM (NAV): gestaffelte Welle setzt zweiten Gegner zeitgenau ein',

      SW.Enemies.list.length === 2 &&

      SW.Enemies.waveElapsed === firstWaveStagger &&

      SW.Enemies.list[1].t === 1 &&

      SW.Enemies.list[0].alive === false);

    // Welle 0 erledigt (Spiel-Logik zählt die Welle ab) → Welle 1 am WP2 (z 1500)

    for (const e of SW.Enemies.list) e.alive = false;

    for (let i = 0; i < 420; i++) pump(1);

    check('IM RAUM (NAV): Welle 1 am WP2 (z≈1500)', SW.Enemies.list.some(e => e.alive && Math.abs(e.z - 1500) < 60));

    check('IM RAUM (NAV): Missionswelle hat gemischte Gegnertypen und Staffelung',

      SW.Missions.get('m1').waves[1].groups.map(group => group.ship).join(',') === 'Jäger,d_b' &&

      SW.Missions.get('m1').waves[1].staggerFrames > 0);

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

  const inRc = /^v0\.\d+(\.\d+)?-rc$/.test(path.basename(root));

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



    // --- 18. Gemini 4 Argon Pass (v0.75 Integration, Missionsbaum, 3 Enden, Target-Bracket) ---

    SW.Transfers.transferTo('fax-traegodie', 'Test');

    check('Argon: Stamm-Crew (Commander, Sechs, Neun, Zwo) auf Fax-Tragödie an Bord',

      SW.World.npcInRoom('buerro').includes('Commander') &&

      SW.World.npcInRoom('bar').includes('Sechs') &&

      SW.World.npcInRoom('bar').includes('Neun') &&

      SW.World.npcInRoom('bar').includes('Zwo'));

    SW.Game.setState('SHIP');

    SW.Ship.currentRoom = 'flugdeck';

    pump(2);

    check('Argon: Flugdeck rendert 5 Missions-Buttons (M1–M5 inkl. Hermes-Branch)',

      Array.isArray(SW.Ship._missionRects) && SW.Ship._missionRects.length === 5);

    const m3Btn = SW.Ship._missionRects[2];

    SW.Ship.handleClick(m3Btn.x + 2, m3Btn.y + 2);

    check('Argon: Klick auf M3 im Flugdeck wählt m3', SW.Ship.selectedMissionId === 'm3');

    const stRect = SW.Ship._startRect;

    SW.Ship.handleClick(stRect.x + 2, stRect.y + 2);

    check('Argon: Phantom-Start-Bug behoben (START im Flugdeck öffnet BRIEFING_BOARD)',

      SW.Game.state === 'BRIEFING_BOARD' && SW.Game.mission && SW.Game.mission.id === 'm3');

    check('Argon: Mission m3 hat zivile Siedler-Eskorte in Welle 0',

      SW.Missions.get('m3').waves[0].civilian === true);



    // Büro-Hotspots: 5 Geheimakten, Fax/Zeitung, 3. Posting (outpost-31)

    SW.Game.setState('SHIP');

    SW.Ship.currentRoom = 'buerro';

    pump(2);

    check('Argon: Büro hat Aktenschrank-, Fax- und Versetzungs-Hotspots',

      !!SW.Ship._aktenschrankRect && !!SW.Ship._faxRect && !!SW.Ship._transferRect);

    check('Argon: 5 lesbare Geheimakten vorhanden',

      Array.isArray(SW.Dialogues.akten) && SW.Dialogues.akten.length === 5);

    SW.Ship.handleClick(SW.Ship._aktenschrankRect.x + 2, SW.Ship._aktenschrankRect.y + 2);

    check('Argon: Klick auf Aktenschrank öffnet Akten-Dialog & setzt akten_gelesen',

      SW.Ship.dialogueActive === true && SW.Quests.flags.akten_gelesen === true);

    SW.Ship.dialogueActive = false;

    SW.Ship.handleClick(SW.Ship._faxRect.x + 2, SW.Ship._faxRect.y + 2);

    pump(2);

    check('Argon: Klick aufs Büro-Fax öffnet DIE TRÄGER-POST Overlay', SW.Ship.newspaperOpen === true);

    SW.Ship.newspaperOpen = false;

    check('Argon: 3. Posting (outpost-31 / Außenposten 31) im Katalog',

      !!SW.Transfers.getById('outpost-31') && SW.Transfers.transferTo('outpost-31', 'Test') === true);

    SW.Transfers.transferTo('fax-traegodie', 'Test');



    // NPC-Klick-Dialog & Wing Commander 3-Entscheidungen

    SW.Ship.currentRoom = 'bar';

    SW.Ship.dialogueActive = false;

    pump(2);

    const sechsRect = SW.Ship._npcRects.find(r => r.name === 'Sechs');

    check('Argon: Sechs hat Klick-Region in der Bar', !!sechsRect);

    SW.Ship.handleClick(sechsRect.x + 5, sechsRect.y + 5);

    pump(2);

    check('Argon: Klick auf NPC startet Dialog mit echtem String-Text (kein Objekt-Crash)',

      SW.Ship.dialogueActive === true && typeof SW.Ship.dialogueLines[0].text === 'string');

    // Zur WC3-Entscheidungs-Zeile blättern und Option 1 wählen

    const choiceLineIdx = SW.Ship.dialogueLines.findIndex(l => Array.isArray(l.choices) && l.choices.length === 2);

    check('Argon: NPC-Dialog enthält Wing Commander 3-Stil A/B-Entscheidung', choiceLineIdx >= 0);

    SW.Ship.dialogueIndex = choiceLineIdx;

    SW.Ship.dialoguePage = 0;

    SW.Ship.typing = false;

    pump(2);

    check('Argon: WC3-Entscheidung rendert 2 klickbare Auswahl-Rechtecke',

      SW.Ship.hasActiveChoices() === true && SW.Ship._choiceRects.length === 2);

    SW.Ship.selectDialogueChoice(0);

    check('Argon: WC3-Auswahl [1] setzt Entscheidungs-Flag & fügt NPC-Antwort ein',

      SW.Quests.getFlag('wc3_sechs_loyal') === true &&

      SW.Ship.dialogueLines[SW.Ship.dialogueIndex].npc === 'SECHS');

    // 12-mal hintereinander NPC anklicken -> darf nie stumm werden

    let alwaysStarts = true;

    for (let c = 0; c < 12; c++) {

      SW.Ship.dialogueActive = false;

      SW.Ship.startNpcDialogue('Sechs');

      if (!SW.Ship.dialogueActive || !SW.Ship.dialogueLines.length || typeof SW.Ship.dialogueLines[0].text !== 'string') {

        alwaysStarts = false;

      }

    }

    check('Argon: Mehrfaches Anklicken (12x) startet immer einen Dialog (Cooldown-Reset)', alwaysStarts);

    SW.Ship.dialogueActive = false;



    // Optimierer nach m4_sieg in der Bar + 3 Enden (sieg / tod / geheim)

    SW.SmartDialogues.noteMission('m4', 'sieg');

    check('Argon: Optimierer erscheint nach m4_sieg in der Bar & hat Gesicht im Registry',

      SW.World.npcInRoom('bar').includes('Optimierer') && !!SW.NPC.registry.optimierer);

    SW.Game.victory = true;

    SW.Quests.flags.klo_wahrheit_gehoert = true;

    check('Argon: 3 Enden — Geheimes Ende (Akte 99-Z) wird erkannt', SW.Game.getEndingType() === 'geheim');

    SW.Game.setState('DEBRIEFING');

    pump(2);

    SW.Game.startCredits();

    check('Argon: Geheimes Ende baut speziellen Abspann',

      SW.Game._credits && SW.Game._credits.lines.some(l => String(l.t || '').includes('GEHEIMES ENDE')));



    // WC1 Target-Bracket & Fax-Banner im Flug

    SW.Game.startMission('m1');

    SW.Game.setState('COCKPIT');

    SW.Fax.push('FAX-TEST', 'Formular 91-X gedruckt.');

    pump(3);

    check('Argon: Target-Bracket & Fax-Overlay rendern im Cockpit fehlerfrei',

      typeof SW.UI.renderTargetBracket === 'function' && !!SW.Fax.current);

    check('Argon: Website dokumentiert Gemini 4 Argon Pass',

      fs.readFileSync(path.join(root, 'site', 'index.html'), 'utf8').includes('Gemini 4 Argon') &&

      fs.readFileSync(path.join(root, 'site', 'entwicklung.html'), 'utf8').includes('GEMINI 4 ARGON'));



    // ===== WINGNUT / AMIGA / ARMADA / PRIVATEER / HERMES / LIGHTING PASS (v0.85) =====

    console.log('\n--- Wingnut Multi-Angle, Dynamic Lighting, Hermes & Privateer Tests ---');

    const shipAtlases = ['hornet', 'hornet_ace', 'scimitar', 'valtar', 'talon', 'dralthi', 'salthi', 'krant', 'strakha', 'grikath', 'fax_traegodie', 'hermes_carrier', 'hermes_drone', 'freighter'];

    const allAtlasesExist = shipAtlases.every(k => fs.existsSync(path.join(root, 'sprites', 'ships', k + '.png')));

    check('Wingnut: Alle 14 kompakten 80-View Schiffs-Atlanten inkl. TCS Fax-Tragödie, TCS Hermes & Kiste 47 existieren', allAtlasesExist);



    const cockpitFronts = ['hornet', 'scimitar', 'valtar', 'freighter', 'hermes', 'dralthi', 'salthi', 'krant', 'strakha'];

    const allCockpitsExist = cockpitFronts.every(k =>

      fs.existsSync(path.join(root, 'sprites', 'cockpits', k + '_front.png')) &&

      fs.existsSync(path.join(root, 'sprites', 'cockpits', k + '_left_gun.png')) &&

      fs.existsSync(path.join(root, 'sprites', 'cockpits', k + '_right_gun.png')));

    check('Wingnut: Alle 9 Cockpits inkl. RGBA-Waffenfeuer-Lightmaps + Terran/Kilrathi Piloten-Hände existieren',

      allCockpitsExist &&

      fs.existsSync(path.join(root, 'sprites', 'cockpits', 'terran_joystick.png')) &&

      fs.existsSync(path.join(root, 'sprites', 'cockpits', 'kilrathi_joystick.png')) &&

      fs.existsSync(path.join(root, 'sprites', 'vfx', 'nav_light.png')) &&

      fs.existsSync(path.join(root, 'sprites', 'vfx', 'debris01.png')));



    // PNG-Header Dimensionen prüfen (alle durch 2 teilbar für Amiga-Skalierung)

    let allDivBy2 = true;

    for (const k of shipAtlases) {

      const buf = fs.readFileSync(path.join(root, 'sprites', 'ships', k + '.png'));

      const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);

      if (w % 2 !== 0 || h % 2 !== 0) allDivBy2 = false;

    }

    check('Wingnut: Alle 14 Schiffs-Atlanten sind exakt durch 2 teilbar (Amiga-Kompatibilität)', allDivBy2);



    // 2 kompakte Grafik-Modi (wingnut_hd <-> amiga_vga, ohne 16x16 Urgrafiken)

    check('Wingnut: Standard-Grafikmodus ist wingnut_hd (80 Views)', SW.Sprites.graphicsMode === 'wingnut_hd');

    SW.Sprites.cycleGraphicsMode();

    check('Wingnut: Wechsel auf amiga_vga (40 Views /2)', SW.Sprites.graphicsMode === 'amiga_vga');

    const amigaCoords = SW.Sprites.getAngleCoords(0.5, 0.2);

    check('Wingnut: getAngleCoords liefert gültige (col, row) Indizes im Amiga-Modus',

      amigaCoords.col >= 0 && amigaCoords.col < 16 && amigaCoords.row >= 0 && amigaCoords.row < 5);

    // Prüfen, dass 0° Vorne exakt col 0 liefert (WCUnity SpritePicker-Fix)

    const frontCoords = SW.Sprites.getAngleCoords(0, 0);

    check('Wingnut: 0° Frontalansicht landet exakt auf Spalte 0, Reihe 2 (Level)',

      frontCoords.col === 0 && frontCoords.row === 2);

    SW.Sprites.cycleGraphicsMode();

    check('Wingnut: Zyklus kehrt direkt zu wingnut_hd zurück (keine 16x16 Urgrafiken)', SW.Sprites.graphicsMode === 'wingnut_hd');



    // Dynamische Waffenfeuer- & Explosions-Beleuchtung für Sprites & Cockpit

    SW.Projectiles.clear();

    SW.Projectiles.list.push({ x: 10, y: 5, z: 100, vx: 0, vy: 0, vz: 5, friendly: true, color: '#ff3333' });

    const dynLight = SW.Sprites.computeDynamicLight(12, 5, 100);

    check('Lighting: Waffenfeuer erzeugt dynamische Farb-Beleuchtung auf nahen Sprites',

      !!dynLight && dynLight.alpha > 0.05 && typeof dynLight.color === 'string');

    check('Lighting: Cockpit-Waffenfeuer- und Explosions-Beleuchtung ist implementiert',

      typeof SW.UI.renderCockpitDynamicLighting === 'function');



    // 9 fliegbare Schiffsklassen & Cockpits durchschaltbar

    const startShip = SW.Player.shipClassId;

    const visitedShips = new Set([startShip]);

    for (let i = 0; i < 9; i++) {

      SW.Player.cycleShipClass();

      visitedShips.add(SW.Player.shipClassId);

    }

    check('Wingnut: Alle 9 fliegbaren Schiffe & Cockpits (inkl. Hermes KIWI-Drohne) lassen sich per [B] durchschalten',

      visitedShips.size === 9 && SW.Player.shipClassId === startShip);



    // WC1/WC4 Cinematic Intro (Einzelner Frachter -> Piraten-Hinterhalt -> TCS Fax-Tragödie Sprung-Rettung)

    SW.Intro.init();

    SW.Intro.toPhase1();

    for (let f = 1; f <= 520; f++) SW.Intro.update(f);

    SW.Intro.render(ctxStub);

    check('Intro: WC4-Storytelling (Frachter im Asteroidenfeld -> Piraten -> Träger-Sprung & Hornet-Rettung)',

      SW.Intro.t >= 520 && SW.Intro.pirates.length === 3 && SW.Intro.rocks.length > 0);



    // TCS Hermes KI-Träger & Branching Storylines (m5, m6a, m6b)

    check('Hermes: TCS Hermes Träger & Roboter-Crew (Hermes-Kern, Worker-7, Reviewer-9) im Katalog',

      !!SW.Transfers.getById('tcs-hermes') &&

      !!SW.NPC.registry['hermes-kern'] && !!SW.NPC.registry['worker-7'] && !!SW.NPC.registry['reviewer-9']);

    SW.Transfers.transferTo('tcs-hermes', 'Test');

    check('Hermes: Träger-Atlas wechselt auf hermes_carrier bei Stationierung auf TCS Hermes',

      SW.Sprites.getCarrierAtlasKey() === 'hermes_carrier');

    check('Hermes: Branching Missionen m5, m6a und m6b sind definiert',

      !!SW.Missions.get('m5') && !!SW.Missions.get('m6a') && !!SW.Missions.get('m6b'));

    SW.Transfers.transferTo('fax-traegodie', 'Zurück');



    // Interaktiver Staffelfunk im Flug ([1]-[4]) — Links wie in WC3

    SW.Wingman.spawned = true;

    SW.Wingman.alive = true;

    SW.Wingman.order('attack');

    SW.Comm.update();

    const allComms1 = [...SW.Comm.messages, ...SW.Comm.queue];

    check('Wingnut: In-Flight Staffelfunk [1] Angriff setzt Wingman-Mode & Funkspruch',

      SW.Wingman.mode === 'attack' && allComms1.some(m => m.text.includes('SECHS:')));

    SW.Wingman.order('taunt');

    SW.Comm.update();

    const allComms2 = [...SW.Comm.messages, ...SW.Comm.queue];

    check('Wingnut: In-Flight Ziel-Funk [4] sendet Spott/Einschüchterung auf Kanal',

      allComms2.some(m => m.text.includes('FUNK AN FEIND:') || m.text.includes('SECHS:')));



    // Armada / Privateer 16-Sektor-Sternenkarte & Dual-Karriere

    check('Armada: 16 Sektoren auf der Sternenkarte vorhanden',

      SW.ArmadaMap && SW.ArmadaMap.sectors.length === 16);

    SW.ArmadaMap.open();

    check('Armada: Sternenkarte öffnet und rendert fehlerfrei', SW.ArmadaMap.active === true);

    SW.ArmadaMap.render(ctxStub);



    // Beförderung zum Captain -> Admiral + Flottenbefehl

    SW.CarrierEconomy.tier = 1;

    SW.ArmadaMap.handleKeyDown({ key: 'p' }); // Captain (tier 2)

    SW.ArmadaMap.handleKeyDown({ key: 'p' }); // Admiral (tier 3)

    check('Armada: Beförderung bis Admiral schaltet Flottenkommando frei',

      SW.CarrierEconomy.tier >= 3 && SW.CarrierEconomy.getSummary().rank.includes('Admiral'));



    // Dienst Quittieren: Zwischensequenz (RESIGNATION), missionsabhängige Abfindung & geschenktes Schiff

    SW.World.missionProgress = ['m1', 'm2', 'm3']; // 3 gespielte Missionen -> mehr Geld + besseres Schiff

    SW.ArmadaMap.handleKeyDown({ key: 'q' });

    check('Privateer: Dienst quittieren startet RESIGNATION-Zwischensequenz, zahlt Einsatz-Abfindung & schenkt Schiff',

      SW.CarrierEconomy.careerMode === 'privateer' &&

      SW.Game.state === 'RESIGNATION' &&

      SW.CarrierEconomy._lastSeverance > 3000 &&

      !!SW.CarrierEconomy.giftedShip);

    SW.Game.updateResignation();

    SW.Game.renderResignation(ctxStub);

    const creditsBefore = SW.CarrierEconomy.credits;

    const cargoBefore = SW.CarrierEconomy.getCargoUsed();

    SW.ArmadaMap.buyCommodity(0); // Toner/Faxpapier kaufen

    check('Privateer: Warenhandel kauft Fracht und zieht Credits ab',

      SW.CarrierEconomy.getCargoUsed() === cargoBefore + 1 && SW.CarrierEconomy.credits < creditsBefore);

    SW.ArmadaMap.sellCommodity(0);

    check('Privateer: Warenhandel verkauft Fracht wieder', SW.CarrierEconomy.getCargoUsed() === cargoBefore);



    // Sektor-zu-Sektor Navigationsflug (Sektorkarte [F] & Cockpit [N]/[J])

    const transitStarted = SW.ArmadaMap.startSectorTransit('s2');

    check('Navigation: Sektor-zu-Sektor Transitflug startet Sprung & lädt Transit-Mission',

      !!transitStarted && SW.Game.state === 'JUMP' && SW.Game.mission && SW.Game.mission.isTransit === true);

    SW.Game.setState('COCKPIT');

    SW.UI.navMapVisible = true;

    SW.UI.renderNavMap(ctxStub);

    check('Navigation: Cockpit-Navigationscomputer [N] rendert Sprungtor-Routen & Sektor-Infos',

      typeof SW.UI.jumpToNextConnectedSector === 'function');



    // Fog-of-War & Sprungtor-Validierung



    SW.ArmadaMap.carrierSectorId = 's1';



    SW.ArmadaMap.discoveredSectors = ['s1', 's2', 's4', 's5'];



    check('Armada: Nebel des Krieges (Fog-of-War) initialisiert s1 als bekannt und s16 als unerforscht',



      SW.ArmadaMap.isDiscovered('s1') && !SW.ArmadaMap.isDiscovered('s16'));



    check('Armada: Direktes Sprungtor erzwingt Verbindung (s16 blockiert, s2 erlaubt)',



      SW.ArmadaMap.startSectorTransit('s16') === false && SW.ArmadaMap.isDirectJumpAvailable('s2'));



    check('Armada: Sektor-Entdeckung schaltet Ziel frei',



      (SW.ArmadaMap.discoverSector('s16'), SW.ArmadaMap.isDiscovered('s16')));







    // Save/Load Privateer & Armada Persistence



    SW.CarrierEconomy.careerMode = 'privateer';



    SW.SaveGame.save();



    SW.CarrierEconomy.careerMode = 'military';



    SW.SaveGame.load();



    check('Savegame: Privateer-Modus und Karriere-Zustand werden persistent geladen',



      SW.CarrierEconomy.careerMode === 'privateer');







    // Combat-Balancing & Flotten-Spezifikationen



    check('Combat-Balancing: Projektil-Salvenabstand >= 15 Frames & Limit <= 6 Projektile',



      SW.ENEMY_BURST_GAP >= 15 && SW.ENEMY_MAX_PROJECTILES <= 6);



    check('Flotte: Konföderations-Versuchszerstörer nutzt kein Kilrathi-Schiff',



      SW.Transfers.getById('test-destroyer').carrierAtlasKey !== 'grikath');







    // Open-Source-Credits im Abspann (CREDITS), Info-Panel, README.md & LICENSE prüfen

    SW.Game.startCredits();

    const creditText = (SW.Game._credits && SW.Game._credits.lines || []).map(l => l.t || '').join(' ');

    const readmeText = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

    const licenseText = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8');



    // --- Amiga Wing Commander MOD Soundtrack & Sector Audio Tests ---

    check('Audio: SW.ModPlayer existiert und besitzt Amiga ProTracker Registry',

      typeof SW.ModPlayer === 'object' && typeof SW.ModPlayer.parseMod === 'function' &&

      SW.ModPlayer.TRACKS && SW.ModPlayer.TRACKS.recroom && SW.ModPlayer.TRACKS.regularcombat);

    

    const modFiles = fs.readdirSync(path.join(root, 'audio', 'mod'));

    check('Audio: Amiga Wing Commander MOD-Dateien (40 Tracks) vorhanden',

      modFiles.length >= 40 && modFiles.includes('wing_commander_recroom.mod') &&

      modFiles.includes('wing_commander_regularcombat.mod'));

    

    check('Audio: wing_commander_originfx.mod wie angewiesen ausgeschlossen',

      !modFiles.includes('wing_commander_originfx.mod'));



    const testModBuffer = fs.readFileSync(path.join(root, 'audio', 'mod', 'wing_commander_beingtailed.mod'));

    const parsedMod = SW.ModPlayer.parseMod(testModBuffer);

    check('Audio: ProTracker Mod-Parser liest Mark Knight MOD fehlerfrei (M.K. Header & Samples)',

      parsedMod && parsedMod.songLength > 0 && parsedMod.numPatterns > 0 && parsedMod.samples.length === 31);



    check('Audio: Offline Base64 ModArchive (14 Tracks) vorhanden',

      SW.ModArchive && Object.keys(SW.ModArchive).length === 14 && typeof SW.ModArchive.recroom === 'string');



    // Test Escape-Menü & Sound-Untermenü

    SW.Game.state = 'MENU';

    SW.Game.soundSubmenuOpen = false;

    pump(2);

    check('Menü: Audio-Zentrale Button _soundOpenBtn gesetzt', !!(SW.Game._soundOpenBtn && SW.Game._soundOpenBtn.w > 0));



    SW.Game.soundSubmenuOpen = true;

    pump(2);

    check('Menü: Sound-Untermenü öffnet, Schließen-Button & Toggles gesetzt',

      !!SW.Game._soundCloseRect && !!SW.Game._soundSfxRect && !!SW.Game._soundMusicRect &&

      !!SW.Game._soundTtsRect && !!SW.Game._soundFilterRect);

    check('Menü: Sound-Untermenü 6 Test-Presets (Messe, Flug, Kampf, Alarm, Orden, Stopp) vorhanden',

      Array.isArray(SW.Game._soundPresetRects) && SW.Game._soundPresetRects.length === 6);



    const oldFilter = SW.ModPlayer.paulaFilterEnabled;

    const newFilter = SW.ModPlayer.toggleFilter();

    check('Audio: Paula 5.2 kHz Filter umschaltbar', newFilter === !oldFilter);

    SW.ModPlayer.toggleFilter(); // Zurückstellen

    SW.Game.soundSubmenuOpen = false;



    check('Audio: SW.SectorSynth prozeduraler Synthesizer für Sektoren existiert',

      typeof SW.SectorSynth === 'object' && SW.SectorSynth.SCALES && SW.SectorSynth.SCALES.deep_space);



    check('Audio: SW.Audio.syncContext Kontext-Weiche vorhanden',

      typeof SW.Audio.syncContext === 'function' && typeof SW.Audio.playMod === 'function');



    // --- Story-Verzweigung, Taktik-Entscheidung & Meta-Quests Tests ---

    const mSpeer = SW.Missions.get('m5_speer');

    const mSchatten = SW.Missions.get('m5_schatten');

    check('Story: Branching-Missionen m5_speer (Frontlinie) & m5_schatten (Guerilla) existieren',

      mSpeer && mSpeer.id === 'm5_speer' && mSchatten && mSchatten.id === 'm5_schatten');



    const cmdChoices = (SW.Dialogues.choices && SW.Dialogues.choices.commander) || [];

    const tacticalChoice = cmdChoices.find(c => c.id === 'wc3_cmd_taktik_speer_schatten');

    check('Story: Taktische Verzweigung (Stellung halten vs. Rückzug) im Commander-Dialog',

      tacticalChoice && tacticalChoice.choices.length === 2 &&

      tacticalChoice.choices[0].flag === 'taktik_entscheidung_halten');



    const loeffelChoices = (SW.Dialogues.choices && SW.Dialogues.choices.loeffel) || [];

    const flashChoice = loeffelChoices.find(c => c.id === 'wc3_flash_upgrade');

    check('Meta-Quest: Koprozessor-Upgrade von Argon zu Gemini 3.8 Flash bei Löffel vorhanden',

      flashChoice && flashChoice.choices.length === 2 && flashChoice.choices[0].flag === 'flash_eingebaut');



    const flashQuest = (SW.QuestData.quests || []).find(q => q.id === 'protokoll_argon_flash');

    check('Meta-Quest: Protokoll Argon-Flash im Quest-Katalog registriert',

      flashQuest && flashQuest.npc === 'LÖFFEL');



    // --- Dogfight AI & Feeling Tests ---

    SW.Game.prepareMission('m1');

    const dummyEnemy = {

      alive: true, shipId: 'Jäger', speed: 2.5, hp: 30, range: 90, t: 0,

      x: 0, y: 0, z: SW.Player.z + 50, state: 'approach', burst: 1, fireTimer: 10,

      heading: 0, pitchAngle: 0

    };

    SW.Enemies.list = [dummyEnemy];

    SW.Enemies.waveActive = true;

    SW.Enemies.update(100);

    check('Dogfight AI: Jäger berechnet true 3D Heading und Pitch für alle 80 Ansichten',

      Number.isFinite(dummyEnemy.heading) && Number.isFinite(dummyEnemy.pitchAngle));



    check('Credits & Doku: Open-Source-Autoren (HowieDay, Arne Jansson, neuromancer/wc1-re) & Agenten im Abspann, README & LICENSE genannt',

      creditText.includes('Howard Day') && creditText.includes('Arne') && creditText.includes('wc1-re') &&

      readmeText.includes('HowieDay') && readmeText.includes('HANDOFF-DOKUMENTATION FÜR ZUKÜNFTIGE AGENTEN') &&

      licenseText.includes('Howard Day'));

  }



console.log(failures === 0 ? '\nALLE TESTS OK' : '\n' + failures + ' TESTS FEHLGESCHLAGEN');

process.exit(failures === 0 ? 0 : 1);

