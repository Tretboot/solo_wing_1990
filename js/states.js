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
    if (s==='BRIEFING_BOARD') { SW.BriefingBoard.start(this.mission || SW.Missions.list[0]); }
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
        if(SW.World) { SW.World.missionResult='sieg'; SW.World.systemId = this.missionSystemId(); }
        if (SW.SmartDialogues && this.mission) SW.SmartDialogues.noteMission(this.mission.id, 'sieg');
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
          SW.World.systemId = this.missionSystemId();
          SW.World.nachrufe.push({name:'Flug Drei',text:'Gefallen im Dienst. ' + this.score + ' Punkte. ' + SW.World._nachrufText('Flug Drei')});
        }
        if (SW.SmartDialogues && this.mission) SW.SmartDialogues.noteMission(this.mission.id, 'tod');
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
    // Ziel-Planet (ab Ankunft, unten rechts, fade-in)
    if (arrival) {
      const fade = Math.min(1, t/40);
      ctx.save();
      ctx.globalAlpha = 0.55*fade;
      ctx.fillStyle = sys.farbe;
      ctx.beginPath(); ctx.arc(SW.W-100, SW.H-40, 85, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 0.8*fade;
      ctx.strokeStyle = sys.farbe; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(SW.W-100, SW.H-40, 90, 0, Math.PI*2); ctx.stroke();
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
    // Träger (Seitenansicht, Silhouette)
    const ship = this._jumpShipPos();
    if (ship.visible) {
      const x = ship.x, y = ship.y;
      ctx.save();
      if (ship.flame) {
        ctx.fillStyle = 'rgba(140,200,255,0.8)';
        ctx.beginPath(); ctx.moveTo(x-92, y-2); ctx.lineTo(x-118-Math.random()*10, y+1); ctx.lineTo(x-92, y+5); ctx.closePath(); ctx.fill();
      }
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
    ctx.fillText('Version 0.6.6-dev — JUMP, Story, Dialog-Paging',SW.CX,60);
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
      // SEKTOR-LICHT (3/4/5): Fenster zeigen die Sektoren-Farbe
      for (let i = 0; i < SW.Systems.length; i++) {
        const s = SW.Systems[i];
        const y = cheatY + 24 + i*11;
        ctx.fillStyle = s.farbe;
        ctx.fillText('[' + (i+3) + '] ' + s.name + (s.id === SW.World.systemId ? ' ●' : ''), 200, y);
        this['_cheatSysRect' + i] = { x: 200, y: y-9, w: 100, h: 12 };
      }
      ctx.fillStyle = '#444';
      ctx.font = '5px monospace';
      ctx.fillText('Nur für Testing. Licht folgt.', 200, cheatY+24+SW.Systems.length*11+5);
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
    if (vm === 'chase') {
      // Chase-Cam: Schiff im unteren Drittel (Rückenansicht), rollt mit
      const shX = SW.CX + SW.Player.vx * 1.2;
      const shY = SW.H - 40 + SW.Player.vy * 0.4;
      ctx.save();
      ctx.translate(shX, shY);
      ctx.rotate(SW.Player.rollAngle);
      SW.Sprites.draw(ctx, SW.Sprites.playerShip, 0, 0, 1.5);
      ctx.fillStyle = (SW.Game.frame % 6 < 3) ? '#ff6600' : '#ffaa00';
      ctx.fillRect(-5, 8, 3, 5); ctx.fillRect(2, 8, 3, 5);  // Triebwerke
      ctx.restore();
      SW.UI.renderMiniHud(ctx);
    } else {
      SW.UI.renderCockpit(ctx);
    }
    // UI (nicht rotiert)
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
  // Top-Down (Ansicht 'VOGEL'): flache 2D-Ebene, Z → Y (vorn = oben)
  renderCockpitTopDown(ctx) {
    SW.Engine.renderStarsTopDown(ctx);
    SW.Enemies.render(ctx);
    SW.Projectiles.render(ctx);
    SW.Explosions.render(ctx);
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
