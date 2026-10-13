// ===== SOLO WING 1990 — UI SYSTEMS =====
// Cockpit overlay, Radar, Space Map, Comm, Briefing.
//
// WIEDERHERSTELLUNG (2026-10-12): Die Datei war bei einer Shell-Operation in
// eine einzige Zeile zerlegt worden. Da Zeile 1 mit "//" beginnt, war das
// komplette File zu einem Kommentar verkommen — SW.UI und SW.Comm liefen
// still als undefined durch (Smoke-Test brach in startMission()).
// Basis: release/v0.6.5-rc/js/ui.js (intakt), dazu v0.6.6-Features nach
// KONZEPTE.md/PATCHNOTES.md nachgebaut:
//   - SW.Comm.render(): Cockpit-Video (NPC-Gesicht 2 s pro Funkzeile,
//     System-Farb-Rahmen) via SW.NPC.renderCockpitVideo
//   - SW.BriefingBoard: Typing-State-Machine (start/advance/update/render),
//     Zeilen aus SW.Dialogues.briefingBoards (m1–m3) bzw. mission.briefing (m4)

SW.UI = {
  navMapVisible: false,  // N = Nav/Spacemap Toggle (Cockpit)

  renderCockpit(ctx) {
    // Cockpit-Frame v2 (statisch, WC1-Stil)
    // Fallback: falls Frame nicht geladen ist, zeichne ein einfaches Cockpit
    if (SW.Sprites.cockpitFrame) {
      ctx.drawImage(SW.Sprites.cockpitFrame, 0, 0);
    } else {
      // Fallback-Cockpit (braune Rahmen)
      ctx.fillStyle = '#8a6d3b';
      ctx.fillRect(0, 0, SW.W, 16);       // Top-HUD
      ctx.fillRect(0, 0, 5, SW.H-40);     // linke Strebe
      ctx.fillRect(SW.W-5, 0, 5, SW.H-40); // rechte Strebe
      ctx.fillRect(0, 150, SW.W, 50);      // Boden
      ctx.fillStyle = '#1a1408';
      ctx.fillRect(3, 48, 46, 99);         // linke Tafel
      ctx.fillRect(SW.W-49, 48, 46, 99);   // rechte Tafel
    }

    // ===== DYNAMISCHE WERTE (über dem Frame) =====
    // FRONT-Schild (linke Tafel, unter Waffen)
    ctx.fillStyle = '#666'; ctx.font = '5px monospace';
    ctx.fillText('FRONT', 5, 102);
    const fw = (SW.Player.frontShield/SW.SHIELD_MAX)*17;
    ctx.fillStyle = '#222'; ctx.fillRect(30, 97, 17, 5);
    ctx.fillStyle = SW.Player.frontShield>30?'#0f0':'#f00';
    ctx.fillRect(30, 97, fw, 5);
    // REAR-Schild (linke Tafel)
    ctx.fillStyle = '#666'; ctx.fillText('REAR', 5, 114);
    const rw = (SW.Player.rearShield/SW.SHIELD_MAX)*17;
    ctx.fillStyle = '#222'; ctx.fillRect(30, 109, 17, 5);
    ctx.fillStyle = SW.Player.rearShield>30?'#0f0':'#f00';
    ctx.fillRect(30, 109, rw, 5);

    // Score (rechte Tafel, unten)
    ctx.fillStyle = '#0f0'; ctx.font = '7px monospace';
    ctx.fillText('SCORE', SW.W-47, 150);
    ctx.fillStyle = '#fff'; ctx.font = '8px monospace';
    ctx.fillText(String(SW.Game.score).padStart(5,'0'), SW.W-47, 160);

    // Laser-Slots + Autopilot + TTS (unten Mitte, über Beinen)
    const slots = SW.Input.getLaserSlots();
    const ap = SW.Autopilot.active?'[AP]':'';
    const tts = SW.TTS.enabled?'[TTS]':'';
    ctx.fillStyle = '#0f0'; ctx.font = '6px monospace'; ctx.textAlign = 'center';
    ctx.fillText('LASER:'+slots+' '+ap+' '+tts, SW.CX, 198);
    ctx.textAlign = 'left';
  },

  // Mini-HUD für Chase-Cam + Top-Down (ohne Cockpit-Frame)
  renderMiniHud(ctx) {
    ctx.fillStyle='rgba(10,10,16,0.75)';
    ctx.fillRect(0,0,SW.W,14);              // Balken oben
    ctx.fillRect(0,SW.H-12,SW.W,12);        // Balken unten
    ctx.fillStyle='#14141a';
    ctx.fillRect(2,16,48,24);               // Schild-Panel
    ctx.fillRect(SW.W-50,16,48,24);         // Score-Panel
    ctx.fillStyle='#666'; ctx.font='5px monospace';
    ctx.fillText('FRONT',6,24);
    const fw=(SW.Player.frontShield/SW.SHIELD_MAX)*17;
    ctx.fillStyle='#222'; ctx.fillRect(30,20,17,5);
    ctx.fillStyle=SW.Player.frontShield>30?'#0f0':'#f00';
    ctx.fillRect(30,20,fw,5);
    ctx.fillStyle='#666'; ctx.fillText('REAR',6,36);
    const rw=(SW.Player.rearShield/SW.SHIELD_MAX)*17;
    ctx.fillStyle='#222'; ctx.fillRect(30,32,17,5);
    ctx.fillStyle=SW.Player.rearShield>30?'#0f0':'#f00';
    ctx.fillRect(30,32,rw,5);
    ctx.fillStyle='#0f0'; ctx.font='6px monospace';
    ctx.fillText('SCORE',SW.W-46,26);
    ctx.fillStyle='#fff'; ctx.font='8px monospace';
    ctx.fillText(String(SW.Game.score).padStart(5,'0'),SW.W-46,37);
    // Radar-Kreis (in diesem Modus fehlt er im Frame)
    ctx.fillStyle='rgba(0,20,10,0.7)';
    ctx.beginPath(); ctx.arc(26,125,15,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#0f0'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.arc(26,125,15,0,Math.PI*2); ctx.stroke();
    const slots=SW.Input.getLaserSlots();
    ctx.fillStyle='#0f0'; ctx.font='6px monospace'; ctx.textAlign='center';
    ctx.fillText('LASER:'+slots+'   [V] '+SW.Engine.viewName(),SW.CX,SW.H-3);
    ctx.textAlign='left';
  },

  renderRadar(ctx) {
    const rx=26, ry=125, rr=15;
    // Blips (der Kreis ist im Frame)
    ctx.fillStyle='#fff'; ctx.fillRect(rx-1,ry-1,2,2);
    ctx.fillStyle='#f00';
    for (const e of SW.Enemies.list) {
      if (!e.alive) continue;
      const bx=rx+(e.x*0.08), by=ry+(e.y*0.08);
      if (Math.sqrt((bx-rx)*(bx-rx)+(by-ry)*(by-ry))<rr) ctx.fillRect(Math.round(bx),Math.round(by),2,2);
    }
    ctx.fillStyle='#0af';
    for (const np of SW.Autopilot.navPoints) {
      const bx=rx+(np.x*0.08), by=ry+(np.y*0.08);
      if (Math.sqrt((bx-rx)*(bx-rx)+(by-ry)*(by-ry))<rr) ctx.fillRect(Math.round(bx)-1,Math.round(by)-1,3,3);
    }
  },

  renderSpaceMap(ctx) {
    const mx=5,my=5,mw=60,mh=40;
    ctx.fillStyle='rgba(0,10,20,0.8)';ctx.fillRect(mx,my,mw,mh);
    ctx.strokeStyle='#003344';ctx.strokeRect(mx,my,mw,mh);
    const sx=mw/400,sy=mh/300,cx=mx+mw/2,cy=my+mh/2;
    if (SW.Carrier.visible) { ctx.fillStyle='#4488aa';ctx.fillRect(cx+SW.Carrier.x*sx-3,cy+SW.Carrier.y*sy-1,6,2); }
    ctx.fillStyle='#00aaff';
    for (const np of SW.Autopilot.navPoints) ctx.fillRect(cx+np.x*sx,cy+np.y*sy,2,2);
    ctx.fillStyle='#ff0000';
    for (const e of SW.Enemies.list) { if(!e.alive)continue;ctx.fillRect(cx+e.x*sx,cy+e.y*sy,1,1); }
    ctx.fillStyle='#00ff00';ctx.fillRect(cx+SW.Player.x*sx-1,cy+SW.Player.y*sy-1,3,3);
    ctx.fillStyle='#004455';ctx.font='5px monospace';ctx.fillText('TAKTISCH',mx+2,my+mh-2);
  },

  // Nav-Karte (N): vergrößerte Übersicht mit Nummern-Waypoints
  renderNavMap(ctx) {
    const mx=85,my=45,mw=150,mh=110;
    ctx.fillStyle='rgba(0,10,20,0.85)';ctx.fillRect(mx,my,mw,mh);
    ctx.strokeStyle='#0f0';ctx.lineWidth=1;ctx.strokeRect(mx,my,mw,mh);
    ctx.fillStyle='#0f0';ctx.font='bold 6px monospace';ctx.fillText('NAV-KARTE',mx+4,my+9);
    const sx=mw/400,sy=mh/300,cx=mx+mw/2,cy=my+mh/2;
    // Träger
    if (SW.Carrier.visible) { ctx.fillStyle='#4488aa';ctx.fillRect(cx+SW.Carrier.x*sx-3,cy+SW.Carrier.y*sy-1,6,2); }
    // Nav-Punkte (nächster Waypoint weiß)
    for (let i=0;i<SW.Autopilot.navPoints.length;i++) {
      const np=SW.Autopilot.navPoints[i];
      const px=cx+np.x*sx, py=cy+np.y*sy;
      ctx.fillStyle=(i===SW.Autopilot.currentNavIndex)?'#fff':'#00aaff';
      ctx.fillRect(px-1,py-1,3,3);
      ctx.fillStyle='#0af';ctx.font='5px monospace';ctx.fillText('WP'+(i+1),px+4,py+2);
    }
    // Feinde
    ctx.fillStyle='#ff0000';
    for (const e of SW.Enemies.list) { if(!e.alive)continue;ctx.fillRect(cx+e.x*sx,cy+e.y*sy,1,1); }
    // Spieler
    ctx.fillStyle='#00ff00';ctx.fillRect(cx+SW.Player.x*sx-1,cy+SW.Player.y*sy-1,3,3);
  },

  renderCrosshair(ctx) {
    ctx.strokeStyle='#0f0';ctx.lineWidth=1;ctx.beginPath();
    ctx.moveTo(SW.Input.mouseX-5,SW.Input.mouseY);ctx.lineTo(SW.Input.mouseX+5,SW.Input.mouseY);
    ctx.moveTo(SW.Input.mouseX,SW.Input.mouseY-5);ctx.lineTo(SW.Input.mouseX,SW.Input.mouseY+5);
    ctx.stroke();
  }
};

SW.Comm = {
  messages:[],queue:[],radioTimer:0,
  clear(){this.messages=[];this.queue=[];this.radioTimer=0;this.showFace=false;this.faceTimer=0;this.lastNpc='commander';this.lastText='';},
  add(text){this.queue.push({text,timer:300});SW.Audio.playCommBeep();
    // TTS: extract NPC name from text (e.g. "COMMANDER: ...")
    const colonIdx=text.indexOf(':');
    if(colonIdx>0){ const npc=text.substring(0,colonIdx); SW.TTS.speak(text.substring(colonIdx+1).trim(), npc); }
    else { SW.TTS.speak(text, 'commander'); }
    this.lastNpc = colonIdx>0?text.substring(0,colonIdx):'commander';
    this.lastText = colonIdx>0?text.substring(colonIdx+1).trim():text;
    this.showFace = true;
    this.faceTimer = 120; // show face for 2 seconds
  },
  update() {
    if (this.queue.length>0&&this.messages.length<2) this.messages.push(this.queue.shift());
    for (let i=this.messages.length-1;i>=0;i--) {
      this.messages[i].timer--;
      if (this.messages[i].timer<=0) this.messages.splice(i,1);
    }
    if(this.faceTimer>0)this.faceTimer--;
    if(this.faceTimer<=0)this.showFace=false;
    this.radioTimer++;
    if (this.radioTimer>600&&this.messages.length===0&&this.queue.length===0&&SW.Enemies.waveActive) {
      this.radioTimer=0;
      const lines=SW.Dialogues.radioStatic;
      if (lines&&lines.length>0) this.queue.push({text:'[STÖRUNG] '+lines[Math.floor(Math.random()*lines.length)],timer:200});
    }
  },
  render(ctx) {
    ctx.font='7px monospace';ctx.fillStyle='#00ff00';
    for (let i=0;i<this.messages.length;i++) {
      const msg=this.messages[i];
      const words=msg.text.split(' ');let line='';const lines=[];
      for (const w of words) { if((line+w).length>45){lines.push(line);line=w+' ';}else{line+=w+' ';} }
      lines.push(line);
      const yStart=28+i*16;
      for (let j=0;j<Math.min(lines.length,2);j++) ctx.fillText(lines[j].trim(),60,yStart+j*9);
    }
    // Cockpit-Video (v0.6.6): jede Funkzeile "NAME: Text" zeigt 2 s (faceTimer)
    // das Gesicht des Sprechers. Name→Gesicht-Auflösung: SW.NPC.resolve().
    if (this.showFace && this.faceTimer > 0 && SW.NPC) {
      SW.NPC.renderCockpitVideo(ctx, this.lastNpc, this.lastText, this.radioTimer);
    }
  }
};

SW.Briefing = {
  active:false,lines:[],currentIndex:0,charIndex:0,typing:true,
  start(lines){this.lines=lines;this.currentIndex=0;this.charIndex=0;this.typing=true;this.active=true;},
  advance() {
    if (this.typing) { this.typing=false;this.charIndex=this.lines[this.currentIndex].text.length;return; }
    this.currentIndex++;
    if (this.currentIndex>=this.lines.length) { this.active=false;return; }
    this.charIndex=0;this.typing=true;
  },
  update() {
    if (!this.active) return;
    if (this.typing) { this.charIndex++;if(this.charIndex>=this.lines[this.currentIndex].text.length)this.typing=false; }
  },
  render(ctx) {
    if (!this.active) return;
    const line=this.lines[this.currentIndex];
    const displayText=this.typing?line.text.substring(0,this.charIndex):line.text;
    ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(20,SW.H-70,SW.W-40,45);
    ctx.strokeStyle='#00aa00';ctx.strokeRect(20,SW.H-70,SW.W-40,45);
    ctx.fillStyle='#00aaff';ctx.font='bold 8px monospace';ctx.fillText(line.npc,28,SW.H-58);
    ctx.fillStyle='#00ff00';ctx.font='7px monospace';
    const words=displayText.split(' ');let l='';const lines=[];
    for (const w of words) { if((l+w).length>40){lines.push(l);l=w+' ';}else{l+=w+' ';} }
    lines.push(l);
    for (let i=0;i<Math.min(lines.length,3);i++) ctx.fillText(lines[i].trim(),28,SW.H-48+i*9);
    if (!this.typing) { ctx.fillStyle='#444';ctx.font='6px monospace';ctx.textAlign='right';ctx.fillText('[LEERTASTE]',SW.W-28,SW.H-28);ctx.textAlign='left'; }
  }
};


// ===== BAR SCENE (Phase 4) =====
// Piloten in der Bar, Scoreboard, optionale Dialoge.
SW.BarScene = {
  systemIndex: 0,
  dialogueActive: false,
  dialogueLines: [],
  dialogueIndex: 0,
  charIndex: 0,
  typing: true,
  _frame: 0,

  init(systemId) {
    const idx = SW.Systems.findIndex(s=>s.id===systemId);
    this.systemIndex = idx>=0?idx:0;
    const sys = SW.Systems[this.systemIndex];
    this.dialogueLines = SW.Dialogues.barScenes[sys.id] || [];
    this.dialogueIndex = 0;
    this.charIndex = 0;
    this.typing = false;
    this.dialogueActive = this.dialogueLines.length > 0;
    this._frame = 0;
  },

  advanceDialogue() {
    if (!this.dialogueActive) { this.dialogueActive=false; return; }
    if (this.typing) {
      this.typing = false;
      this.charIndex = this.dialogueLines[this.dialogueIndex].text.length;
      return;
    }
    this.dialogueIndex++;
    if (this.dialogueIndex >= this.dialogueLines.length) {
      this.dialogueActive = false;
      return;
    }
    this.charIndex = 0;
    this.typing = true;
    const line = this.dialogueLines[this.dialogueIndex];
    SW.TTS.speak(line.text, line.npc);
  },

  update() {
    this._frame++;
    if (!this.dialogueActive) return;
    if (this.typing) {
      this.charIndex++;
      if (this.charIndex >= this.dialogueLines[this.dialogueIndex].text.length) this.typing = false;
    }
  },

  render(ctx) {
    const sys = SW.Systems[this.systemIndex];
    // Background
    ctx.fillStyle = '#0a0a12';
    ctx.fillRect(0,0,SW.W,SW.H);

    // === FENSTER (oben, polygonal/spacig, mit Sternen) ===
    const win = { x:20, y:10, w:100, h:50, cut:12 };
    // 8-eckiges Polygon (abgeschnittene Ecken)
    ctx.beginPath();
    ctx.moveTo(win.x+win.cut, win.y);
    ctx.lineTo(win.x+win.w-win.cut, win.y);
    ctx.lineTo(win.x+win.w, win.y+win.cut);
    ctx.lineTo(win.x+win.w, win.y+win.h-win.cut);
    ctx.lineTo(win.x+win.w-win.cut, win.y+win.h);
    ctx.lineTo(win.x+win.cut, win.y+win.h);
    ctx.lineTo(win.x, win.y+win.h-win.cut);
    ctx.lineTo(win.x, win.y+win.cut);
    ctx.closePath();
    ctx.fillStyle = '#050510';
    ctx.fill();
    ctx.strokeStyle = sys.farbe;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Sterne im Fenster (geclippt)
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#fff';
    for (let i=0; i<20; i++) {
      const sx = win.x+3 + (i*13)%94;
      const sy = win.y+3 + (i*17)%44;
      ctx.fillRect(sx, sy, 1, 1);
    }
    // Nebel/Galaxie (spacig)
    ctx.fillStyle = sys.farbe;
    ctx.globalAlpha = 0.15;
    ctx.beginPath(); ctx.arc(win.x+60, win.y+25, 18, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // Fenster-Rahmen (diagonal, spacig)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(win.x+win.cut, win.y); ctx.lineTo(win.x+win.w-win.cut, win.y+win.h);
    ctx.moveTo(win.x+win.w-win.cut, win.y); ctx.lineTo(win.x+win.cut, win.y+win.h);
    ctx.stroke();

    // === BAR-THEKE (unten) ===
    ctx.fillStyle = '#1a1208';
    ctx.fillRect(0, SW.H-45, SW.W, 45);
    ctx.fillStyle = '#2a1e0e';
    ctx.fillRect(0, SW.H-45, SW.W, 3);
    // Theken-Kante
    ctx.fillStyle = '#3a2a15';
    ctx.fillRect(0, SW.H-45, SW.W, 2);
    // Flaschen auf der Theke
    const bottleColors = ['#44aa44','#aa4444','#4444aa','#aaaa44','#aa44aa'];
    for (let i=0; i<8; i++) {
      const bx = 30 + i*35;
      ctx.fillStyle = bottleColors[i%5];
      ctx.globalAlpha = 0.6;
      ctx.fillRect(bx, SW.H-55, 4, 10); // Flaschenkörper
      ctx.fillRect(bx+1, SW.H-58, 2, 3); // Flaschenhals
      ctx.globalAlpha = 1;
    }

    // === SCOREBOARD ("PILOTS" an der Wand, groß) ===
    const sbX = 140, sbY = 10, sbW = 110, sbH = 65;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(sbX, sbY, sbW, sbH);
    ctx.strokeStyle = sys.farbe;
    ctx.lineWidth = 1;
    ctx.strokeRect(sbX, sbY, sbW, sbH);
    // Titel
    ctx.fillStyle = sys.farbe;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('P I L O T S', sbX+sbW/2, sbY+10);
    ctx.textAlign = 'left';
    // Trennlinie
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(sbX+5, sbY+13);
    ctx.lineTo(sbX+sbW-5, sbY+13);
    ctx.stroke();
    // Piloten
    for (let i=0; i<SW.Scoreboard.length; i++) {
      const p = SW.Scoreboard[i];
      const py = sbY + 20 + i*9;
      ctx.fillStyle = p.farbe;
      ctx.fillRect(sbX+5, py-4, 4, 4);
      ctx.fillStyle = p.status==='gefallen' ? '#555' : '#ccc';
      ctx.font = '6px monospace';
      ctx.fillText(p.name, sbX+13, py);
      ctx.fillStyle = '#888';
      ctx.textAlign = 'right';
      ctx.fillText(p.kills+'/'+p.losses, sbX+sbW-5, py);
      ctx.textAlign = 'left';
    }

    // === SYSTEM-NAME (oben rechts) ===
    ctx.fillStyle = sys.farbe;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(sys.name, SW.W-10, 20);
    ctx.font = '5px monospace';
    ctx.fillStyle = '#555';
    ctx.fillText(sys.char.substring(0,35), SW.W-10, 30);
    ctx.textAlign = 'left';

    // === PILOTEN (sitzend, detaillierter) ===
    // Pilot 1 (links, an Theke)
    this.renderPilotDetailed(ctx, 50, SW.H-65, sys.farbe, 'SECHS', true);
    // Pilot 2 (Mitte, an Tisch)
    this.renderPilotDetailed(ctx, 130, SW.H-60, '#ff6644', 'NEUN', false);
    // Pilot 3 (rechts, an Theke)
    this.renderPilotDetailed(ctx, 220, SW.H-65, '#88aa88', 'ZWO', true);

    // Tisch (Mitte)
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(115, SW.H-50, 30, 3); // Tischplatte
    ctx.fillRect(128, SW.H-47, 4, 10); // Tischbein

    // === DIALOG-BOX (unten, groß) ===
    if (this.dialogueActive) {
      const line = this.dialogueLines[this.dialogueIndex];
      const displayText = this.typing ? line.text.substring(0, this.charIndex) : line.text;
      // Box (height increased from 38 to 60px)
      ctx.fillStyle = 'rgba(0,0,0,0.9)';
      ctx.fillRect(15, SW.H-85, SW.W-30, 60);
      ctx.strokeStyle = sys.farbe;
      ctx.lineWidth = 1;
      ctx.strokeRect(15, SW.H-85, SW.W-30, 60);
      // Unscharfes Gesicht
      this.renderBlurryFace(ctx, 22, SW.H-78, sys.farbe);
      // NPC Name
      ctx.fillStyle = sys.farbe;
      ctx.font = 'bold 7px monospace';
      ctx.fillText(line.npc, 42, SW.H-72);
      // Text (wrapped to max 65 characters per line)
      ctx.fillStyle = '#0f0';
      ctx.font = '7px monospace';
      const words = displayText.split(' ');
      let l=''; const lines=[];
      for (const w of words) { if((l+w).length>65){lines.push(l);l=w+' ';}else{l+=w+' ';} }
      lines.push(l);
      for (let i=0;i<Math.min(lines.length,2);i++) ctx.fillText(lines[i].trim(), 42, SW.H-62+i*9);
      // Weiter-Prompt
      if (!this.typing) {
        const blink = Math.floor(this._frame/30)%2===0;
        ctx.fillStyle = blink?'#fff':'#666';
        ctx.font = '6px monospace';
        ctx.textAlign='right';
        ctx.fillText('[LEER: weiter]', SW.W-22, SW.H-50);
        ctx.textAlign='left';
      }
    } else {
      // "Zur Briefing-Tafel" Prompt
      const blink = Math.floor(this._frame/30)%2===0;
      ctx.fillStyle = blink?'#fff':'#666';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ ZUR BRIEFING-TAFEL ]', SW.CX, SW.H-25);
      ctx.textAlign = 'left';
    }
  },

  // Detaillierter Pilot (sitzend)
  renderPilotDetailed(ctx, x, y, color, name, atBar) {
    ctx.save();
    // Kopf
    ctx.fillStyle = '#cc9966'; // Haut
    ctx.fillRect(x-4, y-14, 8, 8);
    // Haare
    ctx.fillStyle = color;
    ctx.fillRect(x-4, y-16, 8, 3);
    // Augen
    ctx.fillStyle = '#000';
    ctx.fillRect(x-2, y-11, 1, 1);
    ctx.fillRect(x+1, y-11, 1, 1);
    // Körper (Jacke)
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x-6, y-6, 12, 12);
    ctx.globalAlpha = 1;
    // Arme
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5;
    if (atBar) {
      // Arme auf Theke
      ctx.fillRect(x-8, y+2, 4, 3);
      ctx.fillRect(x+4, y+2, 4, 3);
    } else {
      // Arme am Tisch
      ctx.fillRect(x-7, y+0, 3, 5);
      ctx.fillRect(x+4, y+0, 3, 5);
    }
    ctx.globalAlpha = 1;
    // Beine (sitzend)
    ctx.fillStyle = '#333';
    ctx.fillRect(x-5, y+6, 4, 6);
    ctx.fillRect(x+1, y+6, 4, 6);
    // Name
    ctx.fillStyle = '#666';
    ctx.font = '5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y+18);
    ctx.textAlign = 'left';
    ctx.restore();
  },

  // Unscharfes Gesicht
  renderBlurryFace(ctx, x, y, color) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 14, 16);
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x+1, y+1, 12, 14);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#000';
    ctx.fillRect(x+3, y+5, 3, 2);
    ctx.fillRect(x+9, y+5, 3, 2);
    ctx.fillRect(x+4, y+11, 6, 1);
    ctx.restore();
  }
};

SW.BriefingBoard = {
  // v0.6.6: Briefing-Tafel als Typing-State-Machine (statt statischer Tafel).
  // Flow: main.js → advance() pro Leertaste; nach der letzten Zeile →
  // !active → SW.Game.startJump(). states.js ruft render(ctx) auf.
  active:false, lines:[], currentIndex:0, charIndex:0, typing:true, mission:null,

  start(mission) {
    this.mission = mission || SW.Missions.list[0];
    // m1–m3: briefingBoards (Strings → Commander), m4: mission.briefing ({npc,text})
    const raw = SW.Dialogues.briefingBoards[this.mission.id];
    this.lines = raw
      ? raw.map(t => ({ npc: 'COMMANDER', text: t }))
      : (this.mission.briefing || []).slice();
    this.currentIndex = 0; this.charIndex = 0; this.typing = true; this.active = true;
    if (this.lines.length && SW.TTS) SW.TTS.speak(this.lines[0].text, this.lines[0].npc);
  },

  advance() {
    if (!this.active) return;
    if (this.typing) { this.typing=false; this.charIndex=this.lines[this.currentIndex].text.length; return; }
    this.currentIndex++;
    if (this.currentIndex>=this.lines.length) { this.active=false; return; }
    this.charIndex=0; this.typing=true;
    if (SW.TTS) SW.TTS.speak(this.lines[this.currentIndex].text, this.lines[this.currentIndex].npc);
  },

  update() {
    if (!this.active) return;
    if (this.typing) { this.charIndex++; if (this.charIndex>=this.lines[this.currentIndex].text.length) this.typing=false; }
  },

  render(ctx) {
    const mission = this.mission || SW.Missions.list[0];
    const sys = SW.Systems.find(s=>s.missionId===mission.id) || SW.Systems[0];
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0,0,SW.W,SW.H);
    // Tafel (grün)
    ctx.fillStyle = '#0a1a0a';
    ctx.fillRect(30, 20, SW.W-60, 150);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 20, SW.W-60, 150);
    // Kopf
    ctx.fillStyle = sys.farbe;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BRIEFING — ' + mission.name, SW.CX, 38);
    ctx.textAlign = 'left';
    // Mission-Info
    ctx.fillStyle = '#666';
    ctx.font = '6px monospace';
    ctx.fillText('WELLEN: ' + mission.waves.length, 45, 52);
    ctx.fillText('SCHIFFE: ' + mission.waves.map(w=>w.ship||'d_b').join(', '), 45, 62);
    // Commander-Zeile mit Typing (eine Zeile nach der anderen)
    const line = this.lines[this.currentIndex];
    if (line) {
      const displayText = this.typing ? line.text.substring(0, this.charIndex) : line.text;
      ctx.fillStyle = '#00ff00';
      ctx.font = '8px monospace';
      const words = displayText.split(' '); let l=''; const ls=[];
      for (const w of words) { if((l+w).length>55){ls.push(l);l=w+' ';}else{l+=w+' ';} }
      ls.push(l);
      for (let i=0;i<Math.min(ls.length,3);i++) ctx.fillText(ls[i].trim(), 45, 85 + i*14);
      if (!this.typing) {
        const blink = Math.floor(Date.now()/500)%2===0;
        ctx.fillStyle = blink?'#fff':'#666';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[ LEERTASTE: WEITER ]', SW.CX, 155);
        ctx.textAlign = 'left';
      }
    }
  }
};
