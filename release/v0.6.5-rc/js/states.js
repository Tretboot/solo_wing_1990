// ===== SOLO WING 1990 — GAME STATE MACHINE =====
// BAR → BRIEFING → TAKEOFF → COCKPIT → LANDING → DEBRIEFING

SW.Game = {
  state:'BAR',score:0,victory:false,frame:0,mission:null,_simMode:false,_akademieBestanden:false,
  setState(s) {
    this.state=s;
    if (s==='INTRO') { SW.Intro.init(); }
    if (s==='AKADEMIE') { SW.Akademie.init(); }
    if (s==='SHIP') { if(!SW._shipInit) { SW.Ship.init(this.mission?.id||'m1'); SW._shipInit=true; } }
    if (s==='BRIEFING') { const b=SW.Dialogues.getBriefing(this.mission?.id||'m1');SW.Briefing.start(b); }
    if (s==='TAKEOFF') SW.Flight.start('takeoff');
    if (s==='LANDING') SW.Flight.start('landing');
  },
  startMission(id) {
    this.mission=SW.Missions.get(id);
    this.score=0;this.victory=false;this.frame=0;
    SW.Player.init();SW.Engine.initStars();
    SW.Projectiles.clear();SW.Explosions.clear();SW.Comm.clear();
    SW.Collision.reset();SW.Enemies.init(this.mission);
    SW.Autopilot.init(this.mission.navPoints||[]);
    SW.Carrier.init();
    SW.Ship.init(this.mission.id);
    this.setState('SHIP');
  },
  triggerVictory() {
    setTimeout(()=>{
      if (SW.Player.alive&&this.state==='COCKPIT') {
        // SIM-MODUS: Akademie-Prüfung bestanden
        if (this._simMode) { SW.Akademie.bestanden(); return; }
        if(SW.World) SW.World.missionResult='sieg';
        SW.Comm.add("COMMANDER: Sie kommen zurück. Beförderung zum Gefreiten. Per Fax.");
        if (SW.Quests) SW.Quests.tick({typ:'mission', ergebnis:'sieg'});
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
        if(SW.World) {
          SW.World.missionResult='tod';
          SW.World.nachrufe.push({name:'Flug Drei',text:'Gefallen im Dienst. ' + this.score + ' Punkte. ' + SW.World._nachrufText('Flug Drei')});
        }
        if (SW.Quests) SW.Quests.tick({typ:'mission', ergebnis:'tod'});
        this.setState('DEBRIEFING');
      }
    },2000);
  },
  // ===== HANGAR (nach Landung) =====
  // Bolt geht zum Schiff und kommentiert — je nach Schadenslage.
  startHangar() {
    this._hangarTimer = 0;
    this._hangarLines = this._hangarDialog();
    this.setState('HANGAR');
  },
  _hangarDialog() {
    const f = SW.Player.frontShield, r = SW.Player.rearShield;
    const min = Math.min(f, r);
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
    const n = (SW.World && SW.World.pilotName) || 'FLUG DREI';
    if (SW.TTS) SW.TTS.speak('Willkommen an Bord, ' + n + '. Die Spinde ist frei. Der Aufzug zum Stab ist in Arbeit. Sie steigen die Treppe.', 'COMMANDER');
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
    // Text
    ctx.textAlign='center';
    ctx.fillStyle='#0f0';ctx.font='bold 12px monospace';
    ctx.fillText('TRANSFER',SW.CX,40);
    ctx.fillStyle='#666';ctx.font='6px monospace';
    ctx.fillText('STERNENKORPS — TRÄGER FAX-TRAGÖDIE — FORMULAR 1-A',SW.CX,52);
    if (t > 60) {
      ctx.fillStyle='#fff';ctx.font='bold 10px monospace';
      ctx.fillText('WILLKOMMEN AN BORD, ' + n + '.',SW.CX,95);
    }
    if (t > 150) {
      ctx.fillStyle='#aaa';ctx.font='7px monospace';
      ctx.fillText('Spinde 14 ist frei. Schlüssel liegt bei Sechs.',SW.CX,120);
      ctx.fillText('Der Aufzug zum Stab ist in Arbeit. Sie steigen die Treppe.',SW.CX,133);
    }
    if (t > 90) {
      const blink=Math.floor(Date.now()/500)%2===0;
      ctx.fillStyle=blink?'#fff':'#666';ctx.font='8px monospace';
      ctx.fillText('[ LEERTASTE: ANNEHMEN ]',SW.CX,SW.H-15);
    }
    ctx.textAlign='left';
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
    ctx.fillText('Version 0.6.5-rc — Release Candidate',SW.CX,60);
    ctx.textAlign='left';
    const L = [
      'STERNE: KUNSTLICHE. AUS RUST.',
      'LIZENZ: MIT (siehe LICENSE)',
      '',
      'GEBAUT VON: EHEMALIGEM AGENTENVERBUND (QWEN-TEAM)',
      'AGENTENVERBUND: AUFGELOEST (09/2026)',
      'JETZT: VS CODE + API. DAS TEAM IST UMGESTELLT.',
      'DER BISHERIGEN CREW WIRD GEDANKT.',
      '',
      'STERNE: KEINE WERBUNG. KEIN INTERNET. NUR FAX.'
    ];
    ctx.fillStyle='#0f0';ctx.font='7px monospace';
    for (let i=0;i<L.length;i++) ctx.fillText(L[i],SW.CX-110,85+i*13);
    const blink=Math.floor(Date.now()/500)%2===0;
    ctx.fillStyle=blink?'#fff':'#666';ctx.font='8px monospace';ctx.textAlign='center';
    ctx.fillText('[ LEERTASTE: ZURÜCK ]',SW.CX,SW.H-30);
    ctx.textAlign='left';
  },
  renderMenu(ctx) {
    // Hintergrund: letzter Frame bleibt (Pause) — dunkles Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0,0,SW.W,SW.H);
    // Rahmen
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 15, SW.W-40, SW.H-30);
    // Titel
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('M E N Ü', SW.CX, 32);
    ctx.textAlign = 'left';
    // Trennlinie
    ctx.strokeStyle = '#030';
    ctx.beginPath(); ctx.moveTo(30, 40); ctx.lineTo(SW.W-30, 40); ctx.stroke();

    // ANLEITUNG
    ctx.fillStyle = '#0af';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('ANLEITUNG', 32, 54);
    ctx.fillStyle = '#ccc';
    ctx.font = '7px monospace';
    const controls = [
      'WASD + Pfeile   :  Bewegen (Drift)',
      'Q / E           :  Rollen',
      'Maus            :  Zielen',
      'LEERTASTE       :  Feuer',
      'T               :  Autopilot',
      'N               :  Nav-Karte',
      'M               :  TTS ein/aus',
      'O               :  Sound ein/aus',
      'ESC             :  Menü'
    ];
    for (let i=0; i<controls.length; i++) {
      ctx.fillText(controls[i], 32, 66 + i*11);
    }

    // OPTIONEN
    ctx.fillStyle = '#0af';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('OPTIONEN', 200, 54);
    ctx.font = '7px monospace';
    ctx.fillStyle = SW.TTS.enabled ? '#0f0' : '#f66';
    ctx.fillText('TTS: ' + (SW.TTS.enabled ? 'AN' : 'AUS') + '  [M]', 200, 66);
    ctx.fillStyle = SW.Audio.enabled ? '#0f0' : '#f66';
    ctx.fillText('SOUND: ' + (SW.Audio.enabled ? 'AN' : 'AUS') + '  [O]', 200, 77);
    ctx.fillStyle = '#666';
    ctx.fillText('Laser-Slots: ' + SW.Input.getLaserSlots(), 200, 92);
    ctx.fillText('(mehr Geräte = mehr)', 200, 101);
    ctx.fillStyle = '#888';
    ctx.fillText('INFO: [I]  (Version, Lizenz)', 200, 112);

    // CHEAT (Testing) — rechte Spalte unter OPTIONEN (links steht die ANLEITUNG)
    if (SW.Config.cheatEnabled) {
      ctx.fillStyle = '#f66';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('CHEAT [Testing]', 200, 118);
      ctx.font = '7px monospace';
      const cheatY = 130;
      // ZUM TRÄGER
      ctx.fillStyle = '#0f0';
      ctx.fillText('[1] ZUM TRÄGER', 200, cheatY);
      this._cheatShipRect = { x: 200, y: cheatY-9, w: 105, h: 12 };
      // KARTE
      ctx.fillStyle = '#0af';
      ctx.fillText('[2] KARTE (alle Räume)', 200, cheatY+12);
      this._cheatMapRect = { x: 200, y: cheatY+3, w: 115, h: 12 };
      ctx.fillStyle = '#444';
      ctx.font = '5px monospace';
      ctx.fillText('Nur für Testing.', 200, cheatY+24);
    }

    // Zurück
    const blink = Math.floor(Date.now()/500)%2===0;
    ctx.fillStyle = blink?'#fff':'#666';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ ESC: ZURÜCK ]', SW.CX, SW.H-22);
    ctx.textAlign = 'left';
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
      ctx.fillStyle='#0f0';ctx.font='bold 12px monospace';ctx.textAlign='center';
      ctx.fillText('BESTANDEN.',SW.CX,SW.H/2);
      ctx.fillStyle='#fff';ctx.font='8px monospace';
      ctx.fillText('Sie werden dem Träger FAX-TRAGÖDIE zugeteilt.',SW.CX,SW.H/2+20);
      ctx.fillText('Formular 83-B liegt bereit.',SW.CX,SW.H/2+35);
      const b1=Math.floor(Date.now()/500)%2===0;
      ctx.fillStyle=b1?'#fff':'#666';ctx.font='8px monospace';
      ctx.fillText('[ LEERTASTE: ZUM TRÄGER ]',SW.CX,SW.H/2+60);
      ctx.textAlign='left';
    }
    if (SW.Akademie.phase==='durchgefallen') {
      ctx.fillStyle='#ff6644';ctx.font='bold 12px monospace';ctx.textAlign='center';
      ctx.fillText('NICHT BESTANDEN.',SW.CX,SW.H/2);
      ctx.fillStyle='#fff';ctx.font='8px monospace';
      ctx.fillText('Sie werden trotzdem dem Träger FAX-TRAGÖDIE zugeteilt.',SW.CX,SW.H/2+20);
      ctx.fillText('Formular 83-B. Teil C: "Nicht bestanden."',SW.CX,SW.H/2+35);
      const b2=Math.floor(Date.now()/500)%2===0;
      ctx.fillStyle=b2?'#fff':'#666';ctx.font='8px monospace';
      ctx.fillText('[ LEERTASTE: ZUM TRÄGER ]',SW.CX,SW.H/2+60);
      ctx.textAlign='left';
    }
  },
  renderBriefingBoard(ctx) {
    SW.BriefingBoard.render(ctx, this.mission);
  },
  renderBriefing(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    SW.Engine.renderStars(ctx,0,0);
    ctx.fillStyle='#fff';ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.fillText('BRIEFING: '+(this.mission?.name||''),SW.CX,20);
    ctx.textAlign='left';
    SW.Briefing.render(ctx);
  },
  renderTakeoff(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    SW.Engine.renderStars(ctx,SW.Player.x,SW.Player.y);
    SW.Flight.render(ctx);
    ctx.fillStyle='#0f0';ctx.font='7px monospace';ctx.textAlign='center';
    ctx.fillText('ABHEBUNG IN PROGRESS',SW.CX,15);ctx.textAlign='left';
  },
  renderCockpit(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);
    // Roll: rotiere Weltraum-Ansicht (Sterne, Feinde, Projektile)
    if (Math.abs(SW.Player.rollAngle) > 0.005) {
      ctx.save();
      ctx.translate(SW.CX, SW.CY);
      ctx.rotate(SW.Player.rollAngle);
      ctx.translate(-SW.CX, -SW.CY);
    }
    SW.Engine.renderStars(ctx,SW.Player.x,SW.Player.y);
    SW.Enemies.render(ctx);
    SW.Projectiles.render(ctx);
    SW.Explosions.render(ctx);
    if (Math.abs(SW.Player.rollAngle) > 0.005) ctx.restore();
    // UI (nicht rotiert)
    SW.UI.renderCockpit(ctx);
    SW.UI.renderRadar(ctx);
    if (SW.UI.navMapVisible) SW.UI.renderNavMap(ctx);
    SW.Comm.render(ctx);
    SW.UI.renderCrosshair(ctx);
    if (SW.Autopilot.active) {
      ctx.fillStyle='#00aaff';ctx.font='6px monospace';ctx.textAlign='center';
      ctx.fillText('◈ AUTOPILOT ◈',SW.CX,12);ctx.textAlign='left';
    }
    // Nav-Hinweis
    if (SW.UI.navMapVisible) {
      ctx.fillStyle='#0af';ctx.font='5px monospace';ctx.textAlign='center';
      ctx.fillText('[N] NAV',SW.CX,SW.H-2);ctx.textAlign='left';
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
    // Schiff (Silhouette, Mitte, von hinten)
    const shipX=SW.CX, shipY=SW.H-60;
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
      ctx.fillStyle=blink?'#fff':'#666';ctx.font='8px monospace';ctx.textAlign='center';
      ctx.fillText('[ LEERTASTE: ZUM TRÄGER ]',SW.CX,15);ctx.textAlign='left';
    }
    ctx.textAlign='left';
  },

  renderDebriefing(ctx) {
    ctx.fillStyle='#000';ctx.fillRect(0,0,SW.W,SW.H);ctx.textAlign='center';
    if (this.victory) {
      ctx.fillStyle='#0f0';ctx.font='bold 14px monospace';ctx.fillText('MISSION ABGESCHLOSSEN',SW.CX,40);
      ctx.fillStyle='#fff';ctx.font='8px monospace';
      ctx.fillText('Sie kommen zurück. Sie gehören jetzt zu einer sehr kleinen Gruppe.',SW.CX,65);
      ctx.fillText('Beförderung zum Gefreiten. Der Befehl geht per Fax raus.',SW.CX,78);
      ctx.fillStyle='#0f0';ctx.font='6px monospace';
      ctx.fillText('Alle Abschüsse wurden im System erfasst. Das System heißt "A:".',SW.CX,95);
    } else {
      ctx.fillStyle='#f00';ctx.font='bold 14px monospace';ctx.fillText('KONTAKT VERLOREN',SW.CX,40);
      ctx.fillStyle='#fff';ctx.font='8px monospace';
      ctx.fillText('Verlust bestätigt. Wir aktualisieren die Ehrentafel an der Wand.',SW.CX,65);
      ctx.fillText('Trauerfeier am Mittwoch, 14:00, Kapelle B. Torte von der Konditorei.',SW.CX,78);
      ctx.fillStyle='#888';ctx.font='6px monospace';
      ctx.fillText('Das Formular P-9 liegt jetzt im Ordner "C:\\PAPIERKRAM".',SW.CX,95);
    }
    ctx.fillStyle='#fff';ctx.font='10px monospace';
    ctx.fillText('EINSATZBEWERTUNG: '+this.score,SW.CX,120);
    const blink=Math.floor(Date.now()/500)%2===0;
    ctx.fillStyle=blink?'#fff':'#888';ctx.font='9px monospace';
    ctx.fillText('[ ZURÜCK ZUM TRÄGER ]',SW.CX,150);
    ctx.textAlign='left';
  }
};
