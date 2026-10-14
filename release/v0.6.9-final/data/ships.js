// ===== SOLO WING 1990 — SHIP CLASSES =====
// Schiffsklassen. Start-Set: 4 Klassen.
// Reine Daten. Kein DOM. Kein Rendering.

'use strict';

SW.ShipClasses = {
  // Leichter Jäger — Start-Schiff. Schnell, wenig Schild, 1-2 Laser.
  jaeger: {
    id: 'jaeger',
    name: 'LEICHTER JÄGER',
    codename: 'FLIEGE',
    beschreibung: 'Schnell. Wenig Schild. 1-2 Laser. Das Start-Schiff. Das ist kein Bug. Das ist ein Feature.',
    fliegbar: true,
    stats: {
      speed: 8,
      shield: 60,
      laser: 2,
      damage: 1
    },
    // Pixel-Art (einfach, orange)
    farbe: '#ff8844',
    // Cockpit-Layout: B (WC1-Style)
    cockpitLayout: 'B'
  },

  // Großer Frachter — nicht fliegbar. Langsam, viel Schild.
  frachter: {
    id: 'frachter',
    name: 'GROßER FRACHTER',
    codename: 'KISTE',
    beschreibung: 'Langsam. Viel Schild. Nicht fliegbar. Kiste 47 hat eine Kältekammer. Die Kältekammer atmet.',
    fliegbar: false,
    stats: {
      speed: 2,
      shield: 200,
      laser: 0,
      damage: 0
    },
    farbe: '#886644',
    cockpitLayout: null // nicht fliegbar
  },

  // Bomber — langsam, viel Schaden, wenig Schild. Später.
  bomber: {
    id: 'bomber',
    name: 'BOMBER',
    codename: 'BOMBE',
    beschreibung: 'Langsam. Viel Schaden. Wenig Schild. Später. In Arbeit. Seit 1988.',
    fliegbar: false, // später
    stats: {
      speed: 4,
      shield: 40,
      laser: 4,
      damage: 3
    },
    farbe: '#aa4422',
    cockpitLayout: 'B'
  },

  // Überlegenheitsjäger — später. Mehr Waffen, mehr Schild, mehr Speed.
  ueberlegenheit: {
    id: 'ueberlegenheit',
    name: 'ÜBERLEGENHEITSJÄGER',
    codename: 'STOLZ',
    beschreibung: 'Mehr Waffen. Mehr Schild. Mehr Speed. Später. In Arbeit. Seit 1989.',
    fliegbar: false, // später
    stats: {
      speed: 10,
      shield: 100,
      laser: 4,
      damage: 2
    },
    farbe: '#ffaa22',
    cockpitLayout: 'C'
  },

  // ===== COCKPIT-LAYOUTS =====
  // Im Testraum (Hangar / Bar-Simulator) wählbar.
  cockpitLayouts: {
    A: {
      name: 'MINIMALISTISCH',
      beschreibung: 'Radar. Kein sichtbares Cockpit. Der alte Start. Minimalistisch.',
      elemente: ['radar', 'score', 'shields']
    },
    B: {
      name: 'WC1-STYLE',
      beschreibung: 'Weapon Display, Target Data, Radar, Pilot-Hand. Wie 1990.',
      elemente: ['radar', 'score', 'shields', 'weaponDisplay', 'targetData', 'pilotHand', 'throttle']
    },
    C: {
      name: 'EXPERIMENTELL',
      beschreibung: 'Was? In Arbeit. Seit 1990.',
      elemente: ['radar', 'score', 'shields', 'weaponDisplay', 'targetData', 'throttle', 'spaceMap']
    }
  },

  // ===== PIRATEN-SCHIFFE =====
  // Krumm, fleckig, mit Aufklebern. Tutorial-Gegner.
  piratenSchiffe: {
    kapitaen: {
      name: 'DER KUGELSCHREIBER',
      typ: 'kapitaen',
      farbe: '#ff6633',
      stats: { speed: 5, shield: 80, laser: 2, damage: 1 }
    },
    jaeger: {
      name: 'PIRATEN-JÄGER',
      typ: 'jaeger',
      farbe: '#ff4422',
      stats: { speed: 7, shield: 30, laser: 1, damage: 1 }
    }
  },

  // ===== AUDIT-SCHIFFE (Mostly Blank, Wireframe) =====
  auditSchiffe: {
    einheit: {
      name: 'EINHEIT',
      typ: 'einheit',
      style: 'wireframe', // graue Linien, keine Füllung
      farbe: '#888888',
      stats: { speed: 6, shield: 100, laser: 2, damage: 2 }
    }
  },

  // Helper
  get(id) { return this[id] || this.jaeger; },
  list() { return Object.values(this).filter(v => v.id && v.name); }
};
