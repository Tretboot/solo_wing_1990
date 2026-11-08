// ===== SOLO WING 1990 — WINGNUT 3D RETRO PROTOTYP =====
// Basiert auf Arne Niklas Jansson / Howard Day Assets (680x440)

(function() {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  const W = 680, H = 440;
  const CX = W / 2, CY = H / 2;
  const FOCAL = 340;

  // --- ASSET LOADER ---
  const ASSETS = {
    cockpit: null,
    cockpitDamaged: null,
    reticle: null,
    bracketDefault: null,
    bracketLock: null,
    dralthiSheets: []
  };

  const DRALTHI_SHEET_COUNT = 17;
  let totalToLoad = 5 + DRALTHI_SHEET_COUNT;
  let loadedCount = 0;

  const loadingOverlay = document.getElementById('loading-overlay');
  const progressBar = document.getElementById('progress-bar');
  const loadingSub = document.getElementById('loading-sub');

  function assetLoaded(name) {
    loadedCount++;
    const pct = Math.round((loadedCount / totalToLoad) * 100);
    progressBar.style.width = pct + '%';
    loadingSub.textContent = `${loadedCount} / ${totalToLoad} Assets (${name})`;
    if (loadedCount >= totalToLoad) {
      setTimeout(() => {
        loadingOverlay.style.display = 'none';
        initGame();
      }, 200);
    }
  }

  function loadImg(src, name) {
    const img = new Image();
    img.onload = () => assetLoaded(name);
    img.onerror = () => {
      console.warn('Fehler beim Laden von:', src);
      assetLoaded(name + ' [FAIL]');
    };
    img.src = src;
    return img;
  }

  // Assets anstoßen
  ASSETS.cockpit = loadImg('assets/Hornet_Cockpit_Front.png', 'Cockpit Front');
  ASSETS.cockpitDamaged = loadImg('assets/Hornet_Cockpit_Front_Damaged.png', 'Cockpit Damaged');
  ASSETS.reticle = loadImg('assets/Reticle_Hornet.png', 'Reticle');
  ASSETS.bracketDefault = loadImg('assets/Human_Bracket_Default.png', 'Bracket');
  ASSETS.bracketLock = loadImg('assets/Human_Bracket_Lock.png', 'Bracket Lock');

  for (let i = 0; i < DRALTHI_SHEET_COUNT; i++) {
    ASSETS.dralthiSheets.push(loadImg(`assets/HowieDralthi${i}.png`, `Dralthi Sheet ${i}`));
  }

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  const AudioSys = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
    },
    playLaser() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // Dual Oscillator Pew-Pew
      for (let pan of [-0.3, 0.3]) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(580, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.14);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);
        if (panner) { panner.pan.value = pan; osc.connect(gain); gain.connect(panner); panner.connect(this.ctx.destination); }
        else { osc.connect(gain); gain.connect(this.ctx.destination); }
        osc.start(t); osc.stop(t + 0.14);
      }
    },
    playHit() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.1);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.1);
    },
    playExplosion() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      // White noise explosion burst
      const bufferSize = this.ctx.sampleRate * 0.6;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.18));
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, t);
      filter.frequency.exponentialRampToValueAtTime(80, t + 0.5);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);
      noise.connect(filter); filter.connect(gain); gain.connect(this.ctx.destination);
      noise.start(t);
    },
    playLock() {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.05);
      osc.connect(gain); gain.connect(this.ctx.destination);
      osc.start(t); osc.stop(t + 0.05);
    }
  };

  // --- INPUT SYSTEM ---
  const Input = {
    keys: {},
    mouseX: CX, mouseY: CY,
    isMouseDown: false,
    init() {
      window.addEventListener('keydown', e => {
        AudioSys.init();
        this.keys[e.code] = true;
        if (e.code === 'Tab') { e.preventDefault(); Game.cycleTarget(); }
        if (e.code === 'KeyR') { Game.spawnEnemies(); Comms.post('FLUGLEITUNG: Neue Welle Dralthi identifiziert.'); }
        if (e.code === 'KeyC') { Game.toggleCRT(); }
        if (e.code === 'KeyL') { Game.triggerLaunch(); }
        if (e.code === 'KeyK') { Game.triggerLand(); }
        if (e.code === 'KeyF') { Game.toggleFullscreen(); }
      });
      const bindBtn = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
      bindBtn('btn-crt', () => Game.toggleCRT());
      bindBtn('btn-launch', () => Game.triggerLaunch());
      bindBtn('btn-land', () => Game.triggerLand());
      bindBtn('btn-fs', () => Game.toggleFullscreen());
      window.addEventListener('keyup', e => { this.keys[e.code] = false; });
      canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        this.mouseX = (e.clientX - rect.left) * (W / rect.width);
        this.mouseY = (e.clientY - rect.top) * (H / rect.height);
      });
      canvas.addEventListener('mousedown', e => {
        AudioSys.init();
        this.isMouseDown = true;
        Player.fire();
      });
      canvas.addEventListener('mouseup', () => { this.isMouseDown = false; });
    }
  };

  // --- COMMS & RADIO SYSTEM (Solo Wing Lore) ---
  const Comms = {
    messages: [],
    post(text) {
      this.messages.unshift({ text, life: 320 });
      if (this.messages.length > 4) this.messages.pop();
    },
    update() {
      for (let i = this.messages.length - 1; i >= 0; i--) {
        this.messages[i].life--;
        if (this.messages[i].life <= 0) this.messages.splice(i, 1);
      }
    },
    draw(ctx) {
      ctx.save();
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      let y = 35;
      for (const m of this.messages) {
        const alpha = Math.min(1, m.life / 30);
        ctx.fillStyle = `rgba(0, 220, 255, ${alpha})`;
        ctx.fillText('> ' + m.text, 25, y);
        y += 12;
      }
      ctx.restore();
    }
  };

  // --- 3D STARS ---
  const Stars = {
    list: [],
    init(count = 220) {
      this.list = [];
      for (let i = 0; i < count; i++) {
        this.list.push({
          x: (Math.random() - 0.5) * 2400,
          y: (Math.random() - 0.5) * 2400,
          z: Math.random() * 1400 + 40,
          size: Math.random() * 1.5 + 0.8
        });
      }
    },
    update(speed, yawRate, pitchRate) {
      for (const s of this.list) {
        s.z -= speed;
        s.x -= yawRate * (s.z * 0.05);
        s.y -= pitchRate * (s.z * 0.05);
        if (s.z < 20) {
          s.z = 1400;
          s.x = (Math.random() - 0.5) * 2400;
          s.y = (Math.random() - 0.5) * 2400;
        }
      }
    },
    draw(ctx) {
      ctx.fillStyle = '#ffffff';
      for (const s of this.list) {
        if (s.z <= 10) continue;
        const sx = CX + (s.x / s.z) * FOCAL;
        const sy = CY + (s.y / s.z) * FOCAL;
        if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
          const b = Math.min(1, Math.max(0.2, 1 - (s.z / 1400)));
          ctx.fillStyle = `rgba(210, 230, 255, ${b})`;
          ctx.fillRect(Math.round(sx), Math.round(sy), s.size, s.size);
        }
      }
    }
  };

  // --- PLAYER ---
  const Player = {
    x: 0, y: 0, z: 0,
    yawRate: 0, pitchRate: 0,
    speed: 12,
    isAfterburning: false,
    energy: 100,
    frontShield: 100,
    rearShield: 100,
    fireCooldown: 0,
    recoil: 0,
    cockpitShiftX: 0,
    cockpitShiftY: 0,
    targetIndex: 0,
    locked: false,

    update() {
      // Maus / Keyboard Steuerung
      const dx = (Input.mouseX - CX) / CX;
      const dy = (Input.mouseY - CY) / CY;

      let targetYaw = dx * 1.8;
      let targetPitch = dy * 1.5;

      if (Input.keys['ArrowLeft'] || Input.keys['KeyA']) targetYaw = -1.8;
      if (Input.keys['ArrowRight'] || Input.keys['KeyD']) targetYaw = 1.8;
      if (Input.keys['ArrowUp']) targetPitch = -1.5;
      if (Input.keys['ArrowDown']) targetPitch = 1.5;

      this.yawRate += (targetYaw - this.yawRate) * 0.15;
      this.pitchRate += (targetPitch - this.pitchRate) * 0.15;

      // Nachbrenner / Schub
      this.isAfterburning = !!Input.keys['ShiftLeft'] || !!Input.keys['ShiftRight'];
      const baseSpeed = this.isAfterburning ? 26 : (Input.keys['KeyW'] ? 16 : (Input.keys['KeyS'] ? 7 : 12));
      this.speed += (baseSpeed - this.speed) * 0.1;

      // G-Force Cockpit Shake
      const targetShiftX = -this.yawRate * 7;
      const targetShiftY = -this.pitchRate * 6 + this.recoil;
      this.cockpitShiftX += (targetShiftX - this.cockpitShiftX) * 0.2;
      this.cockpitShiftY += (targetShiftY - this.cockpitShiftY) * 0.2;
      this.recoil *= 0.75;

      // Laser Cooldown & Energie
      if (this.fireCooldown > 0) this.fireCooldown--;
      if (this.energy < 100) this.energy = Math.min(100, this.energy + 0.35);

      // Auto-Fire bei Leertaste
      if ((Input.keys['Space'] || Input.isMouseDown) && this.fireCooldown === 0) {
        this.fire();
      }
    },

    fire() {
      if (this.fireCooldown > 0 || this.energy < 6) return;
      this.energy -= 6;
      this.fireCooldown = 12;
      this.recoil = 6;
      AudioSys.playLaser();

      // Twin Hornet Lasers (Mündungen links & rechts)
      Lasers.spawn(-32, 14);
      Lasers.spawn(32, 14);
    }
  };

  // --- LASERS ---
  const Lasers = {
    list: [],
    spawn(originX, originY) {
      this.list.push({
        x: originX * 1.5,
        y: originY * 1.5 + 10,
        z: 40,
        vx: (originX * 0.05),
        vy: (originY * 0.05),
        vz: 65,
        life: 45
      });
    },
    update() {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const l = this.list[i];
        l.x += l.vx;
        l.y += l.vy;
        l.z += l.vz;
        l.life--;

        // Collision Check mit Gegnern
        for (const e of Enemies.list) {
          if (!e.alive) continue;
          const dist = Math.hypot(e.x - l.x, e.y - l.y, e.z - l.z);
          if (dist < 45) {
            e.takeDamage(25);
            l.life = 0;
            AudioSys.playHit();
            Particles.spawnSparks(e.x, e.y, e.z);
            break;
          }
        }

        if (l.life <= 0 || l.z > 1600) this.list.splice(i, 1);
      }
    },
    draw(ctx) {
      ctx.save();
      ctx.lineWidth = 3;
      for (const l of this.list) {
        const sx1 = CX + (l.x / l.z) * FOCAL;
        const sy1 = CY + (l.y / l.z) * FOCAL;
        const sz2 = l.z + l.vz * 0.8;
        const sx2 = CX + (l.x / sz2) * FOCAL;
        const sy2 = CY + (l.y / sz2) * FOCAL;

        const grad = ctx.createLinearGradient(sx1, sy1, sx2, sy2);
        grad.addColorStop(0, '#00ffcc');
        grad.addColorStop(1, '#0088ff');
        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  // --- PARTICLES & EXPLOSIONS ---
  const Particles = {
    list: [],
    spawnSparks(x, y, z) {
      for (let i = 0; i < 12; i++) {
        this.list.push({
          x, y, z,
          vx: (Math.random() - 0.5) * 18,
          vy: (Math.random() - 0.5) * 18,
          vz: (Math.random() - 0.5) * 18,
          color: Math.random() > 0.5 ? '#ffaa00' : '#ffff55',
          size: Math.random() * 3 + 2,
          life: 25
        });
      }
    },
    spawnExplosion(x, y, z) {
      AudioSys.playExplosion();
      for (let i = 0; i < 40; i++) {
        this.list.push({
          x, y, z,
          vx: (Math.random() - 0.5) * 35,
          vy: (Math.random() - 0.5) * 35,
          vz: (Math.random() - 0.5) * 35,
          color: ['#ff3300', '#ff8800', '#ffff33', '#888888'][Math.floor(Math.random() * 4)],
          size: Math.random() * 6 + 3,
          life: Math.random() * 30 + 20
        });
      }
    },
    update() {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.life--;
        if (p.life <= 0 || p.z <= 10) this.list.splice(i, 1);
      }
    },
    draw(ctx) {
      for (const p of this.list) {
        if (p.z <= 15) continue;
        const sx = CX + (p.x / p.z) * FOCAL;
        const sy = CY + (p.y / p.z) * FOCAL;
        const scale = (FOCAL / p.z) * p.size;
        ctx.fillStyle = p.color;
        ctx.fillRect(sx - scale / 2, sy - scale / 2, Math.max(1, scale), Math.max(1, scale));
      }
    }
  };

  // --- KILRATHI DRALTHI CLASS & SPRITE PICKER MATH ---
  class Dralthi {
    constructor(id, x, y, z) {
      this.id = id;
      this.x = x; this.y = y; this.z = z;
      this.vx = 0; this.vy = 0; this.vz = 0;
      this.heading = Math.PI; // schaut anfangs zum Spieler
      this.pitchAngle = 0;
      this.hp = 100;
      this.shields = 60;
      this.alive = true;
      this.aiTimer = 0;
      this.aiState = 'INTERCEPT';
    }

    takeDamage(dmg) {
      if (this.shields > 0) {
        this.shields -= dmg;
        if (this.shields < 0) { this.hp += this.shields; this.shields = 0; }
      } else {
        this.hp -= dmg;
      }
      if (this.hp <= 0 && this.alive) {
        this.alive = false;
        Particles.spawnExplosion(this.x, this.y, this.z);
        Comms.post(`SECHS: Dralthi #${this.id} zerstört! Formular 83-D abhaken.`);
      }
    }

    update(playerSpeed, yawRate, pitchRate) {
      if (!this.alive) return;

      // Spieler-Relativbewegung
      this.z -= playerSpeed;
      this.x -= yawRate * (this.z * 0.05);
      this.y -= pitchRate * (this.z * 0.05);

      // Einfache Dogfight-KI
      this.aiTimer++;
      const distToPlayer = Math.hypot(this.x, this.y, this.z);

      if (this.z < 80) {
        // Nahüberflug -> Ausweichkurve nach hinten abdrehen
        this.aiState = 'EVADE';
      } else if (distToPlayer > 800) {
        this.aiState = 'INTERCEPT';
      }

      if (this.aiState === 'INTERCEPT') {
        // Anflug auf Spieler
        this.vx += (-this.x / distToPlayer) * 0.8;
        this.vy += (-this.y / distToPlayer) * 0.8;
        this.vz += (-this.z / distToPlayer) * 0.8;
        this.heading = Math.atan2(-this.x, -this.z);
      } else if (this.aiState === 'EVADE') {
        // Schere nach oben links/rechts wegziehen
        this.vx += (this.id % 2 === 0 ? 1.2 : -1.2);
        this.vy -= 1.0;
        this.vz += 1.8;
        this.heading += 0.03;
        if (this.z > 500) this.aiState = 'INTERCEPT';
      }

      // Dämpfung
      this.vx *= 0.94; this.vy *= 0.94; this.vz *= 0.94;
      this.x += this.vx; this.y += this.vy; this.z += this.vz;

      // Nick-Winkel aus vertikaler Geschwindigkeit
      this.pitchAngle = Math.max(-0.6, Math.min(0.6, -this.vy * 0.08));
    }

    // EXAKTER SPRITEPICKER NACH DANIEL KOOZER & HOWARD DAY
    getSpriteCoords() {
      // Vektor vom Schiff zur Kamera
      const dx = -this.x, dy = -this.y, dz = -this.z;
      const dist = Math.hypot(dx, dy, dz);
      if (dist < 0.001) return { sheet: 8, col: 0, row: 0 };

      // Transform in Schiff-Lokales Koordinatensystem (Heading-Rotation)
      const cosH = Math.cos(-this.heading);
      const sinH = Math.sin(-this.heading);
      const localX = dx * cosH - dz * sinH;
      const localZ = dx * sinH + dz * cosH;
      const localY = dy;

      // Sphärische Koordinaten (Theta = Azimut / Yaw, Phi = Elevation / Pitch)
      const lenXZ = Math.hypot(localX, localZ);
      let theta = lenXZ < 0.001 ? 0 : Math.atan2(localX, localZ);
      let phi = Math.atan2(localY, lenXZ);

      // Sprite Angle Snap (Math.PI / 16 Interval = 11.25 Grad)
      const interval = Math.PI / 16;
      const halfInterval = interval / 2;
      const twoPi = Math.PI * 2;
      const halfPi = Math.PI / 2;

      let spriteTheta = theta - halfInterval;
      while (spriteTheta < 0) spriteTheta += twoPi;
      while (spriteTheta >= twoPi) spriteTheta -= twoPi;

      let spritePhi = halfPi - (phi - halfInterval);

      // Yaw (0..31), Pitch (0..16)
      let yaw = Math.floor(spriteTheta / interval) % 32;
      let pitch = Math.floor(spritePhi / interval);
      pitch = Math.max(0, Math.min(16, pitch));

      const col = yaw % 8;
      const row = Math.floor(yaw / 8);
      return { sheet: pitch, col, row };
    }

    draw(ctx) {
      if (!this.alive || this.z <= 25) return;

      const { sheet, col, row } = this.getSpriteCoords();
      const sheetImg = ASSETS.dralthiSheets[sheet];
      if (!sheetImg || !sheetImg.complete) return;

      const sx = CX + (this.x / this.z) * FOCAL;
      const sy = CY + (this.y / this.z) * FOCAL;

      // 256x256 Sprite Frame im Atlas
      const frameW = 256, frameH = 256;
      const srcX = col * frameW;
      const srcY = row * frameH;

      // Bildschirmgröße basierend auf Entfernung
      const renderSize = (FOCAL / this.z) * 65;

      ctx.drawImage(
        sheetImg,
        srcX, srcY, frameW, frameH,
        sx - renderSize / 2, sy - renderSize / 2, renderSize, renderSize
      );
    }
  }

  // --- ENEMIES MANAGER ---
  const Enemies = {
    list: [],
    init() {
      this.list = [];
      this.list.push(new Dralthi(1, -120, -40, 650));
      this.list.push(new Dralthi(2, 140, 30, 800));
    },
    update(playerSpeed, yawRate, pitchRate) {
      for (const e of this.list) e.update(playerSpeed, yawRate, pitchRate);
    },
    draw(ctx) {
      // Painter's Algorithm: von hinten nach vorne zeichnen
      const sorted = [...this.list].sort((a, b) => b.z - a.z);
      for (const e of sorted) e.draw(ctx);
    }
  };

  // --- HUD & COCKPIT RENDERER ---
  const HUD = {
    drawTargeting(ctx) {
      const target = Enemies.list[Player.targetIndex];
      if (!target || !target.alive || target.z <= 25) return;

      const sx = CX + (target.x / target.z) * FOCAL;
      const sy = CY + (target.y / target.z) * FOCAL;

      // Ist im Fadenkreuz? (Lock)
      const distCenter = Math.hypot(sx - CX, sy - CY);
      const isLocked = distCenter < 35 && target.z < 850;
      if (isLocked && !Player.locked) AudioSys.playLock();
      Player.locked = isLocked;

      const bracketImg = isLocked ? ASSETS.bracketLock : ASSETS.bracketDefault;
      if (bracketImg && bracketImg.complete) {
        const bSize = Math.max(30, (FOCAL / target.z) * 85);
        ctx.drawImage(bracketImg, sx - bSize / 2, sy - bSize / 2, bSize, bSize);
      }

      // Distanz-Anzeige über dem Ziel
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = isLocked ? '#ff3333' : '#00ddff';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(target.z)}m`, sx, sy - 24);
    },

    drawRadar(ctx) {
      // Zentrales Radar im unteren Instrumententräger
      const rx = CX + Player.cockpitShiftX;
      const ry = 368 + Player.cockpitShiftY;
      const radius = 26;

      ctx.save();
      ctx.beginPath();
      ctx.arc(rx, ry, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#061016';
      ctx.fill();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Radar-Achsen
      ctx.beginPath();
      ctx.moveTo(rx - radius, ry); ctx.lineTo(rx + radius, ry);
      ctx.moveTo(rx, ry - radius); ctx.lineTo(rx, ry + radius);
      ctx.strokeStyle = '#004422';
      ctx.stroke();

      // Spieler Blip (Zentrum)
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(rx - 1, ry - 1, 3, 3);

      // Feind-Blips
      for (const e of Enemies.list) {
        if (!e.alive) continue;
        const bx = rx + Math.max(-radius + 2, Math.min(radius - 2, (e.x / 30)));
        const by = ry + Math.max(-radius + 2, Math.min(radius - 2, (e.z / 30) * (e.z > 0 ? 1 : -1)));
        ctx.fillStyle = e.z > 0 ? '#ff3333' : '#ffaa00';
        ctx.fillRect(bx - 1, by - 1, 3, 3);
      }
      ctx.restore();
    },

    drawMFD(ctx) {
      const ox = Player.cockpitShiftX;
      const oy = Player.cockpitShiftY;

      ctx.save();
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';

      // Linkes MFD: Speed & Schilde
      ctx.fillStyle = '#00ddff';
      ctx.fillText(`KPS: ${Math.round(Player.speed * 20)}`, 140 + ox, 355 + oy);
      ctx.fillText(Player.isAfterburning ? '[BURN]' : '[CRUISE]', 140 + ox, 368 + oy);

      // Energiebalken
      ctx.fillStyle = '#112233';
      ctx.fillRect(140 + ox, 375 + oy, 50, 4);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(140 + ox, 375 + oy, (Player.energy / 100) * 50, 4);

      // Rechtes MFD: Zielerfassung
      const target = Enemies.list[Player.targetIndex];
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('ZIEL: DRALTHI', 485 + ox, 355 + oy);
      if (target && target.alive) {
        ctx.fillText(`HP: ${Math.max(0, target.hp)}%`, 485 + ox, 368 + oy);
        ctx.fillText(`SHLD: ${Math.max(0, target.shields)}%`, 485 + ox, 380 + oy);
      } else {
        ctx.fillStyle = '#666';
        ctx.fillText('KEIN KONTAKT', 485 + ox, 368 + oy);
      }
      ctx.restore();
    },

    drawReticle(ctx) {
      if (ASSETS.reticle && ASSETS.reticle.complete) {
        const rw = ASSETS.reticle.width || 64;
        const rh = ASSETS.reticle.height || 64;
        ctx.drawImage(ASSETS.reticle, CX - rw / 2, CY - rh / 2, rw, rh);
      } else {
        // Fallback Fadenkreuz
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(CX, CY, 16, 0, Math.PI * 2);
        ctx.moveTo(CX - 24, CY); ctx.lineTo(CX - 16, CY);
        ctx.moveTo(CX + 16, CY); ctx.lineTo(CX + 24, CY);
        ctx.moveTo(CX, CY - 24); ctx.lineTo(CX, CY - 16);
        ctx.moveTo(CX, CY + 16); ctx.lineTo(CX, CY + 24);
        ctx.stroke();
      }
    },

    drawCockpit(ctx) {
      if (ASSETS.cockpit && ASSETS.cockpit.complete) {
        // Hornet Cockpit Front mit G-Force Verschiebung
        const drawX = Player.cockpitShiftX;
        const drawY = Player.cockpitShiftY;
        ctx.drawImage(ASSETS.cockpit, drawX, drawY, W, H);
      }
    }
  };

  // --- GAME CONTROLLER ---
  const Game = {
    spawnEnemies() {
      Enemies.init();
    },
    cycleTarget() {
      Player.targetIndex = (Player.targetIndex + 1) % Enemies.list.length;
      Comms.post(`ZIELSYSTEM: Wechsel auf Feind #${Enemies.list[Player.targetIndex].id}`);
    },
    toggleCRT() {
      const overlay = document.getElementById('crt-overlay');
      const btn = document.getElementById('btn-crt');
      if (overlay) {
        const hidden = overlay.style.display === 'none';
        overlay.style.display = hidden ? '' : 'none';
        if (btn) btn.classList.toggle('active', hidden);
      }
    },
    triggerLaunch() {
      Player.speed = Player.afterburnerSpeed;
      Player.isAfterburning = true;
      Enemies.init();
      Comms.post('STARTRÖHRE: Katapultstart von TCS Fax-Tragödie abgeschlossen!');
    },
    triggerLand() {
      Player.speed = 2;
      Player.isAfterburning = false;
      Comms.post('FLUGLEITUNG: Magnet-Fangnetz aktiv. Willkommen zurück auf der TCS Fax-Tragödie.');
    },
    toggleFullscreen() {
      const vp = document.getElementById('viewport') || document.documentElement;
      if (!document.fullscreenElement && vp.requestFullscreen) vp.requestFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // --- MAIN LOOP ---
  function initGame() {
    Input.init();
    Stars.init();
    Enemies.init();

    Comms.post('SYSTEM BEREIT. Nadir-Trägerleitstand verbunden.');
    Comms.post('SECHS: Ich bin an deinen Triebwerken. Mach keinen Blödsinn.');

    function loop() {
      // 1. Logik Updates
      Player.update();
      Stars.update(Player.speed, Player.yawRate, Player.pitchRate);
      Lasers.update();
      Particles.update();
      Enemies.update(Player.speed, Player.yawRate, Player.pitchRate);
      Comms.update();

      // 2. Rendering
      ctx.fillStyle = '#020307';
      ctx.fillRect(0, 0, W, H);

      // 3D Welt im Cockpit-Fenster
      Stars.draw(ctx);
      Enemies.draw(ctx);
      Lasers.draw(ctx);
      Particles.draw(ctx);

      // HUD & Cockpit Overlay
      HUD.drawTargeting(ctx);
      HUD.drawReticle(ctx);
      HUD.drawCockpit(ctx);
      HUD.drawRadar(ctx);
      HUD.drawMFD(ctx);
      Comms.draw(ctx);

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

})();
