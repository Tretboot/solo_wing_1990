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

  initStars() {
    this.stars = [];
    for (let i = 0; i < SW.STAR_COUNT; i++) {
      this.stars.push({ x: (Math.random()-0.5)*1000, y: (Math.random()-0.5)*600, z: 1+Math.random()*499 });
    }
    this.topStars = [];
    for (let i = 0; i < 70; i++) {
      this.topStars.push({ x: Math.random()*SW.W, y: Math.random()*SW.H, s: Math.random() < 0.3 ? 2 : 1 });
    }
  },
  // IM RAUM (v0.75-dev): Sternen-Flow = Vorschub des Spielers (Speed-Gefühl),
  // lateral: Sterne gleiten in die Gegenrichtung des Drifts (Parallax:
  // nah = stärker, weit = schwächer).
  updateStars() {
    const p = SW.Player;
    const fwd = (p && p.speed) ? p.speed : SW.STAR_SPEED;
    const vx = (p && p.vx) || 0, vy = (p && p.vy) || 0;
    for (const s of this.stars) {
      s.z -= fwd;
      const par = 0.25 + (s.z/500)*0.75;
      s.x -= vx * SW.STAR_LATERAL * par;
      s.y -= vy * SW.STAR_LATERAL * par;
      if (s.z < 1) { s.z = 500; s.x = (Math.random()-0.5)*1000; s.y = (Math.random()-0.5)*600; }
      if (s.x > 550) s.x -= 1100; else if (s.x < -550) s.x += 1100;
      if (s.y > 350) s.y -= 700; else if (s.y < -350) s.y += 700;
    }
  },
  renderStars(ctx, playerX, playerY) {
    ctx.fillStyle = '#fff';
    for (const s of this.stars) {
      // Parallax: stars shift opposite to player movement
      const px = s.x - playerX * 0.5;
      const py = s.y - playerY * 0.5;
      const p = this.project(px, py, s.z);
      if (p && p.sx >= 0 && p.sx < SW.W && p.sy >= 0 && p.sy < SW.H) {
        ctx.fillRect(Math.round(p.sx), Math.round(p.sy), 1, 1);
      }
    }
  },
  // Top-Down-Sterne: statisches Feld, scrollt nach unten (Flug nach vorne)
  renderStarsTopDown(ctx) {
    const off = ((SW.Game && SW.Game.frame) || 0) * 0.25;
    ctx.fillStyle = '#888';
    for (const s of this.topStars) {
      const y = (s.y + off) % SW.H;
      ctx.fillRect(Math.round(s.x), Math.round(y), s.s, s.s);
    }
  }
};
