// ===== SOLO WING 1990 — ENTITIES =====
SW.Player = {
  x:0,y:0,z:0,vx:0,vy:0,frontShield:SW.SHIELD_MAX,rearShield:SW.SHIELD_MAX,
  frontLastHit:-999,rearLastHit:-999,laserCooldown:0,alive:true,
  autopilot:false,autopilotTarget:null,
  rollAngle:0,
  init() {
    this.x=0;this.y=0;this.z=0;this.vx=0;this.vy=0;
    this.frontShield=SW.SHIELD_MAX;this.rearShield=SW.SHIELD_MAX;
    this.frontLastHit=-999;this.rearLastHit=-999;this.laserCooldown=0;
    this.alive=true;this.autopilot=false;this.autopilotTarget=null;
    this.rollAngle=0;
  },
  update(frame) {
    if (!this.alive) return;
    let ix=0,iy=0;
    // Rollen (Q/E): reine Sicht-Rotation, federt in Ruhe zurück zur Mitte
    if (SW.Input.keys['KeyQ']) this.rollAngle -= SW.ROLL_SPEED;
    if (SW.Input.keys['KeyE']) this.rollAngle += SW.ROLL_SPEED;
    if (!SW.Input.keys['KeyQ'] && !SW.Input.keys['KeyE']) this.rollAngle *= SW.ROLL_DECAY;
    if (Math.abs(this.rollAngle) < 0.005) this.rollAngle = 0;
    this.rollAngle = Math.max(-SW.ROLL_MAX, Math.min(SW.ROLL_MAX, this.rollAngle));
    // Autopilot: fly to target
    if (this.autopilot && this.autopilotTarget) {
      const dx=this.autopilotTarget.x-this.x, dy=this.autopilotTarget.y-this.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if (dist > SW.AUTOPILOT_TOLERANCE) { ix=(dx/dist); iy=(dy/dist); }
      else { this.autopilot=false; this.autopilotTarget=null; }
    }
    // Manual thrust overrides autopilot
    const move=SW.Input.getThrust();
    if (move.x!==0||move.y!==0) { this.autopilot=false;this.autopilotTarget=null;ix=move.x;iy=move.y; }
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
    if (frame-this.frontLastHit>SW.SHIELD_REGEN_DELAY&&this.frontShield<SW.SHIELD_MAX) this.frontShield=Math.min(SW.SHIELD_MAX,this.frontShield+1);
    if (frame-this.rearLastHit>SW.SHIELD_REGEN_DELAY&&this.rearShield<SW.SHIELD_MAX) this.rearShield=Math.min(SW.SHIELD_MAX,this.rearShield+1);
    if (this.laserCooldown>0) this.laserCooldown--;
    if (SW.Input.getFirePressed()&&this.laserCooldown<=0) { this.fire(); this.laserCooldown=SW.LASER_COOLDOWN; }
  },
  fire() {
    const slots=SW.Input.getLaserSlots(), dir=SW.Input.getAimDirection();
    for (let i=0;i<slots;i++) {
      const spread=(i-(slots-1)/2)*0.05, dx=dir.x+spread, dy=dir.y;
      const len=Math.sqrt(dx*dx+dy*dy+dir.z*dir.z);
      SW.Projectiles.add({x:this.x,y:this.y,z:1,dx:dx/len,dy:dy/len,dz:dir.z/len,speed:SW.LASER_SPEED,friendly:true,life:100});
    }
    SW.Audio.playLaser();
  },
  takeHit(dmg,isFront,frame) {
    if (isFront) { this.frontShield-=dmg; this.frontLastHit=frame; }
    else { this.rearShield-=dmg; this.rearLastHit=frame; }
    SW.Audio.playShieldHit();
    if (this.frontShield<=0||this.rearShield<=0) this.alive=false;
  }
};

// ===== SHIP REGISTRY (Phase 3) =====
// Verknüpft Sprite + Flug-KI. NoThink Code lieferte Struktur,
// Commander hat ms→Frames konvertiert (System arbeitet in Frames).
SW.ShipRegistry = {
  d_b:     { sprite:'d_b',     ai:'drone',       speed:1.5, hp:50,  fireMin:60,  fireMax:90,  damage:10, pattern:'straight', strafeAmp:0,   strafeFreq:0 },
  'Jäger': { sprite:'Jäger',   ai:'interceptor', speed:2.5, hp:30,  fireMin:40,  fireMax:70,  damage:8,  pattern:'strafe',   strafeAmp:60,  strafeFreq:0.05 },
  Kreuzer: { sprite:'Kreuzer', ai:'bomber',      speed:0.8, hp:120, fireMin:150, fireMax:250, damage:25, pattern:'slow',     strafeAmp:0,   strafeFreq:0 },
  // ===== PIRATEN (Vertical Slice) =====
  // Selbstmörderisch. Unterlegene Schiffe. Lernen sie es nicht. In Schwärmen lästig.
  piraten_jaeger:   { sprite:'piraten_jaeger',   ai:'interceptor', speed:3.0, hp:25,  fireMin:30,  fireMax:50,  damage:6,  pattern:'strafe',   strafeAmp:80,  strafeFreq:0.08 },
  piraten_kapitaen: { sprite:'piraten_kapitaen', ai:'bomber',      speed:1.0, hp:100, fireMin:100, fireMax:180, damage:20, pattern:'slow',     strafeAmp:0,   strafeFreq:0 }
};

SW.Enemies = {
  list:[],waveIndex:0,waveTimer:0,waveActive:false,allWavesDone:false,missionData:null,
  init(mission) { this.list=[];this.waveIndex=0;this.waveTimer=0;this.waveActive=false;this.allWavesDone=false;this.missionData=mission; },
  spawnWave(idx) {
    const waves=this.missionData.waves; if (idx>=waves.length) return;
    const cfg=waves[idx], count=cfg.count||3, z=cfg.z||200, spacing=50;
    const startX=-(count-1)*spacing/2;
    for (let i=0;i<count;i++) {
      const shipId=cfg.ship||'d_b'; const sp=SW.ShipRegistry[shipId]||SW.ShipRegistry.d_b; this.list.push({x:startX+i*spacing+(Math.random()-0.5)*10,y:(cfg.y||0)+(Math.random()-0.5)*20,z:z,hp:sp.hp,fireTimer:sp.fireMin+Math.random()*(sp.fireMax-sp.fireMin),speed:sp.speed,damage:sp.damage,fireMin:sp.fireMin,fireMax:sp.fireMax,pattern:sp.pattern,strafeAmp:sp.strafeAmp,strafeFreq:sp.strafeFreq,shipId:shipId,alive:true});
    }
    this.waveActive=true;
  },
  update(frame) {
    if (!this.waveActive&&!this.allWavesDone) {
      this.waveTimer++;
      if (this.waveIndex===0&&frame>SW.FIRST_WAVE_DELAY) { this.spawnWave(0);this.waveTimer=0;const m=this.missionData.waveMessages?.[0];if(m)SW.Comm.add(m); }
      else if (this.waveIndex>0&&this.waveTimer>=SW.WAVE_SPACING) { this.spawnWave(this.waveIndex);this.waveTimer=0;const m=this.missionData.waveMessages?.[this.waveIndex];if(m)SW.Comm.add(m); }
    }
    for (const e of this.list) {
      if (!e.alive) continue;
      e.z-=e.speed; e.x+=(0-e.x)*0.005; e.y+=(0-e.y)*0.005; if(e.pattern==='strafe'){ e.x+=Math.sin(frame*e.strafeFreq)*e.strafeAmp*0.02; }
      e.fireTimer--;
      if (e.fireTimer<=0&&e.z>20) {
        const dx=-e.x,dy=-e.y,dz=-e.z,len=Math.sqrt(dx*dx+dy*dy+dz*dz);
        SW.Projectiles.add({x:e.x,y:e.y,z:e.z,dx:dx/len,dy:dy/len,dz:dz/len,speed:SW.ENEMY_LASER_SPEED,friendly:false,damage:e.damage,life:80});
        e.fireTimer=e.fireMin+Math.random()*(e.fireMax-e.fireMin);
      }
      if (e.z<5) e.alive=false;
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
      const p=SW.Engine.project(e.x,e.y,e.z); if(!p) continue;
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
    for (let i=this.list.length-1;i>=0;i--) {
      const p=this.list[i];
      p.x+=p.dx*p.speed;p.y+=p.dy*p.speed;p.z+=p.dz*p.speed;p.life--;
      if (p.life<=0||p.z<0.5||p.z>500||Math.abs(p.x)>300||Math.abs(p.y)>200) this.list.splice(i,1);
    }
  },
  render(ctx) {
    for (const p of this.list) {
      const proj=SW.Engine.project(p.x,p.y,p.z); if(!proj) continue;
      if (proj.sx<0||proj.sx>SW.W||proj.sy<0||proj.sy>SW.H) continue;
      const proj2=SW.Engine.project(p.x-p.dx*3,p.y-p.dy*3,p.z-p.dz*3);
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
      const p=SW.Engine.project(ex.x,ex.y,ex.z); if(!p) continue;
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
  render(ctx) {
    if (!this.visible) return;
    const p=SW.Engine.project(this.x,this.y,this.z); if(!p) return;
    SW.Sprites.draw(ctx,SW.Sprites.carrier,p.sx,p.sy,p.scale*2,32);
  }
};
