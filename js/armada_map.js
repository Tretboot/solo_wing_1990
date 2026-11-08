// ===== SOLO WING 1990 — ARMADA & PRIVATEER 16-SECTOR STAR MAP =====
// Vereint Wing Commander Armada (Flotten-/Staffel-Strategie für Captains & Admiräle)
// und Wing Commander Privateer (Freier Rohstoffhandel, Schiffs-Händler & Söldner-Karriere):
// - 16 vernetzte Sektoren mit Sprungrouten, Planeten-Fakten, Sektor-Ereignissen & Börsenpreisen
// - [Q]: Jederzeit aus dem Sternenkorps aussteigen -> Abfindung + Frachter "Kiste 47" (Privateer-Modus!)
// - Oder durch Beförderung zum Captain / Admiral die TCS Fax-Tragödie & Staffeln kommandieren!

'use strict';

window.SW1990 = window.SW1990 || {};

SW.ArmadaMap = {
  active: false,
  selectedSectorIndex: 0,
  carrierSectorId: 's1',
  statusNotice: 'Sektorkarte bereit. [PFEILTASTEN] Sektor wählen, [Q] Privateer/Militär wechseln.',
  discoveredSectors: ['s1', 's2', 's4', 's5'],

  isDiscovered(sectorId) {
    if (!this.discoveredSectors) this.discoveredSectors = ['s1', 's2', 's4', 's5'];
    return this.discoveredSectors.indexOf(sectorId) >= 0;
  },

  isAdjacentToDiscovered(sectorId) {
    if (this.isDiscovered(sectorId)) return true;
    for (let i = 0; i < (this.discoveredSectors || []).length; i++) {
      const sid = this.discoveredSectors[i];
      const s = this.SECTORS.find(sec => sec.id === sid);
      if (s && Array.isArray(s.links) && s.links.indexOf(sectorId) >= 0) return true;
    }
    return false;
  },

  discoverSector(sectorId) {
    if (!this.discoveredSectors) this.discoveredSectors = ['s1', 's2', 's4', 's5'];
    if (this.discoveredSectors.indexOf(sectorId) < 0) {
      this.discoveredSectors.push(sectorId);
    }
  },

  COMMODITIES: [
    { key: 'toner',         name: 'Endlos-Faxpapier & Toner', basePrice: 40 },
    { key: 'ersatzteile',   name: 'Hangar-Ersatzteile',       basePrice: 75 },
    { key: 'erz',           name: 'Hephaestus-Schwermetall',  basePrice: 110 },
    { key: 'kaffee',        name: 'Echter Bohnenkaffee 1989', basePrice: 160 },
    { key: 'schmuggelware', name: 'Unzensierte Disketten',    basePrice: 280 }
  ],

  SECTORS: [
    {
      id: 's1', name: 'SEKTOR 7 (TRÄGER-ANKER)', x: 95, y: 115, faction: 'STERNENKORPS', color: '#3388ff',
      planet: 'Station Sieben-B (Bürokratie-Knoten)',
      facts: 'Heimatanker der TCS Fax-Tragödie. 94% der Bevölkerung arbeitet in der Formular-Prüfung.',
      event: 'RUHIG: Regelmäßige Papier-Konvois.',
      links: ['s2', 's4', 's5'],
      prices: { toner: 30, ersatzteile: 70, erz: 120, kaffee: 180, schmuggelware: 310 }
    },
    {
      id: 's2', name: 'SEKTOR 9 (ROTER NEBEL)', x: 185, y: 95, faction: 'PIRATEN', color: '#ff4444',
      planet: 'Rostwelt 9 (Piraten-Versteck)',
      facts: 'Dichter Eisenoxid-Nebel. Rückzugsort von Piratenkapitän „Der Kugelschreiber“.',
      event: 'WARNUNG: Piraten-Kassettenfunk auf allen Kanälen!',
      links: ['s1', 's3', 's6'],
      prices: { toner: 65, ersatzteile: 95, erz: 90, kaffee: 210, schmuggelware: 190 }
    },
    {
      id: 's3', name: 'SEKTOR 12 (GRAUE ZONE)', x: 280, y: 105, faction: 'DAS AUDIT', color: '#cccccc',
      planet: 'Archiv-Mond 12 (Voll-Klimatisiert)',
      facts: 'Kein Staubkorn erlaubt. Hier werden Kältekammern und unrentable Träger abgerechnet.',
      event: 'AUDIT-PRÜFUNG: Hohe Nachfrage nach Faxpapier!',
      links: ['s2', 's7', 's8'],
      prices: { toner: 85, ersatzteile: 65, erz: 115, kaffee: 140, schmuggelware: 390 }
    },
    {
      id: 's4', name: 'STATION GEMMA 4', x: 75, y: 185, faction: 'FREIE HÄNDLER', color: '#44dd88',
      planet: 'Freihafen Gemma 4 (Synthehol-Börse)',
      facts: 'Größter Umschlagplatz für echten Kaffee, Schmuggel-Disketten und gebrauchte Frachter.',
      event: 'BOOM: Kaffee-Ernte auf Deck 4.',
      links: ['s1', 's5', 's9'],
      prices: { toner: 45, ersatzteile: 80, erz: 130, kaffee: 95, schmuggelware: 210 }
    },
    {
      id: 's5', name: 'AUßENPOSTEN 31', x: 155, y: 170, faction: 'STERNENKORPS', color: '#3388ff',
      planet: 'Horchposten 31 (Eis-Asteroid)',
      facts: 'Zwei Zimmer, eine Kaffeemaschine und ein 9600-Baud-Relais. Sehr ruhige Versetzung.',
      event: 'FROST: Heizung benötigt Ersatzteile.',
      links: ['s1', 's4', 's6', 's10'],
      prices: { toner: 50, ersatzteile: 115, erz: 100, kaffee: 195, schmuggelware: 260 }
    },
    {
      id: 's6', name: 'HEPHAESTUS MINEN', x: 235, y: 165, faction: 'FREIE HÄNDLER', color: '#ffaa33',
      planet: 'Schmelzwelt Hephaestus III',
      facts: 'Tagebau für Titan-Hüllenplatten und Ionen-Düsen. Exportiert billiges Erz und Ersatzteile.',
      event: 'ÜBERPRODUKTION: Erz zu Tiefstpreisen!',
      links: ['s2', 's5', 's7', 's11'],
      prices: { toner: 55, ersatzteile: 48, erz: 55, kaffee: 200, schmuggelware: 290 }
    },
    {
      id: 's7', name: 'BEX RAUMWERFT', x: 315, y: 165, faction: 'STERNENKORPS', color: '#3388ff',
      planet: 'Orbital-Dock Bex Prime',
      facts: 'Flottenwerft für Hornet-, Scimitar- und Valtar-Jäger. Hier kauft das Korps seine Schiffe.',
      event: 'WERFT-RABATT: Günstige Ersatzteile.',
      links: ['s3', 's6', 's8', 's12'],
      prices: { toner: 40, ersatzteile: 42, erz: 145, kaffee: 165, schmuggelware: 320 }
    },
    {
      id: 's8', name: 'KILRATH-GRENZE', x: 380, y: 120, faction: 'PIRATEN', color: '#ff4444',
      planet: 'Grenzsektor K-8 (Sperrgebiet)',
      facts: 'Hier wurden Dralthi, Salthi und Krant-Jäger geborgen. Gefährliches Pflaster für Frachter.',
      event: 'ALARM: Beute-Jäger am Sprungpunkt!',
      links: ['s3', 's7', 's12'],
      prices: { toner: 70, ersatzteile: 130, erz: 150, kaffee: 240, schmuggelware: 360 }
    },
    {
      id: 's9', name: 'NEU-OSNABRÜCK', x: 85, y: 255, faction: 'FREIE HÄNDLER', color: '#44dd88',
      planet: 'Agrarkolonie Neu-Osnabrück',
      facts: 'bekannt für den Westfälischen Raum-Frieden von 1988 und erstklassigen Bohnenkaffee.',
      event: 'MESSE: Hohe Preise für Hochtechnologie.',
      links: ['s4', 's10', 's13'],
      prices: { toner: 35, ersatzteile: 95, erz: 135, kaffee: 85, schmuggelware: 250 }
    },
    {
      id: 's10', name: 'TESLA-RELAIS', x: 165, y: 240, faction: 'STERNENKORPS', color: '#3388ff',
      planet: 'Funk-Phalanx Tesla',
      facts: 'Verstärkt sämtliche Fax-Signale im Quadranten mit 400 Megawatt Röhrenleistung.',
      event: 'STABIL: Normale Marktpreise.',
      links: ['s5', 's9', 's11', 's14'],
      prices: { toner: 25, ersatzteile: 85, erz: 110, kaffee: 160, schmuggelware: 280 }
    },
    {
      id: 's11', name: 'SCHROTTGÜRTEL 47', x: 245, y: 235, faction: 'PIRATEN', color: '#ff4444',
      planet: 'Wrackfeld Kiste-Alpha',
      facts: 'Friedhof ausgemusterter Frachter und Schreibmaschinen. Beliebter Schmuggler-Treffpunkt.',
      event: 'SCHWARZMARKT: Unzensierte Disketten spottbillig!',
      links: ['s6', 's10', 's12', 's15'],
      prices: { toner: 60, ersatzteile: 55, erz: 80, kaffee: 190, schmuggelware: 145 }
    },
    {
      id: 's12', name: 'AUDIT-ZENTRALARCHIV', x: 345, y: 230, faction: 'DAS AUDIT', color: '#cccccc',
      planet: 'Zentralwelt Formular-Null',
      facts: 'Ein ganzer Planet aus grauen Aktenschränken. Unzensierte Disketten erzielen Rekordpreise!',
      event: ' ZENSUR: Höchstpreise für Schmuggel-Disketten!',
      links: ['s7', 's8', 's11', 's16'],
      prices: { toner: 90, ersatzteile: 75, erz: 120, kaffee: 175, schmuggelware: 440 }
    },
    {
      id: 's13', name: 'FREIHAFEN TARSUS', x: 115, y: 310, faction: 'FREIE HÄNDLER', color: '#44dd88',
      planet: 'Tarsus-Basar (Privateer-Gilde)',
      facts: 'Treffpunkt unabhängiger Kapitäne, die dem Sternenkorps den Rücken gekehrt haben.',
      event: 'SÖLDNER-TREFF: Alle Schiffsklassen verfügbar.',
      links: ['s9', 's14'],
      prices: { toner: 45, ersatzteile: 60, erz: 105, kaffee: 130, schmuggelware: 175 }
    },
    {
      id: 's14', name: 'SIEDLER-TRECK ALPHA', x: 205, y: 305, faction: 'FREIE HÄNDLER', color: '#44dd88',
      planet: 'Kolonieschiff-Flotte Alpha',
      facts: 'Die zivilen Siedler aus Mission 3. Kaufen dankbar Ersatzteile, Erz und Kaffee.',
      event: 'KOLONIE-AUFBAU: Zahlt Spitzenpreise für Erz & Teile!',
      links: ['s10', 's13', 's15'],
      prices: { toner: 50, ersatzteile: 125, erz: 165, kaffee: 215, schmuggelware: 270 }
    },
    {
      id: 's15', name: 'NEBEL VON STRUDEL', x: 290, y: 300, faction: 'PIRATEN', color: '#ffaa33',
      planet: 'Anomalie Strudelforce',
      facts: 'Aus dem Nebel dringen 4-Kanal-Amiga-ProTracker-Bässe. Niemand weiß warum.',
      event: 'AUDIO-ANOMALIE: TFMX-Signale gemessen.',
      links: ['s11', 's14', 's16'],
      prices: { toner: 55, ersatzteile: 90, erz: 95, kaffee: 170, schmuggelware: 330 }
    },
    {
      id: 's16', name: 'TERMINUS-SPRUNGTOR', x: 375, y: 295, faction: 'DAS AUDIT', color: '#cccccc',
      planet: 'Sprungtor 1990-Omega',
      facts: 'Äußerster Rand der bekannten Sektorkarte. Dahinter liegt nur noch unformatiertes All.',
      event: 'GRENZPOSTEN: Hohe Gefahrenzulage.',
      links: ['s12', 's15'],
      prices: { toner: 95, ersatzteile: 140, erz: 175, kaffee: 250, schmuggelware: 420 }
    }
  ],

  open() {
    this.active = true;
    if (SW.Audio && typeof SW.Audio.playBeep === 'function') SW.Audio.playBeep(760, 0.08);
  },

  close() {
    this.active = false;
    if (SW.Audio && typeof SW.Audio.playBeep === 'function') SW.Audio.playBeep(420, 0.06);
  },

  get sectors() {
    return this.SECTORS;
  },

  buyCommodity(index) {
    return this.tradeCommodity(index, false);
  },

  sellCommodity(index) {
    return this.tradeCommodity(index, true);
  },

  getSelectedSector() {
    return this.SECTORS[this.selectedSectorIndex] || this.SECTORS[0];
  },

  tradeCommodity(index, isSell) {
    if (!SW.CarrierEconomy) return false;
    const item = this.COMMODITIES[index];
    if (!item) return false;
    const sec = this.getSelectedSector();
    if (!this.isDiscovered(sec.id)) {
      this.statusNotice = 'Keine Börsendaten: Sektor ' + sec.name.split(' (')[0] + ' ist noch nicht erforscht!';
      return false;
    }
    const price = (sec.prices && sec.prices[item.key]) || item.basePrice;
    const hold = SW.CarrierEconomy.cargoHold || (SW.CarrierEconomy.cargoHold = {});

    if (isSell) {
      if ((hold[item.key] || 0) <= 0) {
        this.statusNotice = 'Kein Bestand an ' + item.name + ' im Frachtraum!';
        return false;
      }
      hold[item.key]--;
      SW.CarrierEconomy.credits += price;
      SW.CarrierEconomy.saveState();
      this.statusNotice = 'VERKAUFT: 1t ' + item.name + ' für +' + price + ' CR in ' + sec.name + '.';
      if (SW.Audio && SW.Audio.playBeep) SW.Audio.playBeep(980, 0.06);
      return true;
    } else {
      const used = SW.CarrierEconomy.getCargoUsed();
      const max = SW.CarrierEconomy.getCargoMax();
      if (used >= max) {
        this.statusNotice = 'Frachtraum voll (' + used + '/' + max + 't)! Größeren Frachter wählen [B] oder verkaufen.';
        return false;
      }
      if (SW.CarrierEconomy.credits < price) {
        this.statusNotice = 'Nicht genug Credits (' + price + ' CR benötigt)!';
        return false;
      }
      SW.CarrierEconomy.credits -= price;
      hold[item.key] = (hold[item.key] || 0) + 1;
      SW.CarrierEconomy.saveState();
      this.statusNotice = 'GEKAUFT: 1t ' + item.name + ' für -' + price + ' CR (' + (used + 1) + '/' + max + 't).';
      if (SW.Audio && SW.Audio.playBeep) SW.Audio.playBeep(720, 0.06);
      return true;
    }
  },

  getCurrentSector() {
    return this.SECTORS.find(s => s.id === this.carrierSectorId) || this.SECTORS[0];
  },

  isDirectJumpAvailable(targetId) {
    const cur = this.getCurrentSector();
    if (!cur || !targetId) return false;
    return cur.id === targetId || (Array.isArray(cur.links) && cur.links.includes(targetId));
  },

  // Erstellt einen dynamischen Sektor-zu-Sektor-Navigationsflug (mit Sprungtor-Bojen, Fraktions-Begegnungen & Station-Anflug!)
  buildSectorTransitMission(fromSec, toSec) {
    const isPirate = toSec.faction === 'PIRATEN';
    const isAudit = toSec.faction === 'DAS AUDIT';
    const isTrader = toSec.faction === 'FREIE HÄNDLER';
    const waves = [];
    const waveMessages = [];

    if (isPirate) {
      waves.push({
        z: 180,
        groups: [{ count: 2, ship: 'piraten_jaeger' }, { count: 1, ship: 'd_b' }]
      });
      waves.push({
        z: 420,
        groups: [{ count: 1, ship: 'piraten_kapitaen' }, { count: 2, ship: 'piraten_jaeger' }]
      });
      waveMessages.push('PIRATEN-FUNK: Mautkontrolle am Sprungtor ' + toSec.name + '! Fracht abwerfen oder brennen!');
      waveMessages.push('KAPITÄN: Hier kommt das Flaggschiff! Niemand durchquert ' + toSec.name + ' gratis!');
    } else if (isAudit) {
      waves.push({
        z: 200,
        groups: [{ count: 2, ship: 'einheit' }]
      });
      waves.push({
        z: 440,
        groups: [{ count: 1, ship: 'Kreuzer' }, { count: 2, ship: 'einheit' }]
      });
      waveMessages.push('AUDIT-ZOLL: Sektor ' + toSec.name + '. Ihr Transit-Formular 44-S weist Unregelmäßigkeiten auf.');
      waveMessages.push('AUDIT-KREUZER: Einleitung der steuerlichen Vollstreckung im Raum.');
    } else if (isTrader) {
      waves.push({
        z: 180,
        civilian: true,
        groups: [{ count: 2, ship: 'Kreuzer', civilian: true }, { count: 2, ship: 'piraten_jaeger' }]
      });
      waves.push({
        z: 420,
        groups: [{ count: 2, ship: 'Jäger' }]
      });
      waveMessages.push('HANDELSKONVOI: Willkommen auf der Route nach ' + toSec.planet + '! Vorsicht, Wegelagerer am Nav-Punkt!');
      waveMessages.push('FREIHAFEN-SICHERHEIT: Halten Sie den Anflugkorridor nach ' + toSec.name + ' sauber.');
    } else {
      waves.push({
        z: 200,
        groups: [{ count: 2, ship: 'd_b' }]
      });
      waves.push({
        z: 420,
        groups: [{ count: 2, ship: 'Jäger' }, { count: 1, ship: 'hermes_drone' }]
      });
      waveMessages.push('SEKTOR-LEITSTELLE: Sprung nach ' + toSec.name + ' bestätigt. Nav-Bojen aktiv.');
      waveMessages.push('PATROUILLE: Räumen Sie versprengte Kontakte vor Ankerplatz ' + toSec.planet + '.');
    }

    return {
      id: 'transit_' + toSec.id,
      name: 'SEKTOR-TRANSIT: ' + fromSec.name.split(' (')[0] + ' -> ' + toSec.name.split(' (')[0],
      title: 'SEKTOR-TRANSIT: ' + fromSec.name.split(' (')[0] + ' -> ' + toSec.name.split(' (')[0],
      system: ['s1', 's2', 's3'].includes(toSec.id) ? toSec.id : 's1',
      systemId: ['s1', 's2', 's3'].includes(toSec.id) ? toSec.id : 's1',
      targetSectorId: toSec.id,
      isTransit: true,
      isSectorTransit: true,
      briefing: [
        'NAVIGATIONSLOGBUCH: Kurs gesetzt von ' + fromSec.name + ' nach ' + toSec.name + '.',
        'Zielwelt: ' + toSec.planet + ' (' + toSec.faction + ').',
        'Sektor-Lage: ' + toSec.event,
        'Fliegen Sie die Nav-Sprungbojen ab oder landen Sie mit [L] direkt am Ziel-Ankerplatz!'
      ],
      navPoints: [
        { x: -35, y: 10,  z: 180, label: 'WP1 SPRUNGBOJE' },
        { x:  40, y: -15, z: 420, label: 'WP2 ' + toSec.name.substring(0, 12) },
        { x:   0, y: 0,   z: 680, label: 'WP3 ANKER ' + toSec.planet.substring(0, 10) }
      ],
      waves,
      waveMessages
    };
  },

  startSectorTransit(targetSector) {
    let sec = null;
    if (typeof targetSector === 'string') {
      sec = this.SECTORS.find(s => s.id === targetSector);
    } else if (targetSector && typeof targetSector === 'object') {
      sec = targetSector;
    }
    if (!sec) sec = this.getSelectedSector();
    const fromSec = this.getCurrentSector();

    // Direkte Sprungtor-Prüfung: Nur direkt verbundene Sprungtore anfliegbar!
    if (fromSec.id !== sec.id && !this.isDirectJumpAvailable(sec.id)) {
      this.statusNotice = 'KEINE DIREKTE SPRUNGVERBINDUNG — Nur direkt verbundene Sprungtore anfliegbar!';
      if (SW.Audio && SW.Audio.playBeep) SW.Audio.playBeep(320, 0.12);
      return false;
    }

    this.discoverSector(sec.id);
    this.carrierSectorId = sec.id;
    if (SW.World) {
      SW.World.currentSectorId = sec.id;
      SW.World.systemId = ['s1', 's2', 's3'].includes(sec.id) ? sec.id : 's1';
    }
    const transitMission = this.buildSectorTransitMission(fromSec, sec);
    this.lastTransitMission = transitMission;
    this.statusNotice = 'SEKTOR-TRANSIT GESTARTET: ' + fromSec.name.split(' (')[0] + ' -> ' + sec.name + '!';
    if (SW.Game) {
      this.close();
      SW.Game._currentMission = transitMission.id;
      SW.Game._customTransitMission = transitMission;
      if (SW.Game.startMissionWithData) {
        SW.Game.startMissionWithData(transitMission);
      } else {
        SW.Game.startMission('m1');
      }
      SW.Game._jumpT = 0;
      SW.Game._jumpTargetSys = transitMission.system;
      SW.Game._jumpTargetSectorName = sec.name + ' — ' + sec.planet;
      SW.Game.setState('JUMP');
      if (SW.Audio && SW.Audio.playJumpWhoosh) SW.Audio.playJumpWhoosh();
    }
    return transitMission;
  },

  dispatchOrJump() {
    const sec = this.getSelectedSector();
    const econ = SW.CarrierEconomy;
    if (!econ) return;
    const fromSec = this.getCurrentSector();

    // Direkte Sprungtor-Prüfung: Nur direkt verbundene Sprungtore anfliegbar!
    if (fromSec.id !== sec.id && !this.isDirectJumpAvailable(sec.id)) {
      this.statusNotice = 'KEINE DIREKTE SPRUNGVERBINDUNG — Nur direkt verbundene Sprungtore anfliegbar!';
      if (SW.Audio && SW.Audio.playBeep) SW.Audio.playBeep(320, 0.12);
      return;
    }

    this.discoverSector(sec.id);
    if (econ.careerMode === 'privateer') {
      this.carrierSectorId = sec.id;
      if (SW.World) {
        SW.World.currentSectorId = sec.id;
        SW.World.systemId = ['s1', 's2', 's3'].includes(sec.id) ? sec.id : 's1';
      }
      this.lastTransitMission = this.buildSectorTransitMission(fromSec, sec);
      this.statusNotice = 'PRIVATEER-SPRUNG: Kurs nach ' + sec.name + ' (' + sec.planet + ') gesetzt! [ENTER/F] für Sektor-Flug.';
      if (SW.Audio && SW.Audio.playJumpWhoosh) SW.Audio.playJumpWhoosh();
      return;
    }
    if (econ.tier < 2) {
      this.statusNotice = 'Befehl verweigert: Erst ab Rang CAPTAIN/ADMIRAL [P] oder im PRIVATEER-MODUS [Q] verfügbar!';
      return;
    }
    this.carrierSectorId = sec.id;
    if (SW.World) SW.World.currentSectorId = sec.id;
    econ.addReward(150, 3);
    this.statusNotice = 'ARMADA-KOMMANDO: Träger & Staffel nach ' + sec.name + ' verlegt (+150 CR Sektorsicherung).';
    if (SW.Audio && SW.Audio.playBeep) SW.Audio.playBeep(880, 0.08);
  },

  handleKeyDown(e) {
    if (!this.active) return false;
    if (e.key === 'Escape' || e.key === 'k' || e.key === 'K') {
      this.close();
      return true;
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      this.selectedSectorIndex = (this.selectedSectorIndex + 1) % this.SECTORS.length;
      return true;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      this.selectedSectorIndex = (this.selectedSectorIndex - 1 + this.SECTORS.length) % this.SECTORS.length;
      return true;
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      this.selectedSectorIndex = (this.selectedSectorIndex + 4) % this.SECTORS.length;
      return true;
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      this.selectedSectorIndex = (this.selectedSectorIndex - 4 + this.SECTORS.length) % this.SECTORS.length;
      return true;
    }

    // [Q]: Dual-Career Toggle (Dienst quittieren -> Privateer-Modus inkl. Zwischensequenz & Geschenkschiff!)
    if (e.key === 'q' || e.key === 'Q') {
      if (SW.CarrierEconomy) {
        if (SW.CarrierEconomy.careerMode === 'privateer') {
          SW.CarrierEconomy.returnToMilitary();
          this.statusNotice = 'STERNENKORPS: Wieder im aktiven Militärdienst auf der TCS Fax-Tragödie.';
        } else {
          const triggerCutscene = !!(SW.Game && typeof SW.Game.startResignation === 'function');
          if (triggerCutscene) this.close();
          SW.CarrierEconomy.enterPrivateerMode('Dienst auf eigenen Wunsch quittiert (Formular 99-P).', triggerCutscene);
          const sev = SW.CarrierEconomy.lastSeverance || 1800;
          const gShip = SW.CarrierEconomy.giftedShipName || 'Frachter Kiste 47';
          this.statusNotice = 'PRIVATEER-MODUS AKTIV: ' + sev + ' CR Abfindung + ' + gShip + ' übergeben!';
        }
      }
      return true;
    }

    // [P]: Beförderung (Gefreiter -> Captain -> Admiral) für Armada-Flottenkommando
    if (e.key === 'p' || e.key === 'P') {
      if (SW.CarrierEconomy) {
        SW.CarrierEconomy.promote();
        const sum = SW.CarrierEconomy.getSummary();
        this.statusNotice = 'BEFÖRDERUNG PER FAX: Neuer Rang ' + sum.rank + '!';
      }
      return true;
    }

    // [B]: Schiff & Cockpit wechseln (Schiffshändler / Hangar-Wahl)
    if (e.key === 'b' || e.key === 'B') {
      if (SW.Player && SW.Player.cycleShipClass) {
        const cls = SW.Player.cycleShipClass();
        this.statusNotice = 'SCHIFF/COCKPIT GEWÄHLT: ' + cls.name + ' (Frachtraum: ' + (cls.cargoMax || 10) + 't).';
      }
      return true;
    }

    // [E]: Sprung / Armada-Flotte verlegen
    if (e.key === 'e' || e.key === 'E') {
      this.dispatchOrJump();
      return true;
    }

    // [F]: Echter Sektor-zu-Sektor-Navigationsflug zum gewählten Sektor!
    if (e.key === 'f' || e.key === 'F') {
      this.startSectorTransit(this.getSelectedSector());
      return true;
    }

    // [1]-[5]: Ware kaufen (mit SHIFT: Ware verkaufen!)
    if (['1', '2', '3', '4', '5', '!', '"', '§', '$', '%'].includes(e.key) ||
        ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(e.code)) {
      const idx = parseInt(String(e.code || '').replace('Digit', ''), 10) - 1;
      if (idx >= 0 && idx < 5) {
        this.tradeCommodity(idx, !!e.shiftKey);
        return true;
      }
    }

    // [ENTER]: Sektor-zu-Sektor-Navigationsflug starten!
    if (e.key === 'Enter') {
      const sec = this.getSelectedSector();
      this.startSectorTransit(sec);
      return true;
    }

    return false;
  },

  render(ctx) {
    if (!this.active) return;

    const sec = this.getSelectedSector();
    const econ = SW.CarrierEconomy ? SW.CarrierEconomy.getSummary() : { credits: 1250, rank: 'Gefreiter', rankShort: 'GEFREITER', careerMode: 'military', tier: 1 };
    const isPriv = econ.careerMode === 'privateer';

    ctx.save();
    if (ctx.setTransform) ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Outer frame (640x400 native resolution)
    ctx.fillStyle = 'rgba(8, 14, 24, 0.97)';
    ctx.fillRect(20, 14, 600, 372);
    ctx.strokeStyle = isPriv ? '#dd9933' : '#3388cc';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 14, 600, 372);

    // Top Header
    ctx.fillStyle = isPriv ? '#2a1c0e' : '#12263f';
    ctx.fillRect(22, 16, 596, 26);
    ctx.fillStyle = isPriv ? '#ffcc55' : '#88ddff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(isPriv
      ? 'PRIVATEER-SEKTORKARTE & HANDELSBÖRSE // FREIBEUTER AUF „KISTE 47“'
      : 'ARMADA-SEKTORKARTE & FLOTTENKOMMANDO // STERNENKORPS (16 SEKTOREN)', 30, 33);

    ctx.fillStyle = '#44ff88';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('CREDITS: ' + econ.credits + ' CR | ' + econ.rankShort, 608, 33);

    // Left Panel: 16-Sector Star Map (x=28..395, y=48..332)
    ctx.fillStyle = '#050a12';
    ctx.fillRect(28, 48, 372, 284);
    ctx.strokeStyle = '#1e3b58';
    ctx.strokeRect(28, 48, 372, 284);

    // Grid lines
    ctx.strokeStyle = 'rgba(40, 80, 120, 0.22)';
    ctx.lineWidth = 1;
    for (let gx = 60; gx < 395; gx += 45) {
      ctx.beginPath(); ctx.moveTo(gx, 48); ctx.lineTo(gx, 332); ctx.stroke();
    }
    for (let gy = 80; gy < 330; gy += 45) {
      ctx.beginPath(); ctx.moveTo(28, gy); ctx.lineTo(400, gy); ctx.stroke();
    }

    // Jump Lanes between sectors (mit Nebel des Krieges)
    ctx.lineWidth = 1.2;
    for (const s of this.SECTORS) {
      for (const targetId of s.links) {
        const t = this.SECTORS.find(o => o.id === targetId);
        if (t && s.id < t.id) {
          const sDisc = this.isDiscovered(s.id);
          const tDisc = this.isDiscovered(t.id);
          const sAdj = this.isAdjacentToDiscovered(s.id);
          const tAdj = this.isAdjacentToDiscovered(t.id);
          if (sDisc && tDisc) {
            ctx.strokeStyle = 'rgba(90, 160, 220, 0.55)';
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke();
          } else if ((sDisc && tAdj) || (tDisc && sAdj)) {
            ctx.strokeStyle = 'rgba(70, 110, 140, 0.28)';
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke();
          }
        }
      }
    }

    // Active Navigation Course Vector from Current Sector to Selected Target Sector
    const curSec = this.getCurrentSector();
    if (curSec && sec && curSec.id !== sec.id) {
      const isDirect = this.isDirectJumpAvailable(sec.id);
      ctx.save();
      ctx.strokeStyle = isDirect ? '#00ffcc' : '#ffaa33';
      ctx.lineWidth = 2;
      if (ctx.setLineDash) ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(curSec.x, curSec.y);
      ctx.lineTo(sec.x, sec.y);
      ctx.stroke();
      if (ctx.setLineDash) ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw 16 Sector Nodes + WCUnity Nav Beacon Glow
    const vfx = (SW.Sprites && SW.Sprites.vfx) || {};
    this.SECTORS.forEach((s, idx) => {
      const isSel = idx === this.selectedSectorIndex;
      const isCarrier = s.id === this.carrierSectorId;
      const isDisc = this.isDiscovered(s.id);
      const isAdj = this.isAdjacentToDiscovered(s.id);

      if (isSel && vfx.glowOrb && vfx.glowOrb._ready && ctx.drawImage) {
        ctx.drawImage(vfx.glowOrb, s.x - 16, s.y - 16, 32, 32);
      }

      if (isSel) {
        ctx.strokeStyle = isDisc ? '#ffffff' : (isAdj ? '#ffaa33' : '#667788');
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 11, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.fillStyle = isDisc ? s.color : (isAdj ? 'rgba(130, 150, 170, 0.65)' : 'rgba(50, 65, 80, 0.35)');
      ctx.beginPath();
      ctx.arc(s.x, s.y, isSel ? 6 : (isDisc ? 4.5 : (isAdj ? 3.5 : 2.5)), 0, Math.PI * 2);
      ctx.fill();

      if (isCarrier) {
        if (vfx.navLight && vfx.navLight._ready && ctx.drawImage) {
          ctx.drawImage(vfx.navLight, s.x - 10, s.y - 10, 20, 20);
        }
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isPriv ? '★KISTE-47' : '★TRÄGER', s.x, s.y - 12);
      }

      const nodeLabel = isDisc ? s.name.split(' (')[0] : (isAdj ? '??? [TOR]' : '???');
      ctx.fillStyle = isSel ? '#ffffff' : (isDisc ? '#99b5cc' : (isAdj ? '#668899' : '#3d4d5d'));
      ctx.font = isSel ? 'bold 7.5px monospace' : '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(nodeLabel, s.x, s.y + 15);
    });

    // Right Panel: Sector Intelligence, Planet Lore, Commodity Market & Ship Status (x=406..612, y=48..332)
    const secDisc = this.isDiscovered(sec.id);
    const secAdj = this.isAdjacentToDiscovered(sec.id);

    ctx.fillStyle = '#0c1624';
    ctx.fillRect(406, 48, 206, 284);
    ctx.strokeStyle = '#254a6e';
    ctx.strokeRect(406, 48, 206, 284);

    ctx.textAlign = 'left';
    ctx.fillStyle = secDisc ? sec.color : (secAdj ? '#ffaa44' : '#667788');
    ctx.font = 'bold 10px monospace';
    ctx.fillText(secDisc ? sec.name : (secAdj ? sec.id.toUpperCase() + ' — UNERFORSCHTER SEKTOR' : 'UNBEKANNTER SEKTOR (KEIN KONTAKT)'), 414, 64);

    ctx.fillStyle = '#88bbdd';
    ctx.font = '8px monospace';
    ctx.fillText('Fraktion: ' + (secDisc ? sec.faction : (secAdj ? 'SENSOR-RAUSCHEN (SPRUNG-SIGNAL)' : 'KEINE DATEN')), 414, 77);
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Welt: ' + (secDisc ? sec.planet : (secAdj ? 'Nicht kartographiert [Sprungtor aktiv]' : 'Unbekannter Raum')), 414, 89);

    // Wrapped sector lore facts
    ctx.fillStyle = '#99aab8';
    ctx.font = '7.5px monospace';
    const descText = secDisc ? sec.facts : (secAdj ? 'Aufklärungsdaten fehlen. Führen Sie einen Transitflug durch das Sprungtor durch, um diesen Sektor zu kartographieren.' : 'Sektor liegt außerhalb der Sensorreichweite der Flotte. Keine Sprungtorverbindung von hier.');
    const words = descText.split(' ');
    let line = '', ly = 102;
    for (const w of words) {
      if ((line + w).length > 31) {
        ctx.fillText(line.trim(), 414, ly);
        ly += 10;
        line = w + ' ';
      } else line += w + ' ';
    }
    if (line) { ctx.fillText(line.trim(), 414, ly); ly += 12; }

    ctx.fillStyle = secDisc ? '#ffcc44' : (secAdj ? '#88cc44' : '#778899');
    ctx.font = 'bold 7.5px monospace';
    const evtText = secDisc ? sec.event.substring(0, 33) : (secAdj ? 'SPRUNG-FREIGABE ERTEILT' : 'SPRUNG GESPERRT (KEIN TOR)');
    ctx.fillText(evtText, 414, 134);

    // Commodity Trading Table (Privateer / Carrier Supply)
    ctx.fillStyle = '#1b3550';
    ctx.fillRect(412, 142, 194, 1);
    const usedCargo = SW.CarrierEconomy ? SW.CarrierEconomy.getCargoUsed() : 0;
    const maxCargo = SW.CarrierEconomy ? SW.CarrierEconomy.getCargoMax() : 25;
    ctx.fillStyle = '#66ccff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('HANDELSBÖRSE (FRACHT: ' + usedCargo + '/' + maxCargo + 't)', 414, 154);

    if (!secDisc) {
      ctx.fillStyle = '#ffaa33';
      ctx.font = 'bold 7.5px monospace';
      ctx.fillText('[BÖRSENDATEN NICHT ERFASST]', 414, 182);
      ctx.fillStyle = '#7799aa';
      ctx.font = '7px monospace';
      ctx.fillText('Warenpreise & Markt synchronisieren', 414, 200);
      ctx.fillText('erst nach Ankunft im Sektor.', 414, 212);
    } else {
      this.COMMODITIES.forEach((c, idx) => {
        const cy = 169 + idx * 18;
        const pr = (sec.prices && sec.prices[c.key]) || c.basePrice;
        const owned = (SW.CarrierEconomy && SW.CarrierEconomy.cargoHold && SW.CarrierEconomy.cargoHold[c.key]) || 0;
        const diff = pr - c.basePrice;
        ctx.fillStyle = '#dddddd';
        ctx.font = '8px monospace';
        ctx.fillText('[' + (idx + 1) + '] ' + c.name.substring(0, 17), 414, cy);
        ctx.fillStyle = diff < 0 ? '#44ff88' : (diff > 15 ? '#ff7766' : '#ffcc44');
        ctx.fillText(pr + ' CR', 536, cy);
        ctx.fillStyle = owned > 0 ? '#44ff88' : '#667788';
        ctx.fillText('(' + owned + 't)', 578, cy);
      });
    }

    // Active Ship, Gifted Veteran Ship & 3D Multi-Angle Ship Preview in Right Panel
    ctx.fillStyle = '#1b3550';
    ctx.fillRect(412, 260, 194, 1);
    const activeCls = (SW.Player && SW.Player.getShipClass) ? SW.Player.getShipClass() : { name: 'HORNET', cockpitKey: 'hornet', atlasKey: 'hornet' };
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      const rotYaw = ((SW.Game && SW.Game.frame) || 0) * 0.035;
      SW.Sprites.drawMultiAngle(ctx, activeCls.atlasKey || 'hornet', 588, 282, 34, rotYaw, 0.2, '#44ccff', SW.Sprites.playerShip);
    }
    ctx.fillStyle = '#88ddff';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('SCHIFF [B]: ' + activeCls.name.substring(0, 17), 414, 273);
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '7.5px monospace';
    const giftLabel = (isPriv && SW.CarrierEconomy && SW.CarrierEconomy.giftedShipName)
      ? ('Geschenk: ' + SW.CarrierEconomy.giftedShipName.substring(0, 18))
      : ('Cockpit: ' + (activeCls.cockpitKey || 'hornet').toUpperCase());
    ctx.fillText(giftLabel, 414, 286);

    ctx.fillStyle = isPriv ? '#ffbb44' : '#44ff88';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(isPriv
      ? '[Q] ZURÜCK ZUM STERNENKORPS'
      : '[Q] DIENST QUITTIEREN -> PRIVATEER!', 414, 304);
    ctx.fillStyle = '#00ffcc';
    ctx.fillText('[F / ENTER] SEKTOR-SPRUNGFLUG STARTEN!', 414, 318);

    // Status Notice & Shortcut Bar
    ctx.fillStyle = '#0f1e32';
    ctx.fillRect(28, 336, 584, 42);
    ctx.strokeStyle = '#254a6e';
    ctx.strokeRect(28, 336, 584, 42);

    ctx.fillStyle = '#ffdd66';
    ctx.font = '8.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.statusNotice, 320, 351);

    ctx.fillStyle = '#99ccff';
    ctx.font = '8px monospace';
    ctx.fillText('[PFEILE] SEKTOR  [1-5] HANDEL  [F/ENTER] SEKTORFLUG  [E] SPRUNG  [B] SCHIFF  [Q] QUITTIEREN  [ESC] ZU', 320, 369);

    ctx.restore();
  }
};
