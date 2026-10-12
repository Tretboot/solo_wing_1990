// ===== SOLO WING 1990 — SYSTEMS =====
// Collision, Autopilot, Flight (takeoff/landing)

SW.Collision = {
  firstKillDone:false,shieldLowWarned:false,
  reset(){this.firstKillDone=false;this.shieldLowWarned=false;},
  check(frame) {
    const projs=SW.Projectiles.list;
    for (let i=projs.length-1;i>=0;i--) {
      const p=projs[i];
      if (p.friendly) {
        for (const e of SW.Enemies.list) {
          if (!e.alive) continue;
          const dx=p.x-e.x,dy=p.y-e.y,dz=p.z-e.z;
          if (dx*dx+dy*dy+dz*dz<SW.COLLISION_DIST*SW.COLLISION_DIST) {
            e.hp-=SW.LASER_DAMAGE; projs.splice(i,1);
            if (e.hp<=0) {
              e.alive=false; SW.Game.score+=100;
              SW.Explosions.add(e.x,e.y,e.z);
              if (!this.firstKillDone) { this.firstKillDone=true; SW.Comm.add("COMMANDER: Erster Abschuss. Angemerktes Notat."); }
            }
            break;
          }
        }
      } else {
        const dx=p.x-SW.Player.x,dy=p.y-SW.Player.y,dz=p.z-SW.Player.z;
        if (dx*dx+dy*dy+dz*dz<SW.COLLISION_DIST*SW.COLLISION_DIST) {
          projs.splice(i,1);
          SW.Player.takeHit(p.damage||SW.ENEMY_LASER_DAMAGE,p.z>0,frame);
          if (!this.shieldLowWarned&&(SW.Player.frontShield<30||SW.Player.rearShield<30)) {
            this.shieldLowWarned=true;
            SW.Comm.add("COMMANDER: Abschirmladung unter dreißig. Wir drücken die Daumen.");
          }
          if (!SW.Player.alive) {
            SW.Comm.add("COMMANDER: Verlust bestätigt. Wir aktualisieren die Ehrentafel.");
            SW.Game.triggerDeath();
          }
        }
      }
    }
  }
};

SW.Autopilot = {
  active:false,target:null,navPoints:[],currentNavIndex:0,
  init(nps){this.active=false;this.target=null;this.navPoints=nps||[];this.currentNavIndex=0;},
  toggle() {
    if (this.navPoints.length===0) return;
    this.active=!this.active;
    if (this.active) { this.nextWaypoint(); SW.Comm.add("[AUTOPILOT] Engagiert. Ziel: WP-"+(this.currentNavIndex)); }
    else { SW.Player.autopilot=false;SW.Player.autopilotTarget=null;SW.Comm.add("[AUTOPILOT] Getrennt."); }
  },
  nextWaypoint() {
    if (this.currentNavIndex<this.navPoints.length) {
      this.target=this.navPoints[this.currentNavIndex];
      SW.Player.autopilot=true;
      SW.Player.autopilotTarget={x:this.target.x,y:this.target.y};
      this.currentNavIndex++;
    } else { this.active=false;SW.Player.autopilot=false;SW.Player.autopilotTarget=null; }
  },
  update() {
    if (!this.active) return;
    if (SW.Player.autopilotTarget) {
      const dx=SW.Player.x-SW.Player.autopilotTarget.x;
      const dy=SW.Player.y-SW.Player.autopilotTarget.y;
      if (Math.sqrt(dx*dx+dy*dy)<SW.AUTOPILOT_TOLERANCE) this.nextWaypoint();
    }
  }
};

// ===== FLIGHT (Takeoff / Landing) =====
// Carrier is ALWAYS at positive z (in front of camera).
//
// TAKEOFF = LAUNCH-TUBE-Cinematic (WC-Stil, v0.6.9-dev):
//   Phase A (progress < 0.6): Startrohr — Ringe (Rippen) + Streben +
//   Lichterketten entstehen am Fluchtpunkt in der Mitte und fließen
//   beschleunigt an die Bildschirmränder (Z-Achse-Skalierung: je näher
//   der Kamera, desto größer). Schiff zentriert, Triebwerk-Wackeln.
//   Phase B (progress >= 0.6): Freigang — Sterne + Träger, am Ende
//   weißer Exit-Flash (Schiff bricht ins offene All aus).
// LANDING: Carrier startet weit (z=300), kommt nah (z=80), Schiff von hinten.
// Cinematic erzwingt die Standard-Fokaldistanz und stellt sie danach wieder her.
SW.Flight = {
  mode:null, progress:0, duration:210,
  carrierStartZ:80, carrierEndZ:300,
  TUBE_LEN:120, TUBE_R:26,
  tubeRings:[], tubeLights:[],
  _savedFocal:null,

  start(mode) {
    this.mode=mode; this.progress=0;
    this._savedFocal=SW.Engine.view.focal;
    SW.Engine.view.focal=SW.FOCAL;  // Cinematic: Standard-Perspektive
    SW.Carrier.visible=true;
    if (mode==='takeoff') {
      this.carrierStartZ=80; this.carrierEndZ=300;
      this.initTube();
    } else {
      this.carrierStartZ=300; this.carrierEndZ=80;
    }
    SW.Audio.playEngine();
  },

  initTube() {
    this.tubeRings=[];
    for (let i=0;i<12;i++) this.tubeRings.push({ z: 8+(i/12)*this.TUBE_LEN, s: i%2===0 });
    this.tubeLights=[];
    for (let i=0;i<48;i++) {
      this.tubeLights.push({
        a: (i/48)*Math.PI*2 + Math.random()*0.3,
        r: 0.75 + Math.random()*0.22,
        z: 5 + Math.random()*this.TUBE_LEN
      });
    }
  },

  update() {
    if (!this.mode) return;
    this.progress+=1/this.duration;
    if (this.progress>=1) { this.progress=1; this.complete(); return; }
    // Ease in/out
    const t=this.progress<0.5?2*this.progress*this.progress:1-Math.pow(-2*this.progress+2,2)/2;
    // Carrier moves
    SW.Carrier.z=this.carrierStartZ+(this.carrierEndZ-this.carrierStartZ)*t;
    SW.Carrier.x=0; SW.Carrier.y=10;
    // Röhre: Ringe + Lichter fließen zur Kamera, mit Beschleunigung (+ Freigang-Burst)
    if (this.mode==='takeoff') {
      const speed = 2.5 + 16*t + (t>0.6 ? (t-0.6)*22 : 0);
      for (const r of this.tubeRings) { r.z-=speed; if (r.z<2) r.z+=this.TUBE_LEN; }
      for (const l of this.tubeLights) { l.z-=speed*0.85; if (l.z<2) l.z+=this.TUBE_LEN; }
    }
  },

  complete() {
    const wasTakeoff=this.mode==='takeoff';
    this.mode=null;
    SW.Carrier.visible=false;
    SW.Player.z=0; SW.Player.x=0; SW.Player.y=0;
    if (this._savedFocal) { SW.Engine.view.focal=this._savedFocal; this._savedFocal=null; }
    if (wasTakeoff) SW.Game.setState('COCKPIT');
    else SW.Game.startHangar();  // Landung → Hangar (Bolt kommentiert) → Träger
  },

  render(ctx) {
    if (!this.mode) return;
    if (this.mode==='takeoff') { this.renderTube(ctx); return; }
    // LANDING: Sterne + Carrier + Schiff von hinten
    SW.Engine.renderStars(ctx, SW.Player.x, SW.Player.y);
    SW.Carrier.render(ctx);
    const p=SW.Engine.project(0, 18, 25);
    if (p) {
      SW.Sprites.draw(ctx, SW.Sprites.playerShip, p.sx, p.sy, p.scale*1.8);
    }
  },

  // Launch-Tube (Takeoff)
  renderTube(ctx) {
    const t=this.progress;
    const frame=(SW.Game&&SW.Game.frame)||0;
    const exitT = t<0.6 ? 0 : (t-0.6)/0.4;  // 0..1 im Freigang
    const focal=SW.FOCAL;
    // Phase B: Sterne + Träger (Freigang)
    if (exitT>0) {
      ctx.globalAlpha=Math.min(1, exitT*2);
      SW.Engine.renderStars(ctx, 0, 0);
      ctx.globalAlpha=1;
      if (exitT>0.25) SW.Carrier.render(ctx);
    }
    // Phase A + Anfang B: Röhre
    if (exitT<1) {
      // Austritts-Blende (helles Loch am Ende der Röhre)
      const exitRad = 5 + exitT*70;
      const g = ctx.createRadialGradient(SW.CX, SW.CY, 0, SW.CX, SW.CY, Math.max(1, exitRad));
      g.addColorStop(0, '#cfe8ff');
      g.addColorStop(1, 'rgba(30,60,90,0)');
      ctx.fillStyle=g;
      ctx.beginPath(); ctx.arc(SW.CX, SW.CY, Math.max(1, exitRad), 0, Math.PI*2); ctx.fill();
      // Ringe (Rippen): vom Fluchtpunkt zu den Rändern (Z-Skalierung)
      for (const r of this.tubeRings) {
        const rad = (focal*this.TUBE_R)/r.z;
        if (rad<4 || rad>1400) continue;
        const depth = 1 - r.z/this.TUBE_LEN;  // 0 weit → 1 nah
        const alpha = 0.15 + depth*0.65;
        ctx.strokeStyle='rgba(90,170,220,'+alpha.toFixed(2)+')';
        ctx.lineWidth=Math.max(1, 1+depth*2.5);
        ctx.beginPath();
        ctx.ellipse(SW.CX, SW.CY, rad, rad*0.82, 0, 0, Math.PI*2);
        ctx.stroke();
        // Streben (alle zweiten Ringe: 4 Rippen nach außen)
        if (r.s) {
          ctx.strokeStyle='rgba(60,120,160,'+(alpha*0.7).toFixed(2)+')';
          ctx.lineWidth=Math.max(1, depth*2);
          for (let k=0;k<4;k++) {
            const a = k*Math.PI/2 + Math.PI/4;
            ctx.beginPath();
            ctx.moveTo(SW.CX+Math.cos(a)*rad*0.98, SW.CY+Math.sin(a)*rad*0.80);
            ctx.lineTo(SW.CX+Math.cos(a)*rad*1.22, SW.CY+Math.sin(a)*rad*1.00);
            ctx.stroke();
          }
        }
      }
      // Lichterketten (Lichter an der Röhrenwand)
      for (const l of this.tubeLights) {
        const rad = (focal*this.TUBE_R*l.r)/l.z;
        if (rad<3 || rad>1200) continue;
        const x = SW.CX+Math.cos(l.a)*rad;
        const y = SW.CY+Math.sin(l.a)*rad*0.82;
        if (x<-4 || x>SW.W+4 || y<-4 || y>SW.H+4) continue;
        const depth = 1 - l.z/this.TUBE_LEN;
        ctx.fillStyle = (frame>>3)%2===0
          ? 'rgba(160,220,255,'+(0.2+depth*0.8).toFixed(2)+')'
          : 'rgba(90,150,200,'+(0.15+depth*0.6).toFixed(2)+')';
        ctx.fillRect(Math.round(x), Math.round(y), 1+depth, 1+depth);
      }
    }
    // Spielerschiff: zentriert, Triebwerk-Wackeln + Glow
    const wobX = Math.sin(frame*0.35)*2 + Math.sin(frame*0.13)*1.5;
    const wobY = Math.cos(frame*0.27)*1.5 + exitT*6;
    const sx = SW.CX+wobX, sy = SW.CY+10+wobY;
    const glow = 4 + Math.random()*3 + exitT*6;
    ctx.fillStyle='rgba(255,150,50,'+(0.35+Math.random()*0.25).toFixed(2)+')';
    ctx.beginPath(); ctx.arc(sx, sy+10, glow, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,220,120,'+(0.4+Math.random()*0.3).toFixed(2)+')';
    ctx.beginPath(); ctx.arc(sx, sy+9, glow*0.5, 0, Math.PI*2); ctx.fill();
    SW.Sprites.draw(ctx, SW.Sprites.playerShip, sx, sy, 1.7+exitT*0.2);
    // Exit-Flash (letzte 7%: Bruch ins offene All)
    if (t>0.93) {
      ctx.fillStyle='rgba(255,255,255,'+Math.min(1, (t-0.93)/0.07).toFixed(2)+')';
      ctx.fillRect(0, 0, SW.W, SW.H);
    }
  }
};
