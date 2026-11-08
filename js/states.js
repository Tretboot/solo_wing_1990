// ===== SOLO WING 1990 — GAME STATE MACHINE =====
// BAR → BRIEFING → TAKEOFF → COCKPIT → LANDING → DEBRIEFING

SW.Game = {
  state:'BAR',score:0,victory:false,secretEnding:false,frame:0,mission:null,_simMode:false,_akademieBestanden:false,
  setState(s) {
    this.state=s;
    // Musik-Pause: beim Verlassen des INTROS stoppt die Intro-Musik
    if (s!=='INTRO' && SW.Audio) SW.Audio.stopMusic();
    if (s==='INTRO') { SW.Intro.init(); }
    if (s==='AKADEMIE') { SW.Akademie.init(); }
    if (s==='SHIP') { if(!SW._shipInit) { SW.Ship.init(this.mission?.id||'m1'); SW._shipInit=true; } }
    if (s==='BRIEFING') { const b=SW.Dialogues.getBriefing(this.mission?.id||'m1');SW.Briefing.start(b); }
    if (s==='BRIEFING_BOARD') {
      if (!this.mission || this._simMode || SW.Enemies.missionData !== this.mission) {
        this.prepareMission((this.mission && this.mission.id) || 'm1');
      }
      SW.BriefingBoard.start(this.mission || SW.Missions.list[0]);
    }
    if (s==='TAKEOFF') SW.Flight.start('takeoff');
    if (s==='LANDING') SW.Flight.start('landing');
    if (SW.Audio && SW.Audio.syncContext) {
      if (s === 'SHIP') {
        SW.Audio.syncContext(SW.Ship ? SW.Ship.currentRoom : 'bar');
      } else if (s === 'DEBRIEFING') {
        const isMedal = this.victory && ((this.totalKills || 0) >= 3 || (this.mission && this.mission.id === 'm5_speer'));
        if (isMedal) SW.Audio.playMod('medalceremony');
        else SW.Audio.syncContext('debriefing', { victory: this.victory });
      } else {
        SW.Audio.syncContext(s, { victory: this.victory });
      }
    }
  },
  // Bereitet eine Mission im Feld vor (ohne State-Wechsel auf SHIP),
  // behebt den Phantom-Start-Bug beim Abflug vom Flugdeck.
  prepareMission(id) {
    this.mission=SW.Missions.get(id || (this.mission && this.mission.id) || 'm1');
    this.score=0;this.victory=false;this.secretEnding=false;this.frame=0;this._simMode=false;
    SW.Player.init();SW.Engine.initStars();
    SW.Projectiles.clear();SW.Explosions.clear();SW.Comm.clear();
    SW.Collision.reset();SW.Enemies.init(this.mission);
    SW.Autopilot.init(this.mission.navPoints||[]);
    SW.Carrier.init();
    if (SW.Wingman) SW.Wingman.reset();  // IM RAUM: Sechs startet erst nach dem Takeoff
  },
  startMission(id) {
    this.prepareMission(id);
    SW.Ship.init(this.mission.id);
    this.setState('SHIP');
  },
  // Startet eine dynamisch generierte Mission (z.B. Sektor-zu-Sektor Transit / Privateer-Konvoi)
  startMissionWithData(missionData) {
    if (!missionData) return;
    this.mission = missionData;
    this.score = 0; this.victory = false; this.secretEnding = false; this.frame = 0; this._simMode = false;
    SW.Player.init(); SW.Engine.initStars();
    SW.Projectiles.clear(); SW.Explosions.clear(); SW.Comm.clear();
    SW.Collision.reset(); SW.Enemies.init(this.mission);
    SW.Autopilot.init(this.mission.navPoints || []);
    SW.Carrier.init();
    if (missionData.isTransit && SW.Carrier) {
      SW.Carrier.z = 1150;
      SW.Carrier.visible = true;
    }
    if (SW.Wingman) SW.Wingman.reset();
    if (missionData.systemId && SW.World) SW.World.systemId = missionData.systemId;
    this.setState('JUMP');
    this.startJump();
  },
  // ===== RESIGNATION (Zwischensequenz: Dienst Quittieren -> Privateer-Modus) =====
  startResignation() {
    this._resignT = 0;
    this._resignLineSpoken = -1;
    SW.Engine.initStars();
    this.state = 'RESIGNATION';
    if (SW.Audio && SW.Audio.playFax) SW.Audio.playFax();
  },
  updateResignation() {
    this._resignT = (this._resignT || 0) + 1;
    const t = this._resignT;
    if (SW.Engine && SW.Engine.updateStars) SW.Engine.updateStars();
    if (SW.TTS) {
      if (t === 5 && this._resignLineSpoken < 0) {
        this._resignLineSpoken = 0;
        SW.TTS.speak('Formular 99-P gestempelt. Sie sind ab sofort Zivilist. Nehmen Sie Ihre Abfindung.', 'COMMANDER');
      } else if (t === 95 && this._resignLineSpoken < 1) {
        this._resignLineSpoken = 1;
        const gName = (SW.CarrierEconomy && SW.CarrierEconomy.giftedShipName) || 'Kiste 47';
        SW.TTS.speak('Ich hab dir die ' + gName + ' startklar geschweißt. Flieg vorsichtig zwischen den Sektoren!', 'BOLT');
      } else if (t === 185 && this._resignLineSpoken < 2) {
        this._resignLineSpoken = 2;
        SW.TTS.speak('Freier Sektorflug aktiv. Die Sprungtore gehören dir.', 'BORDCOMPUTER');
      }
    }
    if (t > 280) {
      this.setState('SHIP');
    }
  },
  renderResignation(ctx) {
    const t = this._resignT || 0;
    const eco = SW.CarrierEconomy || {};
    const sev = eco._lastSeverance || 2200;
    const mCount = eco._missionsAtExit || 0;
    const giftClass = eco.giftedShip || 'frachter';
    const giftName = eco.giftedShipName || 'Kiste 47 (Tarsus-Frachter)';
    const giftDesc = eco.giftedShipDesc || 'Ausgemustertes Transportschiff aus Reservebucht C';
    const spec = (SW.Player && SW.Player.SHIP_CLASSES && SW.Player.SHIP_CLASSES[giftClass]) || { atlasKey: 'freighter', accent: '#dd9944' };

    ctx.fillStyle = '#06080e';
    ctx.fillRect(0, 0, SW.W, SW.H);

    if (t < 90) {
      // SZENE 1: Büro des Commanders — Formular 99-P & Abfindungs-Scheck
      ctx.fillStyle = '#141820';
      ctx.fillRect(0, 0, SW.W, SW.H);
      ctx.fillStyle = '#241c14';
      ctx.fillRect(0, SW.H - 58, SW.W, 58);
      if (SW.NPC) {
        SW.NPC.drawFace(ctx, 'commander', 82, 118, 44, { showBody: true, showUniform: true, pose: 'standing', animated: true, frame: t });
      }
      // Formular 99-P auf dem Tisch
      const fx = 148, fy = 26, fw = 152, fh = 126;
      ctx.fillStyle = '#e8e2cc';
      ctx.fillRect(fx, fy, fw, fh);
      ctx.strokeStyle = '#665533';
      ctx.strokeRect(fx, fy, fw, fh);
      ctx.fillStyle = '#222';
      ctx.font = 'bold 6px monospace';
      ctx.fillText('FORMULAR 99-P — ENTLASSUNG', fx + 8, fy + 14);
      ctx.font = '5px monospace';
      ctx.fillStyle = '#444';
      ctx.fillText('PILOT: ' + ((SW.World && SW.World.pilotName) || 'FLUG DREI'), fx + 8, fy + 28);
      ctx.fillText('EINSÄTZE GEFLEGT: ' + mCount, fx + 8, fy + 40);
      ctx.fillText('ABFINDUNG: ' + sev + ' CR', fx + 8, fy + 52);
      ctx.fillText('ÜBERLASSENES SCHIFF:', fx + 8, fy + 66);
      ctx.fillStyle = '#005522';
      ctx.font = 'bold 5px monospace';
      ctx.fillText(giftName.substring(0, 26), fx + 8, fy + 76);

      // Roter Stempel "QUITTIERT" (knallt bei Frame 28 drauf)
      if (t > 26) {
        ctx.save();
        ctx.translate(fx + 76, fy + 100);
        ctx.rotate(-0.14);
        ctx.strokeStyle = '#cc2222';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-44, -10, 88, 20);
        ctx.fillStyle = '#cc2222';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DIENST QUITTIERT', 0, 3);
        ctx.restore();
      }
      ctx.fillStyle = '#ffcc44';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AKT I: ENTLASSUNG AUS DEM STERNENKORPS', SW.CX, 14);
      ctx.textAlign = 'left';
    } else if (t < 185) {
      // SZENE 2: Hangar-Übergabe — Bolt übergibt das geschenkte Schiff
      ctx.fillStyle = '#12151e';
      ctx.fillRect(0, 0, SW.W, SW.H);
      ctx.fillStyle = '#222632';
      ctx.fillRect(0, SW.H - 44, SW.W, 44);
      // rotierendes 3D-Schiff auf der Hangar-Drehbühne
      const yaw = (t - 90) * 0.045;
      if (SW.Sprites && SW.Sprites.drawMultiAngle) {
        SW.Sprites.drawMultiAngle(ctx, spec.atlasKey || 'freighter', SW.CX + 18, 92, 84, yaw, 0.22, spec.accent || '#dd9944', SW.Sprites.playerShip);
      }
      if (SW.NPC) {
        SW.NPC.drawFace(ctx, 'bolt', 56, 128, 38, { showBody: true, showUniform: true, pose: 'standing', animated: true, frame: t });
      }
      ctx.fillStyle = '#ffaa33';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AKT II: SCHIFFSÜBERGABE IM HANGAR — ' + giftName.toUpperCase(), SW.CX, 16);
      ctx.fillStyle = '#aaddff';
      ctx.font = '5px monospace';
      ctx.fillText(giftDesc, SW.CX, 27);
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(16, SW.H - 38, SW.W - 32, 26);
      ctx.strokeStyle = '#ffaa33';
      ctx.strokeRect(16, SW.H - 38, SW.W - 32, 26);
      ctx.fillStyle = '#ffcc44';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('BOLT: „Ausgemustert laut Akte, aber der Reaktor schnurrt! Gehört jetzt dir.“', 22, SW.H - 26);
      ctx.fillStyle = '#cccccc';
      ctx.font = '5px monospace';
      ctx.fillText('STARTKAPITAL: ' + ((SW.CarrierEconomy && SW.CarrierEconomy.credits) || sev) + ' CR  |  EINSATZBONUS FÜR ' + mCount + ' MISSIONEN', 22, SW.H - 16);
    } else {
      // SZENE 3: Abflug in den freien Sektor-Raum
      if (SW.Engine && SW.Engine.renderStars) SW.Engine.renderStars(ctx, 18, -6);
      const p = (t - 185) / 95;
      const carrierKey = (SW.Sprites && SW.Sprites.getCarrierAtlasKey) ? SW.Sprites.getCarrierAtlasKey() : 'fax_traegodie';
      if (SW.Sprites && SW.Sprites.drawMultiAngle) {
        // Träger bleibt im Hintergrund zurück
        SW.Sprites.drawMultiAngle(ctx, carrierKey, 88 - p * 25, 72, 95 * (1 - p * 0.35), 0.7, 0.15, '#5588aa', SW.Sprites.carrier);
        // Eigenes Schiff fliegt dem Sprungtor entgegen
        SW.Sprites.drawMultiAngle(ctx, spec.atlasKey || 'freighter', SW.CX + 20 + p * 35, 108 - p * 12, 58 + p * 18, Math.PI + 0.35, -0.12, spec.accent || '#dd9944', SW.Sprites.playerShip);
      }
      ctx.fillStyle = '#44ffaa';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('FREIER PRIVATEER-MODUS AKTIVIERT', SW.CX, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = '6px monospace';
      ctx.fillText('[K] Sektorkarte & Handel   |   [F] Sektor-Transitflug starten   |   [N]/[J] Sprung im Cockpit', SW.CX, SW.H - 24);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = '#888';
    ctx.font = '5px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[LEERTASTE: WEITER]', SW.W - 8, SW.H - 4);
    ctx.textAlign = 'left';
  },
  getEndingType() {
    if (!this.victory) return 'tod';
    if (this.secretEnding) return 'geheim';
    const mId = (this.mission && this.mission.id) || (SW.Ship && SW.Ship.selectedMissionId) || '';
    if (mId === 'm6a') return 'privateer';
    if (mId === 'm6b') return 'neurofax';
    const isM4 = mId === 'm4' ||
      (SW.World && SW.World.missionResults && SW.World.missionResults.m4 === 'sieg') ||
      (SW.SmartDialogues && SW.SmartDialogues._state && SW.SmartDialogues._state.missions && SW.SmartDialogues._state.missions.m4 === 'sieg');
    const hasSecret = SW.Quests && (
      SW.Quests.getFlag('widerspruch_eingelegt') ||
      SW.Quests.getFlag('klo_wahrheit_gehoert') ||
      (SW.Quests.getFlag('kaltkammer_gesichert') && SW.Quests.getFlag('akte_gelesen_sechs'))
    );
    return (isM4 && hasSecret) ? 'geheim' : 'sieg';
  },
  triggerVictory() {
    setTimeout(()=>{
      if (SW.Player.alive&&this.state==='COCKPIT') {
        // SIM-MODUS: Akademie-Prüfung bestanden
        if (this._simMode) { SW.Akademie.bestanden(); return; }
        this.victory = true;
        if(SW.World) { SW.World.missionResult='sieg'; SW.World.systemId = this.missionSystemId(); }
        if (SW.SmartDialogues && this.mission) SW.SmartDialogues.noteMission(this.mission.id, 'sieg');
        SW.Comm.add("COMMANDER: Sie kommen zurück. Beförderung zum Gefreiten. Per Fax.");
        if (SW.Quests) {
          SW.Quests.tick({typ:'mission', ergebnis:'sieg'});
          if (SW.Quests.flight && this.mission) SW.Quests.flight({typ:'mission', missionId:this.mission.id, ergebnis:'sieg'});
        }
        // Auto-advance to next campaign mission
        const nextMap = { m1: 'm2', m2: 'm3', m3: 'm4', m4: 'm5', m5: 'm6b' };
        if (this.mission && nextMap[this.mission.id] && SW.Ship) {
          SW.Ship.selectedMissionId = nextMap[this.mission.id];
        }
        if (this.mission && this.mission.id === 'm4' && SW.Quests) {
          SW.Quests.setFlag('kaltkammer_gesichert', true);
          if (SW.Quests.getFlag('widerspruch_eingelegt') || SW.Quests.getFlag('klo_wahrheit_gehoert') || SW.Quests.getFlag('akte_gelesen_sechs')) {
            this.secretEnding = true;
          }
        }
        if (this.mission && this.mission.id === 'm5' && SW.Quests) {
          SW.Quests.setFlag('hermes_mission_complete', true);
        }
        if (SW.Newspaper && SW.Newspaper.generate && this.mission) {
          SW.Newspaper.generate({
            missionId: this.mission.id,
            ergebnis: 'sieg',
            kills: Math.max(1, Math.floor(this.score / 100)),
            wingmanDown: false,
            heardRap: this.mission.id === 'm4'
          });
        }
        setTimeout(()=>{ if(SW.Player.alive) this.setState('LANDING'); },2000);
      }
    },500);
  },
  triggerDeath() {
    setTimeout(()=>{
      if (!SW.Player.alive&&this.state==='COCKPIT') {
        // SIM-MODUS: Akademie-Prüfung nicht bestanden
        if (this._simMode) { SW.Akademie.durchgefallen(); return; }
        this.victory=false;
        this.secretEnding=false;
        if(SW.World) {
          SW.World.missionResult='tod';
          SW.World.systemId = this.missionSystemId();
          SW.World.nachrufe.push({name:'Flug Drei',text:'Gefallen im Dienst. ' + this.score + ' Punkte. ' + SW.World._nachrufText('Flug Drei')});
        }
        if (SW.SmartDialogues && this.mission) SW.SmartDialogues.noteMission(this.mission.id, 'tod');
        if (SW.Quests) {
          SW.Quests.tick({typ:'mission', ergebnis:'tod'});
          if (SW.Quests.flight && this.mission) SW.Quests.flight({typ:'mission', missionId:this.mission.id, ergebnis:'tod'});
        }
        if (SW.Newspaper && SW.Newspaper.generate && this.mission) {
          SW.Newspaper.generate({
            missionId: this.mission.id,
            ergebnis: 'tod',
            kills: Math.floor(this.score / 100),
            wingmanDown: true,
            heardRap: this.mission.id === 'm4'
          });
        }
        if (SW.Wingman) SW.Wingman.onDeath();  // IM RAUM: ...Funkstille.
        this.setState('DEBRIEFING');
      }
    },2000);
  },
  // ===== HANGAR (nach Landung) =====
  // Bolt geht zum Schiff und kommentiert — je nach Schadenslage.
  startHangar() {
    this._hangarTimer = 0;
    this._hangarRepairHeld = false;
    this._hangarRepaired = false;
    this._hangarLines = this._hangarDialog();
    this.setState('HANGAR');
  },
  repairShip() {
    if (this.state !== 'HANGAR') return false;
    const damaged=Object.values(SW.Player.systems).some(value => value<100);
    if (!damaged) {
      SW.Comm.add('BOLT: Alles im Soll. Ich prüfe es trotzdem. Zweimal.');
      return false;
    }
    SW.Player.repairSystems();
    this._hangarRepaired=true;
    SW.Comm.add('BOLT: Antrieb, Waffen, Schilde und Sensoren instandgesetzt.');
    return true;
  },
  _hangarDialog() {
    const f = SW.Player.frontShield, r = SW.Player.rearShield;
    const min = Math.min(f, r);
    const systemLabels={engines:'ANTRIEB',weapons:'WAFFEN',shields:'SCHILDE',sensors:'SENSOREN'};
    const damagedSystems=Object.keys(systemLabels).filter(key => SW.Player.systems[key]<100);
    if (damagedSystems.length) {
      return [
        'Diagnose: '+damagedSystems.map(key => systemLabels[key]).join(', ')+' beschädigt.',
        'Bolt repariert im Hangar. R drücken, bevor du weiterfliegst.'
      ];
    }
    if (min >= 80) {
      return [
        'Rein mit dir. Kein Kratzer. Kein Öl. Zu sauber.',
        'Ich überprüfe trotzdem alles. Zweimal. Das ist Vorschrift. Und Faulheit.'
      ];
    }
    if (min >= 40) {
      return [
        'Ah. Formular 77-R. Ausgefüllt? Nein? Also doch. Jetzt.',
        'Die Abschirmung meckert. Ich meckere lauter. Das ist mein Job.'
      ];
    }
    return [
      'Das Schiff blutet. Ich sag\'s euch: DAS Schiff blutet. Und ich soll\'s flicken?',
      'Vorderer Schild: ' + f + '. Hinterer: ' + r + '. Das Formular fragt nach beidem. In Teil B.',
      'Ich schweiße das zusammen. Mutters streitet sich mit dem Metall. Ich streite mit ihr.'
    ];
  },
  // ===== ARRIVAL (Zwischenszene: Transfer zum Träger) =====
  // Nach dem Akademie-Ergebnis: Der Träger kommt näher, kurze Begrüßung,
  // dann entlassen in die Räume (BAR → SHIP).
  startArrival() {
    this._arrivalT = 0;
    SW.Engine.initStars();
    if (SW.Player) SW.Player.repairSystems();
    if (SW.World) SW.World.shipSystems = (SW.Player && SW.Player.defaultSystems) ? SW.Player.defaultSystems() : { engines: 100, weapons: 100, shields: 100, sensors: 100 };
    const n = (SW.World && SW.World.pilotName) || 'FLUG DREI';
    if (SW.TTS) SW.TTS.speak('Willkommen an Bord, ' + n + '. Der Aufzug zum Stab ist in Arbeit defekt. Bitte nehmen sie die Treppe.', 'COMMANDER');
    this.state = 'ARRIVAL';
  },
  renderArrival(ctx) {
    const t = this._arrivalT || 0;
    const n = (SW.World && SW.World.pilotName) || 'FLUG DREI';
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    SW.Engine.renderStars(ctx,0,0);
    // Träger: fliegt von fern nah heran (0.15 → 1.0 in 150 Frames)
    const p = Math.min(1, t/150);
    const s = 0.15 + p*0.85;
    const cx=SW.CX, cy=SW.H*0.52;
    const carrierKey = (SW.Sprites && SW.Sprites.getCarrierAtlasKey) ? SW.Sprites.getCarrierAtlasKey() : 'fax_traegodie';
    const drewAtlas = (SW.Sprites && SW.Sprites.drawMultiAngle && SW.Sprites.graphicsMode !== 'classic_1990')
      ? SW.Sprites.drawMultiAngle(ctx, carrierKey, cx, cy - 8, 170 * s, 1.15 - p * 0.35, 0.15, '#5588aa', SW.Sprites.carrier)
      : false;
    if (!drewAtlas) {
      ctx.save();
      ctx.translate(cx,cy); ctx.scale(s,s);
      ctx.fillStyle='#3a4a5a';
      ctx.fillRect(-160,-8,320,16);            // Rumpf
      ctx.fillStyle='#2f3d4a';
      ctx.fillRect(-120,-16,240,8);            // Flugdeck
      ctx.fillStyle='#46586a';
      ctx.fillRect(40,-34,50,18);              // Insel/Brücke
      ctx.fillStyle='#5a7088';
      ctx.fillRect(55,-42,10,8);               // Antenne
      ctx.fillStyle='#ffcc00';
      for(let i=-140;i<150;i+=40) ctx.fillRect(i,-14,4,2);  // Deck-Lichter
      ctx.fillStyle=t%20<10?'#ff6600':'#ff9900';
      ctx.fillRect(-152,0,8,4); ctx.fillRect(144,0,8,4);    // Triebwerke
      ctx.fillStyle='#0af';
      ctx.fillRect(44,-30,6,4);                // Brücken-Licht
      ctx.restore();
    }
    // Text
    ctx.textAlign='center';
    ctx.fillStyle='#0f0';ctx.font='bold 12px monospace';
    ctx.fillText('TRANSFER',SW.CX,40);
    ctx.fillStyle='#666';ctx.font='6px monospace';
    ctx.fillText('STERNENKORPS — ' + SW.Transfers.getCurrentPosting().name + ' — FORMULAR 1-A',SW.CX,52);
    if (t > 60) {
      ctx.fillStyle='#fff';ctx.font='bold 10px monospace';
      ctx.fillText('WILLKOMMEN AN BORD, ' + n + '.',SW.CX,95);
    }
    if (t > 150) {
      ctx.fillStyle='#aaa';ctx.font='7px monospace';
      ctx.fillText('Quartier 14 ist frei. Schlüssel liegt bei Sechs.',SW.CX,120);
      ctx.fillText('Der Aufzug zum Stab ist in Arbeit leider defekt. Nehmen sie die Treppe.',SW.CX,133);
    }
    if (t > 90) {
      const blink=Math.floor(Date.now()/500)%2===0;
      ctx.fillStyle=blink?'#fff':'#666';ctx.font='8px monospace';
      ctx.fillText('[ LEERTASTE: ANNEHMEN ]',SW.CX,SW.H-15);
    }
    ctx.textAlign='left';
  },
  // ===== JUMP (Zwischenszene: Sprung zum Einsatz-System) =====
  // Backdrop: Hyperspace-Streaks + Ziel-Planet in System-Farbe.
  // Story läuft mit TTS, während das Schiff fliegt. Handoff: Briefing-Tafel → JUMP → Takeoff.
  missionSystemId() {
    if (this.mission && this.mission.systemId) return this.mission.systemId;
    const s = SW.Systems.find(s=>s.missionId===(this.mission&&this.mission.id));
    return s ? s.id : 's1';
  },
  // Z-Sternenfeld: Sterne bewegen sich aus der Mitte heraus (Flug nach vorn), NIE vertikal
  _jumpMakeStars(seed) {
    const stars = [];
    let s = (seed * 9301 + 49297) % 233280;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i=0;i<70;i++) stars.push({x:rnd()*2-1, y:rnd()*2-1, z:0.05+rnd()*0.95, b:0.3+rnd()*0.7});
    return stars;
  },
  _jumpStarSpeed() {
    return {1:0, 2:0.004, 3:0.012, 4:0, 5:0, 6:0.02, 7:0}[this._jumpPhase] || 0;
  },
  _jumpSetLine(i) {
    const lines = this._jumpLines||[];
    if (i > this._jumpLineIdx && i < lines.length) {
      this._jumpLineIdx = i;
      if (SW.TTS) SW.TTS.speak(lines[i].text, lines[i].npc);
    }
  },
  startJump() {
    const mid = (this.mission && this.mission.id) || 'm1';
    this._jumpSystem = SW.Systems.find(s=>s.id===this.missionSystemId()) || SW.Systems[0];
    this._jumpLines = SW.Dialogues.getJump(mid) || [];
    this._jumpPhase = 1;      // 1 Abflug, 2 Blase, 3 Sprung, 4 Wipe, 5 Ankunft, 6 Austritt, 7 Hold
    this._jumpPhaseT = 0;
    this._jumpT = 0;
    this._starsA = this._jumpMakeStars(7);    // Abflug-System
    this._starsB = this._jumpMakeStars(42);   // Ziel-System (andere Sternenverteilung)
    this._jumpLineIdx = -1;
    this.state = 'JUMP';
    SW.Audio.playCommBeep();
  },
  // 6-Phasen-State-Machine (Regie: WC-Stil Sprung)
  updateJump() {
    const G = this;
    G._jumpT++;
    G._jumpPhaseT++;
    const P = G._jumpPhase;
    if (G._jumpPhaseT === 1) {
      if (P === 1) G._jumpSetLine(0);
      if (P === 4) SW.Audio.playJumpWhoosh();   // Woosh im Sprungmoment
      if (P === 5) G._jumpSetLine(1);
      if (P === 6) G._jumpSetLine(2);
    }
    const DUR = {1:110, 2:70, 3:50, 4:55, 5:110, 6:80};
    if (P >= 1 && P <= 6 && G._jumpPhaseT > DUR[P]) { G._jumpPhase++; G._jumpPhaseT = 0; }
    // Sterne auf Z-Achse (nur aktives Set)
    const stars = P <= 4 ? G._starsA : G._starsB;
    const sp = this._jumpStarSpeed();
    if (sp > 0) for (const st of stars) { st.z += sp; if (st.z > 1) { st.z = 0.05; st.x = Math.random()*2-1; st.y = Math.random()*2-1; } }
  },
  _jumpShipPos() {
    const P = this._jumpPhase, t = this._jumpPhaseT, y = 90;
    if (P === 1) return {x: -220 + (t/110)*380, y, visible: true, flame: false};              // Abflug: links → rechts
    if (P === 2) return {x: 160 + t*0.5, y, visible: true, flame: false};                     // Driften zur Blase
    if (P === 3) return {x: 195 + Math.pow(t/50, 2)*245, y, visible: t < 42, flame: true};    // Beschleunigt IN die Blase
    if (P === 6 && t >= 25) return {x: 160 + (t-25)*16, y, visible: t < 62, flame: true};     // Rasanter Austritt
    return {x: -999, y, visible: false, flame: false};
  },
  _jumpBubblePos() {
    const P = this._jumpPhase, t = this._jumpPhaseT;
    if (P === 2) return {x: 440, y: 90, r: 8 + (t/70)*32};                                    // Blase wächst
    if (P === 3) return {x: 440, y: 90, r: 40 + Math.sin((t/50)*Math.PI)*10};                 // pulsiert, Flash am Ende
    if (P === 4) return {x: 440, y: 90, r: 60};
    if (P === 6) {
      const r = t < 25 ? (t/25)*40 : Math.max(0, (1-(t-25)/30)*40);
      return {x: 160, y: 90, r};
    }
    return null;
  },
  renderJump(ctx) {
    const P = this._jumpPhase, t = this._jumpPhaseT;
    const sys = this._jumpSystem || SW.Systems[0];
    const arrival = P >= 5;
    // Hintergrund (Ankunft: leichter System-Tint)
    ctx.fillStyle = '#000'; ctx.fillRect(0,0,SW.W,SW.H);
    if (arrival) { ctx.globalAlpha = 0.07; ctx.fillStyle = sys.farbe; ctx.fillRect(0,0,SW.W,SW.H); ctx.globalAlpha = 1; }
    // Z-Sternenfeld (aus der Mitte heraus auf den Betrachter zu — kein "Regen")
    const stars = arrival ? this._starsB : this._starsA;
    for (const st of stars) {
      const sx = SW.CX + st.x*320*st.z, sy = SW.H/2 + st.y*110*st.z;
      if (sx < -4 || sx > SW.W+4 || sy < -4 || sy > SW.H+4) continue;
      ctx.fillStyle = 'rgba(255,255,255,' + (st.z*st.b).toFixed(2) + ')';
      const s = 0.5 + st.z*1.8;
      ctx.fillRect(sx, sy, s, s);
    }
    // Ziel-Planet (ab Ankunft, unten rechts, fade-in, mit Ringen, Kratern & Sektor-7-Basis)
    if (arrival) {
      const fade = Math.min(1, t/40);
      const px = SW.W-100, py = SW.H-40;
      ctx.save();
      ctx.globalAlpha = 0.55*fade;
      ctx.fillStyle = sys.farbe;
      ctx.beginPath(); ctx.arc(px, py, 85, 0, Math.PI*2); ctx.fill();
      // Atmosphären-Ring & planetare Ringe (Sektor 9 / 12)
      ctx.globalAlpha = 0.8*fade;
      ctx.strokeStyle = sys.farbe; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px, py, 90, 0, Math.PI*2); ctx.stroke();
      if (sys.id === 's2' || sys.id === 's3') {
        ctx.globalAlpha = 0.35*fade;
        ctx.beginPath(); ctx.ellipse(px, py, 118, 22, -0.25, 0, Math.PI*2); ctx.stroke();
      }
      // Oberflächendetails / Krater
      ctx.globalAlpha = 0.22*fade;
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(px-28, py-18, 14, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(px+16, py-36, 9, 0, Math.PI*2); ctx.fill();
      // Sektor 7: Militärische Sternenbasis im Orbit
      if (sys.id === 's1') {
        ctx.globalAlpha = 0.85*fade;
        const bx = px - 95, by = py - 70;
        ctx.fillStyle = '#2a3d52';
        ctx.fillRect(bx-14, by-2, 28, 4);
        ctx.fillRect(bx-4, by-10, 8, 20);
        ctx.strokeStyle = '#5588bb';
        ctx.beginPath(); ctx.arc(bx, by, 11, 0, Math.PI*2); ctx.stroke();
        ctx.fillStyle = (Math.floor(t/12)%2===0) ? '#00ffcc' : '#ffcc00';
        ctx.fillRect(bx-1, by-1, 2, 2);
      }
      ctx.restore();
    }
    // Jump-Blase (sternförmiges Portal, rotiert + pulsiert)
    const bub = this._jumpBubblePos();
    if (bub && bub.r > 0.5) {
      ctx.save();
      ctx.translate(bub.x, bub.y);
      ctx.rotate(t*0.04);
      ctx.fillStyle = 'rgba(160,220,255,0.15)';
      ctx.strokeStyle = 'rgba(190,235,255,0.9)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const spikes = 12;
      for (let i=0;i<spikes*2;i++) {
        const rr = i%2===0 ? bub.r : bub.r*0.55;
        const a = (i/(spikes*2))*Math.PI*2;
        const px = Math.cos(a)*rr, py = Math.sin(a)*rr;
        if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath(); ctx.arc(0,0,bub.r*0.25,0,Math.PI*2); ctx.fill();
      if (P === 3 && t > 38) {
        ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.9, (t-38)/12*0.9).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(0,0,bub.r+8,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
    // Träger (Seitenansicht / 80-View 3D Sprite)
    const ship = this._jumpShipPos();
    if (ship.visible) {
      const x = ship.x, y = ship.y;
      ctx.save();
      if (ship.flame) {
        ctx.fillStyle = 'rgba(140,200,255,0.8)';
        ctx.beginPath(); ctx.moveTo(x-52, y-2); ctx.lineTo(x-88-Math.random()*10, y+1); ctx.lineTo(x-52, y+5); ctx.closePath(); ctx.fill();
      }
      const carrierKey = (SW.Sprites && SW.Sprites.getCarrierAtlasKey) ? SW.Sprites.getCarrierAtlasKey() : 'fax_traegodie';
      const drewJumpCarrier = (SW.Sprites && SW.Sprites.drawMultiAngle && SW.Sprites.graphicsMode !== 'classic_1990')
        ? SW.Sprites.drawMultiAngle(ctx, carrierKey, x, y, 130, 1.45, 0.1, '#5588aa', SW.Sprites.carrier)
        : false;
      if (!drewJumpCarrier) {
        ctx.fillStyle = '#9aa3ad';
        ctx.beginPath();
        ctx.moveTo(x-92, y+6); ctx.lineTo(x+92, y+6); ctx.lineTo(x+84, y-1); ctx.lineTo(x-84, y-1);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#c3cad2';
        ctx.fillRect(x-88, y-3, 176, 2);
        ctx.fillStyle = '#7d8894';
        ctx.fillRect(x+18, y-13, 26, 10);
        ctx.fillStyle = '#9aa3ad';
        ctx.fillRect(x+26, y-17, 8, 4);
        ctx.fillStyle = '#ff4444'; ctx.fillRect(x+90, y+3, 2, 2);
        ctx.fillStyle = '#44ff44'; ctx.fillRect(x-92, y+3, 2, 2);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(x-2, y-4, 2, 2);
      }
      ctx.restore();
    }
    // Phase 4: Star-Wars-Wipe (weißer Kreis von der Blase aus)
    if (P === 4) {
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(440, 90, (t/55)*520, 0, Math.PI*2); ctx.fill();
    }
    // Phase 5: Weißes Überblenden ausblenden (weiche Ankunft)
    if (P === 5 && t < 25) {
      ctx.globalAlpha = 1 - t/25;
      ctx.fillStyle = '#fff'; ctx.fillRect(0,0,SW.W,SW.H);
      ctx.globalAlpha = 1;
    }
    // System-Name (Ankunft)
    if (P === 5) {
      const a = Math.min(1, t/30);
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
      ctx.fillText('ANKUNFT: ' + sys.name, SW.CX, 34);
      ctx.fillStyle = sys.farbe; ctx.font = '8px monospace';
      const cw = sys.char.split(' '); let cl = ''; const cls = [];
      for (const w of cw) { if((cl+w).length>60){cls.push(cl);cl=w+' ';} else {cl+=w+' ';} }
      cls.push(cl);
      for (let i=0;i<Math.min(cls.length,2);i++) ctx.fillText(cls[i].trim(), SW.CX, 50+i*10);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
    // Story-Box (unten)
    const lines = this._jumpLines||[];
    if (this._jumpLineIdx >= 0 && this._jumpLineIdx < lines.length) {
      const ln = lines[this._jumpLineIdx];
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(30, SW.H-52, SW.W-60, 32);
      ctx.strokeStyle = sys.farbe; ctx.lineWidth = 1; ctx.strokeRect(30, SW.H-52, SW.W-60, 32);
      ctx.fillStyle = sys.farbe; ctx.font = 'bold 7px monospace';
      ctx.fillText(ln.npc, 38, SW.H-42);
      ctx.fillStyle = '#0f0'; ctx.font = '7px monospace';
      const jw = ln.text.split(' '); let jl = ''; const jls = [];
      for (const w of jw) { if((jl+w).length>75){jls.push(jl);jl=w+' ';} else {jl+=w+' ';} }
      jls.push(jl);
      for (let i=0;i<Math.min(jls.length,2);i++) ctx.fillText(jls[i].trim(), 38, SW.H-32+i*10);
    }
    // Prompt
    const blink = Math.floor(Date.now()/400)%2===0;
    ctx.textAlign = 'center';
    if (P === 7) {
      ctx.fillStyle = blink?'#fff':'#666'; ctx.font = '9px monospace';
      ctx.fillText('[ LEERTASTE: ABHEBEN ]', SW.CX, 16);
    } else {
      ctx.fillStyle = blink?'#555':'#222'; ctx.font = '7px monospace';
      ctx.fillText('[ LEERTASTE: ÜBERSPRINGEN ]', SW.CX, 16);
    }
    ctx.textAlign = 'left';
  },
  // ===== INFO (kleines Info-Panel, [I] im Menü) =====
  renderInfo(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    ctx.fillStyle='#0a1a0a';ctx.fillRect(40,20,SW.W-80,SW.H-40);
    ctx.strokeStyle='#0f0';ctx.lineWidth=1;ctx.strokeRect(40,20,SW.W-80,SW.H-40);
    ctx.textAlign='center';
    ctx.fillStyle='#0f0';ctx.font='bold 12px monospace';
    ctx.fillText('SOLO WING 1990',SW.CX,45);
    ctx.fillStyle='#666';ctx.font='6px monospace';
    ctx.fillText('Version ' + SW.VERSION + ' — Wingnut/Hermes/Privateer & Argon-Pass',SW.CX,58);
    ctx.textAlign='left';
    const L = [
      'LIZENZ: MIT (siehe LICENSE & README.md)',
      'OPEN-SOURCE ASSETS: Howard Day (HowieDay) & Arne Jansson (WCUnity/Wingnut)',
      'ENGINE-REFERENZEN: neuromancer (wc1-re/wc2-re), OpenReliant, FreeSpace Open',
      '',
      'ÄRA 1: QWEN-AGENTENVERBUND | ÄRA 2: HERMES AGENT & KIWI-SCHWARM',
      'ÄRA 3: VS CODE + CLINE & GITHUB COPILOT',
      'ÄRA 4/5: ANTIGRAVITY / GEMINI 4 ARGON (DEEP-TECH & WINGNUT-PASS)',
      'INSPIRATION: Origin Systems (Wing Commander I–IV, Privateer, Armada)',
      'STERNE: KEINE WERBUNG. KEIN INTERNET. NUR FAX.'
    ];
    ctx.fillStyle='#0f0';ctx.font='6px monospace';
    for (let i=0;i<L.length;i++) ctx.fillText(L[i],52,74+i*11);
    const blink=Math.floor(Date.now()/500)%2===0;
    ctx.fillStyle=blink?'#fff':'#666';ctx.font='8px monospace';ctx.textAlign='center';
    ctx.fillText('[ LEERTASTE: ZURÜCK ]',SW.CX,SW.H-30);
    ctx.textAlign='left';
  },
  // Sektor-Licht (Cheat [3][4][5]): setzt den aktuellen Sektor.
  // Alle Fenster (Bar, Beobachtung, Schule) zeigen die Sektoren-Farbe.
  setSector(id) {
    const sys = SW.Systems.find(s => s.id === id);
    if (!sys) return;
    SW.World.systemId = id;
    SW.Comm.add('SYSTEM: Sektor-Licht: ' + sys.name + '. Deklaration des Äußeren: entbehrlich.');
  },
  renderMenu(ctx) {
    // Hintergrund: letzter Frame bleibt (Pause) — dunkles Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0,0,SW.W,SW.H);
    // Rahmen
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 12, SW.W-32, SW.H-24);
    // Titel
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('M E N Ü', SW.CX, 26);
    ctx.textAlign = 'left';
    // Trennlinie
    ctx.strokeStyle = '#030';
    ctx.beginPath(); ctx.moveTo(24, 32); ctx.lineTo(SW.W-24, 32); ctx.stroke();

    // LINKE SPALTE: ANLEITUNG & FLUGSTEUERUNG
    ctx.fillStyle = '#0af';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('STEUERUNG & FLUGFUNK', 24, 44);
    ctx.fillStyle = '#ccc';
    ctx.font = '6px monospace';
    const controls = [
      'WASD / Pfeile   :  Bewegen & Schub',
      'SHIFT / LEER    :  Brenner / Laser',
      'Q / E           :  Rollen',
      '1-4 (Im Flug)   :  Staffelfunk VDU',
      'Y / L (Im Flug) :  Ziel / Landen',
      'K (Auf Träger)  :  Armada / Sektor',
      'S / H (Träger)  :  Staffel / Chat',
      'J (Auf Träger)  :  Schiffszeitung',
      'T / N           :  Autopilot / Nav',
      'ESC             :  Zurück zum Spiel'
    ];
    for (let i = 0; i < controls.length; i++) {
      ctx.fillText(controls[i], 24, 55 + i * 10);
    }

    // RECHTE SPALTE: AUDIO & SYSTEME
    ctx.fillStyle = '#0af';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('AUDIO & SYSTEME', 170, 44);

    // Audio-Zentrale Button
    ctx.fillStyle = '#00221c';
    ctx.fillRect(170, 50, 126, 15);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1;
    ctx.strokeRect(170, 50, 126, 15);
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('[A] AUDIO- & SOUND-ZENTRALE', 174, 60);
    this._soundOpenBtn = { x: 170, y: 50, w: 126, h: 15 };

    // Schnell-Optionen
    ctx.font = '6px monospace';
    ctx.fillStyle = (SW.Audio && SW.Audio.enabled) ? '#00ff88' : '#ff6666';
    ctx.fillText('[O] EFFEKTE:   ' + ((SW.Audio && SW.Audio.enabled) ? 'AN' : 'AUS'), 172, 74);
    ctx.fillStyle = (SW.Audio && SW.Audio.musicEnabled) ? '#00ff88' : '#ff6666';
    ctx.fillText('[P] MOD-MUSIK: ' + ((SW.Audio && SW.Audio.musicEnabled) ? 'AN' : 'AUS'), 172, 84);
    ctx.fillStyle = (SW.TTS && SW.TTS.enabled) ? '#00ff88' : '#ff6666';
    ctx.fillText('[M] SPRACHE:   ' + ((SW.TTS && SW.TTS.enabled) ? 'AN' : 'AUS'), 172, 94);

    ctx.fillStyle = '#aaa';
    ctx.fillText('[I] HANDBUCH & CREDITS', 172, 106);

    // CHEAT & TESTBETRIEB
    if (SW.Config.cheatEnabled) {
      ctx.fillStyle = '#f66';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('TESTBETRIEB [Testing]', 170, 118);
      ctx.font = '6px monospace';
      const cheatY = 129;
      // ZUM TRÄGER
      ctx.fillStyle = '#0f0';
      ctx.fillText('[1] ZUM TRÄGER', 172, cheatY);
      this._cheatShipRect = { x: 170, y: cheatY - 8, w: 110, h: 11 };
      // KARTE
      ctx.fillStyle = '#0af';
      ctx.fillText('[2] KARTE (alle Räume)', 172, cheatY + 11);
      this._cheatMapRect = { x: 170, y: cheatY + 3, w: 110, h: 11 };
      // SEKTOR-LICHT
      for (let i = 0; i < SW.Systems.length; i++) {
        const s = SW.Systems[i];
        const y = cheatY + 22 + i * 9;
        ctx.fillStyle = s.farbe;
        ctx.fillText('[' + (i + 3) + '] ' + s.name + (s.id === SW.World.systemId ? ' ●' : ''), 172, y);
        this['_cheatSysRect' + i] = { x: 170, y: y - 8, w: 100, h: 10 };
      }

      // Button zum Öffnen der Test- & Cheat-Werkstatt
      ctx.fillStyle = '#ffff44';
      ctx.fillRect(24, 160, 130, 14);
      ctx.fillStyle = '#000';
      ctx.font = 'bold 6px monospace';
      ctx.fillText('[C] CHEAT- & TEST-WERKSTATT', 28, 170);
      this._cheatOpenBtn = { x: 24, y: 160, w: 130, h: 14 };
    }

    // Modal-Fenster für AUDIO / SOUND
    if (this.soundSubmenuOpen) {
      this.renderSoundSubmenu(ctx);
    }
    // Modal-Fenster für CHEAT / TEST-BETRIEB
    if (this.cheatSubmenuOpen) {
      this.renderCheatSubmenu(ctx);
    }

    // Zurück
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    ctx.fillStyle = blink ? '#fff' : '#666';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ ESC: ZURÜCK ZUM SPIEL ]', SW.CX, SW.H - 16);
    ctx.textAlign = 'left';
  },

  renderSoundSubmenu(ctx) {
    // Dunkles Backdrop für Modal
    ctx.fillStyle = 'rgba(2, 8, 16, 0.96)';
    ctx.fillRect(16, 12, SW.W - 32, SW.H - 24);
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, 12, SW.W - 32, SW.H - 24);

    // Titelleiste
    ctx.fillStyle = '#003328';
    ctx.fillRect(16, 12, SW.W - 32, 16);
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('AUDIO- & SOUND-ZENTRALE (AMIGA PAULA & SOUNDTRACK)', 22, 23);

    // Schließen-Button oben rechts [X]
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(SW.W - 32, 14, 14, 12);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('X', SW.W - 25, 23);
    ctx.textAlign = 'left';
    this._soundCloseRect = { x: SW.W - 32, y: 14, w: 14, h: 12 };

    const sfxOn = SW.Audio && SW.Audio.enabled;
    const musOn = SW.Audio && SW.Audio.musicEnabled;
    const ttsOn = SW.TTS && SW.TTS.enabled;
    const fltOn = SW.ModPlayer ? SW.ModPlayer.paulaFilterEnabled : true;
    const vol = SW.ModPlayer ? Math.round(SW.ModPlayer.volume * 100) : 65;
    const track = SW.ModPlayer ? SW.ModPlayer.getTrackTitle() : 'KEIN TITEL';

    // 1. Zeile: SFX & Musik Toggles
    const y1 = 34;
    ctx.fillStyle = sfxOn ? '#0a3020' : '#300a0a';
    ctx.fillRect(24, y1, 130, 16);
    ctx.strokeStyle = sfxOn ? '#00ff88' : '#ff4444';
    ctx.strokeRect(24, y1, 130, 16);
    ctx.fillStyle = sfxOn ? '#88ffaa' : '#ff8888';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('[O] EFFEKT-SOUND: ' + (sfxOn ? 'AN' : 'AUS'), 30, y1 + 11);
    this._soundSfxRect = { x: 24, y: y1, w: 130, h: 16 };

    ctx.fillStyle = musOn ? '#0a3020' : '#300a0a';
    ctx.fillRect(164, y1, 130, 16);
    ctx.strokeStyle = musOn ? '#00ff88' : '#ff4444';
    ctx.strokeRect(164, y1, 130, 16);
    ctx.fillStyle = musOn ? '#88ffaa' : '#ff8888';
    ctx.fillText('[P] AMIGA MOD-MUSIK: ' + (musOn ? 'AN' : 'AUS'), 170, y1 + 11);
    this._soundMusicRect = { x: 164, y: y1, w: 130, h: 16 };

    // 2. Zeile: TTS & Paula-Filter
    const y2 = 54;
    ctx.fillStyle = ttsOn ? '#0a3020' : '#300a0a';
    ctx.fillRect(24, y2, 130, 16);
    ctx.strokeStyle = ttsOn ? '#00ff88' : '#ff4444';
    ctx.strokeRect(24, y2, 130, 16);
    ctx.fillStyle = ttsOn ? '#88ffaa' : '#ff8888';
    ctx.fillText('[M] SPRACHAUSGABE (TTS): ' + (ttsOn ? 'AN' : 'AUS'), 30, y2 + 11);
    this._soundTtsRect = { x: 24, y: y2, w: 130, h: 16 };

    ctx.fillStyle = fltOn ? '#0a2233' : '#1a1a22';
    ctx.fillRect(164, y2, 130, 16);
    ctx.strokeStyle = fltOn ? '#00ccff' : '#666688';
    ctx.strokeRect(164, y2, 130, 16);
    ctx.fillStyle = fltOn ? '#88ddff' : '#aaaaaa';
    ctx.fillText('[F] AMIGA PAULA (5.2k): ' + (fltOn ? 'AKTIV' : 'BYPASS'), 170, y2 + 11);
    this._soundFilterRect = { x: 164, y: y2, w: 130, h: 16 };

    // 3. Zeile: Lautstärke-Regler
    const y3 = 74;
    ctx.fillStyle = '#081420';
    ctx.fillRect(24, y3, 270, 20);
    ctx.strokeStyle = '#225577';
    ctx.strokeRect(24, y3, 270, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('LAUTSTÄRKE [← / →]:', 30, y3 + 13);
    ctx.fillStyle = '#112233'; ctx.fillRect(130, y3 + 3, 14, 14);
    ctx.strokeStyle = '#4488aa'; ctx.strokeRect(130, y3 + 3, 14, 14);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('-', 137, y3 + 13); ctx.textAlign = 'left';
    this._soundVolMinusRect = { x: 130, y: y3 + 3, w: 14, h: 14 };

    ctx.fillStyle = '#001a2a'; ctx.fillRect(150, y3 + 5, 80, 10);
    ctx.fillStyle = '#00ffcc'; ctx.fillRect(150, y3 + 5, Math.round(80 * (vol / 100)), 10);
    ctx.strokeStyle = '#336688'; ctx.strokeRect(150, y3 + 5, 80, 10);

    ctx.fillStyle = '#112233'; ctx.fillRect(235, y3 + 3, 14, 14);
    ctx.strokeStyle = '#4488aa'; ctx.strokeRect(235, y3 + 3, 14, 14);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('+', 242, y3 + 13); ctx.textAlign = 'left';
    this._soundVolPlusRect = { x: 235, y: y3 + 3, w: 14, h: 14 };
    ctx.fillStyle = '#aaffdd'; ctx.fillText(vol + '%', 256, y3 + 13);

    // 4. Zeile: Aktueller Track Status
    const y4 = 98;
    ctx.fillStyle = '#050b14';
    ctx.fillRect(24, y4, 270, 16);
    ctx.strokeStyle = '#224455';
    ctx.strokeRect(24, y4, 270, 16);
    ctx.fillStyle = '#ffff66';
    ctx.font = '6px monospace';
    ctx.fillText('AKTIVER TITEL: ' + track, 30, y4 + 11);

    // 5. Zeile: Track Test-Presets
    const y5 = 118;
    ctx.fillStyle = '#88aacc';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('TEST-TRACKS (Mark Knight Amiga OST):', 24, y5 + 8);
    const presets = [
      { id: 'recroom', label: '[1] MESSE' },
      { id: 'flyingtobattle', label: '[2] FLUG' },
      { id: 'regularcombat', label: '[3] KAMPF' },
      { id: 'beingtailed', label: '[4] ALARM' },
      { id: 'medalceremony', label: '[5] ORDEN' },
      { id: 'stop', label: '[0] STOPP' }
    ];
    this._soundPresetRects = [];
    const btnW = 42;
    for (let i = 0; i < presets.length; i++) {
      const p = presets[i];
      const px = 24 + i * 46;
      ctx.fillStyle = (p.id === 'stop') ? '#2e0a0a' : '#0a1d2e';
      ctx.fillRect(px, y5 + 12, btnW, 14);
      ctx.strokeStyle = (p.id === 'stop') ? '#aa3333' : '#3377aa';
      ctx.strokeRect(px, y5 + 12, btnW, 14);
      ctx.fillStyle = (p.id === 'stop') ? '#ff8888' : '#44ddff';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, px + btnW / 2, y5 + 22);
      ctx.textAlign = 'left';
      this._soundPresetRects.push({ x: px, y: y5 + 12, w: btnW, h: 14, key: p.id });
    }

    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    ctx.fillStyle = blink ? '#00ffcc' : '#669988';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ ESC / X: ZURÜCK ZUM HAUPTMENÜ ]', SW.CX, SW.H - 18);
    ctx.textAlign = 'left';
  },

  renderCheatSubmenu(ctx) {
    // Dunkles Backdrop für Modal
    ctx.fillStyle = 'rgba(2, 6, 12, 0.94)';
    ctx.fillRect(18, 14, SW.W - 36, SW.H - 28);
    ctx.strokeStyle = '#ffff55';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 14, SW.W - 36, SW.H - 28);

    // Titelleiste
    ctx.fillStyle = '#ffff55';
    ctx.fillRect(18, 14, SW.W - 36, 16);
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('★ TEST- & CHEAT-WERKSTATT (TESTBETRIEB)', 24, 25);

    // Schließen-Button oben rechts [X]
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(SW.W - 34, 16, 14, 12);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('X', SW.W - 27, 25);
    ctx.textAlign = 'left';
    this._cheatCloseRect = { x: SW.W - 34, y: 16, w: 14, h: 12 };

    const cls = SW.Player.getShipClass();
    const gfxMode = SW.Sprites ? SW.Sprites.graphicsMode : 'wingnut_hd';

    // 1. Schiff / Cockpit Button [B]
    const bY = 38;
    ctx.fillStyle = '#102233';
    ctx.fillRect(26, bY, SW.W - 52, 20);
    ctx.strokeStyle = '#44aaff';
    ctx.strokeRect(26, bY, SW.W - 52, 20);
    ctx.fillStyle = '#ffff88';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('[B] SCHIFF / COCKPIT WECHSELN:', 32, bY + 13);
    ctx.fillStyle = '#aaddff';
    ctx.fillText((cls ? cls.name : 'HORNET') + ' (Cockpit: ' + (cls ? cls.cockpitKey : 'hornet') + ')', 158, bY + 13);
    this._cheatShipClassRect = { x: 26, y: bY, w: SW.W - 52, h: 20 };

    // 2. Grafikmodus Button [G]
    const gY = 64;
    ctx.fillStyle = '#102233';
    ctx.fillRect(26, gY, SW.W - 52, 20);
    ctx.strokeStyle = '#44aaff';
    ctx.strokeRect(26, gY, SW.W - 52, 20);
    ctx.fillStyle = '#ffff88';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('[G] GRAFIKMODUS WECHSELN:', 32, gY + 13);
    ctx.fillStyle = '#aaddff';
    ctx.fillText(gfxMode === 'wingnut_hd' ? 'WINGNUT HD (80 Views / Vollbild)' : 'AMIGA VGA (40 Views / Skaliert)', 158, gY + 13);
    this._cheatGfxRect = { x: 26, y: gY, w: SW.W - 52, h: 20 };

    // 3. Vollreparatur Button [R]
    const rY = 90;
    ctx.fillStyle = '#0a3020';
    ctx.fillRect(26, rY, SW.W - 52, 20);
    ctx.strokeStyle = '#00ff88';
    ctx.strokeRect(26, rY, SW.W - 52, 20);
    ctx.fillStyle = '#88ffaa';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('[R] VOLLREPARATUR: SYSTEME & SCHILDE AUF 100% SETZEN', 32, rY + 13);
    this._cheatRepairRect = { x: 26, y: rY, w: SW.W - 52, h: 20 };

    // 4. Schnellreise-Tasten [1], [2], [3..5]
    const qY = 118;
    ctx.fillStyle = '#888';
    ctx.font = '6px monospace';
    ctx.fillText('SCHNELLREISE: [1] Flugdeck  |  [2] Großer Deckplan  |  [3..5] Sektor wählen', 30, qY);
    ctx.fillText('HINWEIS: Im normalen Flug sind [B] und [G] deaktiviert.', 30, qY + 11);
    ctx.fillStyle = '#555';
    ctx.fillText('[ESC / C] Fenster schließen', 30, qY + 22);
  },

  renderBar(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);ctx.textAlign='center';
    ctx.fillStyle='#fff';ctx.font='bold 16px monospace';ctx.fillText('SOLO WING 1990',SW.CX,25);
    ctx.fillStyle='#666';ctx.font='6px monospace';
    ctx.fillText('STERNENKORPS — FLUGHANDBUCH — FORMULAR 1-A',SW.CX,38);
    // Backstory (Handbuch-Einleitung)
    ctx.fillStyle='#0f0';ctx.font='7px monospace';ctx.textAlign='left';
    const bs=SW.Dialogues.backstory;
    for(let i=0;i<Math.min(bs.length,6);i++){
      ctx.fillText(bs[i],15,52+i*11);
    }
    // Mission + start
    ctx.textAlign='center';
    ctx.fillStyle='#aaa';ctx.font='7px monospace';
    ctx.fillText('MISSION: '+(SW.Missions.list[0]?.name||'SEKTOR 7'),SW.CX,125);
    const blink=Math.floor(Date.now()/500)%2===0;
    ctx.fillStyle=blink?'#fff':'#888';ctx.font='10px monospace';
    ctx.fillText('[ ZUM TRÄGER ]',SW.CX,145);
    ctx.fillStyle='#444';ctx.font='6px monospace';
    ctx.fillText('WASD:Pfeile:Bewegen | Q/E:Roll | Maus:Zielen | LEER:Feuer | T:AP | N:Nav',SW.CX,170);
    ctx.fillText('© 1990 STERNENKORPS. GEDRUCKT AUF FAXPAPIER.',SW.CX,185);
    ctx.textAlign='left';
  },
  renderAkademie(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    ctx.fillStyle='#0f0';ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.fillText('AKADEMIE — ABSCHLUSSPRÜFUNG',SW.CX,20);
    ctx.fillStyle='#666';ctx.font='6px monospace';
    ctx.fillText('STERNENKORPS — FLUGHANDBUCH — FORMULAR 1-A',SW.CX,32);
    ctx.textAlign='left';
    if (SW.Akademie.phase==='dialog') {
      const dialog = SW.AkademieData.dialog;
      const idx = SW.Akademie.dialogIndex;
      if (idx < dialog.length) {
        const line = dialog[idx];
        ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(20,SW.H-70,SW.W-40,45);
        ctx.strokeStyle='#00aa00';ctx.strokeRect(20,SW.H-70,SW.W-40,45);
        ctx.fillStyle='#00aaff';ctx.font='bold 8px monospace';ctx.fillText(line.npc,28,SW.H-58);
        ctx.fillStyle='#00ff00';ctx.font='7px monospace';
        const words=line.text.split(' ');let l='';const lines=[];
        for (const w of words) { if((l+w).length>40){lines.push(l);l=w+' ';}else{l+=w+' ';} }
        lines.push(l);
        for (let i=0;i<Math.min(lines.length,3);i++) ctx.fillText(lines[i].trim(),28,SW.H-48+i*9);
      }
      const blink=Math.floor(Date.now()/500)%2===0;
      ctx.fillStyle=blink?'#fff':'#666';ctx.font='8px monospace';ctx.textAlign='center';
      ctx.fillText('[ LEERTASTE: WEITER ]',SW.CX,SW.H-12);ctx.textAlign='left';
    }
    if (SW.Akademie.phase==='bestanden') {
      const posting = SW.Transfers.getCurrentPosting();
      ctx.fillStyle='#0f0';ctx.font='bold 12px monospace';ctx.textAlign='center';
      ctx.fillText('BESTANDEN.',SW.CX,SW.H/2);
      ctx.fillStyle='#fff';ctx.font='8px monospace';
      ctx.fillText('ZUTEILUNG: ' + posting.name,SW.CX,SW.H/2+20);
      ctx.fillText('Formular 83-B liegt bereit.',SW.CX,SW.H/2+35);
      const b1=Math.floor(Date.now()/500)%2===0;
      ctx.fillStyle=b1?'#fff':'#666';ctx.font='8px monospace';
      ctx.fillText('[ LEERTASTE: ZUM TRÄGER ]',SW.CX,SW.H/2+60);
      ctx.textAlign='left';
    }
    if (SW.Akademie.phase==='durchgefallen') {
      const posting = SW.Transfers.getCurrentPosting();
      ctx.fillStyle='#ff6644';ctx.font='bold 12px monospace';ctx.textAlign='center';
      ctx.fillText('NICHT BESTANDEN.',SW.CX,SW.H/2);
      ctx.fillStyle='#fff';ctx.font='8px monospace';
      ctx.fillText('TROTZDEM: ' + posting.name,SW.CX,SW.H/2+20);
      ctx.fillText('Formular 83-B. Teil C: "Nicht bestanden."',SW.CX,SW.H/2+35);
      const b2=Math.floor(Date.now()/500)%2===0;
      ctx.fillStyle=b2?'#fff':'#666';ctx.font='8px monospace';
      ctx.fillText('[ LEERTASTE: ZUM TRÄGER ]',SW.CX,SW.H/2+60);
      ctx.textAlign='left';
    }
  },
  renderBriefingBoard(ctx) {
    SW.BriefingBoard.render(ctx);
  },
  renderBriefing(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    SW.Engine.renderStars(ctx,0,0);
    ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.fillText('BRIEFING: '+(this.mission?.name||''),SW.CX,20);
    ctx.textAlign='left';
    // NPC-Gesichter mit SW.NPC.drawFace (echte Piloten: Commander, Sechs, Neun, Zwo)
    const f = SW.Game.frame;
    // Commander (links, zeigt zur Tafel)
    if (SW.NPC) SW.NPC.drawFace(ctx, 'commander', 120, 180, 50, { showBody: true, showUniform: true, pose: 'standing', animated: true, frame: f });
    // Sechs, Neun, Zwo (auf Stühlen, Rückenansicht)
    if (SW.NPC) SW.NPC.drawFace(ctx, 'sechs', 220, 150, 40, { showBody: true, showUniform: true, pose: 'cockpit-left', animated: true, frame: f });
    if (SW.NPC) SW.NPC.drawFace(ctx, 'neun', 300, 150, 40, { showBody: true, showUniform: true, pose: 'cockpit-center', animated: true, frame: f });
    if (SW.NPC) SW.NPC.drawFace(ctx, 'zwo', 380, 150, 40, { showBody: true, showUniform: true, pose: 'cockpit-right', animated: true, frame: f });
    SW.Briefing.render(ctx);
  },
  renderTakeoff(ctx) {
    // Launch-Tube-Cinematic (Röhre → Freigang → Exit-Flash)
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    SW.Flight.render(ctx);
    ctx.fillStyle='#0f0';ctx.font='7px monospace';ctx.textAlign='center';
    if (SW.Flight.progress<0.6) ctx.fillText('STARTRÖHRE — ZÜNDUNG',SW.CX,15);
    else ctx.fillText('FREIGANG',SW.CX,15);
    ctx.textAlign='left';
  },
  renderCockpit(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    const vm = SW.Engine.view.mode;
    if (vm === 'topdown') { this.renderCockpitTopDown(ctx); return; }
    // ===== PERSPEKTIVE (cockpit + chase) =====
    // IM RAUM: Roll + Bank — der Blick wankt mit der Seitengeschwindigkeit
    const bank = Math.max(-0.3, Math.min(0.3, SW.Player.vx * SW.BANK_FACTOR));
    const rot = SW.Player.rollAngle + bank;
    if (Math.abs(rot) > 0.005) {
      ctx.save();
      ctx.translate(SW.CX, SW.CY);
      ctx.rotate(rot);
      ctx.translate(-SW.CX, -SW.CY);
    }
    // IM RAUM: Sterne sind in Kamera-Space (Flow = Vorschub, Gleiten = Drift)
    SW.Engine.renderStars(ctx, 0, 0);
    SW.Carrier.render(ctx);   // IM RAUM: Träger im Feld (rückt davon, je weiter man fliegt)
    SW.Enemies.render(ctx);
    if (SW.Wingman) SW.Wingman.render(ctx);  // IM RAUM: Sechs in Formation
    SW.Projectiles.render(ctx);
    SW.Explosions.render(ctx);
    if (Math.abs(rot) > 0.005) ctx.restore();
    // IM RAUM: "FEIND NAH"-Warnung (WC1 "Enemy Near")
    let nearZ = 1e9;
    for (const e of SW.Enemies.list) {
      if (!e.alive) continue;
      const rz = e.z - SW.Player.z;
      if (rz > 5 && rz < nearZ) nearZ = rz;
    }
    if (nearZ < 45 && (SW.Game.frame>>3)%2 === 0) {
      ctx.fillStyle = '#ff3333'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
      ctx.fillText('FEIND NAH', SW.CX, 26);
      ctx.textAlign = 'left';
    }
    if (vm === 'chase') {
      // Chase-Cam: Schiff im unteren Drittel (Rückenansicht / 80-View 3D), rollt und bankt mit
      const shX = SW.CX + SW.Player.vx * 1.2;
      const shY = SW.H - 40 + SW.Player.vy * 0.4;
      const spec = (SW.Player.getShipSpec && SW.Player.getShipSpec()) || null;
      const atlasKey = (spec && spec.atlasKey) || 'hornet';
      ctx.save();
      ctx.translate(shX, shY);
      ctx.rotate(rot);
      const yawRel = Math.PI + SW.Player.vx * 0.08;
      const pitchRel = -SW.Player.vy * 0.08;
      const drewChase = (SW.Sprites && SW.Sprites.drawMultiAngle)
        ? SW.Sprites.drawMultiAngle(ctx, atlasKey, 0, 0, 44, yawRel, pitchRel, '#88aa44', SW.Sprites.playerShip)
        : false;
      if (!drewChase) {
        SW.Sprites.draw(ctx, SW.Sprites.playerShip, 0, 0, 1.5);
        ctx.fillStyle = (SW.Game.frame % 6 < 3) ? '#ff6600' : '#ffaa00';
        ctx.fillRect(-5, 8, 3, 5); ctx.fillRect(2, 8, 3, 5);  // Triebwerke
      }
      ctx.restore();
      SW.UI.renderMiniHud(ctx);
    } else {
      SW.UI.renderCockpit(ctx);
    }
    // Lande-Prompt bei Annäherung an die TCS Fax-Tragödie
    if (SW.Carrier && SW.Carrier.canDock && SW.Carrier.canDock()) {
      ctx.fillStyle = '#00ffcc';
      ctx.font = 'bold 6px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[L] ANLANDEN AUF TCS FAX-TRAGÖDIE FREIGEGEBEN', SW.CX, 20);
      ctx.textAlign = 'left';
    }
    // UI (nicht rotiert)
    if (SW.UI.renderTargetBracket) SW.UI.renderTargetBracket(ctx);
    SW.UI.renderRadar(ctx);
    if (SW.UI.navMapVisible) SW.UI.renderNavMap(ctx);
    SW.Comm.render(ctx);
    SW.UI.renderCrosshair(ctx);
    if (SW.Fax) SW.Fax.render(ctx);
    if (SW.Autopilot.active) {
      ctx.fillStyle='#00aaff';ctx.font='6px monospace';ctx.textAlign='center';
      ctx.fillText('◈ AUTOPILOT ◈',SW.CX,12);ctx.textAlign='left';
    }
    // IM RAUM (NAV): Distanz zum nächsten Nav-Punkt (WC1-Nav-Anzeige).
    // Die Gegnergruppen stehen an den WPs — der Pfeil zeigt, wo es laut.
    {
      const nps=SW.Autopilot.navPoints;
      let np=null, nIdx=-1;
      if (SW.Autopilot.active&&SW.Autopilot.target) { np=SW.Autopilot.target; nIdx=SW.Autopilot.currentNavIndex-1; }
      else { for (let i=0;i<nps.length;i++) { if (nps[i].z===undefined||SW.Player.z<nps[i].z+150) { np=nps[i]; nIdx=i; break; } } }
      if (np&&np.z!==undefined&&np.z-SW.Player.z>0) {
        const d=Math.round(np.z-SW.Player.z);
        const lat=(np.x||0)-SW.Player.x;
        const arrow=Math.abs(lat)<30?'  ':(lat<0?'◀ ':'▶ ');
        ctx.fillStyle='#0af';ctx.font='6px monospace';ctx.textAlign='center';
        ctx.fillText(arrow+'NAV WP'+(nIdx+1)+'  D:'+d,SW.CX,31);ctx.textAlign='left';
      }
    }
    // Nav-Hinweis
    if (SW.UI.navMapVisible) {
      ctx.fillStyle='#0af';ctx.font='5px monospace';ctx.textAlign='center';
      ctx.fillText('[N] NAV',SW.CX,SW.H-2);ctx.textAlign='left';
    }
  },
  // Top-Down (Ansicht 'VOGEL'): flache 2D-Ebene, Z → Y (vorn = oben)
  renderCockpitTopDown(ctx) {
    SW.Engine.renderStarsTopDown(ctx);
    SW.Enemies.render(ctx);
    if (SW.Wingman) SW.Wingman.render(ctx);  // IM RAUM: Sechs (oben = vorne)
    SW.Projectiles.render(ctx);
    SW.Explosions.render(ctx);
    if (SW.UI.renderTargetBracket) SW.UI.renderTargetBracket(ctx);
    // Spieler: Top-Down-Sprite unten Mitte (Rollen angedeutet)
    const t = SW.Engine.view.top;
    ctx.save();
    ctx.translate(t.shipX, t.shipY);
    ctx.rotate(SW.Player.rollAngle * 0.6);
    SW.Sprites.draw(ctx, SW.Sprites.playerShipTop, 0, 0, 1.6);
    ctx.fillStyle = (SW.Game.frame % 6 < 3) ? '#ff6600' : '#ffaa00';
    ctx.fillRect(-3, 12, 2, 4); ctx.fillRect(1, 12, 2, 4);  // Triebwerke
    ctx.restore();
    // UI
    SW.UI.renderMiniHud(ctx);
    SW.UI.renderRadar(ctx);
    if (SW.UI.navMapVisible) SW.UI.renderNavMap(ctx);
    SW.Comm.render(ctx);
    SW.UI.renderCrosshair(ctx);
    if (SW.Fax) SW.Fax.render(ctx);
    if (SW.Autopilot.active) {
      ctx.fillStyle='#00aaff';ctx.font='6px monospace';ctx.textAlign='center';
      ctx.fillText('◈ AUTOPILOT ◈',SW.CX,12);ctx.textAlign='left';
    }
  },
  renderLanding(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    SW.Engine.renderStars(ctx,SW.Player.x,SW.Player.y);
    SW.Flight.render(ctx);
    ctx.fillStyle='#0f0';ctx.font='7px monospace';ctx.textAlign='center';
    ctx.fillText('ANLANDUNG IN PROGRESS',SW.CX,15);ctx.textAlign='left';
  },
  renderHangar(ctx) {
    // HANGAR: Nach Landung. Techniker (Bolt) geht zum Schiff, kommentiert.
    ctx.fillStyle='#0a0a0f';ctx.fillRect(0,0,SW.W,SW.H);
    const t = SW.Game._hangarTimer || 0;
    // Hangar-Hintergrund (graue Wände, Beleuchtung)
    ctx.fillStyle='#1a1a22';ctx.fillRect(0,0,SW.W,SW.H);
    // Deck (Boden)
    ctx.fillStyle='#2a2a33';ctx.fillRect(0,SW.H-40,SW.W,40);
    ctx.strokeStyle='#333';ctx.lineWidth=1;
    for(let i=0;i<SW.W;i+=20){ctx.beginPath();ctx.moveTo(i,SW.H-40);ctx.lineTo(i+10,SW.H);ctx.stroke();}
    // Wände (perspektivisch)
    ctx.fillStyle='#15151e';
    ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(40,30);ctx.lineTo(40,SW.H-40);ctx.lineTo(0,SW.H);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(SW.W,0);ctx.lineTo(SW.W-40,30);ctx.lineTo(SW.W-40,SW.H-40);ctx.lineTo(SW.W,SW.H);ctx.closePath();ctx.fill();
    // Decken-Licht
    ctx.fillStyle='#333';ctx.fillRect(60,10,SW.W-120,3);
    ctx.fillStyle='#555';ctx.fillRect(80,13,SW.W-160,1);
    // Schiff (80-View 3D Sprite auf dem Hangardeck oder klassische Silhouette)
    const shipX=SW.CX, shipY=SW.H-60;
    const spec = (SW.Player.getShipSpec && SW.Player.getShipSpec()) || null;
    const atlasKey = (spec && spec.atlasKey) || 'hornet';
    const drewHangarShip = (SW.Sprites && SW.Sprites.drawMultiAngle && SW.Sprites.graphicsMode !== 'classic_1990')
      ? SW.Sprites.drawMultiAngle(ctx, atlasKey, shipX, shipY - 14, 72, Math.PI * 0.82, 0.22, '#88aa44', SW.Sprites.playerShip)
      : false;
    if (!drewHangarShip) {
      ctx.fillStyle='#2a3a4a';
      // Rumpf
      ctx.beginPath();
      ctx.moveTo(shipX-30,shipY);
      ctx.lineTo(shipX-20,shipY-25);
      ctx.lineTo(shipX-5,shipY-35);
      ctx.lineTo(shipX+5,shipY-35);
      ctx.lineTo(shipX+20,shipY-25);
      ctx.lineTo(shipX+30,shipY);
      ctx.closePath();ctx.fill();
      // Flossen
      ctx.fillStyle='#1a2a3a';
      ctx.beginPath();ctx.moveTo(shipX-30,shipY);ctx.lineTo(shipX-45,shipY-10);ctx.lineTo(shipX-25,shipY-15);ctx.closePath();ctx.fill();
      ctx.beginPath();ctx.moveTo(shipX+30,shipY);ctx.lineTo(shipX+45,shipY-10);ctx.lineTo(shipX+25,shipY-15);ctx.closePath();ctx.fill();
      // Triebwerk (leuchtet)
      ctx.fillStyle=t%20<10?'#ff6600':'#ff9900';
      ctx.fillRect(shipX-8,shipY-2,16,4);
      // Cockpit-Blitz
      ctx.fillStyle='#0af';ctx.fillRect(shipX-3,shipY-32,6,3);
    }
    // Techniker (Bolt): geht von rechts zum Schiff
    const boltX = Math.max(shipX+40, SW.W-30 - t*0.8);
    const boltY = SW.H-45;
    // Bolt (kleine Figur, gelbe Jacke)
    ctx.fillStyle='#ffcc00';ctx.fillRect(boltX-3,boltY-12,6,10); // Körper
    ctx.fillStyle='#cc9966';ctx.fillRect(boltX-2,boltY-16,4,4); // Kopf
    ctx.fillStyle='#333';ctx.fillRect(boltX-3,boltY-2,3,4);ctx.fillRect(boltX,boltY-2,3,4); // Beine
    // Werkzeugkiste
    ctx.fillStyle='#666';ctx.fillRect(boltX+3,boltY-8,4,3);
    // Name
    ctx.fillStyle='#888';ctx.font='5px monospace';ctx.textAlign='center';
    ctx.fillText('BOLT',boltX,boltY+8);
    // Dialog (nach Ankunft)
    if (t > 60) {
      const lines = SW.Game._hangarLines || [];
      const lineIdx = Math.min(Math.floor((t-60)/120), lines.length-1);
      if (lineIdx >= 0 && lineIdx < lines.length) {
        ctx.fillStyle='rgba(0,0,0,0.9)';ctx.fillRect(20,SW.H-75,SW.W-40,30);
        ctx.strokeStyle='#ffcc00';ctx.lineWidth=1;ctx.strokeRect(20,SW.H-75,SW.W-40,30);
        ctx.fillStyle='#ffcc00';ctx.font='bold 7px monospace';ctx.textAlign='left';
        ctx.fillText('BOLT',28,SW.H-65);
        ctx.fillStyle='#fff';ctx.font='7px monospace';
        const words=lines[lineIdx].split(' ');let l='';const ls=[];
        for(const w of words){if((l+w).length>42){ls.push(l);l=w+' ';}else{l+=w+' ';}}
        ls.push(l);
        for(let i=0;i<Math.min(ls.length,2);i++) ctx.fillText(ls[i].trim(),28,SW.H-55+i*9);
      }
    }
    // Weiter-Prompt (nach allen Zeilen)
    if (t > 60 + (SW.Game._hangarLines||[]).length*120) {
      const blink=Math.floor(Date.now()/500)%2===0;
      ctx.fillStyle=blink?'#fff':'#666';ctx.font='7px monospace';ctx.textAlign='center';
      const damaged=Object.values(SW.Player.systems).some(value => value<100);
      if (damaged) {
        ctx.fillText(SW.Game._hangarRepaired?'[ SYSTEME INSTANDGESETZT ]':'[ R: SYSTEME REPARIEREN ]',SW.CX,13);
        ctx.fillText('[ LEERTASTE: ZUM TRÄGER ]',SW.CX,23);
      } else {
        ctx.fillText('[ LEERTASTE: ZUM TRÄGER ]',SW.CX,15);
      }
      ctx.textAlign='left';
    }
    ctx.textAlign='left';
  },

  renderDebriefing(ctx) {
    ctx.fillStyle = '#03070d';
    ctx.fillRect(0, 0, SW.W, SW.H);

    // Rahmen im Stil der taktischen Besprechungsräume von 1990 (WC1 / X-Wing)
    ctx.strokeStyle = '#22384e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(6, 6, SW.W - 12, SW.H - 12);
    ctx.fillStyle = 'rgba(10, 18, 28, 0.9)';
    ctx.fillRect(8, 8, SW.W - 16, 20);

    const endType = this.getEndingType();
    const mId = (this.mission && this.mission.id) || (SW.Ship && SW.Ship.selectedMissionId) || 'm1';
    const deb = (SW.Dialogues.debriefings && SW.Dialogues.debriefings[mId]) || null;
    const isVict = this.victory;

    // TITEL-LEISTE
    ctx.fillStyle = isVict ? '#00ff88' : '#ff4444';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('EINSATZ-DEBRIEFING // FLOTTENKOMMANDO', 14, 21);

    ctx.textAlign = 'right';
    ctx.fillStyle = isVict ? '#00ff88' : '#ff4444';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(isVict ? 'STATUS: ERFOLGREICH' : 'STATUS: GESCHEITERT', SW.W - 14, 21);
    ctx.textAlign = 'left';

    // LINKE SPALTE: LEISTUNGSNACHWEIS & MEDAILLEN (X-Wing / Wing Commander)
    const colLW = 142;
    ctx.fillStyle = '#070f18';
    ctx.fillRect(10, 32, colLW, SW.H - 64);
    ctx.strokeStyle = '#1b2d3f';
    ctx.strokeRect(10, 32, colLW, SW.H - 64);

    // Medaillen-Ermittlung
    const shotsF = this.shotsFired || 0;
    const shotsH = this.shotsHit || 0;
    const acc = shotsF > 0 ? Math.min(100, Math.round((shotsH / shotsF) * 100)) : 0;
    const totalK = this.totalKills || 0;

    let medalName = 'TEILNAHME-BESCHEINIGUNG (1-B)';
    let medalRibbon = ['#556677', '#8899aa', '#556677'];
    let medalStarCol = '#99aabb';

    if (mId === 'm5_speer' || (SW.Quests && SW.Quests.getFlag('sternenkreuz_verliehen'))) {
      medalName = 'STERNENKREUZ AM BANDE';
      medalRibbon = ['#ffcc00', '#aa0000', '#ffcc00'];
      medalStarCol = '#ffe033';
    } else if (acc >= 65 && shotsF >= 6) {
      medalName = 'SCHARFSCHÜTZEN-BAND';
      medalRibbon = ['#0044aa', '#ffffff', '#0044aa'];
      medalStarCol = '#44ccff';
    } else if (totalK >= 3) {
      medalName = 'KAMPFKREUZ MIT EICHENLAUB';
      medalRibbon = ['#880000', '#ffcc00', '#880000'];
      medalStarCol = '#ffcc00';
    } else if (isVict) {
      medalName = 'DIENSTMEDAILLE SEKTOR 7';
      medalRibbon = ['#007733', '#ffffff', '#007733'];
      medalStarCol = '#33ff77';
    }

    // Ordensspange zeichnen (Pixel-Art Band + Kreuz)
    ctx.fillStyle = medalRibbon[0]; ctx.fillRect(16, 38, 7, 12);
    ctx.fillStyle = medalRibbon[1]; ctx.fillRect(23, 38, 8, 12);
    ctx.fillStyle = medalRibbon[2]; ctx.fillRect(31, 38, 7, 12);
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.strokeRect(16, 38, 22, 12);
    // Medaillon
    ctx.fillStyle = medalStarCol;
    ctx.beginPath();
    ctx.arc(27, 56, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(26, 53, 2, 6);
    ctx.fillRect(24, 55, 6, 2);

    ctx.fillStyle = '#ffff66';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('ORDEN & AUSZEICHNUNG:', 44, 44);
    ctx.fillStyle = medalStarCol;
    ctx.font = 'bold 5px monospace';
    ctx.fillText(medalName.substring(0, 18), 44, 53);

    // Trennlinie
    ctx.strokeStyle = '#1a2a3a';
    ctx.beginPath(); ctx.moveTo(14, 66); ctx.lineTo(10 + colLW - 4, 66); ctx.stroke();

    // Abschuss-Scorecard nach Schiffstypen
    ctx.fillStyle = '#66aacc';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('FEIND-ABSCHÜSSE:', 16, 76);

    const kTypes = Object.keys(this.killsByType || {});
    let ky = 87;
    if (kTypes.length === 0) {
      ctx.fillStyle = '#778899';
      ctx.font = '5px monospace';
      ctx.fillText(totalK > 0 ? ('Feindjäger: ' + totalK) : 'Keine Abschüsse verzeichnet', 16, ky);
      ky += 10;
    } else {
      ctx.font = '5px monospace';
      for (const kt of kTypes) {
        ctx.fillStyle = '#dddddd';
        const displayKt = kt === 'd_b' ? 'Dralthi' : (kt === 'piraten_jaeger' ? 'Talon' : kt);
        ctx.fillText(displayKt.toUpperCase() + ':', 16, ky);
        ctx.fillStyle = '#ffff55';
        ctx.fillText('x ' + this.killsByType[kt], 95, ky);
        ky += 9;
        if (ky > 115) break;
      }
    }

    // Trefferquote
    ctx.fillStyle = '#66aacc';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('TREFFERQUOTE:', 16, 126);
    ctx.fillStyle = '#ffffff';
    ctx.font = '6px monospace';
    ctx.fillText(acc + ' %  (' + shotsH + ' / ' + shotsF + ' Schüsse)', 16, 136);

    // Schiffszustand
    const sys = SW.Player.systems || {};
    const avgSys = Math.round(((sys.engines || 100) + (sys.weapons || 100) + (sys.shields || 100) + (sys.sensors || 100)) / 4);
    ctx.fillStyle = '#66aacc';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('SCHIFFSZUSTAND:', 16, 148);
    ctx.fillStyle = avgSys >= 80 ? '#00ff88' : (avgSys >= 40 ? '#ffcc00' : '#ff4444');
    ctx.font = '6px monospace';
    ctx.fillText('Systeme: ' + avgSys + ' % intakt', 16, 158);

    // RECHTE SPALTE: BERICHT DES COMMANDERS & BÜROKRATIE
    const colRX = 158, colRW = SW.W - colRX - 10;
    ctx.fillStyle = '#070f18';
    ctx.fillRect(colRX, 32, colRW, SW.H - 64);
    ctx.strokeStyle = '#1b2d3f';
    ctx.strokeRect(colRX, 32, colRW, SW.H - 64);

    ctx.fillStyle = '#66aacc';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('BERICHT DES COMMANDERS:', colRX + 8, 44);

    // Missions-Debriefing Text
    if (endType === 'geheim') {
      ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 7px monospace';
      ctx.fillText('AKTE 99-Z — GEHEIMES ENDE', colRX + 8, 58);
      ctx.fillStyle = '#e0e0e0'; ctx.font = '5px monospace';
      ctx.fillText('Kältekammer 7 atmet ruhig (2/min).', colRX + 8, 70);
      ctx.fillText('Formular 83-B wurde geschreddert.', colRX + 8, 80);
      ctx.fillText('Der Optimierer stuft das Schiff als unheilbar ein.', colRX + 8, 90);
    } else if (deb) {
      ctx.fillStyle = isVict ? '#00ff88' : '#ff8844'; ctx.font = 'bold 7px monospace';
      ctx.fillText(deb.title.substring(0, 28), colRX + 8, 58);
      ctx.fillStyle = '#e0e0e0'; ctx.font = '5px monospace';
      ctx.fillText(deb.lines[0] ? deb.lines[0].substring(0, 36) : '', colRX + 8, 70);
      ctx.fillText(deb.lines[1] ? deb.lines[1].substring(0, 36) : '', colRX + 8, 80);
      ctx.fillStyle = '#88aacc';
      ctx.fillText(deb.lines[2] ? deb.lines[2].substring(0, 36) : '', colRX + 8, 90);
    } else if (isVict) {
      ctx.fillStyle = '#00ff88'; ctx.font = 'bold 7px monospace';
      ctx.fillText('MISSION VOLLSTÄNDIG ERFÜLLT', colRX + 8, 58);
      ctx.fillStyle = '#e0e0e0'; ctx.font = '5px monospace';
      ctx.fillText('Alle Ziele wurden vorschriftsmäßig bekämpft.', colRX + 8, 70);
      ctx.fillText('Die Einsatzberichte liegen zur Ablage vor.', colRX + 8, 80);
      ctx.fillStyle = '#88aacc';
      ctx.fillText('Befehl zur Rückkehr zum Flugdeck erteilt.', colRX + 8, 90);
    } else {
      ctx.fillStyle = '#ff4444'; ctx.font = 'bold 7px monospace';
      ctx.fillText('KONTAKT ABGEBROCHEN // VERLUST', colRX + 8, 58);
      ctx.fillStyle = '#e0e0e0'; ctx.font = '5px monospace';
      ctx.fillText('Schwere Verluste im Sektor verzeichnet.', colRX + 8, 70);
      ctx.fillText('Disziplinarischer Vermerk in Personalakte P-9.', colRX + 8, 80);
      ctx.fillStyle = '#888888';
      ctx.fillText('Trauerfeier und Schadensaufnahme angeordnet.', colRX + 8, 90);
    }

    // Punkte & Sold-Abrechnung
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('EINSATZPUNKTE: ' + this.score, colRX + 8, 114);
    const bounty = Math.max(50, Math.round(this.score * 0.75));
    ctx.fillStyle = '#88ffaa';
    ctx.font = '5px monospace';
    ctx.fillText('Gutschrift Sold: +' + bounty + ' CR (Formular 19-K)', colRX + 8, 125);

    // Amtlicher Stempel
    ctx.strokeStyle = isVict ? '#00aa55' : '#aa3333';
    ctx.lineWidth = 1;
    ctx.strokeRect(colRX + 8, 136, colRW - 16, 22);
    ctx.fillStyle = isVict ? '#00ff88' : '#ff6666';
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(isVict ? '★ EINSATZ GEPRÜFT & ANERKANNT ★' : '⚠ VERFEHLUNG REGISTRIERT ⚠', colRX + colRW / 2, 146);
    ctx.font = '4px monospace';
    ctx.fillText('KOMMANDO TCS FAX-TRAGÖDIE // ABTEILUNG FLUGWESEN', colRX + colRW / 2, 153);
    ctx.textAlign = 'left';

    // UNTERE SCHALTFLÄCHEN (KLICK- & TASTENBAR)
    const btnY = SW.H - 26;
    // 1. Zum Flugdeck / Träger
    ctx.fillStyle = '#112233';
    ctx.fillRect(10, btnY, 150, 16);
    ctx.strokeStyle = '#44aaff';
    ctx.strokeRect(10, btnY, 150, 16);
    ctx.fillStyle = '#ffff88';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('[ENTER / KLICK] ZUM FLUGDECK (DIENST)', 16, btnY + 11);
    this._debShipBtn = { x: 10, y: btnY, w: 150, h: 16 };

    // 2. Rollender Abspann (Credits)
    ctx.fillStyle = '#221133';
    ctx.fillRect(166, btnY, SW.W - 176, 16);
    ctx.strokeStyle = '#aa66ff';
    ctx.strokeRect(166, btnY, SW.W - 176, 16);
    ctx.fillStyle = '#ddaaff';
    ctx.font = 'bold 5px monospace';
    ctx.fillText(isVict ? '[LEER / C] ROLLENDER ABSPANN' : '[LEER] ZUM TRÄGER', 172, btnY + 11);
    this._debCreditsBtn = { x: 166, y: btnY, w: SW.W - 176, h: 16 };
  },
  // ===== CREDITS / ABSPANN (v0.75-dev, 3 Enden) =====
  // Nach dem Sieg: Debriefing → rollender Abspann (1990-Style) → Träger.
  // Tod (KONTAKT VERLOREN) geht ohne Abspann direkt zum Träger.
  // [LEER] = weiterspulen (am Ende: zum Träger), [ESC] = schließen,
  // nach 5 s am Ende automatisch zum Träger.
  startCredits() {
    this._credits = this._buildCredits();
    this.setState('CREDITS');
  },
  _buildCredits() {
    const n = ((SW.World && SW.World.pilotName) || 'FLUG DREI').toUpperCase();
    const posting = SW.Transfers.getCurrentPosting();
    const endType = this.getEndingType();
    const L = [];
    const line = (t, f, c, gap) => L.push({ t: t, f: f || '8px monospace', c: c || '#ccc', gap: gap || 0 });
    line(posting.name, 'bold 18px monospace', '#ffcc00', 12);
    line('SOLO WING 1990', '10px monospace', '#fff', 6);
    if (endType === 'geheim') {
      line('AKTE 99-Z — GEHEIMES ENDE: DAS DORF ATMET WEITER', 'bold 7px monospace', '#00ffcc', 8);
      line('Kältekammer 7 bleibt versiegelt. Der Optimierer ist abgereist.', '6px monospace', '#88ddaa', 14);
    } else if (endType === 'privateer') {
      line('BRANCH A — DAS PRIVATEER-ENDE: DER FREIE AGENT', 'bold 7px monospace', '#ffaa33', 8);
      line('Dienst quittiert. Das Veteranen-Schiff gehört Ihnen. Keine Vorgesetzten mehr.', '6px monospace', '#eedd88', 14);
    } else if (endType === 'neurofax') {
      line('BRANCH B — PROJEKT NEURO-FAX: DIE FUSION', 'bold 7px monospace', '#00e5ff', 8);
      line('100% Automatisierung der Sternenkorps-Bürokratie durch den KI-Schwarm.', '6px monospace', '#88eeff', 14);
    } else {
      line('STERNENKORPS — EINSATZBERICHT ABGESCHLOSSEN — FORMULAR 77-V: AUSGEFÜLLT', '6px monospace', '#666', 18);
    }
    line('SOLO WING 1990', 'bold 10px monospace', '#0f0', 6);
    line('Pilot: ' + n, '10px monospace', '#0f0', 4);
    const statusText = endType === 'geheim' ? 'Status: Unkündbar (Formular 91-X)' :
      (endType === 'privateer' ? 'Status: Freier Privateer & Händler' :
      (endType === 'neurofax' ? 'Status: Flottenkommandant Schwarm-Matrix' : 'Beförderung: Gefreiter (per Fax)'));
    line(statusText, '7px monospace', '#888', 18);
    line('CREW ' + posting.name, 'bold 10px monospace', '#ffcc00', 8);
    (SW.Crew || []).forEach((m) => {
      let s = '';
      if (m.status === 'gefallen') s = '  [ GEFALLEN IM DIENST ]';
      else if (m.status === 'defekt') s = '  [ DEFEKT ]';
      else if (m.status === 'urlaub') s = '  [ URLAUB ]';
      line(m.name.toUpperCase() + ' — ' + m.posten + s, '7px monospace', m.status === 'gefallen' ? '#ff5555' : '#ccc', s ? 4 : 0);
    });
    line('', '8px monospace', '#ccc', 14);
    line('HERGESTELLT VON', 'bold 10px monospace', '#ffcc00', 6);
    line('Tretboot — Konzept, Regie, Code, Design, Musik, Formulare', '7px monospace', '#ccc', 6);
    line('AGENTEN-ÄREN & KI-CREW', 'bold 9px monospace', '#00ffcc', 6);
    line('Ära 1: Qwen-Agentenverbund (Commander, No Thinking, Lead Story, Lead Dev, Review)', '6px monospace', '#88aacc', 2);
    line('Ära 2: Hermes Agent & Kiwi-Schwarm (AgentHome, BYOA, Ökonomie, TCS Hermes)', '6px monospace', '#88aacc', 2);
    line('Ära 3: VS Code + Cline & GitHub Copilot (IM RAUM, 3 Decks, Schäden, Savegame)', '6px monospace', '#88aacc', 2);
    line('Ära 4 & 5: Antigravity / Gemini 4 Argon (Vollverkabelung, Wingnut 80-View,', '6px monospace', '#00ffcc', 2);
    line('Dynamisches Waffen-Lighting, WC4-Intro, Armada/Privateer & TCS Hermes)', '6px monospace', '#00ffcc', 14);
    line('OPEN-SOURCE ASSETS & ENGINE-REFERENZEN', 'bold 9px monospace', '#ffcc00', 6);
    line('Howard Day (HowieDay) — Wingnut / Wing-Commander-Unity-Clone (WCUnity)', '7px monospace', '#fff', 2);
    line('Niklas „Arne“ Jansson — Multi-Angle Schiffs-Sprites & Cockpit-Artwork', '7px monospace', '#ccc', 4);
    line('neuromancer — wc1-re & wc2-re (C/SDL2 WC1-Rekonstruktion & KI-Referenz)', '6px monospace', '#aaa', 2);
    line('OpenReliant / FreeSpace Open — Raumkampf- & HUD-Architektur-Referenzen', '6px monospace', '#aaa', 2);
    line('Origin Systems / Chris Roberts — Hommage an Wing Commander I–IV, Privateer & Armada', '6px monospace', '#888', 14);
    line('TECHNIK', 'bold 9px monospace', '#ffcc00', 6);
    line('MUSIK — Web Audio API (1 Melodie, 7 Instrumentierungen)', '7px monospace', '#aaa', 2);
    line('GRAFIK — 80-View Multi-Angle Pixel-Art + Amiga /2 + Dynamisches Sprite-Lighting', '7px monospace', '#aaa', 2);
    line('STIMMEN — Speech Synthesis (14 Profile, Mikro-Variation)', '7px monospace', '#aaa', 2);
    line('PHYSIK — 3D-Drift, Trägheit, Raumstaub, Sprungbojen, Kältekammer', '7px monospace', '#aaa', 2);
    line('SPEICHERSTELLE — localStorage, 1 Slot, Fax-Export', '7px monospace', '#aaa', 14);
    line('DANK AN', 'bold 10px monospace', '#ffcc00', 6);
    line('Howard Day, Arne Jansson & die Wing-Commander-Open-Source-Community', '7px monospace', '#fff', 2);
    line('GitHub (endlich)', '7px monospace', '#aaa', 2);
    line('Die Crew, die gestempelt hat (und die Roboter auf der TCS Hermes)', '7px monospace', '#aaa', 2);
    line('Das Audit (es schaut immer)', '7px monospace', '#aaa', 2);
    line('Die Katze (Unfall-Protokoll: README, GIT)', '7px monospace', '#aaa', 14);
    line('Keine Katzen wurden bei der Entwicklung verletzt.', '8px monospace', '#fff', 4);
    line('Die Katze bestritt den Vorfall dennoch nicht.', '8px monospace', '#fff', 18);
    line('ENDE', 'bold 14px monospace', '#fff', 10);
    line(SW.VERSION + ' · STERNENKORPS', '6px monospace', '#666');
    // Layout: ln.y = kumulierte y (0..Inhalthöhe), maxScroll = kompletter
    // Text läuft über die Bildschirmtop-Kante hinaus (Einlauf von unten).
    let y = 0;
    L.forEach((ln) => {
      const m = /(\d+)px/.exec(ln.f);
      const s = m ? parseInt(m[1], 10) : 8;
      ln.y = y;
      y += s * 1.7 + ln.gap;
    });
    return { lines: L, scroll: 0, speed: 0.55, maxScroll: y + SW.H + 40, done: false, endWait: 0 };
  },
  updateCredits() {
    const c = this._credits;
    if (!c) return;
    if (c.done) {
      c.endWait++;
      if (c.endWait > 300) this.setState('SHIP'); // nach 5 s am Ende: zum Träger
      return;
    }
    c.scroll += c.speed;
    if (c.scroll >= c.maxScroll) { c.scroll = c.maxScroll; c.done = true; }
  },
  renderCredits(ctx) {
    const c = this._credits;
    if (!c) return;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW.W, SW.H);
    SW.Engine.renderStars(ctx, 0, 0); // 1990-Style: Sternenfeld hinter dem Abspann
    ctx.textAlign = 'center';
    for (const ln of c.lines) {
      const y = SW.H + ln.y - c.scroll; // Text wandert nach oben: läuft unten rein, oben raus
      if (ln.t && y > -16 && y < SW.H + 16) {
        ctx.fillStyle = ln.c; ctx.font = ln.f;
        ctx.fillText(ln.t, SW.CX, y);
      }
    }
    ctx.textAlign = 'left';
    const blink = Math.floor(Date.now() / 500) % 2 === 0;
    if (c.done) {
      ctx.fillStyle = blink ? '#fff' : '#666'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
      ctx.fillText('[ LEERTASTE: ZUM TRÄGER ]', SW.CX, SW.H - 12);
      ctx.fillStyle = '#666'; ctx.font = '6px monospace';
      ctx.fillText('[ ESC ] SCHLIESSEN', SW.CX, SW.H - 26);
    } else {
      ctx.fillStyle = '#444'; ctx.font = '6px monospace'; ctx.textAlign = 'center';
      ctx.fillText('[ LEER ] WEITERSPULEN', SW.CX, SW.H - 8);
    }
    ctx.textAlign = 'left';
  }
};
