// ===== SOLO WING 1990 — 3D ENGINE =====
// Flat perspective + Z-sort + Star Field with parallax.
//
// VIEW-MODES (v0.6.9-dev, Taste [V]):
//   'cockpit' — 1. Person: HUD/Fadenkreuz, eigenes Schiff unsichtbar.
//   'chase'   — 3. Person: Schiffssprite unten (Rückenansicht), weiter Winkel.
//   'topdown' — Arcade: flache 2D-Ebene, Z-Achse auf Y-Achse (vorn = oben).
// Zentraler State: SW.Engine.view. screenPos() ist der EINZIGE view-aware
// Projections-Einstiegspunkt der Render-Pipeline (Physik bleibt unangetastet).
SW.Engine = {
  stars: [],
  topStars: [],

  // ===== VIEW STATE =====
  view: {
    mode: 'cockpit',
    focal: SW.FOCAL,       // perspektivische Brennweite (pro Modus)
    chaseFocal: 92,        // chase: weiter Winkel
    top: {                 // topdown: Mapping-Parameter (flache 2D-Ebene)
      xScale: 0.55, yScale: 0.30, zScale: 0.36,
      shipX: SW.CX, shipY: SW.H - 52
    }
  },
  viewName() {
    const v = this.view.mode;
    return v === 'cockpit' ? 'COCKPIT' : v === 'chase' ? 'VERFOLGUNG' : 'VOGEL';
  },
  setView(mode) {
    if (mode !== 'cockpit' && mode !== 'chase' && mode !== 'topdown') return;
    this.view.mode = mode;
    this.view.focal = (mode === 'chase') ? this.view.chaseFocal : SW.FOCAL;
  },
  nextView() {
    const order = ['cockpit', 'chase', 'topdown'];
    this.setView(order[(order.indexOf(this.view.mode) + 1) % order.length]);
    return this.view.mode;
  },

  // ===== PROJEKTION =====
  // IM RAUM (v0.75-dev): Die Kamera steht am Spieler — Perspektiven-Modi
  // projizieren RELATIV (die Welt rutscht beim Driften nach hinten).
  // Topdown projiziert ohnehin relativ (projectTop).
  project(x, y, z) {
    const p = SW.Player;
    const rx = x - (p ? p.x : 0), ry = y - (p ? p.y : 0), rz = z - (p ? p.z : 0);
    if (rz <= 0.1) return null;
    const f = this.view.focal;
    return { sx: (rx/rz)*f + SW.CX, sy: (ry/rz)*f + SW.CY, scale: f/rz };
  },
  // Top-Down: Z → Y (Distanz = hoch im Bild), X → X, Y als Fein-Offset
  projectTop(x, y, z) {
    const t = this.view.top, p = SW.Player;
    const dz = z - p.z;
    return {
      sx: t.shipX + (x - p.x) * t.xScale,
      sy: t.shipY - dz * t.zScale + (y - p.y) * t.yScale,
      scale: Math.max(0.35, 1 - dz / 600)
    };
  },
  // View-aware Einstiegspunkt für die Render-Pipeline
  screenPos(x, y, z) {
    return (this.view.mode === 'topdown') ? this.projectTop(x, y, z) : this.project(x, y, z);
  },
  zSort(objs) { return objs.slice().sort((a,b) => b.z - a.z); },

  spaceDust: [],

  initStars() {
    this.stars = [];
    for (let i = 0; i < SW.STAR_COUNT; i++) {
      this.stars.push({
        x: (Math.random() - 0.5) * 1000,
        y: (Math.random() - 0.5) * 600,
        z: 1 + Math.random() * 499
      });
    }
    this.spaceDust = [];
    for (let i = 0; i < 42; i++) {
      this.spaceDust.push({
        x: (Math.random() - 0.5) * 340,
        y: (Math.random() - 0.5) * 220,
        z: 4 + Math.random() * 210,
        isDebris: i < 8,
        debrisType: i % 2
      });
    }
    this.topStars = [];
    for (let i = 0; i < 70; i++) {
      this.topStars.push({ x: Math.random() * SW.W, y: Math.random() * SW.H, s: Math.random() < 0.3 ? 2 : 1 });
    }
  },
  // IM RAUM (v0.85): Echtes 3D-Raumfluggefühl mit Winkel-Sweep beim Einlenken + Nahbereichs-Raumstaub/Debris!
  updateStars() {
    const p = SW.Player;
    const rawFwd = (p && Number.isFinite(p.speed)) ? p.speed : 0;
    const fwd = Math.max(SW.STAR_SPEED, rawFwd);
    const flow = Math.min(fwd, 12);
    const vx = (p && p.vx) || 0, vy = (p && p.vy) || 0;
    for (const s of this.stars) {
      s.z -= flow;
      // Strong angular yaw/pitch sweep + depth parallax so steering rotates the cosmos
      const angularSweep = 3.2 + (s.z / 500) * 5.8;
      s.x -= vx * angularSweep;
      s.y -= vy * angularSweep;
      if (s.z < 1) {
        s.z = 500;
        s.x = (Math.random() - 0.5) * 1000;
        s.y = (Math.random() - 0.5) * 600;
      }
      if (s.x > 550) s.x -= 1100; else if (s.x < -550) s.x += 1100;
      if (s.y > 350) s.y -= 700; else if (s.y < -350) s.y += 700;
    }
    if (this.spaceDust) {
      const dustFlow = Math.max(2.2, flow * 2.9);
      for (const d of this.spaceDust) {
        d.z -= dustFlow;
        d.x -= vx * 6.5;
        d.y -= vy * 6.5;
        if (d.z < 2) {
          d.z = 190 + Math.random() * 35;
          d.x = (Math.random() - 0.5) * 320;
          d.y = (Math.random() - 0.5) * 210;
        }
        if (d.x > 190) d.x -= 380; else if (d.x < -190) d.x += 380;
        if (d.y > 130) d.y -= 260; else if (d.y < -130) d.y += 260;
      }
    }
  },
  renderStars(ctx, playerX, playerY) {
    const player = SW.Player;
    const burning = !!(player && player.burning);
    const spd = (player && Number.isFinite(player.speed)) ? player.speed : 1.5;
    const vx = (player && player.vx) || 0;
    const vy = (player && player.vy) || 0;

    // Dezenter Sektor-Nebel & Horizont-Drift im tiefen Raum
    if (ctx.save && ctx.arc && ctx.restore) {
      const sysCol = (SW.World && SW.World.systemInfo) ? (SW.World.systemInfo().farbe || '#3366ff') : '#3366ff';
      ctx.save();
      ctx.fillStyle = sysCol;
      ctx.globalAlpha = 0.05;
      ctx.beginPath();
      ctx.arc(SW.CX - playerX * 0.28 - vx * 6, SW.CY - 18 - playerY * 0.28 - vy * 6, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(180,220,255,0.65)';
    ctx.lineWidth = 1;
    for (const s of this.stars) {
      const px = s.x - playerX * 0.65;
      const py = s.y - playerY * 0.65;
      const p = this.project(
        px + (player ? player.x : 0),
        py + (player ? player.y : 0),
        s.z + (player ? player.z : 0)
      );
      if (p && p.sx >= 0 && p.sx < SW.W && p.sy >= 0 && p.sy < SW.H) {
        const bright = s.z < 160 ? 2 : 1;
        ctx.fillStyle = s.z < 120 ? '#ffffff' : (s.z < 300 ? '#cbd8e6' : '#7a8a99');
        ctx.fillRect(Math.round(p.sx), Math.round(p.sy), bright, 1);
        if ((burning || spd > 2.1 || Math.hypot(vx, vy) > 0.8) && s.z < 360 && ctx.beginPath && ctx.moveTo && ctx.lineTo && ctx.stroke) {
          const streakZ = burning ? 22 : Math.min(14, spd * 3.2);
          const pTail = this.project(
            px + vx * 2.2 + (player ? player.x : 0),
            py + vy * 2.2 + (player ? player.y : 0),
            s.z + streakZ + (player ? player.z : 0)
          );
          if (pTail) {
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(pTail.sx, pTail.sy);
            ctx.stroke();
          }
        }
      }
    }

    // 3D Space Dust & WCUnity Micro-Debris rushing past the canopy for true 3D motion feel!
    if (this.spaceDust && this.spaceDust.length) {
      const vfx = (SW.Sprites && SW.Sprites.vfx) || {};
      for (const d of this.spaceDust) {
        const dx = d.x - playerX * 0.85;
        const dy = d.y - playerY * 0.85;
        const p = this.project(
          dx + (player ? player.x : 0),
          dy + (player ? player.y : 0),
          d.z + (player ? player.z : 0)
        );
        if (!p || p.sx < -16 || p.sx > SW.W + 16 || p.sy < -16 || p.sy > SW.H + 16) continue;
        const debImg = d.debrisType === 0 ? vfx.debris01 : vfx.debris02;
        if (d.isDebris && debImg && debImg._ready && ctx.drawImage && d.z < 160) {
          const sz = Math.max(3, Math.min(18, Math.round(9 * p.scale)));
          ctx.drawImage(debImg, Math.round(p.sx - sz / 2), Math.round(p.sy - sz / 2), sz, sz);
        } else if (ctx.beginPath && ctx.moveTo && ctx.lineTo && ctx.stroke) {
          const pTail = this.project(
            dx + vx * 2.8 + (player ? player.x : 0),
            dy + vy * 2.8 + (player ? player.y : 0),
            d.z + Math.max(6, spd * 4.5) + (player ? player.z : 0)
          );
          ctx.strokeStyle = d.z < 75 ? 'rgba(150, 230, 255, 0.78)' : 'rgba(110, 175, 220, 0.45)';
          if (pTail) {
            ctx.beginPath();
            ctx.moveTo(p.sx, p.sy);
            ctx.lineTo(pTail.sx, pTail.sy);
            ctx.stroke();
          } else {
            ctx.fillStyle = '#99ddff';
            ctx.fillRect(Math.round(p.sx), Math.round(p.sy), 1, 1);
          }
        }
      }
    }

    // 3D Nav Waypoint / Jump Gate Buoy in Space
    if (SW.Autopilot && Array.isArray(SW.Autopilot.navPoints) && player && ctx.drawImage) {
      const vfx = (SW.Sprites && SW.Sprites.vfx) || {};
      const navImg = (vfx.navLight && vfx.navLight._ready) ? vfx.navLight : null;
      for (let i = 0; i < SW.Autopilot.navPoints.length; i++) {
        const np = SW.Autopilot.navPoints[i];
        if (!np || np.z === undefined) continue;
        const dz = np.z - player.z;
        if (dz <= 10 || dz > 900) continue;
        const proj = this.project(np.x || 0, np.y || 0, np.z);
        if (!proj || proj.sx < 0 || proj.sx > SW.W || proj.sy < 0 || proj.sy > SW.H) continue;
        const pulse = 0.75 + 0.25 * Math.sin(((SW.Game && SW.Game.frame) || 0) * 0.14 + i);
        const bSize = Math.max(6, Math.min(28, Math.round(20 * proj.scale * pulse)));
        if (navImg) {
          ctx.drawImage(navImg, Math.round(proj.sx - bSize / 2), Math.round(proj.sy - bSize / 2), bSize, bSize);
        } else {
          ctx.fillStyle = '#00e5ff';
          ctx.fillRect(Math.round(proj.sx - 2), Math.round(proj.sy - 2), 4, 4);
        }
      }
    }

    ctx.fillStyle = '#fff';
  },
  // Top-Down-Sterne: statisches Feld, scrollt nach unten (Flug nach vorne)
  renderStarsTopDown(ctx) {
    const off = ((SW.Game && SW.Game.frame) || 0) * (SW.Player && SW.Player.burning ? 0.65 : 0.25);
    ctx.fillStyle = '#888';
    for (const s of this.topStars) {
      const y = (s.y + off) % SW.H;
      ctx.fillRect(Math.round(s.x), Math.round(y), s.s, SW.Player && SW.Player.burning ? s.s + 1 : s.s);
    }
  }
};
