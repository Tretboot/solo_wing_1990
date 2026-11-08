// ===== SOLO WING 1990 — CINEMATIC INTRO-SEQUENZ (State "INTRO") =====
// Technisch WC1 Multi-Angle Pixel-Art, erzählerisch WC4 Cinematic Storytelling:
//   Phase 0: Titelschirm mit 3D-Schiffs-Vorbeiflug im Asteroidenfeld
//   Phase 1: Einsamer Transporter fliegt durchs Asteroidenfeld (steuerbar!)
//            -> Akt I:   Introschrift (WC4-Stil) & Asteroiden-Drift
//            -> Akt II:  Überfall durch Piraten-Jäger (Laserfeuer, Explosionen, Notruf)
//            -> Akt III: Die TCS Fax-Tragödie springt mitten ins Gefecht, Hornets
//                        zerlegen die Piraten, Traktorstrahl rettet den Spieler!
//   Phase 2: Das Angebot an Bord (Da man allein auf dem Schrotthaufen war, muss man
//            Pilot sein! Piloten fehlen -> Einstieg nach Simulator-Test, bessere
//            Bezahlung als von Piraten abgeschossen zu werden!) + Namenseingabe
//   Phase 3: Vertrag & Übergang zum Simulator-Test (AKADEMIE)

SW.Intro = {
  phase: 1, t: 0, rocks: [], pirates: [], lasers: [], explosions: [],
  rockTimer: 0, rockCount: 0,
  name: '', cursorOn: true, cursorTimer: 0,
  shieldFlash: 0, iFrames: 0,
  carrierJumpFlash: 0,
  phase3Done: false,
  commTimeout: null,
  _prevKeys: {},
  PHASE1_FRAMES: 840,   // ~14s @60fps für alle 3 dramatischen Akte
  MIN_PASSED: 22,
  MAX_PASSED: 48,

  init() {
    if (this.commTimeout) { clearTimeout(this.commTimeout); this.commTimeout = null; }
    this.phase = 0; this.t = 0; this._spaceHeld = false;
    this.rocks = []; this.pirates = []; this.lasers = []; this.explosions = [];
    this.rockTimer = 0; this.rockCount = 0;
    this.name = ''; this.cursorOn = true; this.cursorTimer = 0;
    this.shieldFlash = 0; this.iFrames = 0;
    this.carrierJumpFlash = 0;
    this.phase3Done = false;
    this._prevKeys = {};
    this.seed = (SW.World && SW.World.seed) || 1990;
    this.prng = SW.Intro.makePRNG(this.seed);

    SW.Player.x = SW.CX; SW.Player.y = SW.H * 0.62; SW.Player.z = 100;
    SW.Player.vx = 0; SW.Player.vy = 0;
    SW.Player.frontShield = 100; SW.Player.rearShield = 100;

    this.commTimeout = setTimeout(() => {
      this.commTimeout = null;
      if (SW.Game.state === 'INTRO' && this.phase === 1) {
        SW.Audio.playCommBeep();
        if (SW.TTS) {
          SW.TTS.speak('Achtung, unabhängiger Transporter. Sie durchqueren Sektor Sieben ohne Geleitschutz. Piraten-Signaturen auf dem Radar.', 'COMMANDER');
        }
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

  toPhase1() {
    this.phase = 1; this.t = 0;
    SW.Audio.init();
    SW.Audio.startMusic('asteroid');
  },
  toPhase2() {
    this.phase = 2; this.t = 0;
    SW.Audio.stopMusic();
    SW.Audio.playCommBeep();
  },

  toPhase3() {
    const n = (this.name.trim() || 'FLUG DREI');
    SW.World.pilotName = n;
    this.phase = 3; this.t = 0; this.phase3Done = false;
    SW.Audio.playCommBeep();
    if (SW.TTS) {
      SW.TTS.speak('Vertrag unterzeichnet, ' + n + '. Ab in den Simulator. Danach warten echte Piraten auf Sie.', 'COMMANDER');
    }
  },

  escToAkademie() {
    if (!SW.World.pilotName) SW.World.pilotName = (this.name.trim() || 'FLUG DREI');
    SW.Game.setState('AKADEMIE');
  },

  update(frame) {
    this.t++;
    this.cursorTimer++;
    if (this.cursorTimer >= 30) { this.cursorOn = !this.cursorOn; this.cursorTimer = 0; }
    if (this.shieldFlash > 0) this.shieldFlash--;
    if (this.iFrames > 0) this.iFrames--;
    if (this.carrierJumpFlash > 0) this.carrierJumpFlash--;

    const K = SW.Input.keys, prev = this._prevKeys;
    if (K['Escape'] && !prev['Escape']) { this.escToAkademie(); return; }

    if (this.phase === 0) {
      const cKey = K['KeyC'];
      if (cKey && !this._cHeld) {
        this._cHeld = true;
        SW.Audio.init();
        SW.Game.startCredits();
        return;
      }
      if (!cKey) this._cHeld = false;
      const space = K['Space'] || K['Enter'];
      if (space && !this._spaceHeld) { this._spaceHeld = true; this.toPhase1(); return; }
      if (!space) this._spaceHeld = false;
      return;
    }

    if (this.phase === 1) this.updatePhase1(frame);
    else if (this.phase === 2) this.handleNameInput();
    else if (this.phase === 3) {
      const skip = (K['Space'] && !prev['Space']) || (K['Enter'] && !prev['Enter']);
      if (!this.phase3Done && (this.t > 190 || skip)) {
        this.phase3Done = true;
        SW.Game.setState('AKADEMIE');
      }
    }

    this._prevKeys = {};
    for (const k in K) if (K[k]) this._prevKeys[k] = true;
  },

  handleNameInput() {
    const K = SW.Input.keys, prev = this._prevKeys;
    if (K['Enter'] && !prev['Enter']) { this.toPhase3(); return; }
    if (K['Backspace'] && !prev['Backspace']) { this.name = this.name.slice(0, -1); return; }
    if (K['Space'] && !prev['Space'] && this.name.length < 12) { this.name += ' '; return; }
    for (const k in K) {
      if (!K[k] || prev[k]) continue;
      if (/^Key[A-Z]$/.test(k) && this.name.length < 12) { this.name += k.slice(3); break; }
      if (/^Digit[0-9]$/.test(k) && this.name.length < 12) { this.name += k.slice(5); break; }
    }
  },

  updatePhase1(frame) {
    // Spieler steuert seinen einsamen Transporter durchs Asteroidenfeld
    const K = SW.Input.keys, ACC = 0.08, DRAG = 0.94;
    if (K['KeyW'] || K['ArrowUp'])    SW.Player.vy -= ACC;
    if (K['KeyS'] || K['ArrowDown'])  SW.Player.vy += ACC;
    if (K['KeyA'] || K['ArrowLeft'])  SW.Player.vx -= ACC;
    if (K['KeyD'] || K['ArrowRight']) SW.Player.vx += ACC;
    SW.Player.x += SW.Player.vx; SW.Player.y += SW.Player.vy;
    SW.Player.vx *= DRAG; SW.Player.vy *= DRAG;
    SW.Player.x = Math.max(36, Math.min(SW.W - 36, SW.Player.x));
    SW.Player.y = Math.max(36, Math.min(SW.H - 28, SW.Player.y));

    // Asteroiden spawnen
    this.rockTimer--;
    if (this.rockTimer <= 0) {
      this.rockTimer = 14 + Math.floor(this.prng() * 18);
      this.spawnRock();
    }

    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.z -= r.speed; r.rot += r.vrot;
      // Kamera-relativ um SW.CX, SW.CY projizieren
      const f = 120;
      if (r.z <= 4) { this.rocks.splice(i, 1); continue; }
      r.sx = SW.CX + (r.x / r.z) * f;
      r.sy = SW.CY + (r.y / r.z) * f;
      r.scale = f / r.z;
      if (!r.passed && r.z <= 28) {
        r.passed = true; this.rockCount++;
        const dx = Math.abs(r.sx - SW.Player.x), dy = Math.abs(r.sy - SW.Player.y);
        if (dx < r.size * 0.55 + 10 && dy < r.size * 0.55 + 10 && this.iFrames <= 0) {
          this.shieldFlash = 20; this.iFrames = 45;
          SW.Player.frontShield = Math.max(12, SW.Player.frontShield - 14);
          if (SW.Audio && SW.Audio.playShieldHit) SW.Audio.playShieldHit();
        }
      }
    }

    // AKT II (ab t=210): Piraten-Überfall auf den einsamen Transporter!
    if (this.t === 210) {
      if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
      this.pirates = [
        { x: -110, y: -35, z: 220, vx: 0.5, vy: 0.15, atlas: 'talon',   alive: true, hp: 2 },
        { x:  115, y: -25, z: 250, vx: -0.5, vy: 0.1, atlas: 'dralthi', alive: true, hp: 2 },
        { x:    0, y: -55, z: 280, vx: 0.2, vy: 0.2,  atlas: 'talon',   alive: true, hp: 2 }
      ];
    }

    // AKT III (ab t=490): Die TCS Fax-Tragödie springt mitten ins Gefecht & Hornets retten dich!
    if (this.t === 490) {
      this.carrierJumpFlash = 26;
      if (SW.Audio && SW.Audio.playJumpWhoosh) SW.Audio.playJumpWhoosh();
    }

    // Update Piraten, Laserfeuer & Retter-Hornets
    for (const p of this.pirates) {
      if (!p.alive) continue;
      if (this.t < 510) {
        // Piraten kreisen den Transporter ein und feuern
        p.z = Math.max(85, p.z - 0.85);
        p.x += Math.sin(this.t * 0.05 + p.z) * 1.3;
        p.y += Math.cos(this.t * 0.04 + p.x) * 0.7;
        if (this.t % 28 === 0) {
          const sx = SW.CX + (p.x / p.z) * 120;
          const sy = SW.CY + (p.y / p.z) * 120;
          this.lasers.push({
            x0: sx, y0: sy,
            x1: SW.Player.x + (this.prng() - 0.5) * 26,
            y1: SW.Player.y + (this.prng() - 0.5) * 18,
            col: '#33ff66', life: 8
          });
          if (this.t % 56 === 0 && SW.Player.frontShield > 18) {
            SW.Player.frontShield = Math.max(14, SW.Player.frontShield - 8);
            this.shieldFlash = 14;
          }
          if (SW.Audio && SW.Audio.playLaser) SW.Audio.playLaser();
        }
      } else {
        // Träger & Hornets feuern rote Salven auf die Piraten und sprengen sie!
        p.x += 1.6; p.y -= 0.8;
      }
    }

    // Zwischen t=530 und t=670 werden die 3 Piraten nacheinander von den Träger-Hornets abgeschossen!
    if (this.t === 545 || this.t === 595 || this.t === 645) {
      const victim = this.pirates.find(p => p.alive);
      if (victim) {
        victim.alive = false;
        const vx = SW.CX + (victim.x / victim.z) * 120;
        const vy = SW.CY + (victim.y / victim.z) * 120;
        this.lasers.push({ x0: SW.CX - 35, y0: 68, x1: vx, y1: vy, col: '#ff3322', life: 12 });
        this.lasers.push({ x0: SW.CX + 35, y0: 68, x1: vx, y1: vy, col: '#ff3322', life: 12 });
        this.explosions.push({ x: vx, y: vy, frame: 0 });
        if (SW.Audio && SW.Audio.playExplosion) SW.Audio.playExplosion();
      }
    }

    for (let i = this.lasers.length - 1; i >= 0; i--) {
      this.lasers[i].life--;
      if (this.lasers[i].life <= 0) this.lasers.splice(i, 1);
    }
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].frame++;
      if (this.explosions[i].frame > 20) this.explosions.splice(i, 1);
    }

    // Im Traktorstrahl (ab t=660) gleitet der Transporter sanft zur Mitte Richtung Träger-Landebucht
    if (this.t > 660) {
      SW.Player.x += (SW.CX - SW.Player.x) * 0.06;
      SW.Player.y += (SW.H * 0.58 - SW.Player.y) * 0.06;
    }

    if (this.t > this.PHASE1_FRAMES) {
      this.toPhase2();
    }
  },

  spawnRock() {
    const r = this.prng;
    this.rocks.push({
      x: (r() - 0.5) * 320,
      y: (r() - 0.5) * 210,
      z: 340 + r() * 180,
      speed: 2.4 + r() * 2.2,
      size: 10 + r() * 18,
      rot: r() * Math.PI * 2,
      vrot: (r() - 0.5) * 0.05,
      debrisSprite: r() < 0.65 ? (r() < 0.5 ? 'debris01' : 'debris02') : null,
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
    SW.Engine.renderStars(ctx, (SW.Player.x - SW.CX) * 0.15, (SW.Player.y - SW.CY) * 0.15);
    if (this.phase === 0) this.renderPhase0(ctx);
    else if (this.phase === 1) this.renderPhase1(ctx);
    else if (this.phase === 2) this.renderPhase2(ctx);
    else if (this.phase === 3) this.renderPhase3(ctx);
  },

  // Phase 0: Titelschirm mit 3D-Schiffsvorbeiflug (Transporter & Träger) im Hintergrund
  renderPhase0(ctx) {
    // Hintergrund-Szenerie: Einsamer Transporter & Träger im tiefen Raum
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      const carrierYaw = 1.15 + Math.sin(this.t * 0.01) * 0.25;
      SW.Sprites.drawMultiAngle(ctx, 'fax_traegodie', 238, 52, 86, carrierYaw, 0.16, '#5588aa', SW.Sprites.carrier);
      const freighterYaw = Math.PI + 0.35 + Math.sin(this.t * 0.025) * 0.3;
      const fx = 76 + Math.sin(this.t * 0.02) * 14;
      const fy = 122 + Math.cos(this.t * 0.025) * 6;
      SW.Sprites.drawMultiAngle(ctx, 'freighter', fx, fy, 46, freighterYaw, 0.15, '#cc8844', SW.Sprites.playerShip);
    }

    // Dunkles Cinema-Banner für klaren Kontrast des Logos
    ctx.fillStyle = 'rgba(4, 8, 16, 0.62)';
    ctx.fillRect(0, 56, SW.W, 74);

    const title = 'SOLO WING 1990';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.font = '900 19px Impact, "Arial Black", sans-serif';
    ctx.lineJoin = 'miter';
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#4e442f';
    ctx.strokeText(title, SW.CX + 1, 78);
    ctx.fillStyle = '#e7c36b';
    ctx.fillText(title, SW.CX, 77);
    ctx.restore();

    ctx.fillStyle = '#8eb8d8'; ctx.font = 'bold 6.5px monospace';
    ctx.fillText('WING COMMANDER EDITION — SEKTOR 7 CHRONIKEN', SW.CX, 91);
    ctx.fillStyle = '#b8c6d4'; ctx.font = '5.5px monospace';
    ctx.fillText('Ein einsamer Transporter. Ein Hinterhalt im Asteroidenfeld.', SW.CX, 104);
    ctx.fillText('Und ein Jobangebot, das besser bezahlt wird als der Tod.', SW.CX, 114);

    const blink = Math.floor(this.t / 25) % 2 === 0;
    ctx.fillStyle = blink ? '#ffffff' : '#6688aa'; ctx.font = 'bold 8px monospace';
    ctx.fillText('[ LEERTASTE: INTRO & KAMPAGNE STARTEN ]', SW.CX, 148);
    ctx.fillStyle = '#667788'; ctx.font = '5.5px monospace';
    ctx.fillText('[ ESC: DIREKT ZUM SIMULATOR ]   [ C: ROLLENDER ABSPANN ]', SW.CX, 164);
    ctx.textAlign = 'left';
  },

  drawRock(ctx, r) {
    const s = r.size * r.scale;
    if (s < 2) return;
    const vfx = (SW.Sprites && SW.Sprites.vfx) || {};
    const debImg = r.debrisSprite ? vfx[r.debrisSprite] : null;
    if (debImg && debImg._ready && ctx.drawImage) {
      const dSize = Math.max(4, Math.min(72, Math.round(s * 1.9)));
      ctx.drawImage(debImg, Math.round(r.sx - dSize / 2), Math.round(r.sy - dSize / 2), dSize, dSize);
      return;
    }
    ctx.save();
    ctx.translate(r.sx, r.sy);
    ctx.rotate(r.rot);
    ctx.fillStyle = '#6e737b';
    ctx.beginPath();
    for (let i = 0; i < r.verts.length; i++) {
      const v = r.verts[i];
      if (i === 0) ctx.moveTo(v[0] * s, v[1] * s);
      else ctx.lineTo(v[0] * s, v[1] * s);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3d424a'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  },

  // Zeichnet den einsamen Transporter des Spielers (80-View 3D Multi-Angle Frachter!)
  drawPlayer(ctx) {
    const px = SW.Player.x;
    const py = SW.Player.y;
    const yaw = Math.PI + SW.Player.vx * 0.18 + Math.sin(this.t * 0.03) * 0.12;
    const pitch = 0.18 - SW.Player.vy * 0.12;
    const vfx = (SW.Sprites && SW.Sprites.vfx) || {};

    // Ab Akt III (t > 640): Grüner Traktorstrahl vom Träger zieht den beschädigten Transporter an Bord!
    if (this.t > 630 && ctx.beginPath) {
      ctx.save();
      ctx.strokeStyle = 'rgba(40, 255, 150, 0.45)';
      ctx.fillStyle = 'rgba(30, 220, 130, 0.14)';
      ctx.beginPath();
      ctx.moveTo(SW.CX - 14, 58);
      ctx.lineTo(SW.CX + 14, 58);
      ctx.lineTo(px + 20, py + 6);
      ctx.lineTo(px - 20, py + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    const drew = (SW.Sprites && SW.Sprites.drawMultiAngle)
      ? SW.Sprites.drawMultiAngle(ctx, 'freighter', px, py, 46, yaw, pitch, '#cc8844', SW.Sprites.playerShip)
      : false;
    if (!drew) {
      ctx.fillStyle = '#aa8844';
      ctx.fillRect(px - 8, py - 6, 16, 12);
    }

    // Triebwerksflackern am Transporter
    if (vfx.engineFlare && vfx.engineFlare._ready && ctx.drawImage) {
      ctx.drawImage(vfx.engineFlare, Math.round(px - 11), Math.round(py + 4), 10, 10);
      ctx.drawImage(vfx.engineFlare, Math.round(px + 1), Math.round(py + 4), 10, 10);
    }

    // Schild-Aufblitzen bei Asteroiden- oder Piraten-Treffern
    if (this.shieldFlash > 0 && ctx.arc) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 200, 255, ' + (this.shieldFlash / 24) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  },

  renderPhase1(ctx) {
    // 1. In Akt III (ab t=490): Die TCS Fax-Tragödie erscheint im Hintergrund + 2 rettende Hornets!
    if (this.t >= 490 && SW.Sprites && SW.Sprites.drawMultiAngle) {
      const carrierP = Math.min(1, (this.t - 490) / 90);
      const cSize = Math.round(28 + carrierP * 88);
      SW.Sprites.drawMultiAngle(ctx, 'fax_traegodie', SW.CX, 54, cSize, 0.45 - carrierP * 0.15, 0.15, '#5588aa', SW.Sprites.carrier);
      if (this.t > 515) {
        const h1x = SW.CX - 48 - Math.sin(this.t * 0.06) * 18;
        const h2x = SW.CX + 48 + Math.cos(this.t * 0.06) * 18;
        SW.Sprites.drawMultiAngle(ctx, 'hornet', h1x, 72, 26, 0.35, 0.1, '#88aa44', SW.Sprites.playerShip);
        SW.Sprites.drawMultiAngle(ctx, 'hornet_ace', h2x, 72, 26, -0.35, 0.1, '#88aa44', SW.Sprites.playerShip);
      }
    }

    // 2. Ferne Asteroiden (z > 100)
    const far = [], near = [];
    for (const r of this.rocks) { if (r.z > 100) far.push(r); else near.push(r); }
    far.sort((a, b) => b.z - a.z);
    for (const r of far) this.drawRock(ctx, r);

    // 3. Piraten-Jäger im Gefecht (mit 80-View Multi-Angle Sprites!)
    for (const p of this.pirates) {
      if (!p.alive) continue;
      const sx = SW.CX + (p.x / p.z) * 120;
      const sy = SW.CY + (p.y / p.z) * 120;
      const sz = Math.max(16, Math.min(48, Math.round((120 / p.z) * 42)));
      const pYaw = Math.sin(this.t * 0.05 + p.x) * 0.75;
      if (SW.Sprites && SW.Sprites.drawMultiAngle) {
        SW.Sprites.drawMultiAngle(ctx, p.atlas, sx, sy, sz, pYaw, 0.1, '#ff4444', SW.Sprites.enemy);
      }
    }

    // 4. Laser-Salven & WCUnity Explosionen
    for (const l of this.lasers) {
      ctx.strokeStyle = l.col;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(l.x0, l.y0); ctx.lineTo(l.x1, l.y1); ctx.stroke();
      ctx.lineWidth = 1;
    }
    const strip = SW.Sprites && SW.Sprites.vfx && SW.Sprites.vfx.explodeStrip;
    for (const ex of this.explosions) {
      if (strip && strip._ready && ctx.drawImage) {
        const fi = Math.min(15, Math.floor((ex.frame / 20) * 16));
        ctx.drawImage(strip, fi * 64, 0, 64, 64, Math.round(ex.x - 24), Math.round(ex.y - 24), 48, 48);
      }
    }

    // 5. Eigener Transporter + nahe Asteroiden
    this.drawPlayer(ctx);
    near.sort((a, b) => b.z - a.z);
    for (const r of near) this.drawRock(ctx, r);

    // Hyperspace-Blitz beim Eintreffen des Trägers
    if (this.carrierJumpFlash > 0) {
      ctx.fillStyle = 'rgba(120, 235, 255, ' + (this.carrierJumpFlash / 32) + ')';
      ctx.fillRect(0, 0, SW.W, SW.H);
    }

    // 6. WC4-Style Kino-Letterbox & Story-Erzählung (Oben & Unten)
    ctx.fillStyle = 'rgba(4, 8, 14, 0.86)';
    ctx.fillRect(0, 0, SW.W, 22);
    ctx.fillRect(0, SW.H - 34, SW.W, 34);
    ctx.fillStyle = '#336688';
    ctx.fillRect(0, 22, SW.W, 1);
    ctx.fillRect(0, SW.H - 34, SW.W, 1);

    // Oben: Schildstatus + Akt-Titel
    ctx.fillStyle = SW.Player.frontShield > 35 ? '#45c97a' : '#ff6644';
    ctx.font = 'bold 5.5px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TRANSPORTER-SCHILD: ' + SW.Player.frontShield + '%', 6, 9);
    ctx.fillStyle = '#e7c36b';
    ctx.textAlign = 'right';
    const actTitle = this.t < 210
      ? 'AKT I: DER EINSAME TRANSPORTER (SEKTOR 7)'
      : (this.t < 490 ? 'AKT II: PIRATEN-HINTERHALT IM GERÖLLFELD!' : 'AKT III: RETTUNG DURCH DIE TCS FAX-TRAGÖDIE!');
    ctx.fillText(actTitle, SW.W - 6, 9);

    ctx.fillStyle = '#88b4d8';
    ctx.font = '5px monospace';
    ctx.textAlign = 'center';
    const topCrawl = this.t < 210
      ? 'Alleine auf deiner alten Frachtmühle kämpfst du dich durch das Asteroidenfeld...'
      : (this.t < 490
          ? 'Drei Piraten-Jäger kesseln dich ein! Ohne Geleitschutz bist du geliefert!'
          : 'Sprungblitz! Der Träger TCS Fax-Tragödie greift ein und zieht dich in den Hangar!');
    ctx.fillText(topCrawl, SW.CX, 18);

    // Unten: Sprecher-Porträt + Untertitel im WC4-Story-Stil
    let speaker = 'LOGBUCH', faceId = 'mechanic', line1 = '', line2 = '';
    if (this.t < 210) {
      speaker = 'BORD-CHRONIK'; faceId = 'mechanic';
      line1 = '»Ein Mann, ein rostiger Transporter und ein ganzes Feld voller Felsen.«';
      line2 = 'Steuere mit [W/A/S/D] oder [PFEILTASTEN] durch den Asteroidengürtel!';
    } else if (this.t < 490) {
      speaker = 'PIRATEN-STAFFEL'; faceId = 'kugelschreiber';
      line1 = '»Frachter voraus! Schilde runter und Fracht raus, oder wir testen unsere Laser!«';
      line2 = 'WARNUNG: Hüllenbruch! Kein Entkommen mit dem langsamen Transporter!';
    } else {
      speaker = 'COMMANDER (TRÄGER)'; faceId = 'commander';
      line1 = '»Hier TCS Fax-Tragödie! Hornets, räumt die Piraten weg! Traktorstrahl aktiv!«';
      line2 = '»Zieht den Überlebenden aus dem Schrotthaufen direkt in unseren Hangar!«';
    }

    if (SW.NPC && SW.NPC.drawFace) {
      ctx.fillStyle = '#0c1c28';
      ctx.fillRect(6, SW.H - 31, 24, 24);
      ctx.strokeStyle = '#4488aa';
      ctx.strokeRect(6, SW.H - 31, 24, 24);
      SW.NPC.drawFace(ctx, faceId, 18, SW.H - 19, 14, { animated: true, frame: this.t });
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffcc55'; ctx.font = 'bold 5.5px monospace';
    ctx.fillText(speaker + ':', 35, SW.H - 23);
    ctx.fillStyle = '#e6f0f8'; ctx.font = '5px monospace';
    ctx.fillText(line1, 35, SW.H - 15);
    ctx.fillStyle = '#88ccaa';
    ctx.fillText(line2, 35, SW.H - 8);
    ctx.fillStyle = '#667788'; ctx.textAlign = 'right';
    ctx.fillText('[ESC: SKIP]', SW.W - 5, SW.H - 23);
    ctx.textAlign = 'left';
  },

  // Phase 2: Gerettet im Hangar der TCS Fax-Tragödie — Das Angebot & Namenseingabe
  renderPhase2(ctx) {
    // Hangar-Kulisse mit gerettetem Schrotthaufen & neuem Hornet-Jäger
    ctx.fillStyle = '#121822'; ctx.fillRect(0, 0, SW.W, SW.H);
    ctx.fillStyle = '#1e2634'; ctx.fillRect(0, 132, SW.W, 68);
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      SW.Sprites.drawMultiAngle(ctx, 'freighter', 64, 118, 44, 0.85, 0.15, '#aa7744', SW.Sprites.playerShip);
      SW.Sprites.drawMultiAngle(ctx, 'hornet', 256, 116, 48, -0.75, 0.15, '#5588aa', SW.Sprites.playerShip);
    }
    if (SW.NPC && SW.NPC.drawFace) {
      SW.NPC.drawFace(ctx, 'commander', 36, 42, 22, { animated: true, frame: this.t });
      SW.NPC.drawFace(ctx, 'mechanic', 284, 42, 22, { animated: false });
    }

    // Story-Dialogbox: Warum man rekrutiert wird
    ctx.fillStyle = 'rgba(6, 14, 24, 0.92)';
    ctx.fillRect(54, 10, 212, 74);
    ctx.strokeStyle = '#4488bb';
    ctx.strokeRect(54, 10, 212, 74);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc55'; ctx.font = 'bold 6.5px monospace';
    ctx.fillText('BERicht NACH DER RETTUNG — HANGAR DECK 1', SW.CX, 21);

    ctx.fillStyle = '#dce8f2'; ctx.font = '5px monospace';
    ctx.fillText('COMMANDER: »Ihr Schrotthaufen ist hinüber. Aber Sie waren ganz', SW.CX, 32);
    ctx.fillText('allein an Bord — also müssen Sie wohl der Pilot gewesen sein!«', SW.CX, 40);
    ctx.fillStyle = '#8bdc74';
    ctx.fillText('»Uns fehlen Piloten. Bestehen Sie kurz unseren Simulator-Test,', SW.CX, 51);
    ctx.fillText('dann kriegen Sie eine Hornet. Wird deutlich besser bezahlt, als', SW.CX, 59);
    ctx.fillText('sich von Piraten abschießen zu lassen. Hauptaufgabe: Piraten jagen!«', SW.CX, 67);

    // Formular 83-B Namenseingabe
    ctx.fillStyle = 'rgba(10, 22, 34, 0.94)';
    ctx.fillRect(46, 92, 228, 72);
    ctx.strokeStyle = '#65d481';
    ctx.strokeRect(46, 92, 228, 72);

    ctx.fillStyle = '#65d481'; ctx.font = 'bold 7.5px monospace';
    ctx.fillText('EINSTELLUNGS-FORMULAR 83-B — PILOTENNAME:', SW.CX, 106);

    ctx.font = 'bold 12px monospace';
    const display = (this.name || '') + (this.cursorOn ? '_' : ' ');
    ctx.fillStyle = '#ffffff';
    ctx.fillText(display, SW.CX, 126);

    ctx.fillStyle = '#8eb8d8'; ctx.font = '5.5px monospace';
    ctx.fillText('[ Tippen + ENTER: Vertrag unterschreiben & zum Simulator ]', SW.CX, 144);
    ctx.fillStyle = '#778899';
    ctx.fillText('(Leer lassen = Rufname „FLUG DREI“)', SW.CX, 155);
    ctx.textAlign = 'left';
  },

  // Phase 3: Vertrag gestempelt -> Direkt in den Simulator (AKADEMIE)
  renderPhase3(ctx) {
    const n = SW.World.pilotName || 'FLUG DREI';
    const posting = SW.Transfers.getCurrentPosting();
    ctx.fillStyle = '#08101a'; ctx.fillRect(0, 0, SW.W, SW.H);

    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      SW.Sprites.drawMultiAngle(ctx, 'hornet', SW.CX, 52, 54, this.t * 0.04, 0.2, '#44aa88', SW.Sprites.playerShip);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#65d481'; ctx.font = 'bold 9px monospace';
    ctx.fillText('VERTRAG GESTEMPELT: WILLKOMMEN, ' + n + '!', SW.CX, 96);
    ctx.fillStyle = '#dce8f2'; ctx.font = '6.5px monospace';
    ctx.fillText('TRÄGER-ZUTEILUNG: ' + posting.name, SW.CX, 112);
    ctx.fillStyle = '#ffcc55'; ctx.font = '6px monospace';
    ctx.fillText('AUFGABE: Piraten abschießen | SOLD: 1.250 CR + Abschussprämien', SW.CX, 126);
    ctx.fillStyle = '#8eb8d8'; ctx.font = '6px monospace';
    ctx.fillText('NÄCHSTER SCHRITT: Kurztest im Kampf-Simulator (Hangar Deck 2)...', SW.CX, 144);
    ctx.fillStyle = '#667788'; ctx.font = '5.5px monospace';
    ctx.fillText('[ LEERTASTE / ENTER: SIMULATOR STARTEN ]', SW.CX, 166);
    ctx.textAlign = 'left';
  }
};
