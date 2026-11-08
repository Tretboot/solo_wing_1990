// ===== SOLO WING 1990 — SQUADRON (ARMADA-MODELL STAFFELVERWALTUNG) =====
// Detail-Staffelverwaltung auf der TCS Fax-Tragödie nach Wing Commander Armada Vorbild:
// - Zuweisung benannter Piloten (data/crew.js: Flug Drei, Sechs, Neun, Zwo, Vier) auf individuelle Schiffe
// - Individuelle Schiffszustände (Hülle, Schildgenerator, Triebwerk, linke/rechte Kanone)
// - Schadenspersistenz über Missionen hinweg, Reparaturzyklen im Hangar (Bolt)
// - Upgrades & Komponenten + Wahl des aktiven Spieler-Schiffs/Cockpits

'use strict';

window.SW1990 = window.SW1990 || {};

SW.Squadron = {
  name: 'Staffel 7 — "Die Geduldigen"',
  carrier: 'TCS Fax-Tragödie',
  selectedIndex: 0,

  UPGRADES: {
    afterburner_tuning: { name: 'Afterburner Mk II', desc: '+25% Boost-Geschwindigkeit', cost: 120, part: 'engine' },
    reinforced_plating: { name: 'Verstärkte Panzerung', desc: '+30% Hüllenresistenz', cost: 150, part: 'hull' },
    military_shields: { name: 'Militär-Schildgenerator', desc: '+40% Schnellere Schildaufladung', cost: 200, part: 'shieldGen' },
    overclocked_guns: { name: 'Übertaktete Kondensatoren', desc: '+20% Laserschaden', cost: 180, part: 'guns' }
  },

  ships: [
    {
      id: 'FLUG-03',
      callsign: 'Fliege Drei (Spieler)',
      classId: 'jaeger',
      pilot: 'Flug Drei',
      hull: 100,
      shieldGen: 100,
      engine: 100,
      leftGun: { name: 'Laser Mk I', status: 'OK', integrity: 100 },
      rightGun: { name: 'Laser Mk I', status: 'OK', integrity: 100 },
      torpedoes: 2,
      upgrades: ['afterburner_tuning'],
      missions: 14,
      kills: 14,
      status: 'READY'
    },
    {
      id: 'FLUG-06',
      callsign: 'Fliege Sechs (Rottenführer)',
      classId: 'jaeger',
      pilot: 'Sechs',
      hull: 92,
      shieldGen: 95,
      engine: 90,
      leftGun: { name: 'Laser Mk I', status: 'OK', integrity: 95 },
      rightGun: { name: 'Laser Mk I', status: 'OK', integrity: 90 },
      torpedoes: 2,
      upgrades: ['reinforced_plating'],
      missions: 19,
      kills: 16,
      status: 'READY'
    },
    {
      id: 'FLUG-09',
      callsign: 'Scimitar Neun',
      classId: 'bomber',
      pilot: 'Neun',
      hull: 75,
      shieldGen: 80,
      engine: 85,
      leftGun: { name: 'Mass Driver', status: 'OK', integrity: 90 },
      rightGun: { name: 'Mass Driver', status: 'DAMAGED', integrity: 45 },
      torpedoes: 4,
      upgrades: [],
      missions: 11,
      kills: 9,
      status: 'READY'
    },
    {
      id: 'FLUG-02',
      callsign: 'Valtar Zwo',
      classId: 'ueberlegenheit',
      pilot: 'Zwo',
      hull: 95,
      shieldGen: 100,
      engine: 100,
      leftGun: { name: 'Laser Mk II', status: 'OK', integrity: 100 },
      rightGun: { name: 'Laser Mk II', status: 'OK', integrity: 100 },
      torpedoes: 4,
      upgrades: ['military_shields', 'overclocked_guns'],
      missions: 12,
      kills: 15,
      status: 'READY'
    },
    {
      id: 'FRACHT-47',
      callsign: 'Kiste 47 (Tarsus-Frachter)',
      classId: 'frachter',
      pilot: 'Vier',
      hull: 100,
      shieldGen: 100,
      engine: 88,
      leftGun: { name: 'Turm-Laser', status: 'OK', integrity: 100 },
      rightGun: { name: 'Turm-Laser', status: 'OK', integrity: 100 },
      torpedoes: 2,
      upgrades: ['reinforced_plating'],
      missions: 24,
      kills: 3,
      status: 'READY'
    },
    {
      id: 'BEUTE-01',
      callsign: 'Beute-Dralthi (Sektor 9)',
      classId: 'dralthi',
      pilot: null,
      hull: 68,
      shieldGen: 75,
      engine: 80,
      leftGun: { name: 'Plasma-Kanone', status: 'OK', integrity: 85 },
      rightGun: { name: 'Plasma-Kanone', status: 'OK', integrity: 80 },
      torpedoes: 2,
      upgrades: [],
      missions: 4,
      kills: 5,
      status: 'READY'
    }
  ],

  init() {
    this.loadState();
  },

  syncWithPosting(posting) {
    if (!posting) return;
    this.carrier = posting.name || 'TCS Fax-Tragödie';
    this.name = posting.squadronName || 'Staffel 7 — "Die Geduldigen"';
    if (posting.id === 'tcs-hermes') {
      this.ships = [
        {
          id: 'KIWI-01', callsign: 'KIWI-Alpha (Spieler)', classId: 'hermes', pilot: 'Flug Drei',
          hull: 100, shieldGen: 100, engine: 100,
          leftGun: { name: 'Neural-Puls Mk IV', status: 'OK', integrity: 100 },
          rightGun: { name: 'Neural-Puls Mk IV', status: 'OK', integrity: 100 },
          torpedoes: 4, upgrades: ['afterburner_tuning', 'military_shields'], missions: 22, kills: 31, status: 'READY'
        },
        {
          id: 'KIWI-02', callsign: 'Worker-Drohne 7', classId: 'hermes', pilot: 'Worker-7',
          hull: 96, shieldGen: 100, engine: 98,
          leftGun: { name: 'Neural-Puls Mk IV', status: 'OK', integrity: 100 },
          rightGun: { name: 'Neural-Puls Mk IV', status: 'OK', integrity: 95 },
          torpedoes: 4, upgrades: ['overclocked_guns'], missions: 48, kills: 42, status: 'READY'
        },
        {
          id: 'KIWI-03', callsign: 'Supervisor-Raptor', classId: 'ueberlegenheit', pilot: 'Sechs',
          hull: 94, shieldGen: 95, engine: 92,
          leftGun: { name: 'Tachyon-Kanone', status: 'OK', integrity: 95 },
          rightGun: { name: 'Tachyon-Kanone', status: 'OK', integrity: 95 },
          torpedoes: 3, upgrades: ['reinforced_plating'], missions: 19, kills: 18, status: 'READY'
        },
        {
          id: 'KIWI-04', callsign: 'Sandbox-Phantom', classId: 'strakha', pilot: 'Reviewer-9',
          hull: 100, shieldGen: 100, engine: 100,
          leftGun: { name: 'Audit-Laser', status: 'OK', integrity: 100 },
          rightGun: { name: 'Audit-Laser', status: 'OK', integrity: 100 },
          torpedoes: 2, upgrades: [], missions: 12, kills: 15, status: 'READY'
        }
      ];
    } else if (posting.id === 'test-destroyer') {
      this.ships = [
        {
          id: 'JAEGER-01', callsign: 'Eisenvogel Eins (Scimitar)', classId: 'bomber', pilot: 'Flug Drei',
          hull: 95, shieldGen: 95, engine: 90,
          leftGun: { name: 'Massebeschleuniger', status: 'OK', integrity: 95 },
          rightGun: { name: 'Massebeschleuniger', status: 'OK', integrity: 95 },
          torpedoes: 4, upgrades: ['reinforced_plating'], missions: 11, kills: 9, status: 'READY'
        },
        {
          id: 'JAEGER-02', callsign: 'Eisenvogel Zwo (Hornet)', classId: 'jaeger', pilot: 'Sechs',
          hull: 90, shieldGen: 92, engine: 95,
          leftGun: { name: 'Laser Mk I', status: 'OK', integrity: 90 },
          rightGun: { name: 'Laser Mk I', status: 'OK', integrity: 90 },
          torpedoes: 2, upgrades: [], missions: 16, kills: 12, status: 'READY'
        }
      ];
    } else if (posting.id === 'outpost-31') {
      this.ships = [
        {
          id: 'JAEGER-31', callsign: 'Nebelwache 31 (Valtar)', classId: 'ueberlegenheit', pilot: 'Flug Drei',
          hull: 98, shieldGen: 100, engine: 95,
          leftGun: { name: 'Grenz-Laser Mk II', status: 'OK', integrity: 100 },
          rightGun: { name: 'Grenz-Laser Mk II', status: 'OK', integrity: 100 },
          torpedoes: 3, upgrades: ['military_shields'], missions: 8, kills: 11, status: 'READY'
        },
        {
          id: 'KISTE-31', callsign: 'Grenzfrachter 31 (Kiste)', classId: 'frachter', pilot: 'Zwo',
          hull: 88, shieldGen: 90, engine: 85,
          leftGun: { name: 'Turm-Laser', status: 'OK', integrity: 85 },
          rightGun: { name: 'Turm-Laser', status: 'OK', integrity: 85 },
          torpedoes: 1, upgrades: [], missions: 25, kills: 3, status: 'READY'
        }
      ];
    }
    this.selectedIndex = 0;
  },

  loadState() {
    try {
      const saved = localStorage.getItem('sw_squadron_data_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.ships = parsed;
        }
      }
    } catch (e) {}
  },

  saveState() {
    try {
      localStorage.setItem('sw_squadron_data_v2', JSON.stringify(this.ships));
    } catch (e) {}
  },

  getShip(id) {
    return this.ships.find(s => s.id === id) || this.ships[0];
  },

  getSelectedShip() {
    return this.ships[this.selectedIndex] || this.ships[0];
  },

  nextShip() {
    this.selectedIndex = (this.selectedIndex + 1) % this.ships.length;
  },

  prevShip() {
    this.selectedIndex = (this.selectedIndex - 1 + this.ships.length) % this.ships.length;
  },

  assignPilot(shipId, pilotName) {
    const currentOwner = this.ships.find(s => s.pilot === pilotName);
    if (currentOwner && currentOwner.id !== shipId) {
      currentOwner.pilot = null;
    }
    const target = this.getShip(shipId);
    if (target) {
      target.pilot = pilotName;
      this.saveState();
      return true;
    }
    return false;
  },

  unassignPilot(shipId) {
    const target = this.getShip(shipId);
    if (target) {
      target.pilot = null;
      this.saveState();
      return true;
    }
    return false;
  },

  repairComponent(shipId, component) {
    const ship = this.getShip(shipId);
    if (!ship) return false;
    const cost = 25;
    if (SW.CarrierEconomy && !SW.CarrierEconomy.spend(cost, 1)) {
      return false;
    }
    if (component === 'hull') ship.hull = Math.min(100, ship.hull + 25);
    if (component === 'shieldGen') ship.shieldGen = Math.min(100, ship.shieldGen + 30);
    if (component === 'engine') ship.engine = Math.min(100, ship.engine + 25);
    if (component === 'leftGun') { ship.leftGun.status = 'OK'; ship.leftGun.integrity = 100; }
    if (component === 'rightGun') { ship.rightGun.status = 'OK'; ship.rightGun.integrity = 100; }

    if (ship.hull >= 70 && ship.engine >= 70 && ship.leftGun.status !== 'OFFLINE') {
      ship.status = 'READY';
    }
    this.saveState();
    return true;
  },

  installUpgrade(shipId, upgradeKey) {
    const ship = this.getShip(shipId);
    const upgrade = this.UPGRADES[upgradeKey];
    if (!ship || !upgrade || ship.upgrades.includes(upgradeKey)) return false;
    if (SW.CarrierEconomy && !SW.CarrierEconomy.spend(upgrade.cost, 2)) {
      return false;
    }
    ship.upgrades.push(upgradeKey);
    this.saveState();
    return true;
  },

  applyMissionDebrief(shipId, damageTaken, killsMade) {
    const ship = this.getShip(shipId);
    if (!ship) return;
    ship.missions += 1;
    ship.kills += (killsMade || 0);
    if (damageTaken > 0) {
      ship.hull = Math.max(10, ship.hull - Math.round(damageTaken * 0.4));
      ship.shieldGen = Math.max(20, ship.shieldGen - Math.round(damageTaken * 0.3));
      ship.engine = Math.max(15, ship.engine - Math.round(damageTaken * 0.2));
      if (damageTaken > 50) {
        ship.rightGun.status = 'DAMAGED';
        ship.rightGun.integrity = 30;
      }
      if (damageTaken > 80) {
        ship.leftGun.status = 'OFFLINE';
        ship.leftGun.integrity = 0;
      }
      if (ship.hull < 50 || ship.engine < 50) {
        ship.status = 'REPAIR';
      }
    }
    this.saveState();
  },

  getWingmen() {
    return this.ships.filter(s => s.pilot && s.pilot !== 'Flug Drei' && s.status === 'READY');
  }
};

if (typeof window !== 'undefined') {
  SW.Squadron.init();
}
