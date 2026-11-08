// ===== SOLO WING 1990 — SHIP CLASSES & COCKPITS =====
// Schiffsklassen: Klassische 4 Basis-Klassen + 9 Wingnut/Privateer-Schiffsklassen mit 8 Cockpits.
// Reine Daten. Kein DOM. Kein Rendering.

'use strict';

SW.ShipClasses = {
  // Leichter Jäger — Start-Schiff (F-44A Hornet / "Fliege"). Schnell, wenig Schild, 1-2 Laser.
  jaeger: {
    id: 'jaeger',
    name: 'LEICHTER JÄGER (HORNET)',
    codename: 'FLIEGE',
    beschreibung: 'Schnell. Wenig Schild. 1-2 Laser. Das Start-Schiff. Das ist kein Bug. Das ist ein Feature.',
    fliegbar: true,
    atlasKey: 'hornet',
    cockpitKey: 'hornet',
    cargoMax: 10,
    price: 0,
    stats: {
      speed: 8,
      shield: 60,
      laser: 2,
      damage: 1,
      yawRate: 1.0,
      pitchRate: 1.0
    },
    farbe: '#ff8844',
    cockpitLayout: 'B'
  },

  // Großer Frachter — Im Privateer-Modus (oder nach Kündigung/Entlassung) fliegbar!
  frachter: {
    id: 'frachter',
    name: 'GROßER FRACHTER (KISTE 47)',
    codename: 'KISTE',
    beschreibung: 'Langsam. Viel Schild. Kiste 47 hat eine Kältekammer und 60 Tonnen Frachtraum für den Privateer-Handel.',
    fliegbar: true,
    atlasKey: 'freighter',
    cockpitKey: 'freighter',
    cargoMax: 60,
    price: 2500,
    stats: {
      speed: 4,
      shield: 200,
      laser: 2,
      damage: 1,
      yawRate: 0.65,
      pitchRate: 0.65
    },
    farbe: '#886644',
    cockpitLayout: 'B'
  },

  // Bomber / Schwerer Jäger (F-47G Scimitar)
  bomber: {
    id: 'bomber',
    name: 'SCHWERER JÄGER (SCIMITAR)',
    codename: 'BOMBE',
    beschreibung: 'Langsam. Viel Schaden. Dicke Panzerung. In Arbeit seit 1988 — jetzt einsatzbereit.',
    fliegbar: true,
    atlasKey: 'scimitar',
    cockpitKey: 'scimitar',
    cargoMax: 15,
    price: 4500,
    stats: {
      speed: 6,
      shield: 110,
      laser: 4,
      damage: 3,
      yawRate: 0.8,
      pitchRate: 0.8
    },
    farbe: '#aa4422',
    cockpitLayout: 'B'
  },

  // Überlegenheitsjäger (F-54A Valtar / Raptor)
  ueberlegenheit: {
    id: 'ueberlegenheit',
    name: 'ÜBERLEGENHEITSJÄGER (VALTAR)',
    codename: 'STOLZ',
    beschreibung: 'Mehr Waffen. Mehr Schild. Mehr Speed. Für Captains, Admiräle und sehr reiche Freibeuter.',
    fliegbar: true,
    atlasKey: 'valtar',
    cockpitKey: 'valtar',
    cargoMax: 12,
    price: 8000,
    stats: {
      speed: 10,
      shield: 140,
      laser: 4,
      damage: 2,
      yawRate: 1.15,
      pitchRate: 1.15
    },
    farbe: '#ffaa22',
    cockpitLayout: 'C'
  },

  // Beute-Jäger: Dralthi Mk.I
  dralthi: {
    id: 'dralthi',
    name: 'BEUTE-JÄGER (DRALTHI)',
    codename: 'PFANNKUCHEN',
    beschreibung: 'Breites Delta-Flügelprofil mit organischem Beute-Cockpit. Hervorragende Kurvenlage.',
    fliegbar: true,
    atlasKey: 'dralthi',
    cockpitKey: 'dralthi',
    cargoMax: 10,
    price: 5000,
    stats: { speed: 8, shield: 85, laser: 2, damage: 2, yawRate: 1.1, pitchRate: 1.05 },
    farbe: '#cc5533',
    cockpitLayout: 'B'
  },

  // Beute-Abfangjäger: Salthi
  salthi: {
    id: 'salthi',
    name: 'LEICHTER BEUTE-JÄGER (SALTHI)',
    codename: 'NADEL',
    beschreibung: 'Ultraschneller leichter Abfangjäger mit offenem Panorama-Cockpit.',
    fliegbar: true,
    atlasKey: 'salthi',
    cockpitKey: 'salthi',
    cargoMax: 8,
    price: 4200,
    stats: { speed: 11, shield: 65, laser: 2, damage: 1, yawRate: 1.25, pitchRate: 1.2 },
    farbe: '#dd7733',
    cockpitLayout: 'B'
  },

  // Schwerer Beute-Jäger: Krant
  krant: {
    id: 'krant',
    name: 'SCHWERER BEUTE-JÄGER (KRANT)',
    codename: 'KLAUE',
    beschreibung: 'Schwer gepanzerter Raumüberlegenheitsjäger mit massiver Frontbewaffnung.',
    fliegbar: true,
    atlasKey: 'krant',
    cockpitKey: 'krant',
    cargoMax: 14,
    price: 6800,
    stats: { speed: 7, shield: 130, laser: 3, damage: 2, yawRate: 0.9, pitchRate: 0.9 },
    farbe: '#994422',
    cockpitLayout: 'B'
  },

  // Tarnkappen-Jäger: Strakha
  strakha: {
    id: 'strakha',
    name: 'TARNKAPPEN-JÄGER (STRAKHA)',
    codename: 'SCHATTEN',
    beschreibung: 'Experimenteller Tarnkappen-Jäger aus Sektor 12. Kaum auf dem Radar zu erfassen.',
    fliegbar: true,
    atlasKey: 'strakha',
    cockpitKey: 'strakha',
    cargoMax: 8,
    price: 9500,
    stats: { speed: 10, shield: 95, laser: 2, damage: 2, yawRate: 1.2, pitchRate: 1.2 },
    farbe: '#6655aa',
    cockpitLayout: 'C'
  },

  // KI-Schwarm-Jäger der TCS Hermes: KIWI-Mk.IV
  hermes: {
    id: 'hermes',
    name: 'KI-SCHWARM-JÄGER (KIWI-MK.IV)',
    codename: 'KIWI',
    beschreibung: 'Autonomer Cyber-Jäger der TCS Hermes (Der Alte Agentenschwarm). Neural-Cockpit, Vektor-Triebwerke und KI-Zielhilfe.',
    fliegbar: true,
    atlasKey: 'hermes_drone',
    cockpitKey: 'hermes',
    cargoMax: 12,
    price: 8800,
    stats: { speed: 11, shield: 125, laser: 4, damage: 2, yawRate: 1.3, pitchRate: 1.3 },
    farbe: '#00eeff',
    cockpitLayout: 'C'
  },

  // ===== COCKPIT-LAYOUTS =====
  cockpitLayouts: {
    A: {
      name: 'MINIMALISTISCH',
      beschreibung: 'Radar. Kein sichtbares Cockpit. Der alte Start. Minimalistisch.',
      elemente: ['radar', 'score', 'shields']
    },
    B: {
      name: 'WC1-STYLE',
      beschreibung: 'Weapon Display, Target Data, Radar, Pilot-Hand & In-Flight VDU-Funk. Wie 1990.',
      elemente: ['radar', 'score', 'shields', 'weaponDisplay', 'targetData', 'pilotHand', 'throttle']
    },
    C: {
      name: 'EXPERIMENTELL',
      beschreibung: 'Erweiterte Taktik-MFDs + Raumkarte.',
      elemente: ['radar', 'score', 'shields', 'weaponDisplay', 'targetData', 'throttle', 'spaceMap']
    }
  },

  // ===== PIRATEN-SCHIFFE =====
  piratenSchiffe: {
    kapitaen: {
      name: 'DER KUGELSCHREIBER',
      typ: 'kapitaen',
      atlasKey: 'grikath',
      farbe: '#ff6633',
      stats: { speed: 5, shield: 80, laser: 2, damage: 1 }
    },
    jaeger: {
      name: 'PIRATEN-JÄGER',
      typ: 'jaeger',
      atlasKey: 'talon',
      farbe: '#ff4422',
      stats: { speed: 7, shield: 30, laser: 1, damage: 1 }
    }
  },

  // ===== AUDIT-SCHIFFE (Mostly Blank, Wireframe / Strakha) =====
  auditSchiffe: {
    einheit: {
      name: 'EINHEIT',
      typ: 'einheit',
      atlasKey: 'strakha',
      style: 'wireframe',
      farbe: '#888888',
      stats: { speed: 6, shield: 100, laser: 2, damage: 2 }
    }
  },

  // Helper
  get(id) { return this[id] || this.jaeger; },
  list() { return Object.values(this).filter(v => v && typeof v === 'object' && v.id && v.name); },
  flyableOrder: ['jaeger', 'bomber', 'ueberlegenheit', 'frachter', 'hermes', 'dralthi', 'salthi', 'krant', 'strakha']
};
