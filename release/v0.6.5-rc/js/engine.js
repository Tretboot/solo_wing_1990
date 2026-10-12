// ===== SOLO WING 1990 — 3D ENGINE =====
// Flat perspective + Z-sort + Star Field with parallax.
SW.Engine = {
  stars: [],
  project(x, y, z) {
    if (z <= 0.1) return null;
    return { sx: (x/z)*SW.FOCAL + SW.CX, sy: (y/z)*SW.FOCAL + SW.CY, scale: SW.FOCAL/z };
  },
  zSort(objs) { return objs.slice().sort((a,b) => b.z - a.z); },
  initStars() {
    this.stars = [];
    for (let i = 0; i < SW.STAR_COUNT; i++) {
      this.stars.push({ x: (Math.random()-0.5)*1000, y: (Math.random()-0.5)*600, z: 1+Math.random()*499 });
    }
  },
  updateStars() {
    for (const s of this.stars) {
      s.z -= SW.STAR_SPEED;
      if (s.z < 1) { s.z = 500; s.x = (Math.random()-0.5)*1000; s.y = (Math.random()-0.5)*600; }
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
  }
};
