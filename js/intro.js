// ===== SOLO WING 1990 — INTRO-SEQUENZ (State "INTRO") =====
// Phase 1: Asteroidenfeld (Drift + Ausweichen, nicht tot)
// Phase 2: Pilotenname-Eingabe (Edge-Detect, max 12, Backspace/Enter)
// Phase 3: Zuordnung → AKADEMIE
// 1990-Deadpan. Vanilla JS. Kein DOM. Nur Canvas.
//
// FIXES (Code Review, R1→final):
//   1. Name-Input auf Edge-Detect gaten (kein Tasten-Spam bei Halten/Repeat)
//   2. cursorTimer++ in update() (Blink-Cursor war tot)
//   3. SW.Player.z setzen (Painter's-Tiefenfilter war tot)
//   4. Death-Intent: Intro kann NICHT verloren werden (by design, dokumentiert)

SW.Intro = {
  phase: 1, t: 0, rocks: [], rockTimer: 0, rockCount: 0,
  name: '', cursorOn: true, cursorTimer: 0,
  shieldFlash: 0, iFrames: 0,
  phase3Done: false,
  commTimeout: null,
  _prevKeys: {},
  PHASE1_FRAMES: 900,   // ~15s @60fps (harte Kappe, nie ewig)
  MIN_PASSED: 18,       // ... ODER genug Durchgänge
  MAX_PASSED: 40,       // ... ODER Cap

  init() {
    // idempotent: Timeout aus vorherigem Lauf sicher entfernen
    if (this.commTimeout) { clearTimeout(this.commTimeout); this.commTimeout = null; }
    this.phase = 0; this.t = 0; this._spaceHeld = false;
    this.rocks = []; this.rockTimer = 0; this.rockCount = 0;
    this.name = ''; this.cursorOn = true; this.cursorTimer = 0;
    this.shieldFlash = 0; this.iFrames = 0;
    this.phase3Done = false;
    this._prevKeys = {};
    this.seed = (SW.World && SW.World.seed) || 1990;
    this.prng = SW.Intro.makePRNG(this.seed);
    // Player-Reset: idempotenter Start, ruhend, MIT z (Kameraebene)
    SW.Player.x = SW.CX; SW.Player.y = SW.H / 2; SW.Player.z = 100;
    SW.Player.vx = 0; SW.Player.vy = 0;
    SW.Player.frontShield = 100; SW.Player.rearShield = 100;
    this.commTimeout = setTimeout(() => {
      this.commTimeout = null;
      if (SW.Game.state === 'INTRO' && this.phase === 1) {
        SW.Audio.playCommBeep();
        SW.TTS.speak('Willkommen an Bord. Sie fliegen durch ein Asteroidenfeld. Das Formular dafür ist 77-A. Sie müssen es nicht ausfüllen.', 'COMMANDER');
      }
    }, 1800);
  },

  makePRNG(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  // Titelschirm → Asteroidenfeld. SPACE ist ein User-Gesture → Audio-Init
  // erlaubt, Intro-Musik startet hier (wenn nicht im Menü deaktiviert).
  toPhase1() {
    this.phase = 1; this.t = 0;
    SW.Audio.init();
    SW.Audio.startMusic('intro');
  },
  toPhase2() { this.phase = 2; this.t = 0; SW.Audio.playCommBeep(); },

  toPhase3() {
    const n = (this.name.trim() || 'FLUG DREI');
    SW.World.pilotName = n;
    this.phase = 3; this.t = 0; this.phase3Done = false;
    SW.Audio.playCommBeep();
    SW.TTS.speak('Willkommen, ' + n + '. Sie werden dem Träger FAX-TRAGÖDIE zugeteilt. Formular 83-B liegt bereit.', 'COMMANDER');
  },

  // ESC in jeder Phase → AKADEMIE (Name = Default, falls noch keiner)
  escToAkademie() {
    if (!SW.World.pilotName) SW.World.pilotName = (this.name.trim() || 'FLUG DREI');
    SW.Game.setState('AKADEMIE');
  },

  update(frame) {
    this.t++;
    if (this.cursorTimer >= 30) { this.cursorOn = !this.cursorOn; this.cursorTimer = 0; }
    if (this.shieldFlash > 0) this.shieldFlash--;
    if (this.iFrames > 0) this.iFrames--;

    // ESC-Edge in jeder Phase → AKADEMIE
    const K = SW.Input.keys, prev = this._prevKeys;
    if (K['Escape'] && !prev['Escape']) { this.escToAkademie(); return; }

    // Phase 0 (Titelschirm): SPACE = Start, sonst nur warten
    if (this.phase === 0) {
      const space = K['Space'];
      if (space && !this._spaceHeld) { this._spaceHeld = true; this.toPhase1(); return; }
      if (!space) this._spaceHeld = false;
      return;
    }

    if (this.phase === 1) this.updatePhase1(frame);
    else if (this.phase === 2) this.handleNameInput();
    else if (this.phase === 3) {
      if (!this.phase3Done && this.t > 180) { this.phase3Done = true; SW.Game.setState('AKADEMIE'); }
    }

    // Edge-Detect: aktuelle Keys merken für nächsten Frame
    this._prevKeys = {};
    for (const k in K) if (K[k]) this._prevKeys[k] = true;
  },

  // Name-Input: NUR auf Keydown-Edges (kein Spam bei Halten/Repeat)
  handleNameInput() {
    const K = SW.Input.keys, prev = this._prevKeys;
    if (K['Enter'] && !prev['Enter']) { this.toPhase3(); return; }
    if (K['Backspace'] && !prev['Backspace']) { this.name = this.name.slice(0, -1); return; }
    if (K['Space'] && !prev['Space'] && this.name.length < 12) { this.name += ' '; return; }
    for (const k in K) {
      if (!K[k] || prev[k]) continue; // nur Edges
      if (/^Key[A-Z]$/.test(k) && this.name.length < 12) { this.name += k.slice(3); break; }
      if (/^Digit[0-9]$/.test(k) && this.name.length < 12) { this.name += k.slice(5); break; }
    }
  },

  updatePhase1(frame) {
    // Drift-Physik (vereinfacht, wie Player)
    const K = SW.Input.keys, ACC = 0.06, DRAG = 0.96;
    if (K['KeyW'] || K['ArrowUp'])    SW.Player.vy -= ACC;
    if (K['KeyS'] || K['ArrowDown'])  SW.Player.vy += ACC;
    if (K['KeyA'] || K['ArrowLeft'])  SW.Player.vx -= ACC;
    if (K['KeyD'] || K['ArrowRight']) SW.Player.vx += ACC;
    SW.Player.x += SW.Player.vx; SW.Player.y += SW.Player.vy;
    SW.Player.vx *= DRAG; SW.Player.vy *= DRAG;
    SW.Player.x = Math.max(20, Math.min(SW.W - 20, SW.Player.x));
    SW.Player.y = Math.max(16, Math.min(SW.H - 16, SW.Player.y));

    this.rockTimer--;
    if (this.rockTimer <= 0) {
      this.rockTimer = 18 + Math.floor(this.prng() * 24);
      this.spawnRock();
    }

    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.z -= r.speed; r.rot += r.vrot;
      const p = SW.Engine.project(r.x, r.y, r.z);
      if (!p) { this.rocks.splice(i, 1); continue; } // Culling: hinter Kamera
      r.sx = p.sx; r.sy = p.sy; r.scale = p.scale;
      if (!r.passed && r.z <= 24) {
        r.passed = true; this.rockCount++;
        const dx = Math.abs(r.sx - SW.Player.x), dy = Math.abs(r.sy - SW.Player.y);
        // Treffer: Schild-Schaden + i-Frames, NICHT tot (by design)
        if (dx < r.size * 0.5 + 8 && dy < r.size * 0.5 + 8 && this.iFrames <= 0) {
          this.shieldFlash = 24; this.iFrames = 60;
          SW.Player.frontShield = Math.max(0, SW.Player.frontShield - 15);
          SW.Audio.playExplosion();
        }
      }
      if (r.z <= 5) this.rocks.splice(i, 1);
    }
    // Phase-Ende: harte Kappe (nie ewig) + Beschleuniger
    if (this.t > this.PHASE1_FRAMES || this.rockCount >= this.MAX_PASSED || (this.rockCount >= this.MIN_PASSED && this.t > 300)) {
      this.toPhase2();
    }
  },

  spawnRock() {
    const r = this.prng;
    this.rocks.push({
      x: (r() - 0.5) * 300,
      y: (r() - 0.5) * 200,
      z: 400 + r() * 200,
      speed: 2 + r() * 2,
      size: 8 + r() * 16,
      rot: r() * Math.PI * 2,
      vrot: (r() - 0.5) * 0.05,
      passed: false,
      verts: this.makeVerts(r)
    });
  },

  makeVerts(r) {
    const n = 7 + Math.floor(r() * 5), v = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rad = 0.7 + r() * 0.6;
      v.push([Math.cos(a) * rad, Math.sin(a) * rad]);
    }
    return v;
  },

  render(ctx) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW.W, SW.H);
    SW.Engine.renderStars(ctx, SW.Player.x * 0.1, SW.Player.y * 0.1);
    if (this.phase === 0) this.renderPhase0(ctx);
    else if (this.phase === 1) this.renderPhase1(ctx);
    else if (this.phase === 2) this.renderPhase2(ctx);
    else if (this.phase === 3) this.renderPhase3(ctx);
  },

  // Titelschirm (v0.6.9-final): Titel + Version + Platzhalter-Hinweis.
  // Der Hinweis ist Absicht: vieles ist Placeholder-Grafik/-Sound.
  renderPhase0(ctx) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f0'; ctx.font = 'bold 16px monospace';
    ctx.fillText('SOLO WING 1990', SW.CX, 55);
    ctx.fillStyle = '#0af'; ctx.font = '8px monospace';
    ctx.fillText('v0.6.9-final — STERNENKORPS / TRÄGER FAX-TRAGÖDIE', SW.CX, 75);
    ctx.fillStyle = '#888'; ctx.font = '7px monospace';
    ctx.fillText('Viele Grafiken und Sounds sind Platzhalter.', SW.CX, 105);
    ctx.fillText('Spielen auf eigene Gefahr. Formular 77-A deckt den Rest ab.', SW.CX, 117);
    const blink = Math.floor(this.t / 30) % 2 === 0;
    ctx.fillStyle = blink ? '#fff' : '#666'; ctx.font = '9px monospace';
    ctx.fillText('[ LEERTASTE: STARTEN ]', SW.CX, 145);
    ctx.fillStyle = '#444'; ctx.font = '6px monospace';
    ctx.fillText('[ ESC: ÜBERSPRINGEN ]', SW.CX, 162);
    ctx.textAlign = 'left';
  },

  drawRock(ctx, r) {
    const s = r.size * r.scale;
    if (s < 1) return;
    ctx.save();
    ctx.translate(r.sx, r.sy);
    ctx.rotate(r.rot);
    ctx.fillStyle = '#7a7a80';
    ctx.beginPath();
    for (let i = 0; i < r.verts.length; i++) {
      const v = r.verts[i];
      if (i === 0) ctx.moveTo(v[0] * s, v[1] * s);
      else ctx.lineTo(v[0] * s, v[1] * s);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  },

  drawPlayer(ctx) {
    ctx.fillStyle = '#3366ff';
    ctx.fillRect(SW.Player.x - 3, SW.Player.y - 4, 6, 8);
    ctx.fillStyle = '#00ccff';
    ctx.fillRect(SW.Player.x - 1, SW.Player.y - 2, 2, 2);
    if (this.shieldFlash > 0) {
      ctx.strokeStyle = 'rgba(0,170,255,' + (this.shieldFlash / 24) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(SW.Player.x, SW.Player.y, 12, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
    }
  },

  renderPhase1(ctx) {
    // Painter's Algorithm: fern (z > Player.z) → Player → nah (z < Player.z)
    const far = [], near = [];
    for (const r of this.rocks) { if (r.z > SW.Player.z) far.push(r); else near.push(r); }
    far.sort((a, b) => b.z - a.z);
    for (const r of far) this.drawRock(ctx, r);
    this.drawPlayer(ctx);
    near.sort((a, b) => b.z - a.z);
    for (const r of near) this.drawRock(ctx, r);
    // HUD
    ctx.fillStyle = '#0f0'; ctx.font = '6px monospace'; ctx.textAlign = 'left';
    ctx.fillText('SCHILD: ' + SW.Player.frontShield, 5, 10);
    ctx.fillStyle = '#666';
    ctx.fillText('[ W/S/D: AUSWEICHEN ]  [ ESC: ÜBERSPRINGEN ]', 5, SW.H - 5);
  },

  renderPhase2(ctx) {
    ctx.fillStyle = '#0f0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('PILOTENNAME:', SW.CX, 60);
    ctx.font = '12px monospace';
    const display = this.name + (this.cursorOn ? '_' : ' ');
    ctx.fillStyle = '#fff';
    ctx.fillText(display, SW.CX, 90);
    ctx.fillStyle = '#666'; ctx.font = '7px monospace';
    ctx.fillText('[ Buchstaben / Ziffern / Leer ]  [ ENTER: OK ]', SW.CX, 120);
    ctx.fillText('Leer = FLUG DREI', SW.CX, 132);
    ctx.textAlign = 'left';
  },

  renderPhase3(ctx) {
    const n = SW.World.pilotName;
    ctx.fillStyle = '#0f0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('WILLKOMMEN, ' + n + '.', SW.CX, 70);
    ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
    ctx.fillText('Sie werden dem Träger FAX-TRAGÖDIE zugeteilt.', SW.CX, 95);
    ctx.fillText('Formular 83-B liegt bereit.', SW.CX, 110);
    ctx.fillStyle = '#666'; ctx.font = '7px monospace';
    ctx.fillText('[ AKADEMIE ]', SW.CX, 140);
    ctx.textAlign = 'left';
  }
};
