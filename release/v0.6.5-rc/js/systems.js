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
// Takeoff: carrier starts close (z=80), moves far (z=300). Player ship at z=10.
// Landing: carrier starts far (z=300), moves close (z=80).
SW.Flight = {
  mode:null, progress:0, duration:180,
  carrierStartZ:80, carrierEndZ:300,

  start(mode) {
    this.mode=mode; this.progress=0;
    SW.Carrier.visible=true;
    if (mode==='takeoff') {
      this.carrierStartZ=80; this.carrierEndZ=300;
    } else {
      this.carrierStartZ=300; this.carrierEndZ=80;
    }
    SW.Audio.playEngine();
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
  },

  complete() {
    const wasTakeoff=this.mode==='takeoff';
    this.mode=null;
    SW.Carrier.visible=false;
    SW.Player.z=0; SW.Player.x=0; SW.Player.y=0;
    if (wasTakeoff) SW.Game.setState('COCKPIT');
    else SW.Game.startHangar();  // Landung → Hangar (Bolt kommentiert) → Träger
  },

  render(ctx) {
    if (!this.mode) return;
    // Carrier (in front of camera, positive z) — groß + prominent
    SW.Carrier.render(ctx);
    // Player ship: von hinten, unten Mitte
    const shipZ=25;
    const p=SW.Engine.project(0, 18, shipZ);
    if (p) {
      SW.Sprites.draw(ctx, SW.Sprites.playerShip, p.sx, p.sy, p.scale*1.8);
    }
    // Autopilot text
    ctx.fillStyle='#0f0'; ctx.font='7px monospace'; ctx.textAlign='center';
    ctx.fillText('[ AUTOPILOT ENGAGIERT ]',SW.CX,SW.H-55);
    ctx.textAlign='left';
  }
};
