// ===== SOLO WING 1990 — SPRITE & MULTI-ANGLE ATLAS SYSTEM =====
// Supports 3 live-switchable graphics modes via [G]:
//   1. 'wingnut_hd'   — 80-view (16 yaw × 5 pitch) pixel-art atlases + 340×220 WCUnity/Custom cockpits
//   2. 'amiga_vga'    — 40-view (8 yaw × 5 pitch) integer /2 downscaled Amiga/VGA sprites & cockpits
//   3. 'classic_1990' — Original 16×16 procedural canvas sprites & classic procedural cockpit frame
SW.Sprites = {
  enemy: null, playerShip: null, playerShipTop: null, carrier: null, cockpitFrame: null,
  shipVariants: {},

  // Multi-angle atlases, clean distance mipmaps & runtime palette-shifted variants
  graphicsMode: 'wingnut_hd', // 'wingnut_hd' | 'amiga_vga' | 'classic_1990'
  atlases: {},
  amigaAtlases: {},
  mipAtlases: {}, // key -> [{ cell: 64, img }, { cell: 32, img }, { cell: 20, img }]
  cockpits: {},
  vfx: {},
  assetsLoaded: 0,
  assetsTotal: 0,

  ATLAS_SPECS: {
    hornet:         { src: 'sprites/ships/hornet.png',         cell: 64, cols: 16, rows: 5, baseSize: 42 },
    // Eigene Atlanten aus tools/build_wingnut_assets.py. Früher wurden hier Kilrathi-Rümpfe
    // (grikath/strakha) nur umgefärbt — dadurch erschien z.B. beim "Willkommen an Bord"
    // ein Kilrathi-Träger statt der TCS Fax-Tragödie. paletteFrom nur noch für echte Farbvarianten.
    hornet_ace:     { src: 'sprites/ships/hornet_ace.png',     cell: 64, cols: 16, rows: 5, baseSize: 42 },
    scimitar:       { src: 'sprites/ships/scimitar.png',       cell: 64, cols: 16, rows: 5, baseSize: 46 },
    valtar:         { src: 'sprites/ships/valtar.png',         cell: 64, cols: 16, rows: 5, baseSize: 46 },
    talon:          { src: 'sprites/ships/talon.png',          cell: 64, cols: 16, rows: 5, baseSize: 40 },
    talon_pirate:   { src: 'sprites/ships/talon.png',          cell: 64, cols: 16, rows: 5, baseSize: 40, paletteFrom: 'talon',    hueShift: 82,  satMult: 1.28, valMult: 1.04 },
    dralthi:        { src: 'sprites/ships/dralthi.png',        cell: 64, cols: 16, rows: 5, baseSize: 46 },
    dralthi_ace:    { src: 'sprites/ships/dralthi.png',        cell: 64, cols: 16, rows: 5, baseSize: 46, paletteFrom: 'dralthi',  hueShift: -24, satMult: 1.30, valMult: 1.05 },
    salthi:         { src: 'sprites/ships/salthi.png',         cell: 64, cols: 16, rows: 5, baseSize: 40 },
    salthi_ace:     { src: 'sprites/ships/salthi.png',         cell: 64, cols: 16, rows: 5, baseSize: 40, paletteFrom: 'salthi',   hueShift: -28, satMult: 1.35, valMult: 1.05 },
    krant:          { src: 'sprites/ships/krant.png',          cell: 64, cols: 16, rows: 5, baseSize: 48 },
    strakha:        { src: 'sprites/ships/strakha.png',        cell: 64, cols: 16, rows: 5, baseSize: 44 },
    grikath:        { src: 'sprites/ships/grikath.png',        cell: 96, cols: 16, rows: 5, baseSize: 72 },
    fax_traegodie:  { src: 'sprites/ships/fax_traegodie.png',  cell: 96, cols: 16, rows: 5, baseSize: 124 },
    hermes_carrier: { src: 'sprites/ships/hermes_carrier.png', cell: 96, cols: 16, rows: 5, baseSize: 124 },
    hermes_drone:   { src: 'sprites/ships/hermes_drone.png',   cell: 64, cols: 16, rows: 5, baseSize: 42 },
    freighter:      { src: 'sprites/ships/freighter.png',      cell: 64, cols: 16, rows: 5, baseSize: 52 }
  },

  // Build crisp distance-filtered mipmap levels (cell -> cell/2 -> cell/3) with alpha snap
  // so 320x200 nearest-neighbor canvas rendering never shreds thin wings or outlines at medium/far range!
  _buildMipChain(key, sourceCanvasOrImg, baseCell) {
    try {
      const mips = [{ cell: baseCell, img: sourceCanvasOrImg }];
      const mipCells = baseCell >= 96 ? [48, 32, 20] : [32, 22, 14];
      for (const mc of mipCells) {
        const mw = mc * 16, mh = mc * 5;
        const c = document.createElement('canvas');
        c.width = mw; c.height = mh;
        const s = c.getContext('2d');
        s.imageSmoothingEnabled = true;
        if ('imageSmoothingQuality' in s) s.imageSmoothingQuality = 'high';
        s.drawImage(sourceCanvasOrImg, 0, 0, mw, mh);
        // Snap semi-transparent edge alpha back to crisp pixel-art silhouette
        if (s.getImageData && s.putImageData) {
          const id = s.getImageData(0, 0, mw, mh);
          const d = id.data;
          for (let i = 0; i < d.length; i += 4) {
            const a = d[i + 3];
            if (a >= 84) {
              if (a < 245) {
                const sc = 255 / a;
                d[i]     = Math.min(255, Math.round(d[i] * sc));
                d[i + 1] = Math.min(255, Math.round(d[i + 1] * sc));
                d[i + 2] = Math.min(255, Math.round(d[i + 2] * sc));
              }
              d[i + 3] = 255;
            } else {
              d[i + 3] = 0;
            }
          }
          s.putImageData(id, 0, 0);
        }
        c._ready = true;
        mips.push({ cell: mc, img: c });
      }
      this.mipAtlases[key] = mips;
      this.amigaAtlases[key] = mips[1].img;
    } catch (e) { /* ignore in headless Node stub */ }
  },

  // Runtime Palette Shifting: generate faction/squadron/ace color variants from 1 base sprite!
  createPaletteVariant(baseImg, hueShiftDeg = 90, satMult = 1.15, valMult = 1.0) {
    try {
      const w = baseImg.width, h = baseImg.height;
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const s = c.getContext('2d');
      s.drawImage(baseImg, 0, 0);
      if (!s.getImageData || !s.putImageData) { c._ready = true; return c; }
      const id = s.getImageData(0, 0, w, h);
      const d = id.data;
      const hShift = ((hueShiftDeg % 360) + 360) % 360 / 360;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3] < 40) continue;
        const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        const delta = max - min;
        const sat = max === 0 ? 0 : delta / max;
        // Shift colored hull panels while keeping neutral grey metal & orange engine glow natural
        if (sat > 0.14) {
          let hue = 0;
          if (delta > 0) {
            if (max === r) hue = ((g - b) / delta) % 6;
            else if (max === g) hue = (b - r) / delta + 2;
            else hue = (r - g) / delta + 4;
            hue /= 6;
            if (hue < 0) hue += 1;
          }
          hue = (hue + hShift) % 1;
          const newSat = Math.max(0, Math.min(1, sat * satMult));
          const newVal = Math.max(0, Math.min(1, max * valMult));
          const cChroma = newVal * newSat;
          const xVal = cChroma * (1 - Math.abs(((hue * 6) % 2) - 1));
          const m = newVal - cChroma;
          let nr = 0, ng = 0, nb = 0;
          const h6 = hue * 6;
          if (h6 < 1)      { nr = cChroma; ng = xVal; nb = 0; }
          else if (h6 < 2) { nr = xVal; ng = cChroma; nb = 0; }
          else if (h6 < 3) { nr = 0; ng = cChroma; nb = xVal; }
          else if (h6 < 4) { nr = 0; ng = xVal; nb = cChroma; }
          else if (h6 < 5) { nr = xVal; ng = 0; nb = cChroma; }
          else             { nr = cChroma; ng = 0; nb = xVal; }
          d[i]     = Math.round((nr + m) * 255);
          d[i + 1] = Math.round((ng + m) * 255);
          d[i + 2] = Math.round((nb + m) * 255);
        }
      }
      s.putImageData(id, 0, 0);
      c._ready = true;
      return c;
    } catch (e) {
      return baseImg;
    }
  },

  _tintCanvas: null,
  _tintCtx: null,

  init() {
    this.createEnemy();
    this.createPlayerShip();
    this.createPlayerShipTop();
    this.createCarrier();
    this.createCockpitFrame();
    this.createShipVariants();
    try {
      this._tintCanvas = document.createElement('canvas');
      this._tintCanvas.width = 128;
      this._tintCanvas.height = 128;
      this._tintCtx = this._tintCanvas.getContext('2d');
    } catch (e) { /* ignore in headless env */ }
    this.loadExternalAssets();
  },

  graphicsModeLabel() {
    if (this.graphicsMode === 'wingnut_hd') return 'KOMPAKT 80-VIEW (64px)';
    if (this.graphicsMode === 'amiga_vga') return 'KOMPAKT AMIGA /2 (32px)';
    return 'KOMPAKT 80-VIEW';
  },

  cycleGraphicsMode() {
    // Switch cleanly between the two compact multi-angle pixel-art modes (no 16x16 Urgrafiken in cycle)
    const order = ['wingnut_hd', 'amiga_vga'];
    const idx = order.indexOf(this.graphicsMode);
    this.graphicsMode = order[(idx + 1) % order.length];
    return this.graphicsMode;
  },

  loadExternalAssets() {
    if (typeof Image === 'undefined') return; // Headless / Node smoke test environment
    const loadImg = (src, onReady) => {
      this.assetsTotal++;
      const img = new Image();
      img.onload = () => {
        img._ready = true;
        this.assetsLoaded++;
        if (onReady) onReady(img);
      };
      img.onerror = () => { img._failed = true; };
      img.src = src;
      return img;
    };

    // Load base 80-view ship atlases, build 3-level crisp mipmaps, and generate palette-shifted variants
    const deferredVariants = [];
    for (const [key, spec] of Object.entries(this.ATLAS_SPECS)) {
      if (spec.paletteFrom) {
        deferredVariants.push([key, spec]);
        continue;
      }
      this.atlases[key] = loadImg(spec.src, (img) => {
        this._buildMipChain(key, img, spec.cell);
        // Generate any palette-shifted variants that depend on this base hull sprite
        for (const [vKey, vSpec] of deferredVariants) {
          if (vSpec.paletteFrom === key) {
            const shifted = this.createPaletteVariant(img, vSpec.hueShift || 0, vSpec.satMult || 1, vSpec.valMult || 1);
            this.atlases[vKey] = shifted;
            this._buildMipChain(vKey, shifted, vSpec.cell);
          }
        }
      });
    }
    // Also load direct fallback for any variant whose base wasn't queued
    for (const [vKey, vSpec] of deferredVariants) {
      if (!this.ATLAS_SPECS[vSpec.paletteFrom]) {
        this.atlases[vKey] = loadImg(vSpec.src, (img) => this._buildMipChain(vKey, img, vSpec.cell));
      }
    }

    // Load all 9 cockpits with full front, damaged, and RGBA left/right weapon-flash overlays
    const cockpitKeys = ['hornet', 'valtar', 'dralthi', 'krant', 'salthi', 'strakha', 'scimitar', 'freighter', 'hermes'];
    for (const ck of cockpitKeys) {
      this.cockpits[ck] = {
        front: loadImg(`sprites/cockpits/${ck}_front.png`),
        damaged: loadImg(`sprites/cockpits/${ck}_damaged.png`),
        leftGun: loadImg(`sprites/cockpits/${ck}_left_gun.png`),
        rightGun: loadImg(`sprites/cockpits/${ck}_right_gun.png`)
      };
    }
    this.cockpits.joystick = loadImg('sprites/cockpits/terran_joystick.png');
    this.cockpits.joystickFire = loadImg('sprites/cockpits/terran_joystick_fire.png');
    this.cockpits.kilrathiJoystick = loadImg('sprites/cockpits/kilrathi_joystick.png');
    this.cockpits.kilrathiJoystickFire = loadImg('sprites/cockpits/kilrathi_joystick_fire.png');
    this.cockpits.throttle = loadImg('sprites/cockpits/terran_throttle.png');

    // Load VFX, brackets, debris/asteroids, nav lights & weapon bolts
    this.vfx.explodeStrip = loadImg('sprites/vfx/explode_strip.png');
    this.vfx.reticleHornet = loadImg('sprites/vfx/reticle_hornet.png');
    this.vfx.reticleDralthi = loadImg('sprites/vfx/reticle_dralthi.png');
    this.vfx.reticleValtar = loadImg('sprites/vfx/reticle_valtar.png');
    this.vfx.bracketDefault = loadImg('sprites/vfx/human_bracket_default.png');
    this.vfx.bracketLock = loadImg('sprites/vfx/human_bracket_lock.png');
    this.vfx.bracketSel = loadImg('sprites/vfx/human_bracket_sel.png');
    this.vfx.kilrathiBracketDefault = loadImg('sprites/vfx/kilrathi_bracket_default.png');
    this.vfx.kilrathiBracketLock = loadImg('sprites/vfx/kilrathi_bracket_lock.png');
    this.vfx.debris01 = loadImg('sprites/vfx/debris01.png');
    this.vfx.debris02 = loadImg('sprites/vfx/debris02.png');
    this.vfx.navLight = loadImg('sprites/vfx/nav_light.png');
    this.vfx.shieldImpact = loadImg('sprites/vfx/shield_impact.png');
    this.vfx.engineFlare = loadImg('sprites/vfx/engine_flare.png');
    this.vfx.engineFlareAb = loadImg('sprites/vfx/engine_flare_ab.png');
    this.vfx.glowOrb = loadImg('sprites/vfx/glow_orb.png');
    this.vfx.muzzleFlash = loadImg('sprites/vfx/muzzle_flash.png');
    this.vfx.photonBlast = loadImg('sprites/vfx/photon_blast.png');
    this.vfx.mesonBolt = loadImg('sprites/vfx/meson_bolt.png');
  },

  getCarrierAtlasKey() {
    const pid = (SW.World && SW.World.postingId) || 'fax-traegodie';
    if (pid === 'tcs-hermes') return 'hermes_carrier';
    if (pid === 'test-destroyer') return 'fax_traegodie';
    if (pid === 'outpost-31') return 'freighter';
    return 'fax_traegodie';
  },

  mapShipIdToAtlas(shipId, isCivilian) {
    if (isCivilian) return 'freighter';
    const map = {
      d_b: 'dralthi',
      dralthi_ace: 'dralthi_ace',
      'Jäger': 'salthi',
      salthi_ace: 'salthi_ace',
      Kreuzer: 'krant',
      piraten_jaeger: 'talon_pirate',
      piraten_kapitaen: 'grikath',
      einheit: 'strakha',
      hermes_drone: 'hermes_drone',
      hermes: 'hermes_drone',
      hermes_carrier: 'hermes_carrier',
      jaeger: 'hornet',
      hornet_ace: 'hornet_ace',
      frachter: 'freighter',
      bomber: 'scimitar',
      ueberlegenheit: 'valtar',
      hornet: 'hornet',
      scimitar: 'scimitar',
      valtar: 'valtar',
      talon: 'talon',
      talon_pirate: 'talon_pirate',
      dralthi: 'dralthi',
      salthi: 'salthi',
      krant: 'krant',
      strakha: 'strakha',
      grikath: 'grikath',
      freighter: 'freighter',
      fax_traegodie: 'fax_traegodie'
    };
    return map[shipId] || 'dralthi';
  },

  // Exact Camera-Space Spherical Coordinate Sprite Picker
  // Maps viewing vector (dx, dy, dz) from ship to camera + ship (heading, pitchAngle)
  // onto our 16-column × 5-row (80-view) or 8-column × 5-row (40-view Amiga) atlas:
  //   col 0  = Exact Front (nose at camera)
  //   col 4  = Starboard / Right Profile (nose pointing right on screen)
  //   col 8  = Exact Rear (engines at camera, nose pointing into screen)
  //   col 12 = Port / Left Profile (nose pointing left on screen)
  //   row 0..1 = Dorsal Top View (ship below camera or diving down)
  //   row 2    = Level Equator View
  //   row 3..4 = Ventral Belly View (ship above camera or climbing up)
  getAngleCoords(dx = 0, dy = 0, dz, heading, pitchAngle, isAmiga = (this.graphicsMode === 'amiga_vga')) {
    // Direct UI / angle call signature: (yawAngle, pitchAngle, [isAmiga])
    if (typeof dz === 'boolean' || typeof dz === 'undefined' || typeof heading === 'undefined') {
      const amiga = (typeof dz === 'boolean') ? dz : isAmiga;
      const yawAngle = Number.isFinite(dx) ? dx : 0;
      const pAngle = Number.isFinite(dy) ? dy : 0;
      const twoPi = Math.PI * 2;
      const step = twoPi / 16;
      let normTheta = yawAngle + step * 0.5;
      while (normTheta < 0) normTheta += twoPi;
      while (normTheta >= twoPi) normTheta -= twoPi;
      let col = Math.floor(normTheta / step) % 16;
      if (amiga) col = (col >> 1) << 1;
      const pitchNorm = (Math.PI / 2 - Math.max(-1.3, Math.min(1.3, pAngle))) / Math.PI;
      const row = Math.max(0, Math.min(4, Math.round(pitchNorm * 4)));
      return { col, row };
    }

    const dist = Math.hypot(dx, dy, dz);
    if (dist < 0.001) return { col: 0, row: 2 };

    // Line-of-sight vector from camera to ship (+vx = ship is right of center, +vy = ship is below center, +vz = ship is ahead)
    const vxView = -dx / dist;
    const vyView = -dy / dist;
    const vzView = Math.max(0.05, -dz / dist);

    // Ship 3D forward vector in camera space (+fx = nose right, +fz = nose away into screen)
    const h = Number.isFinite(heading) ? heading : 0;
    const p = Number.isFinite(pitchAngle) ? pitchAngle : 0;
    const cosP = Math.cos(p);
    const fx = Math.sin(h) * cosP;
    const fz = Math.cos(h) * cosP;

    // Account for horizontal perspective offset across the field of view
    const viewYaw = Math.atan2(vxView, vzView) * 0.42;
    const cosV = Math.cos(viewYaw), sinV = Math.sin(viewYaw);
    const relFx = fx * cosV - fz * sinV;
    const relFz = fx * sinV + fz * cosV;

    // Azimuth angle theta: 0 = nose toward camera (-relFz > 0), +PI/2 = nose right (+relFx > 0), PI = nose away (+relFz > 0)
    const theta = Math.atan2(relFx, -relFz);
    const twoPi = Math.PI * 2;
    const step = twoPi / 16;
    let normTheta = theta + step * 0.5;
    while (normTheta < 0) normTheta += twoPi;
    while (normTheta >= twoPi) normTheta -= twoPi;

    let col = Math.floor(normTheta / step) % 16;
    if (isAmiga) col = (col >> 1) << 1; // Snap to 8 yaw angles (40 views total)

    // Elevation angle: +dorsalView = seeing top of ship (row 0..1), -dorsalView = seeing belly of ship (row 3..4)
    const viewElev = Math.atan2(vyView, vzView);
    const dorsalView = viewElev * 1.15 - p * 0.85;
    let row = Math.round(2 - dorsalView * 2.35);
    row = Math.max(0, Math.min(4, row));

    // Zwischenstufen / Sub-Angle Interpolation für flüssige Drehungen zwischen den 16 diskreten Winkeln
    const colCenter = col * step + step * 0.5;
    let diff = normTheta - colCenter;
    while (diff > Math.PI) diff -= twoPi;
    while (diff < -Math.PI) diff += twoPi;
    const subAngle = isAmiga ? 0 : Math.max(-0.16, Math.min(0.16, diff * 0.45));

    return { col, row, subAngle };
  },

  // Compute dynamic illumination from nearby weapon fire & explosions on a 3D world position
  computeDynamicLight(wx, wy, wz) {
    let bestAlpha = 0;
    let bestColor = null;
    if (SW.Projectiles && SW.Projectiles.list) {
      for (let i = 0; i < SW.Projectiles.list.length; i++) {
        const pr = SW.Projectiles.list[i];
        const distSq = (pr.x - wx) * (pr.x - wx) + (pr.y - wy) * (pr.y - wy) + (pr.z - wz) * (pr.z - wz);
        if (distSq < 4200) { // within ~65m
          const a = (1 - Math.sqrt(distSq) / 65) * 0.58;
          if (a > bestAlpha) {
            bestAlpha = a;
            bestColor = pr.color || (pr.friendly ? '#ff5522' : '#44ff77');
          }
        }
      }
    }
    if (SW.Explosions && SW.Explosions.list) {
      for (let i = 0; i < SW.Explosions.list.length; i++) {
        const ex = SW.Explosions.list[i];
        const distSq = (ex.x - wx) * (ex.x - wx) + (ex.y - wy) * (ex.y - wy) + (ex.z - wz) * (ex.z - wz);
        if (distSq < 19600) { // within ~140m
          const life = 1 - (ex.frame / (SW.EXPLOSION_FRAMES || 20));
          const a = (1 - Math.sqrt(distSq) / 140) * life * 0.72;
          if (a > bestAlpha) {
            bestAlpha = a;
            bestColor = '#ffaa33';
          }
        }
      }
    }
    return bestAlpha > 0.04 ? { color: bestColor, alpha: Math.min(0.68, bestAlpha) } : null;
  },

  drawMultiAngle(ctx, atlasKey, sx, sy, scale, dx, dy, dz, heading, pitchAngle, fallbackSprite, customBaseSize, lightInfo) {
    const spec = this.ATLAS_SPECS[atlasKey];
    const isAmiga = this.graphicsMode === 'amiga_vga';
    const isClassic = this.graphicsMode === 'classic_1990';
    let atlasImg = isAmiga ? (this.amigaAtlases[atlasKey] || this.atlases[atlasKey]) : this.atlases[atlasKey];

    // Detect 8/9-arg UI/Turntable/Cutscene call: (ctx, key, sx, sy, pixelSize, yawAngle, pitchAngle, tintColor, fallbackSprite)
    const isDirectAngleCall = (typeof dz === 'string') || (typeof heading === 'undefined' && typeof dz === 'undefined');
    const isPreviewOrUI = isDirectAngleCall || (customBaseSize !== undefined && (!SW.Game || SW.Game.state !== 'COCKPIT'));

    if (!isClassic && spec && atlasImg && atlasImg._ready && ctx.drawImage && atlasImg.width > 0) {
      let col = 0, row = 2, renderSize = 24;
      let subRot = 0;
      if (isDirectAngleCall) {
        const yawAngle = Number.isFinite(dx) ? dx : 0;
        const pAngle = Number.isFinite(dy) ? dy : 0;
        const twoPi = Math.PI * 2;
        const step = twoPi / 16;
        let normTheta = yawAngle + step * 0.5;
        while (normTheta < 0) normTheta += twoPi;
        while (normTheta >= twoPi) normTheta -= twoPi;
        col = Math.floor(normTheta / step) % 16;
        if (isAmiga) col = (col >> 1) << 1;
        const pitchNorm = (Math.PI / 2 - Math.max(-1.3, Math.min(1.3, pAngle))) / Math.PI;
        row = Math.max(0, Math.min(4, Math.round(pitchNorm * 4)));
        renderSize = Math.round(scale);
      } else {
        const coords = this.getAngleCoords(dx, dy, dz, heading, pitchAngle, isAmiga);
        col = coords.col;
        row = coords.row;
        // In UI/Turntable or static mode, subRot remains 0 to eliminate all jitter/wobble
        subRot = (!isClassic && !isPreviewOrUI && coords && coords.subAngle && Math.abs(coords.subAngle) > 0.012) ? coords.subAngle : 0;
        const bw = customBaseSize || spec.baseSize || 42;
        renderSize = Math.round(bw * scale);
      }

      if (isAmiga) renderSize = Math.max(2, (renderSize >> 1) << 1);
      if (renderSize < 2) return true;
      // Cap extreme close-up screen size so sprites stay sharp
      renderSize = Math.min(240, renderSize);

      // Select the cleanest distance mipmap level so 320x200 nearest-neighbor draw never shreds thin wings!
      let cell = (isAmiga && this.amigaAtlases[atlasKey]) ? (spec.cell >> 1) : spec.cell;
      const mips = this.mipAtlases && this.mipAtlases[atlasKey];
      if (mips && mips.length > 1) {
        if (isAmiga) {
          const m = mips[renderSize <= 22 ? 2 : 1] || mips[1];
          atlasImg = m.img;
          cell = m.cell;
        } else {
          let chosen = mips[0];
          for (let i = 1; i < mips.length; i++) {
            if (renderSize <= mips[i].cell * 1.25) chosen = mips[i];
          }
          atlasImg = chosen.img;
          cell = chosen.cell;
        }
      }

      const drawX = Math.round(sx - renderSize / 2);
      const drawY = Math.round(sy - renderSize / 2);

      // Sub-angle rotation: Zwischenstufen für flüssige Drehungen
      if (Math.abs(subRot) > 0.012 && ctx.save && ctx.rotate) {
        ctx.save();
        ctx.translate(Math.round(sx), Math.round(sy));
        ctx.rotate(subRot);
        if (lightInfo && lightInfo.alpha > 0.04 && this._tintCanvas && this._tintCtx && cell <= 128) {
          const tc = this._tintCtx;
          tc.clearRect(0, 0, cell, cell);
          tc.globalCompositeOperation = 'source-over';
          tc.globalAlpha = 1;
          tc.drawImage(atlasImg, col * cell, row * cell, cell, cell, 0, 0, cell, cell);
          tc.globalCompositeOperation = 'source-atop';
          tc.fillStyle = lightInfo.color;
          tc.globalAlpha = lightInfo.alpha;
          tc.fillRect(0, 0, cell, cell);
          tc.globalCompositeOperation = 'source-over';
          tc.globalAlpha = 1;
          ctx.drawImage(this._tintCanvas, 0, 0, cell, cell, -Math.round(renderSize / 2), -Math.round(renderSize / 2), renderSize, renderSize);
        } else {
          ctx.drawImage(
            atlasImg,
            col * cell, row * cell, cell, cell,
            -Math.round(renderSize / 2), -Math.round(renderSize / 2),
            renderSize, renderSize
          );
        }
        ctx.restore();
      } else {
        // Apply dynamic weapon-fire / explosion tinting on ship silhouette if present
        if (lightInfo && lightInfo.alpha > 0.04 && this._tintCanvas && this._tintCtx && cell <= 128) {
          const tc = this._tintCtx;
          tc.clearRect(0, 0, cell, cell);
          tc.globalCompositeOperation = 'source-over';
          tc.globalAlpha = 1;
          tc.drawImage(atlasImg, col * cell, row * cell, cell, cell, 0, 0, cell, cell);
          tc.globalCompositeOperation = 'source-atop';
          tc.fillStyle = lightInfo.color;
          tc.globalAlpha = lightInfo.alpha;
          tc.fillRect(0, 0, cell, cell);
          tc.globalCompositeOperation = 'source-over';
          tc.globalAlpha = 1;
          ctx.drawImage(this._tintCanvas, 0, 0, cell, cell, drawX, drawY, renderSize, renderSize);
        } else {
          ctx.drawImage(
            atlasImg,
            col * cell, row * cell, cell, cell,
            drawX, drawY,
            renderSize, renderSize
          );
        }
      }
      return true;
    }

    // Fallback to procedural 1990 canvas sprite (e.g. in headless Node tests)
    const fb = isDirectAngleCall ? heading : fallbackSprite;
    if (fb) {
      const fbScale = isDirectAngleCall ? Math.max(0.5, scale / 24) : scale;
      this.draw(ctx, fb, sx, sy, fbScale, customBaseSize ? Math.round(customBaseSize * 0.65) : 16);
      return true;
    }
    return false;
  },

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

  // ===== PROZEDURALE SCHIFFS-VARIANTEN (Fallback & Classic 1990 Mode) =====
  createShipVariants() {
    // --- d_b: Delta-Flügel + Ball/Turm in der Mitte ---
    let c = document.createElement('canvas'); c.width=16; c.height=16;
    let s = c.getContext('2d');
    s.fillStyle='#ff3333'; s.fillRect(7,1,2,14);
    s.fillStyle='#ff6600';
    s.beginPath(); s.moveTo(2,12); s.lineTo(7,4); s.lineTo(12,12); s.closePath(); s.fill();
    s.beginPath(); s.moveTo(14,12); s.lineTo(9,4); s.lineTo(4,12); s.closePath(); s.fill();
    s.fillStyle='#00ccff'; s.fillRect(6,5,4,3);
    s.fillStyle='#ffff00'; s.fillRect(6,13,4,2);
    this.shipVariants['d_b'] = c;

    // --- Kreuzer: breit, flach, massig ---
    c = document.createElement('canvas'); c.width=16; c.height=16;
    s = c.getContext('2d');
    s.fillStyle='#445566'; s.fillRect(1,6,14,5);
    s.fillStyle='#556677'; s.fillRect(3,4,10,4);
    s.fillStyle='#667788'; s.fillRect(6,2,4,4);
    s.fillStyle='#00ccff'; s.fillRect(7,3,2,2);
    s.fillStyle='#ff6600'; s.fillRect(2,11,3,2); s.fillRect(11,11,3,2);
    s.fillStyle='#00ff00'; s.fillRect(1,8,1,1); s.fillRect(14,8,1,1);
    this.shipVariants['Kreuzer'] = c;

    // --- Jäger: schmal, spitz, agil ---
    c = document.createElement('canvas'); c.width=16; c.height=16;
    s = c.getContext('2d');
    s.fillStyle='#3366ff'; s.fillRect(7,1,2,13);
    s.fillStyle='#6699ff'; s.fillRect(6,3,4,3);
    s.fillStyle='#3366ff';
    s.fillRect(4,9,3,2); s.fillRect(9,9,3,2);
    s.fillStyle='#00ccff'; s.fillRect(7,2,2,2);
    s.fillStyle='#ff6600'; s.fillRect(6,13,2,2); s.fillRect(8,13,2,2);
    s.fillStyle='#ffff00'; s.fillRect(7,14,1,2); s.fillRect(8,14,1,2);
    this.shipVariants['Jäger'] = c;

    // --- Piraten-Jäger ---
    c = document.createElement('canvas'); c.width=16; c.height=16;
    s = c.getContext('2d');
    s.fillStyle='#ff4422'; s.fillRect(7,1,2,13);
    s.fillStyle='#ff6633'; s.fillRect(6,3,4,3);
    s.fillStyle='#ff4422';
    s.fillRect(3,8,4,3); s.fillRect(9,9,4,2);
    s.fillStyle='#00ccff'; s.fillRect(7,2,2,2);
    s.fillStyle='#ffff00'; s.fillRect(5,13,2,2); s.fillRect(9,13,2,2);
    s.fillStyle='#ffcc00'; s.fillRect(4,6,1,1); s.fillRect(11,7,1,1);
    s.fillStyle='#ffffff'; s.fillRect(3,5,2,1);
    this.shipVariants['piraten_jaeger'] = c;

    // --- Piraten-Kapitänsschiff ---
    c = document.createElement('canvas'); c.width=20; c.height=20;
    s = c.getContext('2d');
    s.fillStyle='#ff6633'; s.fillRect(9,1,2,16);
    s.fillStyle='#ff4422'; s.fillRect(7,3,6,4);
    s.fillStyle='#ff6633';
    s.fillRect(3,8,5,4); s.fillRect(12,9,5,3);
    s.fillStyle='#888'; s.fillRect(16,10,2,1);
    s.fillStyle='#00ccff'; s.fillRect(9,2,2,2);
    s.fillStyle='#ffcc00'; s.fillRect(4,14,3,2); s.fillRect(13,14,3,2);
    s.fillStyle='#ff0000'; s.fillRect(2,6,1,1); s.fillRect(17,7,1,1);
    s.fillStyle='#ffffff'; s.fillRect(5,5,3,1);
    s.fillStyle='#ffff00'; s.fillRect(9,17,2,2);
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
    s.fillStyle = '#8899aa'; s.fillRect(4, 12, 56, 10);
    s.fillStyle = '#aabbcc'; s.fillRect(8, 8, 48, 5);
    s.fillStyle = '#99aabb'; s.fillRect(44, 2, 14, 12);
    s.fillStyle = '#bbccdd'; s.fillRect(48, 0, 8, 4);
    s.fillStyle = '#00ccff'; s.fillRect(46, 4, 10, 3);
    s.fillStyle = '#ffcc00'; s.fillRect(10, 16, 20, 1); s.fillRect(34, 16, 10, 1);
    s.fillStyle = '#556677'; s.fillRect(10, 14, 8, 5); s.fillRect(20, 14, 8, 5);
    s.fillStyle = '#00ff00';
    for (let i = 0; i < 8; i++) s.fillRect(6 + i * 7, 22, 1, 1);
    s.fillStyle = '#ff0000'; s.fillRect(4, 12, 2, 2);
    s.fillStyle = '#00ff00'; s.fillRect(58, 12, 2, 2);
    s.fillStyle = '#ff6600'; s.fillRect(4, 14, 3, 3); s.fillRect(57, 14, 3, 3);
    s.fillStyle = '#ccddff'; s.fillRect(52, 0, 1, 4);
    this.carrier = c;
  },

  createCockpitFrame() {
    const c = document.createElement('canvas');
    c.width = SW.W; c.height = SW.H;
    const s = c.getContext('2d');
    const steel = '#536777', darkSteel = '#293a47', lightSteel = '#8297a8';
    const panel = '#111c25';

    s.fillStyle = '#263642'; s.fillRect(0, 0, SW.W, 16);
    s.fillStyle = lightSteel; s.fillRect(0, 0, SW.W, 2);
    s.fillStyle = darkSteel; s.fillRect(0, 14, SW.W, 2);
    s.fillStyle = '#72d7e8'; s.font = '6px monospace';
    s.fillText('FLUG', 6, 10); s.fillText('HP', 69, 10);
    s.fillText('LASER', 142, 10); s.fillText('UNIT', 242, 10);
    s.fillStyle = '#0f0';
    for (let i=0;i<5;i++) s.fillRect(31+i*6, 5, 4, 6);
    for (let i=0;i<5;i++) s.fillRect(83+i*6, 5, 4, 6);
    s.fillStyle = '#ffdc58';
    for (let i=0;i<3;i++) s.fillRect(177+i*8, 5, 6, 6);

    s.fillStyle = steel; s.fillRect(0, 16, 3, 130); s.fillRect(SW.W-3, 16, 3, 130);
    s.fillStyle = darkSteel; s.fillRect(66, 16, 3, 131); s.fillRect(251, 16, 3, 131);
    s.fillStyle = '#718594'; s.fillRect(0, 143, SW.W, 4);
    s.fillStyle = '#a4b8c6'; s.fillRect(68, 16, 183, 1);
    s.strokeStyle = 'rgba(140,170,190,0.45)'; s.lineWidth = 1;
    s.beginPath(); s.moveTo(0, 18); s.lineTo(18, 34); s.lineTo(18, 42); s.stroke();
    s.beginPath(); s.moveTo(SW.W, 18); s.lineTo(SW.W-18, 34); s.lineTo(SW.W-18, 42); s.stroke();

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

    s.fillStyle = '#475b68'; s.fillRect(155, 190, 10, 7);
    s.fillStyle = '#333'; s.fillRect(158, 183, 4, 8);
    s.fillStyle = '#d8483d'; s.fillRect(157, 181, 6, 4);

    this.cockpitFrame = c;
  },

  draw(ctx, sprite, sx, sy, scale, baseWidth) {
    if (!sprite) return;
    const bw = baseWidth || 16;
    const size = bw * scale;
    if (size < 1) return;
    const aspect = (sprite.height && sprite.width) ? (sprite.height / sprite.width) : 1;
    const w = Math.round(size), h = Math.round(w * aspect);
    ctx.drawImage(sprite, Math.round(sx-w/2), Math.round(sy-h/2), w, h);
  }
};
