// ===== SOLO WING 1990 — ENTITIES (3D MULTI-ANGLE & VECTOR INERTIA) =====
SW.Player = {
  x:0,y:0,z:0,vx:0,vy:0,speed:0,burning:false,
  frontShield:SW.SHIELD_MAX,rearShield:SW.SHIELD_MAX,
  frontLastHit:-999,rearLastHit:-999,laserCooldown:0,alive:true,
  systems:null,_systemDamageIndex:0,_weaponsOfflineReported:false,
  autopilot:false,autopilotTarget:null,
  rollAngle:0,
  // Wingnut 3D Cockpit & Ship Class State
  shipClassId:'jaeger',
  steerX:0.5, steerY:0.5,
  cockpitShiftX:0, cockpitShiftY:0,
  gunFlashTimer:0, gunFlashSide:0,

  defaultSystems() { return {engines:100,weapons:100,shields:100,sensors:100}; },
  isValidSystems(systems) {
    return systems !== null && typeof systems === 'object' && !Array.isArray(systems) &&
      ['engines','weapons','shields','sensors'].every(key =>
        systems[key] === undefined || (typeof systems[key] === 'number' &&
          Number.isFinite(systems[key]) && systems[key] >= 0 && systems[key] <= 100));
  },
  getShipClass() {
    return (SW.ShipClasses && SW.ShipClasses.get(this.shipClassId)) || {
      id: 'jaeger', name: 'LEICHTER JÄGER (HORNET)', atlasKey: 'hornet', cockpitKey: 'hornet'
    };
  },
  cycleShipClass() {
    const order = (SW.ShipClasses && SW.ShipClasses.flyableOrder) || ['jaeger', 'bomber', 'ueberlegenheit', 'frachter', 'dralthi', 'salthi', 'krant', 'strakha'];
    const idx = order.indexOf(this.shipClassId);
    this.shipClassId = order[(idx + 1) % order.length];
    const cls = this.getShipClass();
    if (SW.Comm) SW.Comm.add('SYSTEM: Cockpit/Schiff gewechselt auf ' + cls.name + '.');
    return cls;
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
    this.steerX=0.5;this.steerY=0.5;this.cockpitShiftX=0;this.cockpitShiftY=0;
    this.gunFlashTimer=0;
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
    if (this.x >= SW.PLAYER_MAX_X) { this.x = SW.PLAYER_MAX_X; if (this.vx > 0) this.vx = 0; }
    else if (this.x <= -SW.PLAYER_MAX_X) { this.x = -SW.PLAYER_MAX_X; if (this.vx < 0) this.vx = 0; }
    if (this.y >= SW.PLAYER_MAX_Y) { this.y = SW.PLAYER_MAX_Y; if (this.vy > 0) this.vy = 0; }
    else if (this.y <= -SW.PLAYER_MAX_Y) { this.y = -SW.PLAYER_MAX_Y; if (this.vy < 0) this.vy = 0; }

    // Update WCUnity-style Joystick (steerX, steerY in 0..1) & G-Force CockpitShift (-8..+8 px)
    const mouseSteerX = (SW.Input.mouseX - SW.CX) / SW.CX;
    const mouseSteerY = (SW.Input.mouseY - SW.CY) / SW.CY;
    const rawSteerX = (ix !== 0) ? ix : mouseSteerX * 0.65;
    const rawSteerY = (iy !== 0) ? iy : mouseSteerY * 0.65;
    this.steerX = Math.max(0, Math.min(0.99, 0.5 + rawSteerX * 0.48));
    this.steerY = Math.max(0, Math.min(0.99, 0.5 - rawSteerY * 0.48));

    const targetShiftX = Math.max(-8, Math.min(8, -this.vx * 1.8));
    const targetShiftY = Math.max(-7, Math.min(7, -this.vy * 1.6 + (this.burning ? 2.5 : 0)));
    this.cockpitShiftX += (targetShiftX - this.cockpitShiftX) * 0.18;
    this.cockpitShiftY += (targetShiftY - this.cockpitShiftY) * 0.18;

    if (this.gunFlashTimer > 0) this.gunFlashTimer--;

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
    const slots = SW.Input.getLaserSlots(), dir = SW.Input.getAimDirection();
    const convDist = 140; // Konvergenzpunkt vor dem Cockpit
    const targetX = this.x + dir.x * convDist;
    const targetY = this.y + dir.y * convDist;
    const targetZ = this.z + dir.z * convDist;

    // Physikalisch getrennte Tragflächen-Geschütze (kein Stapeln der Laser aufeinander)
    let offsets;
    if (slots === 1) {
      offsets = [{ x: 0, y: -0.8 }];
    } else if (slots === 2) {
      offsets = [{ x: -3.6, y: -0.7 }, { x: 3.6, y: -0.7 }];
    } else if (slots === 3) {
      offsets = [{ x: -3.8, y: -0.7 }, { x: 0, y: -1.0 }, { x: 3.8, y: -0.7 }];
    } else {
      offsets = [{ x: -4.2, y: -0.7 }, { x: -1.8, y: -0.9 }, { x: 1.8, y: -0.9 }, { x: 4.2, y: -0.7 }];
    }

    for (let i = 0; i < slots; i++) {
      const off = offsets[i] || { x: (i - (slots - 1) / 2) * 2.0, y: -0.8 };
      const gunX = this.x + off.x;
      const gunY = this.y + off.y;
      const gunZ = this.z + 1.2;
      const dx = targetX - gunX;
      const dy = targetY - gunY;
      const dz = targetZ - gunZ;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const damage = SW.LASER_DAMAGE * (0.5 + 0.5 * this.systems.weapons / 100);
      SW.Projectiles.add({
        x: gunX, y: gunY, z: gunZ,
        dx: dx / len, dy: dy / len, dz: dz / len,
        speed: SW.LASER_SPEED,
        friendly: true,
        damage,
        life: 100
      });
      if (SW.Game) SW.Game.shotsFired = (SW.Game.shotsFired || 0) + 1;
    }
    this.gunFlashTimer = 5;
    this.gunFlashSide = (this.gunFlashSide + 1) % 2;
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
    // Simulator-Schutz: Treffer in der Akademie dürfen niemals das echte Schiff beschädigen
    if (SW.Game && SW.Game._simMode && this.systems === (SW.World && SW.World.shipSystems)) {
      this.systems = this.defaultSystems();
    }
    // Schilde schlucken den Treffer. Erst wenn die getroffene Seite unter 35 %
    // ist, schlägt ein Teil auf die Bordsysteme durch (WC-Prinzip: Schild → Systeme).
    // Früher ging jeder Treffer mit 1,5× Schaden auf ein System → Schiff nach
    // wenigen Gefechten dauerhaft "defekt".
    const sideShield = isFront ? this.frontShield : this.rearShield;
    if (sideShield < this.shieldCapacity() * 0.35) {
      this.damageSystem(Math.max(1, Math.round(dmg * 0.6)));
    }
    this.cockpitShiftX += (Math.random() - 0.5) * 9;
    this.cockpitShiftY += (Math.random() - 0.5) * 9;
    SW.Audio.playShieldHit();
    if (this.frontShield<=0||this.rearShield<=0) this.alive=false;
  }
};

// ===== SHIP REGISTRY (Phase 3 + Multi-Angle Atlas Mapping) =====
SW.ShipRegistry = {
  d_b:              { sprite:'d_b',              atlas:'dralthi',      ai:'drone',       speed:1.5, hp:50,  fireMin:80,  fireMax:130, damage:5,  pattern:'straight', strafeAmp:0,  strafeFreq:0,    range:0,   burst:1 },
  'Jäger':          { sprite:'Jäger',            atlas:'salthi',       ai:'interceptor', speed:2.5, hp:30,  fireMin:70,  fireMax:110, damage:6,  pattern:'strafe',   strafeAmp:60, strafeFreq:0.05, range:90,  burst:1 },
  Kreuzer:          { sprite:'Kreuzer',          atlas:'krant',        ai:'bomber',      speed:0.8, hp:120, fireMin:180, fireMax:280, damage:15, pattern:'slow',     strafeAmp:0,  strafeFreq:0,    range:200, burst:1 },
  piraten_jaeger:   { sprite:'piraten_jaeger',   atlas:'talon',        ai:'interceptor', speed:3.0, hp:25,  fireMin:65,  fireMax:100, damage:5,  pattern:'strafe',   strafeAmp:80, strafeFreq:0.08, range:70,  burst:2 },
  piraten_kapitaen: { sprite:'piraten_kapitaen', atlas:'grikath',      ai:'bomber',      speed:1.0, hp:100, fireMin:140, fireMax:220, damage:14, pattern:'slow',     strafeAmp:0,  strafeFreq:0,    range:170, burst:1 },
  freighter:        { sprite:'freighter',        atlas:'freighter',    ai:'drone',       speed:1.2, hp:120, fireMin:120, fireMax:200, damage:4,  pattern:'straight', strafeAmp:0,  strafeFreq:0,    range:0,   burst:1 },
  frachter:         { sprite:'frachter',         atlas:'freighter',    ai:'drone',       speed:1.2, hp:120, fireMin:120, fireMax:200, damage:4,  pattern:'straight', strafeAmp:0,  strafeFreq:0,    range:0,   burst:1 },
  hermes_drone:     { sprite:'Jäger',            atlas:'hermes_drone', ai:'interceptor', speed:3.2, hp:45,  fireMin:60,  fireMax:95,  damage:6,  pattern:'strafe',   strafeAmp:70, strafeFreq:0.07, range:85,  burst:1 },
  einheit:          { sprite:'Kreuzer',          atlas:'strakha',      ai:'interceptor', speed:2.8, hp:70,  fireMin:75,  fireMax:120, damage:8,  pattern:'strafe',   strafeAmp:65, strafeFreq:0.06, range:110, burst:2 }
};

SW.Enemies = {
  list:[],waveIndex:0,waveTimer:0,waveActive:false,allWavesDone:false,missionData:null,
  pendingSpawns:[],waveElapsed:0,selectedTargetIndex:0,
  init(mission) {
    this.list=[];this.waveIndex=0;this.waveTimer=0;this.waveActive=false;
    this.allWavesDone=false;this.missionData=mission;this.pendingSpawns=[];this.waveElapsed=0;
    this.selectedTargetIndex=0;
  },
  cycleTarget() {
    const live = this.list.filter(e => e.alive && e.z > SW.Player.z + 5);
    if (!live.length) return null;
    this.selectedTargetIndex = (this.selectedTargetIndex + 1) % live.length;
    const t = live[this.selectedTargetIndex];
    if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
    return t;
  },
  getSelectedTarget() {
    const live = this.list
      .filter(e => e.alive && e.z > SW.Player.z + 5)
      .sort((a, b) => (a.z - SW.Player.z) - (b.z - SW.Player.z));
    if (!live.length) return null;
    return live[this.selectedTargetIndex % live.length] || live[0];
  },
  spawnWave(idx) {
    const waves=this.missionData.waves; if (idx>=waves.length) return;
    const cfg=waves[idx];
    const groups=Array.isArray(cfg.groups)&&cfg.groups.length
      ? cfg.groups
      : [{count:cfg.count||3,ship:cfg.ship||'d_b'}];
    const count=groups.reduce((total,group)=>total+(group.count||0),0), spacing=50;
    const np=(this.missionData.navPoints||[])[idx];
    let baseX=0, baseY=(cfg.y||0), baseZ=SW.Player.z+(cfg.z||200);
    if (np) {
      baseX=np.x||0; baseY=np.y!==undefined?np.y:baseY;
      if (np.z!==undefined) {
        baseZ=np.z;
        if (baseZ<SW.Player.z+150) baseZ=SW.Player.z+300;
      }
    }
    const startX=-(count-1)*spacing/2;
    const staggerFrames=Math.max(0,Math.floor(cfg.staggerFrames||0));
    this.pendingSpawns=[];
    let index=0;
    for (const group of groups) {
      const shipId=group.ship||cfg.ship||'d_b';
      for (let i=0;i<(group.count||0);i++) {
        this.pendingSpawns.push({
          at:index*staggerFrames,
          x:baseX+startX+index*spacing+(Math.random()-0.5)*10,
          y:baseY+(Math.random()-0.5)*20,
          z:baseZ,
          shipId:shipId,
          index:index,
          civilian:!!(group.civilian||cfg.civilian)
        });
        index++;
      }
    }
    this.waveElapsed=0;
    this.waveActive=true;
    this._spawnDueMembers();
  },
  _spawnDueMembers() {
    while (this.pendingSpawns.length && this.pendingSpawns[0].at<=this.waveElapsed) {
      const member=this.pendingSpawns.shift();
      const sp=SW.ShipRegistry[member.shipId]||SW.ShipRegistry.d_b;
      this.list.push({
        x:member.x,y:member.y,z:member.z,hp:sp.hp,maxHp:sp.hp,
        fireTimer:sp.fireMin+Math.random()*(sp.fireMax-sp.fireMin),
        speed:sp.speed,damage:sp.damage,fireMin:sp.fireMin,fireMax:sp.fireMax,
        pattern:sp.pattern,strafeAmp:sp.strafeAmp,strafeFreq:sp.strafeFreq,
        shipId:member.shipId,alive:true,state:'approach',t:0,
        strafeDir:(member.index%2?1:-1),wab:0,range:sp.range||120,burst:sp.burst||1,
        civilian:!!member.civilian,_vx:0,_vy:0,_vz:0,
        heading:Math.PI, pitchAngle:0,
        _screenPos:null,_screenSize:12
      });
    }
  },
  _announceWaveMessage(msg) {
    if (!msg) return;
    SW.Comm.add(msg);
    if (msg.indexOf('KUGELSCHREIBER') !== -1 && SW.Quests && SW.Quests.flight) {
      SW.Quests.flight({ typ: 'heard_rap' });
    }
  },
  update(frame) {
    if (this.waveActive && this.pendingSpawns.length) {
      this.waveElapsed++;
      this._spawnDueMembers();
    }
    if (!this.waveActive&&!this.allWavesDone) {
      this.waveTimer++;
      if (this.waveIndex===0&&frame>SW.FIRST_WAVE_DELAY) {
        this.spawnWave(0);this.waveTimer=0;
        const m=this.missionData.waveMessages?.[0];
        if(m) this._announceWaveMessage(m);
      } else if (this.waveIndex>0&&this.waveTimer>=SW.WAVE_SPACING) {
        this.spawnWave(this.waveIndex);this.waveTimer=0;
        const m=this.missionData.waveMessages?.[this.waveIndex];
        if(m) this._announceWaveMessage(m);
      }
    }
    const p=SW.Player;
    for (const e of this.list) {
      if (!e.alive) continue;
      const prevX=e.x, prevY=e.y, prevZ=e.z;
      e.t++;
      const rz=e.z-p.z, rx=e.x-p.x, ry=e.y-p.y;
      if (e.civilian) {
        e.z += p.speed * 0.35;
        e.x += Math.sin(e.t * 0.02 + (e.strafeDir || 1)) * 0.25;
        e._vx = e.x - prevX; e._vy = e.y - prevY; e._vz = e.z - prevZ;
        e.heading = Math.atan2(e._vx, 1.2); // flying forward (+Z) showing stern/quarter
        e.pitchAngle = 0;
        if (rz < 55 && e.t > 45) {
          e.alive = false;
          SW.Game.score += 50;
          SW.Comm.add('SIEDLER: Eskorte bestätigt. Danke, Sternenkorps. Wir melden uns bei Sektor 12.');
        }
        continue;
      }
      const ai=SW.ShipRegistry[e.shipId]?SW.ShipRegistry[e.shipId].ai:'drone';
      if (ai==='drone') {
        e.z-=e.speed; e.x+=(p.x-e.x)*0.004; e.y+=(p.y-e.y)*0.004;
      } else if (ai==='bomber') {
        if (rz>e.range+60) e.z-=e.speed;
        else if (rz<e.range-60) e.z+=e.speed*0.6;
        e.x+=(p.x*0.6-e.x)*0.002; e.y+=(p.y*0.4-e.y)*0.002;
      } else {
        // Taktische Dogfight-Logik: Ausweichen, Verfolgen, Passieren und Re-Engagement
        const isTargeted = SW.Enemies.getSelectedTarget && SW.Enemies.getSelectedTarget() === e;
        const playerAimingAtMe = isTargeted && Math.hypot(rx, ry) < 28 && rz > 15 && rz < 160;

        if (e.state === 'tailing') {
          // Feind klebt am Heck des Spielers und attackiert den Heckschild!
          e.z = p.z - 35 - Math.sin(e.t * 0.05) * 10;
          e.x += (p.x - e.x) * 0.055;
          e.y += (p.y - e.y) * 0.055;
          // Spieler kann den Verfolger durch Nachbrenner [SHIFT] oder Rollen [Q/E] abschütteln
          const shaken = p.burning || Math.abs(p.rollAngle) > 0.12 || e.t > 150;
          if (shaken) {
            e.state = 'break';
            e.strafeDir = Math.random() < 0.5 ? -1 : 1;
            e.t = 0;
            if (SW.Comm) SW.Comm.add('SECHS: Schöner Ausweichhaken! Verfolger abgeschüttelt!');
          }
        } else if (playerAimingAtMe && e.state !== 'break') {
          // Feind bemerkt Zielerfassung und fliegt aggressive Ausweichschlangen
          e.state = 'evade';
          e.z -= e.speed * 0.85;
          e.x += Math.sin(e.t * 0.08) * 2.4;
          e.y += Math.cos(e.t * 0.06) * 1.6;
          if (rz < 35 || Math.random() < 0.01) e.state = 'strafe';
        } else if (e.state === 'approach') {
          e.z -= e.speed; e.x += (p.x - e.x) * 0.01; e.y += (p.y - e.y) * 0.008;
          if (rz < e.range) { e.state = 'strafe'; e.strafeDir = Math.random() < 0.5 ? -1 : 1; }
        } else if (e.state === 'strafe') {
          e.z += p.speed + (Math.random() - 0.5) * 0.4;
          e.x += e.strafeDir * 1.2 + (p.x - e.x) * 0.006;
          e.y += Math.sin(e.t * 0.03) * 0.4 + (p.y - e.y) * 0.006;
          if (e.wab > 0) { e.wab--; e.x += (Math.random() - 0.5) * 2.5; }
          else if (Math.random() < 0.008) e.wab = 10;
          if (e.t % 240 === 0) e.strafeDir *= -1;
          if (rz < 30) e.state = 'break';
        } else {
          // Break: speed away forward to open distance, then bank around to re-engage
          e.z += p.speed + e.speed * 1.5;
          e.x += e.strafeDir * 1.8;
          e.y += Math.sin(e.t * 0.05) * 0.5;
          if (rz > 220) {
            e.state = 'approach';
            e.t = 0;
            e.strafeDir = Math.random() < 0.5 ? -1 : 1;
          }
        }
      }
      e._vx = e.x - prevX; e._vy = e.y - prevY; e._vz = e.z - prevZ;
      // Compute true 3D flight heading & pitch angle so ships smoothly rotate through all 80 views!
      if (e.state === 'tailing') {
        e.heading = Math.sin(e.t * 0.04) * 0.25; // Blick direkt nach vorne auf das Heck des Spielers
        e.pitchAngle = 0;
      } else if (e.state === 'evade') {
        e.heading = Math.sin(e.t * 0.08) * 0.65;
        e.pitchAngle = Math.cos(e.t * 0.06) * 0.35;
      } else if (e.state === 'strafe') {
        e.heading = Math.atan2(e.strafeDir * 1.15, -0.45) + Math.sin(e.t * 0.05) * 0.48;
        e.pitchAngle = Math.max(-0.65, Math.min(0.65, -e._vy * 0.45 + Math.cos(e.t * 0.04) * 0.18));
      } else if (e.state === 'break') {
        e.heading = Math.atan2(e.strafeDir * 0.75, 1.0) + Math.sin(e.t * 0.04) * 0.25;
        e.pitchAngle = -0.38;
      } else {
        // Approach: aligned with true 3D flight vector + dogfight banking weave across all angles
        const relVz = e._vz - (p ? p.speed : 1.5);
        e.heading = Math.atan2(e._vx * 16, relVz) + Math.sin(e.t * 0.04 + (e.strafeDir || 1) * 1.3) * 0.45;
        e.pitchAngle = Math.max(-0.6, Math.min(0.6, Math.atan2(-e._vy * 10, Math.max(8, Math.abs(relVz))) + Math.sin(e.t * 0.03) * 0.15));
      }
      // Feuer: Vorhaltschuss. Salven werden über mehrere Frames verteilt
      // (e.burstLeft / e.burstGap), statt alle Schüsse im selben Frame fast
      // parallel abzufeuern — das ergab früher "zusammenklebende" Projektil-
      // klumpen, die immer komplett trafen. Zusätzlich gilt ein globales Limit
      // feindlicher Projektile (SW.ENEMY_MAX_PROJECTILES).
      e.fireTimer--;
      const fireMax=e.range>0?e.range+150:300;
      const isTailingFire = (e.state === 'tailing' && rz < -10 && rz > -90);
      if (e.fireTimer<=0&&((rz>15&&rz<fireMax) || isTailingFire)) {
        e.burstLeft = e.burst||1;
        e.burstGap = 0;
        e.fireTimer=e.fireMin+Math.random()*(e.fireMax-e.fireMin);
      }
      if (e.burstLeft > 0 && ((rz > 15) || isTailingFire)) {
        if (e.burstGap > 0) e.burstGap--;
        else if (SW.Projectiles.countHostile() < SW.ENEMY_MAX_PROJECTILES) {
          const lead=Math.abs(rz)/SW.ENEMY_LASER_SPEED;
          // Leichte Streuung: Feinde sind 1990er Piloten, keine Zielcomputer.
          const spread = (Math.random() - 0.5) * (isTailingFire ? 5 : 10);
          const tx=p.x+p.vx*lead*0.8+spread, ty=p.y+p.vy*lead*0.8+spread*0.6;
          const dx=tx-e.x, dy=ty-e.y, dz=p.z-e.z, len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
          SW.Projectiles.add({x:e.x,y:e.y,z:e.z,dx:dx/len,dy:dy/len,dz:dz/len,speed:SW.ENEMY_LASER_SPEED,friendly:false,damage:e.damage,life:90});
          e.burstLeft--;
          e.burstGap = SW.ENEMY_BURST_GAP;
        } else {
          e.burstLeft = 0; // Limit erreicht: Salve verfällt
        }
      }
      if (rz < 8 && e.state !== 'tailing') {
        if (e.civilian) {
          e.alive = false;
          SW.Game.score += 50;
          SW.Comm.add('SIEDLER: Sprungpunkt erreicht. Eskorte erfolgreich. Danke, Sternenkorps!');
        } else if (e.hp > 0) {
          const ai = SW.ShipRegistry[e.shipId] ? SW.ShipRegistry[e.shipId].ai : 'drone';
          if (ai === 'interceptor' && Math.random() < 0.6) {
            // Tailing-Manöver: Feind setzt sich auf die 6 des Spielers
            e.state = 'tailing';
            e.z = p.z - 30;
            e.t = 0;
            if (!this._lastTailingCall || frame - this._lastTailingCall > 300) {
              this._lastTailingCall = frame;
              if (SW.Comm) SW.Comm.add('SECHS: Feind im toten Winkel hinter dir! Schüttel ihn ab!');
            }
          } else {
            // Fighter overshoots player: loop back around ahead for another pass instead of vanishing!
            e.z = p.z + 200 + Math.random() * 80;
            e.x = p.x + (Math.random() - 0.5) * 90;
            e.y = p.y + (Math.random() - 0.5) * 50;
            e.state = 'approach';
            e.t = 0;
            e.strafeDir = Math.random() < 0.5 ? -1 : 1;
          }
        } else {
          e.alive = false;
        }
      }
    }
    if (this.waveActive) {
      const alive=this.list.filter(e=>e.alive).length;
      if (alive===0 && this.pendingSpawns.length===0) {
        this.waveActive=false; this.waveIndex++; this.waveElapsed=0;
        if (this.waveIndex>=(this.missionData.waves?.length||3)&&SW.Player.alive) {
          this.allWavesDone=true; SW.Game.triggerVictory();
        } else if (SW.Carrier.visible && !SW.Game._simMode) {
          SW.Comm.add("TRÄGER: Welle bereinigt. Nächster Sektor-Wegpunkt freigegeben.");
        }
      }
    }
    // Dynamische Musik im Cockpit je nach Kampflage
    if (frame % 30 === 0 && SW.Audio && SW.Audio.syncContext && SW.Game && SW.Game.state === 'COCKPIT') {
      const combatLive = this.list.some(e => e.alive && !e.civilian && Math.abs(e.z - p.z) < 450);
      SW.Audio.syncContext('cockpit', {
        inCombat: combatLive
      });
    }
  },
  render(ctx) {
    for (const e of this.list) e._screenPos = null;
    const sorted=SW.Engine.zSort(this.list.filter(e=>e.alive));
    const P = SW.Player;
    const vfx = (SW.Sprites && SW.Sprites.vfx) || {};
    for (const e of sorted) {
      const p=SW.Engine.screenPos(e.x,e.y,e.z); if(!p) continue;
      if (p.sx<-40||p.sx>SW.W+40||p.sy<-40||p.sy>SW.H+40) continue;
      e._screenPos = p;
      e._screenSize = Math.max(10, 26 * p.scale);
      const spr=SW.Sprites.shipVariants[e.shipId]||SW.Sprites.enemy;
      const atlasKey = SW.Sprites.mapShipIdToAtlas(e.shipId, e.civilian);
      const dx = P.x - e.x, dy = P.y - e.y, dz = P.z - e.z;
      const lightInfo = (SW.Sprites && SW.Sprites.computeDynamicLight) ? SW.Sprites.computeDynamicLight(e.x, e.y, e.z) : null;
      if (SW.Engine.view.mode === 'topdown') {
        SW.Sprites.draw(ctx, spr, p.sx, p.sy, p.scale);
      } else {
        SW.Sprites.drawMultiAngle(ctx, atlasKey, p.sx, p.sy, p.scale, dx, dy, dz, e.heading, e.pitchAngle, spr, undefined, lightInfo);
        // Engine flare glow when ship is flying away (break / civilian)
        if ((e.state === 'break' || e.civilian) && vfx.engineFlare && vfx.engineFlare._ready && ctx.drawImage) {
          const fSz = Math.max(4, Math.min(20, Math.round(12 * p.scale)));
          ctx.drawImage(vfx.engineFlare, Math.round(p.sx - fSz / 2), Math.round(p.sy - fSz / 2), fSz, fSz);
        }
      }
      if (e.civilian) {
        ctx.fillStyle='#44ff88';
        ctx.fillRect(Math.round(p.sx)-2, Math.round(p.sy)-Math.round(12*p.scale)-3, 4, 2);
      }
    }
  }
};

SW.Projectiles = {
  list:[],
  add(p){this.list.push(p);},
  clear(){this.list=[];},
  countHostile(){ let n=0; for (const q of this.list) if (!q.friendly) n++; return n; },
  update() {
    const p=SW.Player;
    for (let i=this.list.length-1;i>=0;i--) {
      const q=this.list[i];
      q.x+=q.dx*q.speed;q.y+=q.dy*q.speed;q.z+=q.dz*q.speed;q.life--;
      const rz=q.z-p.z;
      if (q.life<=0||rz<0.5||rz>1250||Math.abs(q.x-p.x)>300||Math.abs(q.y-p.y)>200) this.list.splice(i,1);
    }
  },
  render(ctx) {
    const isHermes = SW.Player && SW.Player.shipClassId === 'hermes';
    for (const p of this.list) {
      const proj = SW.Engine.screenPos(p.x, p.y, p.z);
      if (!proj) continue;
      if (proj.sx < -20 || proj.sx > SW.W + 20 || proj.sy < -20 || proj.sy > SW.H + 20) continue;
      const tailLen = 5.2;
      const proj2 = SW.Engine.screenPos(p.x - p.dx * tailLen, p.y - p.dy * tailLen, p.z - p.dz * tailLen);
      const outerCol = p.friendly ? (isHermes ? '#00e5ff' : '#ff3311') : '#22ff55';
      const coreCol  = p.friendly ? (isHermes ? '#e0ffff' : '#ffeeaa') : '#ccffdd';
      if (proj2) {
        // Äußerer volumetrischer Laserstrahl
        ctx.strokeStyle = outerCol;
        ctx.lineWidth = Math.min(4.5, Math.max(1.5, proj.scale * 1.2));
        ctx.beginPath();
        ctx.moveTo(proj2.sx, proj2.sy);
        ctx.lineTo(proj.sx, proj.sy);
        ctx.stroke();

        // Weißglühender Kernstrahl
        ctx.strokeStyle = coreCol;
        ctx.lineWidth = Math.min(2.0, Math.max(0.8, proj.scale * 0.45));
        ctx.beginPath();
        ctx.moveTo(proj2.sx, proj2.sy);
        ctx.lineTo(proj.sx, proj.sy);
        ctx.stroke();

        // Prozeduraler Mündungs-/Spitzenblitz bei nahen Projektilen (ohne quadratische PNG-Artefakte)
        if (proj.scale > 0.35) {
          const r = Math.min(3.5, Math.max(1.2, proj.scale * 1.4));
          ctx.fillStyle = coreCol;
          ctx.beginPath();
          ctx.arc(proj.sx, proj.sy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = outerCol;
        ctx.fillRect(Math.round(proj.sx) - 1, Math.round(proj.sy) - 1, 3, 3);
      }
    }
    ctx.lineWidth = 1;
  }
};

SW.Explosions = {
  list:[],
  add(x,y,z){this.list.push({x,y,z,frame:0});SW.Audio.playExplosion();},
  clear(){this.list=[];},
  update(){for(let i=this.list.length-1;i>=0;i--){this.list[i].frame++;if(this.list[i].frame>SW.EXPLOSION_FRAMES)this.list.splice(i,1);}},
  render(ctx) {
    const strip = SW.Sprites && SW.Sprites.vfx && SW.Sprites.vfx.explodeStrip;
    const useStrip = strip && strip._ready && SW.Sprites.graphicsMode !== 'classic_1990' && ctx.drawImage;
    for (const ex of this.list) {
      const p=SW.Engine.screenPos(ex.x,ex.y,ex.z); if(!p) continue;
      const t=ex.frame/SW.EXPLOSION_FRAMES;
      if (useStrip) {
        const frameIdx = Math.min(15, Math.floor(t * 16));
        const sz = Math.max(12, Math.round(46 * p.scale));
        ctx.drawImage(strip, frameIdx * 64, 0, 64, 64, Math.round(p.sx - sz / 2), Math.round(p.sy - sz / 2), sz, sz);
      } else {
        const radius=t*15*p.scale;
        ctx.globalAlpha=1-t;
        ctx.fillStyle=t<0.3?'#ffff00':t<0.6?'#ff6600':'#ff0000';
        ctx.beginPath();ctx.arc(p.sx,p.sy,Math.max(1,radius),0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=1;
      }
    }
  }
};

SW.Carrier = {
  x:SW.CARRIER_X,y:SW.CARRIER_Y,z:SW.CARRIER_Z,visible:false,friendlyHits:0,
  heading: 0.35, pitchAngle: 0.08,
  init(){this.x=SW.CARRIER_X;this.y=SW.CARRIER_Y;this.z=SW.CARRIER_Z;this.visible=false;this.friendlyHits=0;this.heading=0.35;},
  onFriendlyHit() {
    this.friendlyHits++;
    if (this.friendlyHits === 1) {
      SW.Comm.add("TRÄGER: Stellen Sie das Feuer auf den eigenen Träger ein! Formular 66-F!");
    } else if (this.friendlyHits === 2) {
      SW.Comm.add("COMMANDER: Noch ein Treffer auf mein Flugdeck und die Bordgeschütze antworten!");
    } else {
      SW.Comm.add("TRÄGER: Bordgeschütz-Erwiderung nach Dienstvorschrift 1984 ausgelöst.");
      const dx=SW.Player.x-this.x, dy=SW.Player.y-this.y, dz=SW.Player.z-this.z;
      const len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
      SW.Projectiles.add({x:this.x,y:this.y,z:this.z,dx:dx/len,dy:dy/len,dz:dz/len,speed:SW.ENEMY_LASER_SPEED*1.3,friendly:false,damage:18,life:90});
    }
  },
  canDock() {
    if (!this.visible || !SW.Player) return false;
    const dz = Math.abs(this.z - SW.Player.z);
    return dz < 220;
  },
  render(ctx) {
    if (!this.visible) return;
    const p=SW.Engine.project(this.x,this.y,this.z); if(!p) return;
    const P = SW.Player || { x: 0, y: 0, z: 0 };
    const dx = P.x - this.x, dy = P.y - this.y, dz = P.z - this.z;
    const h = this.heading + ((SW.Game && SW.Game.frame) || 0) * 0.0015;
    const carrierAtlas = (SW.Sprites && SW.Sprites.getCarrierAtlasKey) ? SW.Sprites.getCarrierAtlasKey() : 'fax_traegodie';
    const postingName = (SW.Transfers && SW.Transfers.getCurrentPosting) ? SW.Transfers.getCurrentPosting().name : 'TCS FAX-TRAGÖDIE';
    const lightInfo = (SW.Sprites && SW.Sprites.computeDynamicLight) ? SW.Sprites.computeDynamicLight(this.x, this.y, this.z) : null;
    SW.Sprites.drawMultiAngle(ctx, carrierAtlas, p.sx, p.sy, p.scale * 1.4, dx, dy, dz, h, this.pitchAngle, SW.Sprites.carrier, 110, lightInfo);
    // Green Landing Approach Corridor indicator when in range
    const distZ = Math.round(this.z - P.z);
    if (distZ > 10 && distZ < 550 && ctx.strokeRect) {
      ctx.save();
      ctx.fillStyle = distZ < 220 ? '#00ff88' : '#57c8df';
      ctx.font = '4px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(distZ < 220 ? (postingName + ' [L: LANDEN]') : (postingName + ' (' + distZ + 'm)'), p.sx, p.sy - Math.max(14, 34 * p.scale));
      ctx.restore();
    }
  }
};

// ===== WINGMAN "SECHS" / "WORKER-7" & IN-FLIGHT SQUADRON ORDERS =====
SW.Wingman = {
  active:false, x:0,y:0,z:0,
  offX:-60, offY:20, offZ:80,
  orderMode:'form', // 'form' | 'attack' | 'defend'
  heading:0, pitchAngle:0,
  fireTimer:120, chatterTimer:3600, _hitCd:0,
  get alive() { return this.active; },
  set alive(v) { this.active = !!v; },
  get mode() { return this.orderMode; },
  set mode(v) { this.orderMode = v; },
  reset(){ this.active=false; this.orderMode='form'; },
  init() {
    if (SW.Game._simMode) return;
    this.active=true;
    this.orderMode='form';
    this.x=SW.Player.x+this.offX; this.y=SW.Player.y+this.offY; this.z=SW.Player.z+this.offZ;
    this.fireTimer=120; this.chatterTimer=3600; this._hitCd=0;
    const isHermes = SW.World && SW.World.postingId === 'tcs-hermes';
    SW.Comm.add(isHermes
      ? "SECHS: KIWI-Schwarm-Link steht. Worker-7 und ich halten deine linke Flanke."
      : "SECHS: Flugdrei, ich bin bei dir. Vorn-links. Halte Funkdisziplin.");
  },
  order(cmd) {
    if (!this.active) return;
    if (cmd === 'attack') {
      this.orderMode = 'attack';
      SW.Comm.add('SECHS: Verstanden! Greife dein Ziel an.', 'squadron');
    } else if (cmd === 'form') {
      this.orderMode = 'form';
      SW.Comm.add('SECHS: Schließe auf deine Flanke auf. Formation eng.', 'squadron');
    } else if (cmd === 'defend') {
      this.orderMode = 'defend';
      SW.Comm.add('SECHS: Decke den Träger. Keiner kommt durch.', 'squadron');
    } else if (cmd === 'taunt') {
      const taunts = [
        'FUNK AN FEIND: Ihr Fluggerät verstößt gegen Sektor-Abgasnorm 4-B. Stellen Sie den Betrieb ein!',
        'FUNK AN FEIND: Hier spricht das Sternenkorps. Haben Sie einen gültigen Parkausweis für Sektor 7?',
        'SECHS: Hey Pirat! Deine Mutter fliegt ohne Formular 83-B!',
        'FUNK AN FEIND: Bitte halten Sie die Position, bis unsere Laser Ihre Beschwerde bearbeitet haben.'
      ];
      SW.Comm.add(taunts[Math.floor(Math.random() * taunts.length)], 'public');
    }
  },
  update(frame) {
    if (!this.active) return;
    const p=SW.Player;
    const prevX = this.x, prevY = this.y;
    // Formation nachführen (verzögert, nicht teleportiert) — keeps z within Player.z + offZ ± 20 for smoke test!
    let targetX = p.x + this.offX;
    let targetY = p.y + this.offY;
    const eTarget = SW.Enemies.getSelectedTarget ? SW.Enemies.getSelectedTarget() : null;
    if (this.orderMode === 'attack' && eTarget) {
      targetX = p.x + Math.max(-90, Math.min(90, (eTarget.x - p.x) * 0.5));
      targetY = p.y + Math.max(-60, Math.min(60, (eTarget.y - p.y) * 0.5));
    }
    this.x += (targetX - this.x)*0.08;
    this.y += (targetY - this.y)*0.08;
    this.z += (p.z+this.offZ-this.z)*0.15;
    this.heading = Math.atan2(this.x - prevX, 1.5);
    this.pitchAngle = Math.max(-0.4, Math.min(0.4, -(this.y - prevY) * 0.25));

    // Deckung: feuert auf den nächsten Gegner
    this.fireTimer--;
    if (this.fireTimer<=0) {
      let best=null, bd=Infinity;
      for (const e of SW.Enemies.list) {
        if (!e.alive || e.civilian) continue;
        const d=(e.x-this.x)*(e.x-this.x)+(e.y-this.y)*(e.y-this.y)+(e.z-this.z)*(e.z-this.z);
        if (d<bd) { bd=d; best=e; }
      }
      if (best && best.z>this.z) {
        const spreadX = (Math.random() - 0.5) * 8;
        const spreadY = (Math.random() - 0.5) * 6;
        const dx=(best.x + spreadX)-this.x, dy=(best.y + spreadY)-this.y, dz=best.z-this.z, len=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
        SW.Projectiles.add({x:this.x,y:this.y,z:this.z,dx:dx/len,dy:dy/len,dz:dz/len,speed:SW.LASER_SPEED,friendly:true,damage:SW.LASER_DAMAGE*0.75,life:95});
        SW.Audio.playLaser();
        this.fireTimer=(this.orderMode==='attack'?45:80)+Math.random()*50;
      } else this.fireTimer=40;
    }
    this.chatterTimer--;
    // Deutlich weniger Idle-Gespräche im Flug (nur alle 60-90 Sekunden statt alle 15s)
    if (this.chatterTimer<=0) {
      this.chatterTimer=3600+Math.random()*2400;
      const lines=SW.Dialogues.wingmanIdle;
      if (lines&&lines.length) SW.Comm.add("SECHS: "+lines[Math.floor(Math.random()*lines.length)]);
    }
    if (this._hitCd>0) this._hitCd--;
  },
  onPlayerHit(frame) {
    if (!this.active||this._hitCd>0) return;
    this._hitCd=600;
    SW.Comm.add("SECHS: Treffer! Ich decke dich.");
  },
  onFirstKill() {
    if (!this.active) return;
    SW.Comm.add("SECHS: Einer weniger. Guter Schuss.");
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
    const P = SW.Player || { x: 0, y: 0, z: 0 };
    const dx = P.x - this.x, dy = P.y - this.y, dz = P.z - this.z;
    const wingAtlas = (SW.World && SW.World.postingId === 'tcs-hermes') ? 'hermes_drone' : 'hornet_ace';
    const lightInfo = (SW.Sprites && SW.Sprites.computeDynamicLight) ? SW.Sprites.computeDynamicLight(this.x, this.y, this.z) : null;
    if (SW.Engine.view.mode === 'topdown') {
      SW.Sprites.draw(ctx, SW.Sprites.playerShip, p.sx, p.sy, p.scale*0.9);
    } else {
      SW.Sprites.drawMultiAngle(ctx, wingAtlas, p.sx, p.sy, p.scale*0.95, dx, dy, dz, this.heading, this.pitchAngle, SW.Sprites.playerShip, undefined, lightInfo);
      const vfx = (SW.Sprites && SW.Sprites.vfx) || {};
      if (vfx.engineFlare && vfx.engineFlare._ready && ctx.drawImage) {
        const fSz = Math.max(4, Math.min(18, Math.round(11 * p.scale)));
        ctx.drawImage(vfx.engineFlare, Math.round(p.sx - fSz / 2), Math.round(p.sy - fSz / 2), fSz, fSz);
      }
    }
    ctx.fillStyle='#4488ff';
    ctx.fillRect(Math.round(p.sx)-2, Math.round(p.sy)-Math.round(12*p.scale)-3, 4, 2);
  }
};
