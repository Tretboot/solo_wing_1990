// ===== SOLO WING 1990 — SPRITE SYSTEM =====
// Procedural pixel art. Later: replace with PNG files in sprites/.
SW.Sprites = {
  enemy: null, playerShip: null, carrier: null, cockpitFrame: null,
  init() { this.createEnemy(); this.createPlayerShip(); this.createCarrier(); this.createCockpitFrame(); this.createShipVariants(); },

  // ===== SCHIFFS-VARIANTEN (Phase 3) =====
  // Prozedural gezeichnet (NoThink Code lieferte leere Matrizen → selbst gebaut).
  shipVariants: {},

  createShipVariants() {
    // --- d_b: Delta-Flügel + Ball/Turm in der Mitte ---
    let c = document.createElement('canvas'); c.width=16; c.height=16;
    let s = c.getContext('2d');
    s.fillStyle='#ff3333'; s.fillRect(7,1,2,14);           // Rumpf
    s.fillStyle='#ff6600';
    s.beginPath(); s.moveTo(2,12); s.lineTo(7,4); s.lineTo(12,12); s.closePath(); s.fill(); // Delta links
    s.beginPath(); s.moveTo(14,12); s.lineTo(9,4); s.lineTo(4,12); s.closePath(); s.fill(); // Delta rechts
    s.fillStyle='#00ccff'; s.fillRect(6,5,4,3);            // Ball/Turm
    s.fillStyle='#ffff00'; s.fillRect(6,13,4,2);           // Triebwerk
    this.shipVariants['d_b'] = c;

    // --- Kreuzer: breit, flach, massig ---
    c = document.createElement('canvas'); c.width=16; c.height=16;
    s = c.getContext('2d');
    s.fillStyle='#445566'; s.fillRect(1,6,14,5);           // breite Flanken
    s.fillStyle='#556677'; s.fillRect(3,4,10,4);           // Oberdeck
    s.fillStyle='#667788'; s.fillRect(6,2,4,4);            // Turm
    s.fillStyle='#00ccff'; s.fillRect(7,3,2,2);            // Cockpit
    s.fillStyle='#ff6600'; s.fillRect(2,11,3,2); s.fillRect(11,11,3,2); // Triebwerke
    s.fillStyle='#00ff00'; s.fillRect(1,8,1,1); s.fillRect(14,8,1,1);   // Nav-Lights
    this.shipVariants['Kreuzer'] = c;

    // --- Jäger: schmal, spitz, agil ---
    c = document.createElement('canvas'); c.width=16; c.height=16;
    s = c.getContext('2d');
    s.fillStyle='#3366ff'; s.fillRect(7,1,2,13);           // schmaler Rumpf
    s.fillStyle='#6699ff'; s.fillRect(6,3,4,3);            // Kopf
    s.fillStyle='#3366ff';
    s.fillRect(4,9,3,2); s.fillRect(9,9,3,2);              // kleine Flügel
    s.fillStyle='#00ccff'; s.fillRect(7,2,2,2);            // Cockpit
    s.fillStyle='#ff6600'; s.fillRect(6,13,2,2); s.fillRect(8,13,2,2); // Twin-Engines
    s.fillStyle='#ffff00'; s.fillRect(7,14,1,2); s.fillRect(8,14,1,2); // Flammen
    this.shipVariants['Jäger'] = c;

    // --- Piraten-Jäger: krumm, fleckig, mit Aufklebern. Selbstmörderisch. ---
    c = document.createElement('canvas'); c.width=16; c.height=16;
    s = c.getContext('2d');
    s.fillStyle='#ff4422'; s.fillRect(7,1,2,13);           // Rumpf (krumm)
    s.fillStyle='#ff6633'; s.fillRect(6,3,4,3);            // Kopf
    s.fillStyle='#ff4422';
    s.fillRect(3,8,4,3); s.fillRect(9,9,4,2);              // ungleiche Flügel (krumm)
    s.fillStyle='#00ccff'; s.fillRect(7,2,2,2);            // Cockpit
    s.fillStyle='#ffff00'; s.fillRect(5,13,2,2); s.fillRect(9,13,2,2); // Triebwerke
    s.fillStyle='#ffcc00'; s.fillRect(4,6,1,1); s.fillRect(11,7,1,1);  // Kaffee-Flecken
    s.fillStyle='#ffffff'; s.fillRect(3,5,2,1);            // Aufkleber "WELTBESTER PIRAT"
    this.shipVariants['piraten_jaeger'] = c;

    // --- Piraten-Kapitänsschiff: größer, mit Draht, abgebrochener Flügel ---
    c = document.createElement('canvas'); c.width=20; c.height=20;
    s = c.getContext('2d');
    s.fillStyle='#ff6633'; s.fillRect(9,1,2,16);           // Rumpf
    s.fillStyle='#ff4422'; s.fillRect(7,3,6,4);            // Oberdeck
    s.fillStyle='#ff6633';
    s.fillRect(3,8,5,4); s.fillRect(12,9,5,3);             // Flügel (rechts abgebrochen, mit Draht)
    s.fillStyle='#888'; s.fillRect(16,10,2,1);             // Draht (abgebrochener Flügel)
    s.fillStyle='#00ccff'; s.fillRect(9,2,2,2);            // Cockpit
    s.fillStyle='#ffcc00'; s.fillRect(4,14,3,2); s.fillRect(13,14,3,2); // Triebwerke
    s.fillStyle='#ff0000'; s.fillRect(2,6,1,1); s.fillRect(17,7,1,1);   // Nav-Lights
    s.fillStyle='#ffffff'; s.fillRect(5,5,3,1);            // Aufkleber
    s.fillStyle='#ffff00'; s.fillRect(9,17,2,2);           // Flammen
    this.shipVariants['piraten_kapitaen'] = c;
  },
  createEnemy() {
    const c = document.createElement('canvas'); c.width=16; c.height=16;
    const s = c.getContext('2d');
    s.fillStyle='#ff3333'; s.fillRect(7,3,2,10); s.fillRect(6,5,4,6);
    s.fillStyle='#ff6600'; s.fillRect(3,7,3,2); s.fillRect(10,7,3,2); s.fillRect(4,6,2,4); s.fillRect(10,6,2,4);
    s.fillStyle='#ffcc00'; s.fillRect(7,2,2,1);
    s.fillStyle='#ffff00'; s.fillRect(6,13,4,2);
    s.fillStyle='#ff9900'; s.fillRect(7,14,2,2);
    s.fillStyle='#66ccff'; s.fillRect(7,5,2,2);
    this.enemy = c;
  },
  createPlayerShip() {
    const c = document.createElement('canvas'); c.width=16; c.height=16;
    const s = c.getContext('2d');
    s.fillStyle='#3366ff'; s.fillRect(7,2,2,12); s.fillRect(6,4,4,8);
    s.fillStyle='#6699ff'; s.fillRect(3,8,3,3); s.fillRect(10,8,3,3); s.fillRect(4,7,2,5); s.fillRect(10,7,2,5);
    s.fillStyle='#ffffff'; s.fillRect(7,1,2,1);
    s.fillStyle='#ff6600'; s.fillRect(5,13,2,2); s.fillRect(9,13,2,2);
    s.fillStyle='#ffff00'; s.fillRect(6,14,1,2); s.fillRect(9,14,1,2);
    s.fillStyle='#00ccff'; s.fillRect(7,4,2,2);
    this.playerShip = c;
  },
  createCarrier() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 32;
    const s = c.getContext('2d');
    // Hauptdeck (hellgrau)
    s.fillStyle = '#8899aa';
    s.fillRect(4, 12, 56, 10);
    // Oberdeck
    s.fillStyle = '#aabbcc';
    s.fillRect(8, 8, 48, 5);
    // Superstructure (Turm, rechts)
    s.fillStyle = '#99aabb';
    s.fillRect(44, 2, 14, 12);
    s.fillStyle = '#bbccdd';
    s.fillRect(48, 0, 8, 4);
    // Brücke (Fenster)
    s.fillStyle = '#00ccff';
    s.fillRect(46, 4, 10, 3);
    // Flugdeck-Markierungen
    s.fillStyle = '#ffcc00';
    s.fillRect(10, 16, 20, 1);
    s.fillRect(34, 16, 10, 1);
    // Hangar-Türen
    s.fillStyle = '#556677';
    s.fillRect(10, 14, 8, 5);
    s.fillRect(20, 14, 8, 5);
    // Runway-Lights (grün, blinkend)
    s.fillStyle = '#00ff00';
    for (let i = 0; i < 8; i++) s.fillRect(6 + i * 7, 22, 1, 1);
    // Nav-Lights
    s.fillStyle = '#ff0000'; s.fillRect(4, 12, 2, 2);
    s.fillStyle = '#00ff00'; s.fillRect(58, 12, 2, 2);
    // Triebwerke (hinten)
    s.fillStyle = '#ff6600';
    s.fillRect(4, 14, 3, 3);
    s.fillRect(57, 14, 3, 3);
    // Antenne
    s.fillStyle = '#ccddff';
    s.fillRect(52, 0, 1, 4);
    this.carrier = c;
  },

  createCockpitFrame() {
    const c = document.createElement('canvas');
    c.width = SW.W; c.height = SW.H;
    const s = c.getContext('2d');
    const TAN = '#9a7d4b', TAN_D = '#6a5230', TAN_L = '#c8a46a';
    const PANEL = '#1a1408', SCREEN = '#0a0a0a';

    // ===== OBEN: HUD-Leiste (braun) =====
    s.fillStyle = TAN;
    s.fillRect(0, 0, SW.W, 16);
    s.fillStyle = TAN_D;
    s.fillRect(0, 14, SW.W, 2);
    // HUD-Text
    s.fillStyle = '#0f0';
    s.font = '7px monospace';
    s.fillText('FUEL', 8, 11);
    s.fillText('HP', 70, 11);
    s.fillText('WEAPONS', 150, 11);
    // FUEL-Segmente
    s.fillStyle = '#0f0';
    for (let i=0;i<6;i++) s.fillRect(32+i*6, 5, 4, 7);
    // HP-Segmente
    s.fillStyle = '#0f0';
    for (let i=0;i<6;i++) s.fillRect(92+i*6, 5, 4, 7);
    // WEAPONS (Laser-Slots, gelb)
    s.fillStyle = '#ff0';
    for (let i=0;i<3;i++) s.fillRect(200+i*8, 5, 6, 7);
    // Ziel-Retikel oben Mitte
    s.strokeStyle = '#0f0'; s.lineWidth = 1;
    s.strokeRect(120, 3, 20, 10);

    // ===== DIAGONALE STREBEN (oben) =====
    s.strokeStyle = TAN; s.lineWidth = 6;
    s.beginPath(); s.moveTo(0,0); s.lineTo(55, 45); s.stroke();
    s.beginPath(); s.moveTo(SW.W,0); s.lineTo(SW.W-55, 45); s.stroke();
    s.strokeStyle = TAN_D; s.lineWidth = 2;
    s.beginPath(); s.moveTo(0,0); s.lineTo(55, 45); s.stroke();
    s.beginPath(); s.moveTo(SW.W,0); s.lineTo(SW.W-55, 45); s.stroke();

    // ===== LINKE TAFEL (Waffen-Status) =====
    s.fillStyle = TAN;
    s.fillRect(0, 45, 52, 105);
    s.fillStyle = PANEL;
    s.fillRect(3, 48, 46, 99);
    s.fillStyle = '#0af';
    s.font = '6px monospace';
    s.fillText('WAF-STATUS', 5, 56);
    // Waffen-Balken
    const weapons = [['LASER','#f00',1.0],['MASS','#ff0',0.0],['SHLD','#0f0',0.8]];
    for (let i=0;i<weapons.length;i++) {
      const y = 64 + i*12;
      s.fillStyle = '#666'; s.font = '5px monospace';
      s.fillText(weapons[i][0], 5, y);
      s.fillStyle = '#222'; s.fillRect(30, y-5, 17, 5);
      s.fillStyle = weapons[i][1]; s.fillRect(30, y-5, Math.round(17*weapons[i][2]), 5);
    }
    // Radar (links unten in Tafel)
    s.fillStyle = SCREEN;
    s.beginPath(); s.arc(26, 125, 16, 0, Math.PI*2); s.fill();
    s.strokeStyle = '#0f0'; s.lineWidth = 1;
    s.beginPath(); s.arc(26, 125, 16, 0, Math.PI*2); s.stroke();
    s.strokeStyle = '#030';
    s.beginPath(); s.moveTo(10,125); s.lineTo(42,125); s.moveTo(26,109); s.lineTo(26,141); s.stroke();

    // ===== RECHTE TAFEL (Auto-Targeting) =====
    s.fillStyle = TAN;
    s.fillRect(SW.W-52, 45, 52, 105);
    s.fillStyle = PANEL;
    s.fillRect(SW.W-49, 48, 46, 99);
    s.fillStyle = '#0f0';
    s.font = '6px monospace';
    s.fillText('AUTO-TARGET', SW.W-47, 56);
    s.fillStyle = '#0af';
    s.font = '5px monospace';
    s.fillText('Target: Radar', SW.W-47, 66);
    s.fillText('Range: 2023m', SW.W-47, 74);
    // Targetting-Balken (farbig)
    const tcols = ['#f00','#ff0','#0f0','#0af','#f0f'];
    for (let i=0;i<5;i++) {
      const y = 82 + i*8;
      s.fillStyle = tcols[i];
      s.fillRect(SW.W-47, y, 10, 5);
      s.fillStyle = '#222'; s.fillRect(SW.W-35, y, 28, 5);
      s.fillStyle = tcols[i]; s.fillRect(SW.W-35, y, 10+((i*7)%18), 5);
    }
    // Ziel-Symbol
    s.strokeStyle = '#0f0'; s.lineWidth = 1;
    s.strokeRect(SW.W-35, 120, 20, 20);
    s.beginPath(); s.moveTo(SW.W-35,130); s.lineTo(SW.W-15,130); s.moveTo(SW.W-25,120); s.lineTo(SW.W-25,140); s.stroke();

    // ===== UNTEN: Cockpit-Boden (braun) =====
    s.fillStyle = TAN;
    s.fillRect(0, 150, SW.W, 50);
    s.fillStyle = TAN_D;
    s.fillRect(0, 150, SW.W, 3);
    // Mittlere Konsole
    s.fillStyle = PANEL;
    s.fillRect(110, 153, 100, 47);
    // Eject-Button
    s.fillStyle = '#f00';
    s.fillRect(155, 158, 30, 8);
    s.fillStyle = '#fff'; s.font = '5px monospace';
    s.fillText('EJECT', 160, 164);
    // Buttons-Grid
    for (let r=0;r<3;r++) for (let col=0;col<6;col++) {
      s.fillStyle = (r+col)%2 ? '#0f0' : '#0af';
      s.fillRect(118 + col*14, 172 + r*8, 10, 5);
    }

    // ===== JOYSTICK + HAND (unten Mitte) =====
    // Joystick-Basis
    s.fillStyle = TAN_L;
    s.fillRect(150, 185, 20, 15);
    // Joystick-Stift
    s.fillStyle = '#333';
    s.fillRect(158, 175, 4, 12);
    s.fillStyle = '#f00';
    s.fillRect(156, 172, 8, 5);
    // Hand (pixel-art, braun)
    s.fillStyle = '#c8956a';
    s.fillRect(150, 180, 20, 14); // Handfläche
    s.fillRect(148, 184, 4, 8);  // Daumen
    s.fillStyle = '#a8755a';
    s.fillRect(150, 180, 20, 3); // Schatten
    // Arm (braun)
    s.fillStyle = '#8a5a3a';
    s.fillRect(152, 192, 16, 8);

    // ===== BEINE (blau, unten links/rechts) =====
    s.fillStyle = '#2244aa';
    s.fillRect(90, 188, 25, 12);  // linkes Bein
    s.fillRect(205, 188, 25, 12); // rechtes Bein
    s.fillStyle = '#1a3388';
    s.fillRect(90, 188, 25, 3);
    s.fillRect(205, 188, 25, 3);

    this.cockpitFrame = c;
  },

  draw(ctx, sprite, sx, sy, scale, baseWidth) {
    const bw = baseWidth || 16;
    const size = bw * scale;
    if (size < 1) return;
    const aspect = sprite.height / sprite.width;
    const w = Math.round(size), h = Math.round(w * aspect);
    ctx.drawImage(sprite, Math.round(sx-w/2), Math.round(sy-h/2), w, h);
  }
};
