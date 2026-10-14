// ===== SOLO WING 1990 — WORLD STATE (Phase 6.3) =====
// Seed, aktuelles System, gesammelte Nachrufe, NPC-Placements.
// Das "fliegende Dorf" lebt: NPCs wandern je nach Seed/Mission,
// die Kapelle sammelt Nachrufe, das Observationsdeck zeigt das System.
SW.World = {
  seed: 1990,
  systemId: 's1',
  shipSystems: { engines:100, weapons:100, shields:100, sensors:100 },
  nachrufe: [],       // gesammelte Nachrufe (Kapelle)
  missionResult: null, // 'sieg' | 'tod' | null

  init(systemId, seed) {
    this.systemId = systemId || 's1';
    this.seed = seed || 1990;
    this.missionResult = null;
    if (!SW.Player.isValidSystems(this.shipSystems)) this.shipSystems = SW.Player.defaultSystems();
    // Nachrufe: aus gefallenen Piloten (Scoreboard) + generisch
    this.nachrufe = [];
    for (const p of SW.Scoreboard) {
      if (p.status === 'gefallen') {
        this.nachrufe.push({
          name: p.name,
          text: 'Gefallen im Dienst. ' + p.kills + ' Abschüsse. ' + this._nachrufText(p.name)
        });
      }
    }
    if (this.nachrufe.length === 0) {
      this.nachrufe.push({ name:'Vier', text:'Gefallen im Dienst. 0 Abschüsse. Hat gelacht, bis zum Schluss.' });
    }
  },

  _nachrufText(name) {
    const opts = [
      'Die Kantine hat eine Torte gebacken. Niemand hat sie gegessen.',
      'Kopfhörer sind noch in der Spinde. VHS-Karte nie bezahlt.',
      'Der Stuhl in der Bar ist jetzt frei. Jemand hat ihn umgedreht.',
      'Pfarrer Klopstock hat die Formel geändert. Einmal. Nur für ihn.'
    ];
    let h = 0;
    for (let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))&0xffff;
    return opts[h % opts.length];
  },

  // Deterministischer Hash (für Seed-basierte Entscheidungen)
  _hash(str) {
    let h = this.seed;
    for (let i=0;i<str.length;i++) h = (h*31 + str.charCodeAt(i)) & 0xffff;
    return h;
  },

  // NPCs für einen Raum: Basis-NPCs + ggf. ein "gastierender" NPC (je nach Seed)
  npcInRoom(roomId) {
    const room = SW.Rooms.find(r => r.id === roomId);
    if (!room) return [];
    const base = room.npcs.slice();
    // Je nach Seed: ein Pilot "gastiert" in diesem Raum (deterministisch)
    const h = this._hash(roomId);
    const guests = ['Sechs','Neun','Zwo','Vier'];
    const guest = guests[h % guests.length];
    // Gast nur, wenn er nicht schon Basis-NPC ist und nicht gefallenen
    const guestData = SW.Scoreboard.find(p => p.name === guest);
    if (guestData && guestData.status !== 'gefallen' && base.indexOf(guest) < 0) {
      // Je nach Missionsergebnis: nach Sieg sitzt Sechs in der Bar, nach Tod Neun in der Kapelle
      if (this.missionResult === 'sieg' && roomId === 'bar' && guest !== 'Sechs') {
        base.push('Sechs');
      } else if (this.missionResult === 'tod' && roomId === 'kapelle' && guest !== 'Neun') {
        base.push('Neun');
      } else if (h % 3 === 0) {
        // In 1/3 der Räume gastiert ein Pilot
        base.push(guest);
      }
    }
    return base;
  },

  // System-Info (für Observationsdeck)
  systemInfo() {
    const sys = SW.Systems.find(s => s.id === this.systemId) || SW.Systems[0];
    return sys;
  }
};

// ===== SOLO WING 1990 — SHIP INTERIOR (Phase 6.1) =====
// Der Träger als "fliegendes Dorf". 10 statische Räume.
// Tür-Klick-Navigation, Minimap, prozeduraler Artstyle pro Raum, NPC-Dialoge.
// Konferenz: No Thinking + Lead Story Writer.

SW.Ship = {
  DECK_NAMES: { 1: 'WOHNDECK', 2: 'DIENSTDECK', 3: 'OBERDECK' },
  currentRoom: 'bar',
  dialogueActive: false,
  dialogueLines: [],
  dialogueIndex: 0,
  charIndex: 0,
  typing: true,
  talkingNPC: null,
  _frame: 0,
  _doorRects: [],
  _npcRects: [],
  _lockedQuartersRects: [],
  _ownQuartersRect: null,
  _roomNotice: null,
  _lockedDoorClick: 0,
  savePanelOpen: false,  // Save/Load-Panel im persönlichen Quartier
  _saveTerminalRect: null,
  _saveRects: [],        // Panel-Optionen

  init(systemId) {
    this.currentRoom = 'bar';
    this._frame = 0;
    this.dialogueActive = false;
    this.talkingNPC = null;
    this.savePanelOpen = false; // Raumwechsel schließt das Save-Panel
    // World-State initialisieren (Seed = Mission-Id + Zeit)
    const seed = (SW.Game.mission?.id || 'm1').charCodeAt(1) * 1000 + Math.floor(Date.now()/100000) % 1000;
    SW.World.init(systemId, seed);
  },

  getRoom() { return SW.Rooms.find(r => r.id === this.currentRoom) || SW.Rooms[0]; },

  roomLabel(room, mapLabel) {
    const pilotName = ((SW.World && SW.World.pilotName) || 'PILOT').trim() || 'PILOT';
    const label = mapLabel ? (room.mapLabel || room.name) : room.name;
    return label.replace(/\{spielername\}/gi, pilotName);
  },

  // ===== NAVIGATION =====
  navigateTo(roomId) {
    const room = this.getRoom();
    if (room.toren.indexOf(roomId) < 0) return; // nur über Türen
    this.currentRoom = roomId;
    this._saveTerminalRect = null;
    this._roomNotice = null;
    this.dialogueActive = false;
    this.talkingNPC = null;
    SW.Audio.playCommBeep();
  },

  // ===== DIALOG =====
  startDialogue() {
    const room = this.getRoom();
    const lines = SW.Dialogues.rooms[room.id] || [];
    if (lines.length === 0) return;
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialoguePage = 0;
    this.charIndex = 0;
    this.typing = true;
    this.dialogueActive = true;
    const line = lines[0];
    SW.TTS.speak(line.text, line.npc);
  },

  advanceDialogue() {
    if (!this.dialogueActive) { this.dialogueActive = false; return; }
    if (this.typing) {
      this.typing = false;
      this.charIndex = this.dialogueLines[this.dialogueIndex].text.length;
      return;
    }
    // Weiter: erst durch die Seiten scrollen (keine neue TTS), dann nächste Zeile
    const pages = this._dialoguePages || 1;
    if (this.dialoguePage < pages - 1) {
      this.dialoguePage++;
      return;
    }
    this.dialogueIndex++;
    this.dialoguePage = 0;
    if (this.dialogueIndex >= this.dialogueLines.length) {
      this.dialogueActive = false;
      this.talkingNPC = null;
      return;
    }
    this.charIndex = 0;
    this.typing = true;
    const line = this.dialogueLines[this.dialogueIndex];
    SW.TTS.speak(line.text, line.npc);
  },

  update() {
    this._frame++;
    if (this._roomNotice) {
      this._roomNotice.timer--;
      if (this._roomNotice.timer <= 0) this._roomNotice = null;
    }
    if (!this.dialogueActive) return;
    if (this.typing) {
      this.charIndex++;
      if (this.charIndex >= this.dialogueLines[this.dialogueIndex].text.length) this.typing = false;
    }
  },

  // ===== KLIK-BEHANDLUNG =====
  handleClick(mx, my) {
    // Save/Load-Panel: Overlay hat Vorrang
    if (this.savePanelOpen) { this.handleSavePanelClick(mx, my); return; }
    if (this.currentRoom === 'quartiere') {
      if (this._ownQuartersRect && this._contains(this._ownQuartersRect, mx, my)) {
        this.navigateTo('player_quarters');
        return;
      }
      if (this._lockedQuartersRects.some(rect => this._contains(rect, mx, my))) {
        const messages = [
          ['ZUGANGSKONTROLLE', 'Abgeschlossen. Das Quartier ist privat.'],
          ['ZUGANGSKONTROLLE', 'Kein Zugriff. Für diese Tür fehlt die Berechtigung.'],
          ['DU', 'Ich sollte mich da nicht reinschleichen.']
        ];
        const notice = messages[this._lockedDoorClick % messages.length];
        this._lockedDoorClick++;
        this.showRoomNotice(notice[0], notice[1]);
        return;
      }
    }
    // Die persönliche Savegame-Konsole ist nur im eigenen Quartier erreichbar.
    if (this.currentRoom === 'player_quarters' && this._saveTerminalRect) {
      const t = this._saveTerminalRect;
      if (mx >= t.x && mx <= t.x + t.w && my >= t.y && my <= t.y + t.h) {
        this.savePanelOpen = true;
        SW.Audio.playCommBeep();
        return;
      }
    }
    // Wandkarte (Minimap) geklickt → Fullscreen-Karte
    if (this._mapRect) {
      const m = this._mapRect;
      if (mx>=m.x && mx<=m.x+m.w && my>=m.y && my<=m.y+m.h) {
        SW.Game.state = 'CHEAT_MAP';
        return;
      }
    }
    // START-Button im Flugdeck
    if (this.currentRoom==='flugdeck' && this._startRect) {
      const s=this._startRect;
      if (mx>=s.x && mx<=s.x+s.w && my>=s.y && my<=s.y+s.h) {
        SW.Game.setState('BRIEFING_BOARD');
        return;
      }
    }
    // Tür geklickt?
    for (const d of this._doorRects) {
      if (mx >= d.x && mx <= d.x + d.w && my >= d.y && my <= d.y + d.h) {
        this.navigateTo(d.to);
        return;
      }
    }
    // NPC geklickt?
    for (const n of this._npcRects) {
      if (mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.h) {
        this.talkingNPC = n.name;
        this.startDialogue();
        return;
      }
    }
    // Dialog fortsetzen
    if (this.dialogueActive) this.advanceDialogue();
  },

  _contains(rect, x, y) {
    return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
  },

  showRoomNotice(speaker, text) {
    this.dialogueActive = false;
    this._roomNotice = { speaker, text, timer: 180 };
    if (SW.Audio) SW.Audio.playCommBeep();
  },

  // ===== RENDER =====
  render(ctx) {
    const room = this.getRoom();
    this._doorRects = [];
    this._npcRects = [];
    this._lockedQuartersRects = [];
    this._ownQuartersRect = null;

    // Hintergrund
    ctx.fillStyle = room.farbe;
    ctx.fillRect(0, 0, SW.W, SW.H);

    // Raum-Art (prozedural, je Raum anders)
    this.renderArt(ctx, room);
    this.renderRoomArchitecture(ctx, room);

    // Raum-Name + Zweck
    ctx.fillStyle = room.akzent;
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.roomLabel(room), SW.CX, 14);
    ctx.fillStyle = '#888';
    ctx.font = '6px monospace';
    ctx.fillText(room.zweck, SW.CX, 24);
    ctx.textAlign = 'left';

    // NPCs
    this.renderNPCs(ctx, room);

    // Türen
    this.renderDoors(ctx, room);

    // Minimap
    this.renderMap(ctx, room);

    // Dialog-Box
    if (this.dialogueActive) this.renderDialogue(ctx, room);
    else if (this._roomNotice) this.renderRoomNotice(ctx, room);
    else this.renderHint(ctx, room);
    // Save/Load-Panel — oberstes Overlay
    if (this.savePanelOpen) this.renderSavePanel(ctx, room);
  },

  // ===== PROZEDURALER ARTSTYLE PRO RAUM =====
  renderArt(ctx, room) {
    switch (room.art) {
      case 'bar': this.artBar(ctx, room); break;
      case 'quartiere': this.artQuartersLobby(ctx, room); break;
      case 'player_quarters': this.artPlayerQuarters(ctx, room); break;
      case 'flugdeck': this.artFlugdeck(ctx, room); break;
      case 'buerro': this.artBuerro(ctx, room); break;
      case 'kantine': this.artKantine(ctx, room); break;
      case 'kapelle': this.artKapelle(ctx, room); break;
      case 'reparatur': this.artReparatur(ctx, room); break;
      case 'friseur': this.artFriseur(ctx, room); break;
      case 'beobachtung': this.artBeobachtung(ctx, room); break;
      case 'maschinenraum': this.artMaschinenraum(ctx, room); break;
      case 'krankenstation': this.artKrankenstation(ctx, room); break;
      case 'klo': this.artKlo(ctx, room); break;
      case 'schule': this.artSchule(ctx, room); break;
    }
  },

  renderRoomArchitecture(ctx, room) {
    ctx.save();
    // Druckschotten, Paneelfugen und Decklicht halten alle Räume im Träger-Look.
    ctx.fillStyle = 'rgba(5,9,15,0.32)';
    ctx.fillRect(0, 29, 8, 154);
    ctx.fillRect(SW.W - 8, 29, 8, 154);
    ctx.fillStyle = 'rgba(190,210,230,0.24)';
    ctx.fillRect(8, 29, SW.W - 16, 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(8, 157, SW.W - 16, 4);
    ctx.strokeStyle = 'rgba(180,205,225,0.18)';
    ctx.lineWidth = 1;
    for (const x of [9, 18, 78, 160, 242, SW.W - 19, SW.W - 10]) {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x, 157);
      ctx.stroke();
    }
    ctx.fillStyle = room.akzent;
    for (const x of [32, 112, 192, 272]) {
      ctx.globalAlpha = 0.35;
      ctx.fillRect(x, 31, 20, 2);
      ctx.globalAlpha = 0.16;
      ctx.fillRect(x + 2, 33, 16, 1);
    }
    ctx.globalAlpha = 1;
    for (const x of [10, 18, SW.W - 19, SW.W - 11]) {
      for (const y of [39, 76, 113, 150]) {
        ctx.fillStyle = '#aebdcc';
        ctx.globalAlpha = 0.4;
        ctx.fillRect(x - 1, y, 2, 2);
        ctx.fillStyle = room.akzent;
        ctx.globalAlpha = y === 39 ? 0.65 : 0.25;
        ctx.fillRect(x - 1, y + 3, 2, 1);
      }
    }

    // Bodenplatten und ein farbcodiertes Deckband unter den integrierten Schotts.
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 183, SW.W, 17);
    ctx.strokeStyle = 'rgba(195,215,235,0.18)';
    for (const y of [184, 191, 198]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(SW.W, y);
      ctx.stroke();
    }
    for (let x = 16; x < SW.W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 184);
      ctx.lineTo(x - 7, 200);
      ctx.stroke();
    }
    ctx.fillStyle = room.akzent;
    ctx.globalAlpha = 0.65;
    ctx.fillRect(0, 182, SW.W, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#aebdcc';
    ctx.font = '4px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('FAX-TRAGÖDIE  /  DECK ' + room.deck, SW.W - 12, 197);
    ctx.restore();
  },

  artBar(ctx, room) {
    // Fenster (polygonal, spacig)
    const win = { x:20, y:30, w:90, h:45, cut:10 };
    ctx.beginPath();
    ctx.moveTo(win.x+win.cut,win.y); ctx.lineTo(win.x+win.w-win.cut,win.y);
    ctx.lineTo(win.x+win.w,win.y+win.cut); ctx.lineTo(win.x+win.w,win.y+win.h-win.cut);
    ctx.lineTo(win.x+win.w-win.cut,win.y+win.h); ctx.lineTo(win.x+win.cut,win.y+win.h);
    ctx.lineTo(win.x,win.y+win.h-win.cut); ctx.lineTo(win.x,win.y+win.cut); ctx.closePath();
    ctx.fillStyle='#050510'; ctx.fill();
    ctx.strokeStyle=room.akzent; ctx.lineWidth=2; ctx.stroke();
    ctx.save(); ctx.clip();
    ctx.fillStyle='#fff';
    for(let i=0;i<18;i++) ctx.fillRect(win.x+3+(i*13)%84, win.y+3+(i*17)%39, 1,1);
    // Sektor-Licht: das Äußere trägt die Farbe des aktuellen Sektors
    ctx.fillStyle=SW.World.systemInfo().farbe; ctx.globalAlpha=0.22;
    ctx.beginPath(); ctx.arc(win.x+45,win.y+22,15,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1; ctx.restore();
    // Theke
    ctx.fillStyle='#2a1e0e'; ctx.fillRect(0,SW.H-40,SW.W,40);
    ctx.fillStyle='#3a2a15'; ctx.fillRect(0,SW.H-40,SW.W,3);
    // Flaschen
    const bc=['#44aa44','#aa4444','#4444aa','#aaaa44','#aa44aa'];
    for(let i=0;i<8;i++){ const bx=25+i*35; ctx.fillStyle=bc[i%5]; ctx.globalAlpha=0.6;
      ctx.fillRect(bx,SW.H-50,4,10); ctx.fillRect(bx+1,SW.H-53,2,3); ctx.globalAlpha=1; }
    // Scoreboard
    ctx.fillStyle='#0a0a0a'; ctx.fillRect(130,30,110,60);
    ctx.strokeStyle=room.akzent; ctx.lineWidth=1; ctx.strokeRect(130,30,110,60);
    ctx.fillStyle=room.akzent; ctx.font='bold 7px monospace'; ctx.textAlign='center';
    ctx.fillText('P I L O T S', 185, 40); ctx.textAlign='left';
    for(let i=0;i<SW.Scoreboard.length;i++){ const p=SW.Scoreboard[i]; const py=48+i*9;
      ctx.fillStyle=p.farbe; ctx.fillRect(135,py-4,4,4);
      ctx.fillStyle=p.status==='gefallen'?'#555':'#ccc'; ctx.font='6px monospace';
      ctx.fillText(p.name,143,py); ctx.fillStyle='#888'; ctx.textAlign='right';
      ctx.fillText(p.kills+'/'+p.losses,235,py); ctx.textAlign='left'; }
  },

  artFlugdeck(ctx, room) {
    // Große Konsole
    ctx.fillStyle='#0a1520'; ctx.fillRect(20,40,280,100);
    ctx.strokeStyle=room.akzent; ctx.lineWidth=1; ctx.strokeRect(20,40,280,100);
    // Screens
    for(let i=0;i<3;i++){ const sx=30+i*90;
      ctx.fillStyle='#001a1a'; ctx.fillRect(sx,50,80,40);
      ctx.strokeStyle='#00ff00'; ctx.strokeRect(sx,50,80,40);
      ctx.fillStyle='#0f0'; ctx.font='5px monospace';
      ctx.fillText('SYSTEM OK', sx+5, 60);
      ctx.fillText('KURS: SEKTOR', sx+5, 70);
      ctx.fillText((7+i)+'  LOCK', sx+5, 80);
    }
    // Start-Button
    this._startRect={x:140,y:100,w:40,h:20};
    const blink=Math.floor(this._frame/30)%2===0;
    ctx.fillStyle=blink?'#0f0':'#030'; ctx.fillRect(140,100,40,20);
    ctx.fillStyle='#000'; ctx.font='bold 7px monospace'; ctx.textAlign='center';
    ctx.fillText('START', 160, 113); ctx.textAlign='left';
    // Boden
    ctx.fillStyle='#1a2530'; ctx.fillRect(0,SW.H-30,SW.W,30);
  },

  artBuerro(ctx, room) {
    // Schreibtisch
    ctx.fillStyle='#5a3a1a'; ctx.fillRect(40,110,240,30);
    ctx.fillStyle='#3a2a1a'; ctx.fillRect(40,140,240,10);
    // Aktenregale
    for(let i=0;i<4;i++){ ctx.fillStyle='#2a1a0a'; ctx.fillRect(20+i*70,40,60,60);
      ctx.strokeStyle='#5a3a1a'; ctx.strokeRect(20+i*70,40,60,60);
      for(let j=0;j<3;j++){ ctx.fillStyle='#4a3a2a'; ctx.fillRect(24+i*70,46+j*18,52,14); } }
    // Fax
    ctx.fillStyle='#888'; ctx.fillRect(150,95,40,15);
    ctx.fillStyle='#0f0'; ctx.fillRect(155,98,10,4);
    ctx.fillStyle='#000'; ctx.font='5px monospace'; ctx.fillText('FAX', 175, 105);
    // Boden
    ctx.fillStyle='#2a1a0a'; ctx.fillRect(0,SW.H-25,SW.W,25);
  },

  artKantine(ctx, room) {
    // Neon
    ctx.fillStyle='#0a0a0a'; ctx.fillRect(0,30,SW.W,20);
    ctx.fillStyle=room.akzent; ctx.font='bold 10px monospace'; ctx.textAlign='center';
    ctx.fillText('BROTZEIT 4711', 125, 65); ctx.textAlign='left';
    // Tische
    for(let i=0;i<3;i++){ const tx=40+i*90;
      ctx.fillStyle='#4a3a2a'; ctx.fillRect(tx,110,60,8);
      ctx.fillRect(tx+25,118,10,20);
      ctx.fillStyle='#888'; ctx.fillRect(tx+10,104,8,6); // Teller
    }
    // Speisekarte
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(188,50,58,50);
    ctx.strokeStyle='#ff6644'; ctx.strokeRect(188,50,58,50);
    ctx.fillStyle='#ff6644'; ctx.font='5px monospace';
    ctx.fillText('MENÜ', 194, 60);
    ctx.fillText('Suppe: 2 DM', 194, 70);
    ctx.fillText('Nudeln: 3 DM', 194, 78);
    ctx.fillText('Kaffee: aus', 194, 86);
    // Fliesenboden
    ctx.fillStyle='#2a2a2a'; ctx.fillRect(0,SW.H-25,SW.W,25);
    for(let i=0;i<16;i++){ ctx.fillStyle=i%2?'#333':'#222'; ctx.fillRect(i*20,SW.H-25,20,25); }
  },

  artKapelle(ctx, room) {
    // Dunkles Holz
    ctx.fillStyle='#0a0a12'; ctx.fillRect(0,30,SW.W,SW.H-55);
    // Kreuz aus Schraubenziehern
    ctx.strokeStyle='#666'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(160,50); ctx.lineTo(160,100); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(145,65); ctx.lineTo(175,65); ctx.stroke();
    ctx.lineWidth=1;
    // Kerzen
    for(let i=0;i<5;i++){ const cx=80+i*40;
      ctx.fillStyle='#ccc'; ctx.fillRect(cx,110,4,15);
      ctx.fillStyle='#ffcc00';
      const flick=Math.floor(this._frame/8+i)%2===0;
      if(flick) ctx.fillRect(cx+1,106,2,4);
    }
    // Trauerband
    ctx.fillStyle='#333'; ctx.fillRect(0,130,SW.W,8);
    ctx.fillStyle='#888'; ctx.font='5px monospace'; ctx.textAlign='center';
    ctx.fillText('IN STILLER TRAUER', SW.CX, 136); ctx.textAlign='left';
    // Boden
    ctx.fillStyle='#0a0a0a'; ctx.fillRect(0,SW.H-25,SW.W,25);
  },

  artReparatur(ctx, room) {
    // Öl + Kabelsalat
    ctx.fillStyle='#1a1a12'; ctx.fillRect(0,30,SW.W,SW.H-55);
    // Warnleuchten
    for(let i=0;i<4;i++){ const blink=Math.floor(this._frame/15+i)%2===0;
      ctx.fillStyle=blink?'#ffcc00':'#332200'; ctx.fillRect(30+i*70,40,8,8); }
    // Kabel
    ctx.strokeStyle='#444'; ctx.lineWidth=2;
    for(let i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(20,60+i*15);
      ctx.quadraticCurveTo(160,50+i*20,300,60+i*15); ctx.stroke(); }
    ctx.lineWidth=1;
    // Werkzeugwand
    ctx.fillStyle='#2a2a2a'; ctx.fillRect(20,100,120,40);
    ctx.fillStyle='#888';
    for(let i=0;i<6;i++) ctx.fillRect(28+i*18,108,4,20);
    // Ölflüssigkeit
    ctx.fillStyle='#111'; ctx.fillRect(0,SW.H-30,SW.W,30);
    ctx.fillStyle='#222'; ctx.fillRect(50,SW.H-28,30,4); ctx.fillRect(200,SW.H-26,40,4);
  },

  artFriseur(ctx, room) {
    // Spiegelwände
    for(let i=0;i<3;i++){ const sx=30+i*90;
      ctx.fillStyle='#1a1a2a'; ctx.fillRect(sx,40,70,70);
      ctx.strokeStyle=room.akzent; ctx.strokeRect(sx,40,70,70);
      ctx.fillStyle='#333'; ctx.fillRect(sx+10,50,50,40); // Spiegel
      ctx.fillStyle=room.akzent; ctx.globalAlpha=0.3;
      ctx.fillRect(sx+15,55,10,30); ctx.globalAlpha=1;
    }
    // Stühle
    for(let i=0;i<3;i++){ const sx=50+i*90;
      ctx.fillStyle='#4a2a4a'; ctx.fillRect(sx,120,30,15);
      ctx.fillStyle='#333'; ctx.fillRect(sx+12,135,6,10);
    }
    // Bunte Tücher
    ctx.fillStyle=room.akzent; ctx.fillRect(0,30,SW.W,4);
    ctx.fillStyle='#ff66cc'; ctx.fillRect(0,34,SW.W,2);
    // Boden
    ctx.fillStyle='#2a1a2a'; ctx.fillRect(0,SW.H-25,SW.W,25);
  },

  artBeobachtung(ctx, room) {
    // Scheibewand ins Nichts — ändert sich je nach System
    const sys = SW.World.systemInfo();
    ctx.fillStyle='#020208'; ctx.fillRect(20,35,280,110);
    ctx.strokeStyle=sys.farbe; ctx.lineWidth=2; ctx.strokeRect(20,35,280,110);
    // Sterne
    ctx.fillStyle='#fff';
    for(let i=0;i<40;i++) ctx.fillRect(25+(i*17)%270, 40+(i*23)%100, 1,1);
    // Planet (System-Farbe)
    ctx.fillStyle=sys.farbe; ctx.globalAlpha=0.5;
    ctx.beginPath(); ctx.arc(240,70,18,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    // System-Label
    ctx.fillStyle=sys.farbe; ctx.font='bold 7px monospace'; ctx.textAlign='center';
    ctx.fillText(sys.name, 110, 55);
    ctx.fillStyle='#888'; ctx.font='5px monospace';
    ctx.fillText(sys.char.substring(0,38), 110, 65);
    ctx.textAlign='left';
    // Automata
    ctx.fillStyle='#333'; ctx.fillRect(250,120,40,25);
    ctx.fillStyle='#0f0'; ctx.fillRect(255,125,15,8);
    ctx.fillStyle='#000'; ctx.font='5px monospace'; ctx.fillText('50 PF', 272, 132);
    // Boden
    ctx.fillStyle='#0a0a1a'; ctx.fillRect(0,SW.H-25,SW.W,25);
  },

  artMaschinenraum(ctx, room) {
    // Rohre
    ctx.fillStyle='#1a1a22'; ctx.fillRect(0,30,SW.W,SW.H-55);
    for(let i=0;i<5;i++){ ctx.fillStyle='#333'; ctx.fillRect(20+i*60,40,15,90);
      ctx.fillStyle='#444'; ctx.fillRect(20+i*60,40,15,5); }
    // Hebel
    for(let i=0;i<4;i++){ ctx.fillStyle='#555'; ctx.fillRect(40+i*60,130,6,15);
      ctx.fillStyle='#f00'; ctx.fillRect(38+i*60,128,10,4); }
    // Brummende Motoren
    const pulse=Math.floor(this._frame/10)%2===0;
    ctx.fillStyle=pulse?'#0f0':'#030'; ctx.fillRect(20,150,280,8);
    // Boden
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(0,SW.H-25,SW.W,25);
  },

  artKrankenstation(ctx, room) {
    // Steriles Weiß + grüne Akzente
    ctx.fillStyle='#1a2a2a'; ctx.fillRect(0,30,SW.W,SW.H-55);
    // Bettreihen
    for(let i=0;i<3;i++){ const bx=30+i*90;
      ctx.fillStyle='#ccc'; ctx.fillRect(bx,100,70,25);
      ctx.fillStyle='#00ccaa'; ctx.fillRect(bx,100,70,4);
      ctx.fillStyle='#fff'; ctx.fillRect(bx+5,105,20,15); // Kissen
    }
    // Herzmonitor
    ctx.fillStyle='#0a0a0a'; ctx.fillRect(240,45,60,35);
    ctx.strokeStyle='#00ccaa'; ctx.strokeRect(240,45,60,35);
    ctx.strokeStyle='#0f0'; ctx.beginPath();
    for(let i=0;i<40;i++){ const x=245+i; const y=62+((i/4)%2===0?-5:5);
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
    ctx.stroke();
    // Tamagotchi
    ctx.fillStyle='#ffcc00'; ctx.fillRect(255,85,12,10);
    ctx.fillStyle='#000'; ctx.fillRect(258,88,2,2); ctx.fillRect(262,88,2,2);
    // Boden
    ctx.fillStyle='#2a3a3a'; ctx.fillRect(0,SW.H-25,SW.W,25);
  },

  artKlo(ctx, room) {
    // Kacheln (grau-grün)
    ctx.fillStyle='#1a2a2a'; ctx.fillRect(0,30,SW.W,SW.H-55);
    for(let i=0;i<16;i++){ ctx.fillStyle=i%2?'#2a3a3a':'#1a2a2a'; ctx.fillRect(i*20,SW.H-25,20,25); }
    // Spülung (links)
    ctx.fillStyle='#3a4a4a'; ctx.fillRect(30,80,40,50);
    ctx.fillStyle='#2a3a3a'; ctx.fillRect(35,85,30,30);
    ctx.fillStyle='#88ccaa'; ctx.fillRect(40,90,20,20); // Wasser
    // Spülknopf
    ctx.fillStyle='#666'; ctx.fillRect(45,70,10,8);
    // Wischmopp (rechts)
    ctx.fillStyle='#886644'; ctx.fillRect(250,60,4,60); // Stiel
    ctx.fillStyle='#ccaa88'; ctx.fillRect(245,115,14,15); // Moppkopf
    // Toner-Fleck (Witz)
    ctx.fillStyle='#111'; ctx.fillRect(150,130,20,8);
    ctx.fillStyle='#444'; ctx.font='5px monospace'; ctx.fillText('TONER', 152, 137);
    // Boden
    ctx.fillStyle='#1a2a2a'; ctx.fillRect(0,SW.H-25,SW.W,25);
    for(let i=0;i<16;i++){ ctx.fillStyle=i%2?'#2a3a3a':'#1a2a2a'; ctx.fillRect(i*20,SW.H-25,20,25); }
  },

  // Schulraum "ZWEIG": Tafel mit Git-Tree, Schülertische, Formular-14-C, Katze am Fenster
  artSchule(ctx, room) {
    // Tafel (Mitte, Git-Tree in Kreide)
    ctx.fillStyle = '#0f1f12';
    ctx.fillRect(70, 34, 180, 86);
    ctx.strokeStyle = '#5a4a2a';
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 34, 180, 86);
    ctx.lineWidth = 1;
    // Kreide: git log
    ctx.fillStyle = 'rgba(204,255,102,0.9)';
    ctx.font = '6px monospace';
    ctx.fillText('git log --oneline', 80, 46);
    ctx.strokeStyle = 'rgba(204,255,102,0.8)';
    ctx.beginPath(); ctx.moveTo(80, 58); ctx.lineTo(238, 58); ctx.stroke();
    // Commits (main)
    ctx.fillStyle = 'rgba(204,255,102,0.9)';
    for (const cx of [95, 135, 175, 215]) { ctx.beginPath(); ctx.arc(cx, 58, 3, 0, Math.PI*2); ctx.fill(); }
    // Branch (vom 3. Commit ab)
    ctx.beginPath(); ctx.moveTo(175, 58); ctx.quadraticCurveTo(175, 74, 195, 77); ctx.lineTo(238, 77); ctx.stroke();
    ctx.fillStyle = 'rgba(204,255,102,0.9)';
    for (const cx of [210, 238]) { ctx.beginPath(); ctx.arc(cx, 77, 3, 0, Math.PI*2); ctx.fill(); }
    ctx.font = '5px monospace';
    ctx.fillText('main', 80, 70);
    ctx.fillText('branch "tet"', 185, 90);
    // Der kaputte Commit (rot) + Katze
    ctx.fillStyle = 'rgba(255,68,68,0.9)';
    ctx.beginPath(); ctx.arc(238, 58, 3, 0, Math.PI*2); ctx.fill();
    ctx.font = '5px monospace';
    ctx.fillText('KATZE', 242, 50);
    // Kreideregister + Kreide + Radiergummi
    ctx.fillStyle = '#5a4a2a'; ctx.fillRect(66, 120, 188, 4);
    ctx.fillStyle = '#fff'; ctx.fillRect(90, 118, 8, 2);
    ctx.fillStyle = '#ccff66'; ctx.fillRect(112, 118, 6, 2);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(200, 117, 14, 4);
    // Schülertische (vorne)
    for (const dx of [45, 130, 215]) {
      ctx.fillStyle = '#4a3a2a';
      ctx.fillRect(dx, 130, 60, 7);
      ctx.fillStyle = '#2a2018';
      ctx.fillRect(dx+4, 137, 6, 12);
      ctx.fillRect(dx+50, 137, 6, 12);
    }
    // Poster: Formular 14-C (Selbstanzeige)
    ctx.fillStyle = '#d8d0c0';
    ctx.fillRect(268, 38, 42, 52);
    ctx.fillStyle = '#333';
    ctx.font = '5px monospace';
    ctx.fillText('FORMULAR', 272, 48);
    ctx.fillText('14-C', 272, 56);
    ctx.fillText('(Selbstanzeige)', 272, 64);
    ctx.fillStyle = '#f00';
    ctx.fillRect(274, 68, 30, 14);
    ctx.fillStyle = '#fff';
    ctx.font = '7px monospace';
    ctx.fillText('KATZE', 279, 78);
    // Fenster (links) mit Katzensilhouette
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(18, 40, 44, 34);
    // Sektor-Licht fällt in den Raum
    ctx.fillStyle = SW.World.systemInfo().farbe;
    ctx.globalAlpha = 0.10;
    ctx.fillRect(18, 40, 44, 34);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#334';
    ctx.strokeRect(18, 40, 44, 34);
    ctx.fillStyle = '#111';
    ctx.fillRect(28, 58, 16, 12);   // Körper
    ctx.fillRect(32, 52, 10, 8);   // Kopf
    ctx.fillRect(32, 48, 3, 4);    // Ohr 1
    ctx.fillRect(39, 48, 3, 4);    // Ohr 2
    ctx.fillRect(44, 54, 6, 3);    // Schwanz
    ctx.fillStyle = '#ff0';
    ctx.fillRect(34, 55, 2, 2);    // Augen
    ctx.fillRect(38, 55, 2, 2);
    ctx.fillStyle = '#555';
    ctx.font = '5px monospace';
    ctx.fillText('Tastatur?', 24, 84);
  },

  // ===== NPC RENDER =====
  // v0.6.9-final: prozedurale Gesichter (SW.NPC.drawFace) statt Silhouetten.
  // Fallback für NPCs ohne Registry-Eintrag (z.B. Klopstock, Löffel): Silhouette.
  renderNPCs(ctx, room) {
    const npcs = SW.World.npcInRoom(room.id);
    const positions = [[70,116],[160,116],[250,116]];
    for (let i=0; i<npcs.length && i<3; i++) {
      const name = npcs[i];
      const x = positions[i][0], y = positions[i][1];
      const npcId = SW.NPC ? SW.NPC.resolve(name) : null;
      if (npcId && SW.NPC.registry[npcId]) {
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.beginPath();
        ctx.ellipse(x, y + 34, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        SW.NPC.drawFace(ctx, npcId, x, y, 28, { showBody: true, showUniform: true, animated: true, frame: this._frame });
      } else {
        const npcData = SW.RoomNPCs[name] || { farbe:'#888' };
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.beginPath();
        ctx.ellipse(x, y + 34, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = npcData.farbe || '#888';
        ctx.fillRect(x - 7, y - 10, 14, 14);
        ctx.fillRect(x - 10, y + 4, 20, 26);
        ctx.fillStyle = '#f0d5a8';
        ctx.fillRect(x - 5, y - 8, 10, 9);
        ctx.fillStyle = '#18202a';
        ctx.fillRect(x - 3, y - 5, 2, 2);
        ctx.fillRect(x + 2, y - 5, 2, 2);
      }
      // Name
      ctx.fillStyle = 'rgba(5,8,12,0.78)';
      ctx.fillRect(x - 27, y + 33, 54, 9);
      ctx.strokeStyle = 'rgba(180,205,225,0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 27, y + 33, 54, 9);
      ctx.fillStyle = '#e0e8ef';
      ctx.font = '5px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(name.toUpperCase(), x, y + 39);
      ctx.textAlign = 'left';
      // Klick-Region
      this._npcRects.push({ x: x-17, y: y-17, w: 34, h: 60, name: name });
    }
  },

  // ===== TÜR RENDER =====
  renderDoors(ctx, room) {
    const doors = room.id === 'quartiere'
      ? room.toren.filter(id => id !== 'player_quarters')
      : room.toren;
    const destNames = doors.map(d => {
      const destination = SW.Rooms.find(rr => rr.id === d);
      if (destination && destination.deck !== room.deck) return 'AUFZUG D' + destination.deck;
      return destination ? this.roomLabel(destination, true) : d;
    });
    // Seitliche Schotts sitzen in den Bulkheads und lassen Boden und Crew frei.
    const positions = [[8, 55, 34, 44], [278, 55, 34, 44], [8, 105, 34, 44], [278, 105, 34, 44]];
    for (let i=0; i<doors.length; i++) {
      const [dx, dy, dw, dh] = positions[i];
      ctx.fillStyle = 'rgba(13,21,29,0.9)';
      ctx.fillRect(dx, dy, dw, dh);
      ctx.fillStyle = '#6b7c89';
      ctx.fillRect(dx, dy, dw, 2);
      ctx.fillRect(dx, dy, 2, dh);
      ctx.fillStyle = '#263644';
      ctx.fillRect(dx + 3, dy + 3, dw - 6, dh - 5);
      ctx.fillStyle = '#080e14';
      ctx.fillRect(dx + 5, dy + 11, dw - 10, dh - 15);
      ctx.strokeStyle = room.akzent;
      ctx.lineWidth = 1;
      ctx.strokeRect(dx + 5, dy + 10, dw - 10, dh - 14);
      ctx.fillStyle = room.akzent;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(dx + dw - 8, dy + 20, 2, 5);
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#aebdcc';
      ctx.font = '3px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(destNames[i].toUpperCase().substring(0, 13), dx + dw / 2, dy + 8);
      ctx.textAlign = 'left';
      this._doorRects.push({ x: dx, y: dy, w: dw, h: dh, to: doors[i] });
    }
  },

  // ===== MINIMAP =====
  renderMap(ctx, room) {
    const mx = SW.W-62, my = 28, mw = 52, mh = 26;
    ctx.save();
    // Kleine, fest montierte Wandkarte statt schwebendem HUD-Panel.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(mx + 2, my + 2, mw, mh);
    ctx.fillStyle = '#111b25';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#718398';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);
    ctx.fillStyle = '#080d13';
    ctx.fillRect(mx + 2, my + 2, mw - 4, mh - 4);
    ctx.strokeStyle = 'rgba(190,210,230,0.35)';
    ctx.strokeRect(mx + 2, my + 2, mw - 4, mh - 4);
    for (const [sx, sy] of [[mx + 2, my + 2], [mx + mw - 4, my + 2],
      [mx + 2, my + mh - 4], [mx + mw - 4, my + mh - 4]]) {
      ctx.fillStyle = '#92a3b3';
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.fillStyle = room.akzent;
    ctx.font = '4px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TRÄGER / DECKPLAN', mx + 4, my + 6);
    for (let deck = 1; deck <= 3; deck++) {
      const deckRooms = SW.Rooms.filter(r => r.deck === deck);
      const y = my + 11 + (deck - 1) * 6;
      const isCurrentDeck = room.deck === deck;
      ctx.fillStyle = isCurrentDeck ? room.akzent : '#8291a0';
      ctx.fillText('D' + deck, mx + 4, y + 2);
      const startX = mx + 14, span = mw - 22;
      if (deckRooms.length > 1) {
        ctx.strokeStyle = '#3c4b58';
        ctx.beginPath();
        ctx.moveTo(startX, y + 1);
        ctx.lineTo(startX + span, y + 1);
        ctx.stroke();
      }
      for (let i = 0; i < deckRooms.length; i++) {
        const r = deckRooms[i];
        const gx = deckRooms.length === 1 ? startX : startX + i * span / (deckRooms.length - 1);
        const isCurrent = r.id === room.id;
        const isNeighbor = room.toren.indexOf(r.id) >= 0;
        ctx.fillStyle = isCurrent ? room.akzent : (isNeighbor ? '#bdcbd7' : '#596a79');
        ctx.fillRect(gx - 1, y, 2, 2);
        if (isCurrent) {
          ctx.strokeStyle = '#eef5fb';
          ctx.strokeRect(gx - 2, y - 1, 4, 4);
        }
      }
    }
    // Der senkrechte Schacht rechts verbindet die drei Deckebenen.
    const liftX = mx + mw - 5;
    ctx.strokeStyle = '#536b7e';
    ctx.beginPath();
    ctx.moveTo(liftX + 1, my + 13);
    ctx.lineTo(liftX + 1, my + 24);
    ctx.stroke();
    for (const deck of [1, 2, 3]) {
      const y = my + 11 + (deck - 1) * 6;
      ctx.fillStyle = deck === room.deck ? room.akzent : '#99adbd';
      ctx.fillRect(liftX, y, 3, 3);
    }
    ctx.restore();
    // Klick-Region (Wandkarte → Fullscreen)
    this._mapRect = { x: mx, y: my, w: mw, h: mh };
  },

  // ===== QUARTIERE =====
  artQuartersLobby(ctx, room) {
    const name = ((SW.World && SW.World.pilotName) || 'PILOT').trim() || 'PILOT';
    ctx.fillStyle = '#121a24';
    ctx.fillRect(48, 42, 224, 100);
    ctx.fillStyle = '#27384a';
    ctx.fillRect(48, 42, 224, 8);
    ctx.fillStyle = '#d8e4f0';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('CREW-DECK  /  ZUTEILUNG NACH DIENSTNUMMER', SW.CX, 37);
    for (let i = 0; i < 4; i++) {
      const x = 50 + i * 55;
      const isOwn = i === 0;
      const y = 58;
      ctx.fillStyle = isOwn ? '#253849' : '#111820';
      ctx.fillRect(x, y, 48, 78);
      ctx.fillStyle = isOwn ? room.akzent : '#596675';
      ctx.fillRect(x, y, 48, 4);
      ctx.fillStyle = '#0a1017';
      ctx.fillRect(x + 4, y + 8, 40, 62);
      ctx.fillStyle = isOwn ? '#344d60' : '#202a34';
      ctx.fillRect(x + 8, y + 12, 32, 54);
      ctx.fillStyle = isOwn ? '#a9d5ff' : '#727d87';
      ctx.fillRect(x + 36, y + 20, 3, 7);
      ctx.fillStyle = isOwn ? '#8fe0ff' : '#d89442';
      ctx.fillRect(x + 6, y + 40, 2, 10);
      ctx.fillStyle = isOwn ? '#e8f4ff' : '#77818b';
      ctx.font = '4px monospace';
      const cabinLabel = isOwn ? name.toUpperCase() : 'CREW ' + String(i + 1).padStart(2, '0');
      ctx.fillText(cabinLabel, x + 24, y + 76);
      if (isOwn) {
        this._ownQuartersRect = { x, y, w: 48, h: 78 };
      } else {
        this._lockedQuartersRects.push({ x, y, w: 48, h: 78 });
      }
    }
    ctx.textAlign = 'left';
  },

  artPlayerQuarters(ctx, room) {
    const name = ((SW.World && SW.World.pilotName) || 'PILOT').toUpperCase();
    // Private sleeping alcove and an assigned-name plaque.
    ctx.fillStyle = '#171d29';
    ctx.fillRect(24, 42, 174, 98);
    ctx.fillStyle = '#303b4d';
    ctx.fillRect(24, 42, 174, 5);
    ctx.fillStyle = '#252c3b';
    ctx.fillRect(34, 98, 151, 32);
    ctx.fillStyle = '#687b91';
    ctx.fillRect(39, 93, 141, 9);
    ctx.fillStyle = '#d0d8dd';
    ctx.fillRect(47, 87, 30, 8);
    ctx.fillStyle = '#475263';
    ctx.fillRect(31, 47, 4, 81);
    ctx.fillRect(188, 47, 4, 81);
    ctx.fillStyle = '#0b1119';
    ctx.fillRect(47, 55, 130, 23);
    ctx.strokeStyle = room.akzent;
    ctx.lineWidth = 1;
    ctx.strokeRect(47, 59, 116, 21);
    ctx.fillStyle = room.akzent;
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(name, 112, 72);
    ctx.fillStyle = '#596473';
    ctx.fillRect(211, 105, 84, 10);
    ctx.fillRect(216, 115, 5, 27);
    ctx.fillRect(284, 115, 5, 27);
    ctx.fillStyle = '#121a21';
    ctx.fillRect(222, 54, 62, 42);
    ctx.strokeStyle = room.akzent;
    ctx.lineWidth = 2;
    ctx.strokeRect(222, 54, 62, 42);
    ctx.fillStyle = '#9edbff';
    ctx.font = 'bold 6px monospace';
    ctx.fillText('PERSÖNLICHES', 253, 67);
    ctx.fillText('SAVEGAME', 253, 77);
    ctx.fillStyle = (SW.Game.frame % 60 < 30) ? room.akzent : '#687987';
    ctx.fillRect(242, 83, 22, 4);
    ctx.fillStyle = '#999';
    ctx.font = '5px monospace';
    ctx.fillText('[KLICK: SPEICHERN]', 253, 91);
    ctx.textAlign = 'left';
    this._saveTerminalRect = { x: 222, y: 54, w: 62, h: 42 };
  },

  // Alte Aufrufer und gespeicherte Kabinen-IDs bleiben auf dem eigenen Quartier.
  artCaptainQuarters(ctx, room) { this.artPlayerQuarters(ctx, room); },
  artSpinde(ctx, room) { this.artPlayerQuarters(ctx, room); },

  // ===== SAVE/LOAD-PANEL (PERSÖNLICHES QUARTIER) =====
  renderSavePanel(ctx, room) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, SW.W, SW.H);
    const px = 55, py = 38, pw = SW.W - 110, ph = 124;
    ctx.fillStyle = 'rgba(10,10,16,0.98)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = room.akzent;
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
    ctx.fillStyle = room.akzent;
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(this.roomLabel(room) + ' — SAVE/LOAD', SW.CX, py + 14);
    ctx.font = '5px monospace';
    ctx.fillStyle = '#888';
    ctx.fillText('Persönliche Kabine. Formular 83-D bleibt an Bord.', SW.CX, py + 25);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#666';
    ctx.font = '5px monospace';
    ctx.fillText('Sie haben bisher ohne Savegame überlebt. Respekt.', px + 12, py + 38);
    const t = SW.SaveGame ? SW.SaveGame.lastSaveTime() : null;
    ctx.fillStyle = '#555';
    ctx.fillText(t ? ('Letzter Save: ' + new Date(t).toLocaleString()) : 'Kein Savegame vorhanden.', px + 12, py + 48);
    // Optionen (Klick oder Taste)
    this._saveRects = [];
    const opts = [
      ['1', 'SPEICHERN', 'Spielstand sichern'],
      ['2', 'LADEN', 'Zurück zu dem Moment, wo es noch lief'],
      ['3', 'EXPORT', 'JSON auf Datenträger (Fax-Archiv +1)'],
      ['4', 'LÖSCHEN', 'Spielstand endgültig entfernen'],
      ['5', 'SCHLIESSEN', '']
    ];
    for (let i = 0; i < opts.length; i++) {
      const y = py + 60 + i * 11;
      ctx.fillStyle = '#0f0';
      ctx.font = '6px monospace';
      ctx.fillText('[' + opts[i][0] + '] ' + opts[i][1], px + 14, y);
      ctx.fillStyle = '#555';
      ctx.font = '5px monospace';
      ctx.fillText(opts[i][2], px + 88, y);
      this._saveRects.push({ x: px + 8, y: y - 8, w: pw - 16, h: 10, action: opts[i][0] });
    }
    // Feedback-Zeile
    if (SW.SaveGame && SW.SaveGame.lastMessage) {
      ctx.fillStyle = room.akzent;
      ctx.font = 'bold 5px monospace';
      ctx.fillText(SW.SaveGame.lastMessage, px + 14, py + ph - 6);
    }
  },

  handleSavePanelClick(mx, my) {
    for (const r of this._saveRects) {
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        this.saveAction(r.action);
        return;
      }
    }
  },

  saveAction(action) {
    if (action === '1') SW.SaveGame.save();
    else if (action === '2') SW.SaveGame.load();
    else if (action === '3') SW.SaveGame.export();
    else if (action === '4') SW.SaveGame.delete();
    else if (action === '5') this.savePanelOpen = false;
    SW.Audio.playCommBeep();
  },

  renderRoomNotice(ctx, room) {
    const boxY = SW.H - 48;
    ctx.fillStyle = 'rgba(4,8,13,0.94)';
    ctx.fillRect(25, boxY, SW.W - 50, 38);
    ctx.strokeStyle = room.akzent;
    ctx.lineWidth = 1;
    ctx.strokeRect(25, boxY, SW.W - 50, 38);
    ctx.fillStyle = room.akzent;
    ctx.font = 'bold 5px monospace';
    ctx.fillText(this._roomNotice.speaker, 33, boxY + 10);
    ctx.fillStyle = '#e0e8ef';
    ctx.font = '6px monospace';
    ctx.fillText(this._roomNotice.text, 33, boxY + 23);
  },

  // ===== DIALOG BOX =====
  renderDialogue(ctx, room) {
    const line = this.dialogueLines[this.dialogueIndex];
    const displayText = this.typing ? line.text.substring(0, this.charIndex) : line.text;
    // Box (62px) für 4 Zeilen — Paging verhindert abgeschnittenen Text
    const boxY = SW.H-92, boxH = 62;
    ctx.fillStyle = 'rgba(0,0,0,0.92)';
    ctx.fillRect(15, boxY, SW.W-30, boxH);
    ctx.strokeStyle = room.akzent;
    ctx.lineWidth = 1;
    ctx.strokeRect(15, boxY, SW.W-30, boxH);
    // Gesicht des Sprechers (v0.6.9-final): echtes prozedurales Porträt,
    // Fallback = unscharfe Silhouette (für NPCs ohne Registry-Eintrag).
    const faceId = SW.NPC ? SW.NPC.resolve(line.npc) : null;
    if (faceId && SW.NPC.registry[faceId]) {
      SW.NPC.drawFace(ctx, faceId, 32, boxY+18, 24, { animated: true, frame: this._frame });
    } else {
      let npcData = SW.RoomNPCs[line.npc];
      if (!npcData) {
        const key = Object.keys(SW.RoomNPCs).find(k => k.toUpperCase() === String(line.npc).toUpperCase());
        npcData = key ? SW.RoomNPCs[key] : { farbe:'#888' };
      }
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = npcData.farbe;
      ctx.fillRect(22, boxY+6, 14, 16);
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#000';
      ctx.fillRect(25, boxY+11, 3, 2);
      ctx.fillRect(31, boxY+11, 3, 2);
      ctx.fillRect(26, boxY+17, 6, 1);
      ctx.restore();
    }
    // Name
    ctx.fillStyle = room.akzent;
    ctx.font = 'bold 7px monospace';
    ctx.fillText(line.npc, 48, boxY+12);
    // Text (4 Zeilen, Font 6px, paginiert). Umbruch 62 Zeichen:
    // 6px monospace ≈ 3.6px/Zeichen → 62×3.6 = 223px, passt in die Box
    // (x=42 bis 305 = 263px). Der alte Wert 110 (396px) lief über den
    // rechten Bildrand — "Text wird rechts abgeschnitten".
    ctx.fillStyle = '#0f0';
    ctx.font = '6px monospace';
    const words = displayText.split(' ');
    let l=''; const allLines=[];
    for (const w of words) { if((l+w).length>62){allLines.push(l);l=w+' ';}else{l+=w+' ';} }
    allLines.push(l);
    const perPage = 4;
    this._dialoguePages = Math.max(1, Math.ceil(allLines.length/perPage));
    if (this.dialoguePage >= this._dialoguePages) this.dialoguePage = this._dialoguePages - 1;
    for (let i=0;i<perPage;i++) {
      const li = allLines[this.dialoguePage*perPage+i];
      if (li) ctx.fillText(li.trim(), 42, boxY+24+i*9);
    }
    // Scroll-Indikator (Track + Daumen, nur ab 2 Seiten)
    if (this._dialoguePages > 1) {
      const tx = SW.W-24, ty = boxY+8, th = boxH-16;
      ctx.fillStyle = '#222';
      ctx.fillRect(tx, ty, 3, th);
      const thumbH = Math.max(6, Math.floor(th/this._dialoguePages));
      const thumbY = ty + Math.floor((th-thumbH)*(this.dialoguePage/(this._dialoguePages-1)));
      ctx.fillStyle = room.akzent;
      ctx.fillRect(tx, thumbY, 3, thumbH);
    }
    if (!this.typing) {
      const blink = Math.floor(this._frame/30)%2===0;
      ctx.fillStyle = blink?'#fff':'#666';
      ctx.font = '6px monospace';
      ctx.textAlign='right';
      const more = this.dialoguePage < this._dialoguePages-1;
      ctx.fillText(more ? ('[LEER: WEITER] '+(this.dialoguePage+1)+'/'+this._dialoguePages) : '[LEER: weiter]', SW.W-22, boxY+boxH-4);
      ctx.textAlign='left';
    }
  },

  // ===== HINT (kein Dialog) =====
  renderHint(ctx, room) {
    const blink = Math.floor(this._frame/30)%2===0;
    ctx.fillStyle = blink?'#fff':'#666';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    if (room.id === 'flugdeck') {
      ctx.fillText('[ ZUR BRIEFING-TAFEL ]', SW.CX, SW.H-12);
    } else {
      ctx.fillText('[ Klicke auf NPCs oder Türen ]', SW.CX, SW.H-12);
    }
    ctx.textAlign = 'left';
  },

  // ===== DECKPLAN (Vollbildkarte) =====
  _cheatMapRects: [],

  renderCheatMap(ctx) {
    ctx.fillStyle = '#020208';
    ctx.fillRect(0, 0, SW.W, SW.H);

    // Titel
    ctx.fillStyle = '#b8d8ff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('FAX-TRAGÖDIE — DECKPLÄNE', SW.CX, 12);
    ctx.textAlign = 'left';

    // Drei Deckbänder mit verbundenen Aufzugsschächten.
    this._cheatMapRects = [];
    const panelX = 14, panelW = SW.W - 28;
    const cardX = 17, cardGap = 3, cardW = 55, cardH = 32;
    for (let deck = 1; deck <= 3; deck++) {
      const top = 18 + (deck - 1) * 57;
      const rooms = SW.Rooms.filter(r => r.deck === deck);
      ctx.fillStyle = 'rgba(10,18,30,0.86)';
      ctx.fillRect(panelX, top, panelW, 52);
      ctx.strokeStyle = deck === this.getRoom().deck ? '#b8d8ff' : '#2c3a4a';
      ctx.lineWidth = 1;
      ctx.strokeRect(panelX, top, panelW, 52);
      ctx.fillStyle = deck === this.getRoom().deck ? '#b8d8ff' : '#8395a8';
      ctx.font = 'bold 5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('DECK ' + deck + '  ' + this.DECK_NAMES[deck], panelX + 4, top + 8);

      for (let i = 0; i < rooms.length; i++) {
        const r = rooms[i];
        const x = cardX + i * (cardW + cardGap);
        const y = top + 14;
        const isCurrent = r.id === this.currentRoom;
        const isNeighbor = this.getRoom().toren.indexOf(r.id) >= 0;
        ctx.fillStyle = isCurrent ? 'rgba(89,158,222,0.28)' : (isNeighbor ? 'rgba(120,150,180,0.16)' : 'rgba(0,0,0,0.48)');
        ctx.fillRect(x, y, cardW, cardH);
        ctx.strokeStyle = isCurrent ? r.akzent : (isNeighbor ? '#71869a' : '#3b4652');
        ctx.lineWidth = isCurrent ? 2 : 1;
        ctx.strokeRect(x, y, cardW, cardH);
        ctx.fillStyle = isCurrent ? r.akzent : '#c2cfdd';
        ctx.font = 'bold 4px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.roomLabel(r, true), x + cardW / 2, y + 10);
        ctx.fillStyle = '#8797a8';
        ctx.font = '4px monospace';
        const purpose = r.zweck.length > 19 ? r.zweck.substring(0, 16) + '...' : r.zweck;
        ctx.fillText(purpose, x + cardW / 2, y + 19);
        const npcs = SW.World.npcInRoom(r.id);
        ctx.fillStyle = '#9eb99a';
        ctx.fillText(npcs.length + ' CREW', x + cardW / 2, y + 28);
        ctx.textAlign = 'left';
        this._cheatMapRects.push({ x, y, w: cardW, h: cardH, room: r.id });
      }
    }

    // Schacht, Kabinen und Aufzugskabinen verbinden die drei Decks.
    ctx.strokeStyle = '#54708a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(8, 43);
    ctx.lineTo(8, 157);
    ctx.stroke();
    for (let deck = 1; deck <= 3; deck++) {
      const y = 18 + (deck - 1) * 57 + 24;
      ctx.fillStyle = '#182433';
      ctx.fillRect(3, y - 4, 10, 8);
      ctx.strokeStyle = '#8ab9e8';
      ctx.strokeRect(3, y - 4, 10, 8);
      ctx.fillStyle = '#8ab9e8';
      ctx.fillRect(7, y - 2, 2, 4);
    }

    // Hinweis
    const blink = Math.floor(Date.now()/500)%2===0;
    ctx.fillStyle = blink ? '#fff' : '#666';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ RAUM WÄHLEN ]  [ ESC: ZURÜCK ]', SW.CX, SW.H-5);
    ctx.textAlign = 'left';
  },

  handleCheatMapClick(mx, my) {
    for (const r of this._cheatMapRects) {
      if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
        this.currentRoom = r.room;
        this.dialogueActive = false;
        this.talkingNPC = null;
        SW.Game.setState('SHIP');
        return;
      }
    }
  }
};
