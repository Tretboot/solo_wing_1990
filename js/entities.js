// ===== SOLO WING 1990 — ENTITIES =====
SW.Player = {
  x:0,y:0,z:0,vx:0,vy:0,speed:0,burning:false,
  frontShield:SW.SHIELD_MAX,rearShield:SW.SHIELD_MAX,
  frontLastHit:-999,rearLastHit:-999,laserCooldown:0,alive:true,
  systems:null,_systemDamageIndex:0,_weaponsOfflineReported:false,
  autopilot:false,autopilotTarget:null,
  rollAngle:0,
  defaultSystems() { return {engines:100,weapons:100,shields:100,sensors:100}; },
  isValidSystems(systems) {
    return systems !== null && typeof systems === 'object' && !Array.isArray(systems) &&
      ['engines','weapons','shields','sensors'].every(key =>
        systems[key] === undefined || (typeof systems[key] === 'number' &&
          Number.isFinite(systems[key]) && systems[key] >= 0 && systems[key] <= 100));
  },
  shieldCapacity() {
    return SW.SHIELD_MAX * (0.5 + 0.5 * ((this.systems && this.systems.shields) || 0) / 100);
  },
  init() {
    this.x=0;this.y=0;this.z=0;this.vx=0;this.vy=0;
    this.speed=SW.FORWARD_BASE;this.burning=false;
    if (!SW.World.shipSystems || !this.isValidSystems(SW.World.shipSystems)) {
      SW.World.shipSystems=this.defaultSystems();
    }
    for (const key of ['engines','weapons','shields','sensors']) {
      if (SW.World.shipSystems[key] === undefined) SW.World.shipSystems[key]=100;
    }
    this.systems=SW.World.shipSystems;
    this.frontShield=this.shieldCapacity();this.rearShield=this.shieldCapacity();
    this.frontLastHit=-999;this.rearLastHit=-999;this.laserCooldown=0;
    this.alive=true;this.autopilot=false;this.autopilotTarget=null;
    this.rollAngle=0;this._systemDamageIndex=0;this._weaponsOfflineReported=false;
  },
  update(frame) {
    if (!this.alive) return;
    let ix=0,iy=0;
    const sh = SW.Input.keys['ShiftLeft']||SW.Input.keys['ShiftRight'];
    // Rollen (Q/E): reine Sicht-Rotation, federt in Ruhe zurück zur Mitte
    if (SW.Input.keys['KeyQ']) this.rollAngle -= SW.ROLL_SPEED;
    if (SW.Input.keys['KeyE']) this.rollAngle += SW.ROLL_SPEED;
    if (!SW.Input.keys['KeyQ'] && !SW.Input.keys['KeyE']) this.rollAngle *= SW.ROLL_DECAY;
    if (Math.abs(this.rollAngle) < 0.005) this.rollAngle = 0;
    this.rollAngle = Math.max(-SW.ROLL_MAX, Math.min(SW.ROLL_MAX, this.rollAngle));
    // Autopilot: fliegt zum nächsten Nav-Punkt (IM RAUM, NAV).
    // FLYBY-Animation (WC1-Autopilot): auf der Ausstreckung (z noch lang,
    // oder Seitenstrecke noch groß) Nachbrenner — die Bank entsteht aus
    // der Seitengeschwindigkeit (BANK_FACTOR), also sieht die Kurve aus.
    this.burnAuto=false;
    if (this.autopilot && this.autopilotTarget) {
      const t=this.autopilotTarget;
      const dx=t.x-this.x, dy=t.y-this.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if (dist > SW.AUTOPILOT_TOLERANCE) {
        ix=(dx/dist); iy=(dy/dist);
        const zLeft=(t.z!==undefined)?(t.z-this.z):0;
        this.burnAuto = zLeft>400 || dist>90;
      } else { this.autopilot=false; this.autopilotTarget=null; }
    }
    // Manual thrust overrides autopilot
    const move=SW.Input.getThrust();
    if (move.x!==0||move.y!==0) { this.autopilot=false;this.autopilotTarget=null;this.burnAuto=false;ix=move.x;iy=move.y; }
    // IM RAUM (v0.75-dev): Vorschub — Cruise oder Nachbrenner [SHIFT]
    // (und Autopilot-Flyby). Sterne + Motor-Sound + HUD spiegeln wider.
    this.burning = !!sh || this.burnAuto;
    const engineOutput = 0.65 + 0.35 * this.systems.engines / 100;
    const tSpd = (this.burning ? SW.FORWARD_BURN : SW.FORWARD_BASE) * engineOutput;
    this.speed += (tSpd - this.speed) * SW.FORWARD_ACCEL;
    this.z += this.speed;
    // Inertial: thrust adds to velocity, drag slows down (space drift)
    this.vx += ix * SW.PLAYER_THRUST;
    this.vy += iy * SW.PLAYER_THRUST;
    this.vx *= SW.PLAYER_DRAG;
    this.vy *= SW.PLAYER_DRAG;
    // Clamp speed
    const spd=Math.sqrt(this.vx*this.vx+this.vy*this.vy);
    if (spd>SW.PLAYER_MAX_SPEED) { this.vx=(this.vx/spd)*SW.PLAYER_MAX_SPEED; this.vy=(this.vy/spd)*SW.PLAYER_MAX_SPEED; }
    this.x+=this.vx; this.y+=this.vy;
    this.x=Math.max(-SW.PLAYER_MAX_X,Math.min(SW.PLAYER_MAX_X,this.x));
    this.y=Math.max(-SW.PLAYER_MAX_Y,Math.min(SW.PLAYER_MAX_Y,this.y));
    const shieldCapacity=this.shieldCapacity();
    if (frame-this.frontLastHit>SW.SHIELD_REGEN_DELAY&&this.frontShield<shieldCapacity) this.frontShield=Math.min(shieldCapacity,this.frontShield+1);
    if (frame-this.rearLastHit>SW.SHIELD_REGEN_DELAY&&this.rearShield<shieldCapacity) this.rearShield=Math.min(shieldCapacity,this.rearShield+1);
    if (this.laserCooldown>0) this.laserCooldown--;
    if (SW.Input.getFirePressed()&&this.laserCooldown<=0) { this.fire(); this.laserCooldown=SW.LASER_COOLDOWN; }
  },
  fire() {
    if (this.systems.weapons<=0) {
      if (!this._weaponsOfflineReported) {
        SW.Comm.add('SYSTEM: Waffensteuerung ausgefallen. Reparatur im Hangar erforderlich.');
        this._weaponsOfflineReported=true;
      }
      return;
    }
    const slots=SW.Input.getLaserSlots(), dir=SW.Input.getAimDirection();
    for (let i=0;i<slots;i++) {
      const spread=(i-(slots-1)/2)*0.05, dx=dir.x+spread, dy=dir.y;
      const len=Math.sqrt(dx*dx+dy*dy+dir.z*dir.z);
      // IM RAUM: Startposition = Weltkoordinate des Spielers (Kamera steht am Spieler)
      const damage=SW.LASER_DAMAGE*(0.5+0.5*this.systems.weapons/100);
      SW.Projectiles.add({x:this.x,y:this.y,z:this.z+1,dx:dx/len,dy:dy/len,dz:dir.z/len,speed:SW.LASER_SPEED,friendly:true,damage,life:100});
    }
    SW.Audio.playLaser();
  },
  damageSystem(amount) {
    const keys=['engines','weapons','shields','sensors'];
    const key=keys[this._systemDamageIndex%keys.length];
    this._systemDamageIndex++;
    const previous=this.systems[key];
    this.systems[key]=Math.max(0,previous-Math.max(1,Math.round(amount)));
    if (previous>50&&this.systems[key]<=50) {
      const labels={engines:'ANTRIEB',weapons:'WAFFEN',shields:'SCHILDE',sensors:'SENSOREN'};
      SW.Comm.add('SYSTEM: '+labels[key]+' beschädigt. Status '+this.systems[key]+'%.');
    }
    if (key==='shields') {
      const capacity=this.shieldCapacity();
      this.frontShield=Math.min(this.frontShield,capacity);
      this.rearShield=Math.min(this.rearShield,capacity);
    }
    return key;
  },
  repairSystems() {
    for (const key of ['engines','weapons','shields','sensors']) this.systems[key]=100;
    this.frontShield=SW.SHIELD_MAX;this.rearShield=SW.SHIELD_MAX;
    this._weaponsOfflineReported=false;
  },
  takeHit(dmg,isFront,frame) {
    if (isFront) { this.frontShield-=dmg; this.frontLastHit=frame; }
    else { this.rearShield-=dmg; this.rearLastHit=frame; }
    this.damageSystem(Math.max(1,Math.round(dmg*1.5)));
    SW.Audio.playShieldHit();
    if (this.frontShield<=0||this.rearShield<=0) this.alive=false;
  }
};

// ===== SHIP REGISTRY (Phase 3) =====
// Verknüpft Sprite + Flug-KI. NoThink Code lieferte Struktur,
// Commander hat ms→Frames konvertiert (System arbeitet in Frames).
// IM RAUM (v0.75-dev): range = bevorzugte Kampf-Distanz (relatives z, px),
// burst = Schuss-Salvenlänge. Drohnen (range 0) fliegen gradeaus —
// Selbstmörder. Jäger halten Distanz (WC1-Manöver: approach/strafe/break).
SW.ShipRegistry = {
  d_b:     { sprite:'d_b',     ai:'drone',       speed:1.5, hp:50,  fireMin:60,  fireMax:90,  damage:10, pattern:'straight', strafeAmp:0,   strafeFreq:0, range:0,   burst:1 },
  'Jäger': { sprite:'Jäger',   ai:'interceptor', speed:2.5, hp:30,  fireMin:40,  fireMax:70,  damage:8,  pattern:'strafe',   strafeAmp:60,  strafeFreq:0.05, range:90,  burst:2 },
  Kreuzer: { sprite:'Kreuzer', ai:'bomber',      speed:0.8, hp:120, fireMin:150, fireMax:250, damage:25, pattern:'slow',     strafeAmp:0,   strafeFreq:0, range:200, burst:1 },
  // ===== PIRATEN (Vertical Slice) =====
  // Selbstmörderisch. Unterlegene Schiffe. Lernen sie es nicht. In Schwärmen lästig.
  piraten_jaeger:   { sprite:'piraten_jaeger',   ai:'interceptor', speed:3.0, hp:25,  fireMin:30,  fireMax:50,  damage:6,  pattern:'strafe',   strafeAmp:80,  strafeFreq:0.08, range:70,  burst:3 },
  piraten_kapitaen: { sprite:'piraten_kapitaen', ai:'bomber',      speed:1.0, hp:100, fireMin:100, fireMax:180, damage:20, pattern:'slow',     strafeAmp:0,   strafeFreq:0, range:170, burst:1 }
};

SW.Enemies = {
  list:[],waveIndex:0,waveTimer:0,waveActive:false,allWavesDone:false,missionData:null,
  init(mission) { this.list=[];this.waveIndex=0;this.waveTimer=0;this.waveActive=false;this.allWavesDone=false;this.missionData=mission; },
  spawnWave(idx) {
    const waves=this.missionData.waves; if (idx>=waves.length) return;
    const cfg=waves[idx], count=cfg.count||3, spacing=50;
    // IM RAUM (NAV): Welle i steht am Nav-Punkt i — Gegner an den
    // Waypoints der Route (Weltkoordinaten, deterministisch).
    // Ohne Nav-Punkt: alt, relativ vor dem Spieler (z.B. Akademie-Sim).
    const np=(this.missionData.navPoints||[])[idx];
    let baseX=0, baseY=(cfg.y||0), baseZ=SW.Player.z+(cfg.z||200);
    if (np) {
      baseX=np.x||0; baseY=np.y!==undefined?np.y:baseY;
      if (np.z!==undefined) {
        baseZ=np.z;
        if (baseZ<SW.Player.z+150) baseZ=SW.Player.z+300;  // Sicherheit: nie zu nah/hinter dem Spieler
      }
    }
    const startX=-(count-1)*spacing/2;
    for (let i=0;i<count;i++) {
      const shipId=cfg.ship||'d_b'; const sp=SW.ShipRegistry[shipId]||SW.ShipRegistry.d_b;
      // IM RAUM: Spawn in Weltkoordinaten (relative Projektion rechnet den Rest)
      this.list.push({x:baseX+startX+i*spacing+(Math.random()-0.5)*10,y:baseY+(Math.random()-0.5)*20,z:baseZ,hp:sp.hp,fireTimer:sp.fireMin+Math.random()*(sp.fireMax-sp.fireMin),speed:sp.speed,damage:sp.damage,fireMin:sp.fireMin,fireMax:sp.fireMax,pattern:sp.pattern,strafeAmp:sp.strafeAmp,strafeFreq:sp.strafeFreq,shipId:shipId,alive:true,state:'approach',t:0,strafeDir:(i%2?1:-1),wab:0,range:sp.range||120,burst:sp.burst||1});
    }
    this.waveActive=true;
  },
  update(frame) {
    if (!this.waveActive&&!this.allWavesDone) {
      this.waveTimer++;
      if (this.waveIndex===0&&frame>SW.FIRST_WAVE_DELAY) { this.spawnWave(0);this.waveTimer=0;const m=this.missionData.waveMessages?.[0];if(m)SW.Comm.add(m); }
      else if (this.waveIndex>0&&this.waveTimer>=SW.WAVE_SPACING) { this.spawnWave(this.waveIndex);this.waveTimer=0;const m=this.missionData.waveMessages?.[this.waveIndex];if(m)SW.Comm.add(m); }
    }
    const p=SW.Player;
    for (const e of this.list) {
      if (!e.alive) continue;
      e.t++;
      const rz=e.z-p.z, rx=e.x-p.x, ry=e.y-p.y;
      const ai=SW.ShipRegistry[e.shipId]?SW.ShipRegistry[e.shipId].ai:'drone';
      if (ai==='drone') {
        // Drohne: gradeaus auf den Spieler zu, leichte Nachführung (Selbstmörder)
        e.z-=e.speed; e.x+=(p.x-e.x)*0.004; e.y+=(p.y-e.y)*0.004;
      } else if (ai==='bomber') {
        // Kreuzer/Kapitän: langsam, hält große Distanz, schwere Schüsse
        if (rz>e.range+60) e.z-=e.speed;
        else if (rz<e.range-60) e.z+=e.speed*0.6;
        e.x+=(p.x*0.6-e.x)*0.002; e.y+=(p.y*0.4-e.y)*0.002;
      } else {
        // Interceptor (Jäger/Piraten) — WC1-Manöver: approach → strafe → break
        if (e.state==='approach') {
          e.z-=e.speed; e.x+=(p.x-e.x)*0.01; e.y+=(p.y-e.y)*0.008;
          if (rz<e.range) { e.state='strafe'; e.strafeDir=Math.random()<0.5?-1:1; }
        } else if (e.state==='strafe') {
          // Hält relative Distanz (gleicht Vorschub aus), gleitet seitlich,
          // Wabbel = gelegentliches zufälliges Zucken (WC1: Mwabbel)
          e.z+=p.speed+(Math.random()-0.5)*0.4;
          e.x+=e.strafeDir*1.2+(p.x-e.x)*0.006;
          e.y+=Math.sin(e.t*0.03)*0.4+(p.y-e.y)*0.006;
          if (e.wab>0) { e.wab--; e.x+=(Math.random()-0.5)*2.5; }
          else if (Math.random()<0.008) e.wab=10;
          if (e.t%240===0) e.strafeDir*=-1;
          if (rz<30) e.state='break'; // zu nah → abreißen
        } else { // break: wegfliegen, dann neu angreifen
          e.z-=e.speed*1.5;
          if (rz>240) { e.state='approach'; e.t=0; }
        }
      }
      // Feuer: Vorhaltschuss (Interpunkt auf Spielerposition + Drift)
      e.fireTimer--;
      const fireMax=e.range>0?e.range+150:300;
      if (e.fireTimer<=0&&rz>15&&rz<fireMax) {
        const lead=rz/SW.ENEMY_LASER_SPEED;
        const tx=p.x+p.vx*lead*0.8, ty=p.y+p.vy*lead*0.8;
        const dx=tx-e.x, dy=ty-e.y, dz=p.z-e.z, len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
        const burst=e.burst||1;
        for (let b=0;b<burst;b++) {
          const off=(b-(burst-1)/2)*0.05;
          const ox=dx-dz*off, oy=dy;
          const olen=Math.sqrt(ox*ox+oy*oy+dz*dz)||1;
          SW.Projectiles.add({x:e.x,y:e.y,z:e.z,dx:ox/olen,dy:oy/olen,dz:dz/olen,speed:SW.ENEMY_LASER_SPEED,friendly:false,damage:e.damage,life:90});
        }
        e.fireTimer=e.fireMin+Math.random()*(e.fireMax-e.fireMin);
      }
      // Hinter den Spieler durchgeflogen → weg (kein Nachjagen)
      if (rz<5) e.alive=false;
    }
    if (this.waveActive) {
      const alive=this.list.filter(e=>e.alive).length;
      if (alive===0) {
        this.waveActive=false; this.waveIndex++;
        if (this.waveIndex>=(this.missionData.waves?.length||3)&&SW.Player.alive) { this.allWavesDone=true; SW.Game.triggerVictory(); }
      }
    }
  },
  render(ctx) {
    const sorted=SW.Engine.zSort(this.list.filter(e=>e.alive));
    for (const e of sorted) {
      const p=SW.Engine.screenPos(e.x,e.y,e.z); if(!p) continue;
      if (p.sx<-20||p.sx>SW.W+20||p.sy<-20||p.sy>SW.H+20) continue;
      const spr=SW.Sprites.shipVariants[e.shipId]||SW.Sprites.enemy; SW.Sprites.draw(ctx,spr,p.sx,p.sy,p.scale);
    }
  }
};

SW.Projectiles = {
  list:[],
  add(p){this.list.push(p);},
  clear(){this.list=[];},
  update() {
    // IM RAUM: Culling relativ zum Spieler (Welt-z wächst mit dem Vorschub)
    const p=SW.Player;
    for (let i=this.list.length-1;i>=0;i--) {
      const q=this.list[i];
      q.x+=q.dx*q.speed;q.y+=q.dy*q.speed;q.z+=q.dz*q.speed;q.life--;
      const rz=q.z-p.z;
      if (q.life<=0||rz<0.5||rz>1250||Math.abs(q.x-p.x)>300||Math.abs(q.y-p.y)>200) this.list.splice(i,1);
    }
  },
  render(ctx) {
    for (const p of this.list) {
      const proj=SW.Engine.screenPos(p.x,p.y,p.z); if(!proj) continue;
      if (proj.sx<0||proj.sx>SW.W||proj.sy<0||proj.sy>SW.H) continue;
      const proj2=SW.Engine.screenPos(p.x-p.dx*3,p.y-p.dy*3,p.z-p.dz*3);
      if (proj2) {
        ctx.strokeStyle=p.friendly?'#ff0000':'#00ff00';
        ctx.lineWidth=Math.min(3,Math.max(1,proj.scale*0.5));
        ctx.beginPath();ctx.moveTo(proj2.sx,proj2.sy);ctx.lineTo(proj.sx,proj.sy);ctx.stroke();
      } else {
        ctx.fillStyle=p.friendly?'#ff0000':'#00ff00';
        ctx.fillRect(Math.round(proj.sx),Math.round(proj.sy),2,2);
      }
    }
    ctx.lineWidth=1;
  }
};

SW.Explosions = {
  list:[],
  add(x,y,z){this.list.push({x,y,z,frame:0});SW.Audio.playExplosion();},
  clear(){this.list=[];},
  update(){for(let i=this.list.length-1;i>=0;i--){this.list[i].frame++;if(this.list[i].frame>SW.EXPLOSION_FRAMES)this.list.splice(i,1);}},
  render(ctx) {
    for (const ex of this.list) {
      const p=SW.Engine.screenPos(ex.x,ex.y,ex.z); if(!p) continue;
      const t=ex.frame/SW.EXPLOSION_FRAMES, radius=t*15*p.scale;
      ctx.globalAlpha=1-t;
      ctx.fillStyle=t<0.3?'#ffff00':t<0.6?'#ff6600':'#ff0000';
      ctx.beginPath();ctx.arc(p.sx,p.sy,Math.max(1,radius),0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }
  }
};

SW.Carrier = {
  x:SW.CARRIER_X,y:SW.CARRIER_Y,z:SW.CARRIER_Z,visible:false,
  init(){this.x=SW.CARRIER_X;this.y=SW.CARRIER_Y;this.z=SW.CARRIER_Z;this.visible=false;},
  // IM RAUM: z wird bei Mission/Flight-Wechseln als Weltkoordinate gesetzt
  // (relative Projektion in SW.Engine.project rechnet den Rest)
  render(ctx) {
    if (!this.visible) return;
    const p=SW.Engine.project(this.x,this.y,this.z); if(!p) return;
    SW.Sprites.draw(ctx,SW.Sprites.carrier,p.sx,p.sy,p.scale*2,32);
  }
};

// ===== WINGMAN "SECHS" (IM RAUM, v0.75-dev) =====
// WC1-Prinzip (auto.c: position_relative_ijk, aShipFormationOffset):
// Der Wingman fliegt in Formation VORN-links, deckt den Spieler und
// funkt — über SW.Comm (gleicher Kanal wie Commander/Träger).
// Keine eigenen Schadenswerte (Phase 1); Akademie-Sim bekommt keinen.
SW.Wingman = {
  active:false, x:0,y:0,z:0,
  offX:-60, offY:20, offZ:80,   // Formation: vorn-links (relativ zum Spieler)
  fireTimer:120, chatterTimer:900, _hitCd:0,
  reset(){ this.active=false; },
  init() {
    if (SW.Game._simMode) return;
    this.active=true;
    this.x=SW.Player.x+this.offX; this.y=SW.Player.y+this.offY; this.z=SW.Player.z+this.offZ;
    this.fireTimer=120; this.chatterTimer=900; this._hitCd=0;
    SW.Comm.add("SECHS: Flugdrei, ich bin bei dir. Vorn-links. Wenn es vorne laut wird, weißt du, was zu tun ist.");
  },
  update(frame) {
    if (!this.active) return;
    const p=SW.Player;
    // Formation nachführen (verzögert, nicht teleportiert)
    this.x += (p.x+this.offX-this.x)*0.08;
    this.y += (p.y+this.offY-this.y)*0.08;
    this.z += (p.z+this.offZ-this.z)*0.15;
    // Deckung: feuert auf den nächsten Gegner (freundlich)
    this.fireTimer--;
    if (this.fireTimer<=0) {
      let best=null, bd=Infinity;
      for (const e of SW.Enemies.list) {
        if (!e.alive) continue;
        const d=(e.x-this.x)*(e.x-this.x)+(e.y-this.y)*(e.y-this.y)+(e.z-this.z)*(e.z-this.z);
        if (d<bd) { bd=d; best=e; }
      }
      if (best && best.z>this.z) {
        const dx=best.x-this.x, dy=best.y-this.y, dz=best.z-this.z, len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
        SW.Projectiles.add({x:this.x,y:this.y,z:this.z,dx:dx/len,dy:dy/len,dz:dz/len,speed:SW.LASER_SPEED,friendly:true,life:100});
        SW.Audio.playLaser();
        this.fireTimer=80+Math.random()*60;
      } else this.fireTimer=40;
    }
    // Idle-Funk (selten, 1990-Deadpan)
    this.chatterTimer--;
    if (this.chatterTimer<=0) {
      this.chatterTimer=1800+Math.random()*1200;
      const lines=SW.Dialogues.wingmanIdle;
      if (lines&&lines.length) SW.Comm.add("SECHS: "+lines[Math.floor(Math.random()*lines.length)]);
    }
    if (this._hitCd>0) this._hitCd--;
  },
  onPlayerHit(frame) {
    if (!this.active||this._hitCd>0) return;
    this._hitCd=240;
    SW.Comm.add("SECHS: Treffer! Ich decke dich. Bleib am Leben, du hast noch Formulare auszufüllen.");
  },
  onFirstKill() {
    if (!this.active) return;
    SW.Comm.add("SECHS: Einer weniger. Guter Schuss. Das Formular sagt 'abgeschossen', nicht 'abgeknallt'.");
  },
  onDeath() {
    if (!this.active) return;
    this.active=false;
    SW.Comm.add("SECHS: ...Funkstille. Für das gibt es kein Formular.");
  },
  render(ctx) {
    if (!this.active) return;
    const p=SW.Engine.screenPos(this.x,this.y,this.z); if(!p) return;
    if (p.sx<-20||p.sx>SW.W+20||p.sy<-20||p.sy>SW.H+20) return;
    SW.Sprites.draw(ctx, SW.Sprites.playerShip, p.sx, p.sy, p.scale*0.9);
    // IFF-Markierung (blau = befreundet, WC1-Scanner-Style)
    ctx.fillStyle='#4488ff';
    ctx.fillRect(Math.round(p.sx)-2, Math.round(p.sy)-10, 4, 2);
  }
};
