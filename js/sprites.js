// ===== SOLO WING 1990 — SPRITE SYSTEM =====
// Procedural pixel art. Later: replace with PNG files in sprites/.
SW.Sprites = {
  enemy: null, playerShip: null, playerShipTop: null, carrier: null, cockpitFrame: null,
  init() { this.createEnemy(); this.createPlayerShip(); this.createPlayerShipTop(); this.createCarrier(); this.createCockpitFrame(); this.createShipVariants(); },

  // Top-Down-Player: von oben, Nase nach oben (Ansicht 'VOGEL')
  createPlayerShipTop() {
    const c = document.createElement('canvas'); c.width = 16; c.height = 16;
    const s = c.getContext('2d');
    s.fillStyle = '#557788';
    s.fillRect(7, 1, 2, 12);                          // Rumpf (Nase oben)
    s.fillStyle = '#6699aa';
    s.fillRect(5, 3, 6, 4);                           // Bug
    s.fillStyle = '#557788';
    s.fillRect(2, 7, 5, 3); s.fillRect(9, 7, 5, 3);   // Flügel (gepfeilt)
    s.fillStyle = '#334455';
    s.fillRect(2, 10, 3, 2); s.fillRect(11, 10, 3, 2);// Flügelspitzen
    s.fillStyle = '#00ccff';
    s.fillRect(7, 2, 1, 3);                           // Cockpit-Strich
    s.fillStyle = '#ff6600';
    s.fillRect(5, 13, 2, 2); s.fillRect(9, 13, 2, 2); // Twin-Engines
    this.playerShipTop = c;
  },

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
    const steel = '#536777', darkSteel = '#293a47', lightSteel = '#8297a8';
    const panel = '#111c25', glass = '#040b10';

    // Low-profile status strip above the forward canopy.
    s.fillStyle = '#263642'; s.fillRect(0, 0, SW.W, 16);
    s.fillStyle = lightSteel; s.fillRect(0, 0, SW.W, 2);
    s.fillStyle = darkSteel; s.fillRect(0, 14, SW.W, 2);
    s.fillStyle = '#72d7e8'; s.font = '6px monospace';
    s.fillText('FLUG', 6, 10); s.fillText('HP', 69, 10);
    s.fillText('LASER', 142, 10); s.fillText('FAX-TRAGÖDIE', 242, 10);
    s.fillStyle = '#0f0';
    for (let i=0;i<5;i++) s.fillRect(31+i*6, 5, 4, 6);
    for (let i=0;i<5;i++) s.fillRect(83+i*6, 5, 4, 6);
    s.fillStyle = '#ffdc58';
    for (let i=0;i<3;i++) s.fillRect(177+i*8, 5, 6, 6);

    // Canopy rails: the main 3D view stays open and nearly square.
    s.fillStyle = steel; s.fillRect(0, 16, 3, 130); s.fillRect(SW.W-3, 16, 3, 130);
    s.fillStyle = darkSteel; s.fillRect(66, 16, 3, 131); s.fillRect(251, 16, 3, 131);
    s.fillStyle = '#718594'; s.fillRect(0, 143, SW.W, 4);
    s.fillStyle = '#a4b8c6'; s.fillRect(68, 16, 183, 1);
    s.strokeStyle = 'rgba(140,170,190,0.45)'; s.lineWidth = 1;
    s.beginPath(); s.moveTo(0, 18); s.lineTo(18, 34); s.lineTo(18, 42); s.stroke();
    s.beginPath(); s.moveTo(SW.W, 18); s.lineTo(SW.W-18, 34); s.lineTo(SW.W-18, 42); s.stroke();

    // Left communications rack with two recessed, bolted radio bays.
    s.fillStyle = steel; s.fillRect(0, 42, 67, 108);
    s.fillStyle = panel; s.fillRect(3, 45, 61, 49); s.fillRect(3, 98, 61, 49);
    s.fillStyle = '#162630'; s.fillRect(5, 47, 57, 45); s.fillRect(5, 100, 57, 45);
    s.fillStyle = '#57c8df'; s.fillRect(5, 47, 57, 1);
    s.fillStyle = '#8bdc74'; s.fillRect(5, 100, 57, 1);
    s.font = 'bold 5px monospace'; s.fillText('PUBLIC', 8, 55); s.fillText('STAFFEL', 8, 108);
    s.fillStyle = '#57c8df'; s.fillRect(55, 51, 3, 3);
    s.fillStyle = '#8bdc74'; s.fillRect(55, 104, 3, 3);
    s.fillStyle = lightSteel; s.fillRect(1, 44, 2, 2); s.fillRect(62, 44, 2, 2);
    s.fillRect(1, 97, 2, 2); s.fillRect(62, 97, 2, 2);

    // Right-side target repeater, cut into the instrument housing.
    s.fillStyle = steel; s.fillRect(253, 42, 67, 108);
    s.fillStyle = panel; s.fillRect(256, 45, 61, 102);
    s.fillStyle = '#162630'; s.fillRect(258, 47, 57, 98);
    s.fillStyle = '#57c8df'; s.font = 'bold 6px monospace';
    s.fillText('ZIELDATEN', 261, 56);
    s.fillStyle = '#253746'; s.fillRect(261, 60, 50, 1);
    s.strokeStyle = '#34505e'; s.strokeRect(272, 93, 28, 28);
    s.beginPath(); s.moveTo(272,107); s.lineTo(300,107); s.moveTo(286,93); s.lineTo(286,121); s.stroke();
    s.fillStyle = lightSteel; s.fillRect(255, 44, 2, 2); s.fillRect(315, 44, 2, 2);
    s.fillRect(255, 144, 2, 2); s.fillRect(315, 144, 2, 2);

    // Lower instrument shelf: a fax, paired MFDs and the central tactical radar.
    s.fillStyle = '#3b4c59'; s.fillRect(0, 150, SW.W, 50);
    s.fillStyle = darkSteel; s.fillRect(0, 150, SW.W, 3);
    s.fillStyle = '#718594'; s.fillRect(0, 197, SW.W, 3);
    s.fillStyle = panel; s.fillRect(4, 154, 56, 40);
    s.fillStyle = '#9bb0bd'; s.font = '4px monospace';
    s.fillText('FAX-KONSOLE', 8, 161);
    s.fillStyle = '#d9d1bd'; s.fillRect(8, 164, 29, 10);
    s.fillStyle = '#7d796f'; s.fillRect(11, 167, 22, 1); s.fillRect(11, 170, 18, 1);
    s.fillStyle = '#273746'; s.fillRect(8, 176, 46, 13);
    s.fillStyle = '#57c8df'; s.fillRect(12, 180, 3, 3);
    s.fillStyle = '#26343d'; s.fillRect(75, 155, 51, 37);
    s.strokeStyle = lightSteel; s.strokeRect(73, 153, 55, 41);
    s.fillStyle = '#162630'; s.fillRect(77, 157, 47, 33);
    s.fillStyle = '#9bb0bd'; s.font = '4px monospace'; s.fillText('SCHILD / SPEED', 80, 163);
    s.fillStyle = '#39a9d2'; s.fillRect(80, 167, 5, 2); s.fillRect(80, 174, 5, 2);
    s.fillStyle = '#26343d'; s.fillRect(89, 167, 30, 2); s.fillRect(89, 174, 30, 2);
    s.fillStyle = '#15222c'; s.fillRect(133, 153, 54, 41);
    s.strokeStyle = lightSteel; s.strokeRect(131, 151, 58, 45);
    s.fillStyle = '#0a1418'; s.beginPath(); s.arc(160, 173, 17, 0, Math.PI*2); s.fill();
    s.strokeStyle = '#45c97a'; s.lineWidth = 2;
    s.beginPath(); s.arc(160, 173, 14, 0, Math.PI*2); s.stroke();
    s.strokeStyle = '#205333'; s.lineWidth = 1;
    s.beginPath(); s.moveTo(146,173); s.lineTo(174,173); s.moveTo(160,159); s.lineTo(160,187); s.stroke();
    s.fillStyle = '#26343d'; s.fillRect(195, 155, 51, 37);
    s.strokeStyle = lightSteel; s.strokeRect(193, 153, 55, 41);
    s.fillStyle = '#162630'; s.fillRect(197, 157, 47, 33);
    s.fillStyle = '#9bb0bd'; s.font = '4px monospace'; s.fillText('TAKTIK / SCORE', 200, 163);
    s.fillStyle = '#253746'; s.fillRect(200, 169, 40, 1);
    for (let i=0;i<4;i++) { s.fillStyle = '#39a9d2'; s.fillRect(201+i*9, 175, 3, 3); }
    s.fillStyle = '#dce7ed'; s.font = '5px monospace'; s.fillText('00000', 200, 186);
    s.fillStyle = '#273746'; s.fillRect(254, 154, 62, 40);
    s.strokeStyle = lightSteel; s.strokeRect(252, 152, 66, 44);
    s.fillStyle = '#15222c'; s.fillRect(256, 158, 58, 32);
    s.fillStyle = '#9bb0bd'; s.font = '4px monospace'; s.fillText('WEAPON / SHIP', 260, 165);
    s.fillStyle = '#d8483d'; s.fillRect(267, 171, 12, 5);
    s.fillStyle = '#ffdc58'; s.fillRect(285, 171, 12, 5);
    s.fillStyle = '#46c878'; s.fillRect(303, 171, 7, 5);

    // Compact joystick keeps the 3D canopy and its center radar in view.
    s.fillStyle = '#475b68'; s.fillRect(155, 190, 10, 7);
    s.fillStyle = '#333'; s.fillRect(158, 183, 4, 8);
    s.fillStyle = '#d8483d'; s.fillRect(157, 181, 6, 4);

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
