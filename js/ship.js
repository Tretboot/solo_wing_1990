// ===== SOLO WING 1990 — WORLD STATE (Phase 6.3) =====
// Seed, aktuelles System, gesammelte Nachrufe, NPC-Placements.
// Das "fliegende Dorf" lebt: NPCs wandern je nach Seed/Mission,
// die Kapelle sammelt Nachrufe, das Observationsdeck zeigt das System.
SW.World = {
  seed: 1990,
  systemId: 's1',
  shipSystems: { engines:100, weapons:100, shields:100, sensors:100 },
  pilotName: null,
  postingId: 'fax-traegodie',
  transferHistory: [],
  nachrufe: [],       // gesammelte Nachrufe (Kapelle)
  missionResult: null, // 'sieg' | 'tod' | null

  init(systemId, seed) {
    const mMap = { m1: 's1', m2: 's2', m3: 's3', m4: 's2' };
    this.systemId = mMap[systemId] || systemId || 's1';
    this.seed = seed || 1990;
    this.missionResult = null;
    if (!SW.Transfers.getById(this.postingId)) this.postingId = SW.Transfers.DEFAULT_POSTING_ID;
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
    const posting = SW.Transfers.getCurrentPosting();
    const assigned = posting.crewRooms && posting.crewRooms[roomId];
    const base = (assigned || room.npcs).filter(name => posting.crew.indexOf(name) >= 0);
    // Quartiere bleiben privat (keine gastierenden Piloten vor den Kabinentüren)
    if (roomId === 'quartiere' || roomId === 'player_quarters') return base;
    // Bei Postings mit fester Raumzuteilung (crewRooms) keine zusätzlichen Gastpiloten würfeln
    if (posting.crewRooms) return base;
    // Nach m4_sieg (bzw. Subplot-Stufe optimierer >= 1) taucht der Optimierer in der Bar auf
    const optActive = (SW.SmartDialogues && SW.SmartDialogues.stage('optimierer') >= 1) ||
      (this.missionResults && this.missionResults.m4 === 'sieg');
    if (roomId === 'bar' && optActive && posting.crew.indexOf('Optimierer') >= 0 && base.indexOf('Optimierer') < 0) {
      if (base.length >= 3) base[2] = 'Optimierer';
      else base.push('Optimierer');
      return base;
    }
    // Je nach Seed: ein Pilot "gastiert" in diesem Raum (deterministisch)
    const h = this._hash(roomId);
    const guests = ['Sechs','Neun','Zwo','Vier'];
    const guest = guests[h % guests.length];
    // Gast nur, wenn er nicht schon Basis-NPC ist und nicht gefallenen
    const guestData = SW.Scoreboard.find(p => p.name === guest);
    if (posting.crew.indexOf(guest) >= 0 && guestData && guestData.status !== 'gefallen' && base.indexOf(guest) < 0) {
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
// Der Träger als "fliegendes Dorf". 14 statische Räume.
// Tür-Klick-Navigation, Minimap, prozeduraler Artstyle pro Raum, NPC-Dialoge.
// Konferenz: No Thinking + Lead Story Writer.

SW.Ship = {
  DECK_NAMES: { 1: 'WOHNDECK', 2: 'DIENSTDECK', 3: 'OBERDECK' },
  currentRoom: 'bar',
  selectedMissionId: 'm1',
  dialogueActive: false,
  dialogueLines: [],
  dialogueIndex: 0,
  charIndex: 0,
  typing: true,
  talkingNPC: null,
  _frame: 0,
  _doorRects: [],
  _npcRects: [],
  _choiceRects: [],
  _missionRects: [],
  _aktenschrankRect: null,
  _faxRect: null,
  _transferRect: null,
  _kaffeeRect: null,
  _moppRect: null,
  _kerzeRect: null,
  _akteIdx: 0,
  _npcClickCount: 0,
  _lastRoomId: null,
  newspaperOpen: false,
  _lockedQuartersRects: [],
  _ownQuartersRect: null,
  _roomNotice: null,
  _lockedDoorClick: 0,
  savePanelOpen: false,  // Save/Load-Panel im persönlichen Quartier
  _saveTerminalRect: null,
  _saveRects: [],        // Panel-Optionen

  // WC3-Stil Turbolift & Deck-Aufzug
  elevatorOpen: false,
  _elevatorButtons: [],
  _elevatorCloseRect: null,

  // Privateer-Modus Frachter-Brücke (Kiste 47)
  _freighterMarketRect: null,
  _freighterNavRect: null,
  _freighterLaunchRect: null,
  _freighterDockRect: null,

  privateerRoom: {
    id: 'frachter_bruecke',
    name: 'KOMMANDOBRÜCKE (KISTE 47)',
    zweck: 'Privates Cockpit, Handelsterminal, Logbuch & Nav-Computer',
    deck: 1,
    farbe: '#2a1a0a',
    akzent: '#ff9933',
    npcs: [],
    toren: ['bar'],
    art: 'frachter_bruecke'
  },

  init(systemId) {
    this._frame = 0;
    this.dialogueActive = false;
    this.talkingNPC = null;
    this._choiceRects = [];
    this.savePanelOpen = false; // Raumwechsel schließt das Save-Panel
    this.newspaperOpen = false;
    if (systemId && /^m\d$/.test(systemId)) this.selectedMissionId = systemId;
    else if (SW.Game && SW.Game.mission && SW.Game.mission.id) this.selectedMissionId = SW.Game.mission.id;
    // World-State initialisieren (Seed = Mission-Id + Zeit)
    const seed = (SW.Game.mission?.id || 'm1').charCodeAt(1) * 1000 + Math.floor(Date.now()/100000) % 1000;
    SW.World.init(systemId, seed);
    const posting = SW.Transfers.getCurrentPosting();
    this.currentRoom = SW.Transfers.canVisit(this.currentRoom) ? this.currentRoom : posting.startRoom;
  },

  getRoom() {
    if (this.currentRoom === 'frachter_bruecke') {
      return this.privateerRoom;
    }
    return SW.Rooms.find(r => r.id === this.currentRoom) || SW.Rooms[0];
  },

  roomLabel(room, mapLabel) {
    if (!room) return '';
    if (room.id === 'frachter_bruecke') return mapLabel ? (room.mapLabel || 'KISTE 47') : room.name;
    const pilotName = ((SW.World && SW.World.pilotName) || 'PILOT').trim() || 'PILOT';
    const label = mapLabel ? (room.mapLabel || room.name) : room.name;
    return label.replace(/\{spielername\}/gi, pilotName);
  },

  // ===== NAVIGATION =====
  navigateTo(roomId) {
    const room = this.getRoom();
    if (room.toren.indexOf(roomId) < 0) return; // nur über Türen
    if (!SW.Transfers.canVisit(roomId)) {
      this.showRoomNotice('ZUGANGSKONTROLLE', 'Kein Zugriff. Für dieses Deck fehlt die Zuweisung.');
      return;
    }
    this.currentRoom = roomId;
    this._saveTerminalRect = null;
    this._roomNotice = null;
    this.dialogueActive = false;
    this.talkingNPC = null;
    this._choiceRects = [];
    this.newspaperOpen = false;
    if (SW.Quests) SW.Quests.tick({ typ: 'raum', raum: roomId });
    if (SW.Audio && SW.Audio.syncContext) SW.Audio.syncContext(roomId);
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
    this._choiceRects = [];
    const line = lines[0];
    SW.TTS.speak(line.text, line.npc);
  },

  // Smart-Dialog für einen angeklickten NPC + automatische Quest-Vergabe + WC3-Auswahl
  startNpcDialogue(npcName) {
    const room = this.getRoom();
    const npcId = SW.NPC ? SW.NPC.resolve(npcName) : String(npcName || '').toLowerCase();
    const speaker = String(npcName || 'SYSTEM').toUpperCase();
    this._npcClickCount = (this._npcClickCount || 0) + 1;
    if (SW.Quests && SW.Quests.startForNpc) {
      SW.Quests.startForNpc(speaker);
    }
    const lines = [];
    let firstId = null;
    if (SW.SmartDialogues && npcId && SW.Dialogues.smart && SW.Dialogues.smart[npcId]) {
      const s1 = SW.SmartDialogues.get(npcId);
      const t1 = typeof s1 === 'string' ? s1 : (s1 && s1.text);
      firstId = s1 && s1.id;
      if (t1) lines.push({ npc: speaker, text: t1 });
    }

    // Wing Commander 3-Stil Entscheidungs-Frage für diesen NPC prüfen
    const choiceKey = (SW.Dialogues.choices && SW.Dialogues.choices[npcId]) ? npcId : speaker.toLowerCase();
    const choicePool = (SW.Dialogues.choices && SW.Dialogues.choices[choiceKey]) || [];
    let chosenPrompt = null;
    for (const c of choicePool) {
      if (!SW.Quests || !SW.Quests.getFlag(c.id)) {
        chosenPrompt = c;
        break;
      }
    }
    // Falls bereits beantwortet: bei jedem zweiten Klick erneut anbieten, damit Entscheidungen immer erlebbar bleiben
    if (!chosenPrompt && choicePool.length > 0 && this._npcClickCount % 2 === 0) {
      chosenPrompt = choicePool[this._npcClickCount % choicePool.length];
    }

    if (chosenPrompt) {
      lines.push({
        npc: speaker,
        text: chosenPrompt.text,
        choiceId: chosenPrompt.id,
        choices: chosenPrompt.choices.map(ch => ({ label: ch.label, flag: ch.flag, action: ch.action, reply: ch.reply }))
      });
    } else {
      if (SW.SmartDialogues && npcId && SW.Dialogues.smart && SW.Dialogues.smart[npcId]) {
        const s2 = SW.SmartDialogues.get(npcId, { excludeId: firstId });
        const t2 = typeof s2 === 'string' ? s2 : (s2 && s2.text);
        if (t2 && (!lines[0] || lines[0].text !== t2)) lines.push({ npc: speaker, text: t2 });
      }
      const roomLines = (SW.Dialogues.rooms[room.id] || []).filter(l => String(l.npc).toUpperCase() === speaker);
      if (roomLines.length > 0) {
        const pick = roomLines[(this._frame + this._npcClickCount) % roomLines.length];
        if (!lines.some(l => l.text === pick.text)) lines.push({ npc: pick.npc, text: pick.text });
      }
    }

    if (lines.length === 0) {
      const roomAll = SW.Dialogues.rooms[room.id] || [];
      if (roomAll.length > 0) {
        const fallback = roomAll[this._npcClickCount % roomAll.length];
        lines.push({ npc: fallback.npc || speaker, text: fallback.text });
      } else {
        lines.push({ npc: speaker, text: 'Keine besonderen Vorkommnisse auf diesem Deck. Formular 08/15 liegt bereit.' });
      }
    }
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialoguePage = 0;
    this.charIndex = 0;
    this.typing = true;
    this.dialogueActive = true;
    this._choiceRects = [];
    SW.TTS.speak(lines[0].text, lines[0].npc);
  },

  hasActiveChoices() {
    if (!this.dialogueActive || this.typing) return false;
    const line = this.dialogueLines && this.dialogueLines[this.dialogueIndex];
    if (!line || !Array.isArray(line.choices) || line.choices.length === 0) return false;
    const pages = this._dialoguePages || 1;
    return this.dialoguePage >= pages - 1;
  },

  selectDialogueChoice(index) {
    if (!this.dialogueActive) return false;
    const line = this.dialogueLines && this.dialogueLines[this.dialogueIndex];
    if (!line || !Array.isArray(line.choices) || !line.choices[index]) return false;
    const chosen = line.choices[index];
    if (SW.Quests) {
      if (line.choiceId) SW.Quests.setFlag(line.choiceId, true);
      if (chosen.flag) SW.Quests.setFlag(chosen.flag, true);
    }
    if (chosen.action) {
      if (chosen.action === 'transfer_hermes' && SW.Transfers && SW.Transfers.transferTo) {
        SW.Transfers.transferTo('tcs-hermes', 'Schwarm-Protokoll angefordert (TCS Hermes)');
        this.selectedMissionId = 'm5';
      } else if (chosen.action === 'transfer_fax' && SW.Transfers && SW.Transfers.transferTo) {
        SW.Transfers.transferTo('fax-traegodie', 'Rückkehr zur TCS Fax-Tragödie');
      } else if (chosen.action === 'quit_service' && SW.CarrierEconomy) {
        this.dialogueActive = false;
        SW.CarrierEconomy.enterPrivateerMode('Im Gespräch den Dienst quittiert (Formular 99-P)', true);
        return true;
      } else if (chosen.action === 'branch_m6a') {
        this.selectedMissionId = 'm6a';
      } else if (chosen.action === 'branch_m6b') {
        this.selectedMissionId = 'm6b';
      }
    }
    line.choices = null;
    this._choiceRects = [];
    if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
    if (chosen.reply && chosen.reply.text) {
      this.dialogueLines.splice(this.dialogueIndex + 1, 0, {
        npc: chosen.reply.npc || line.npc,
        text: chosen.reply.text
      });
    }
    this.typing = false;
    this.advanceDialogue();
    return true;
  },

  advanceDialogue() {
    if (!this.dialogueActive) { this.dialogueActive = false; return; }
    const curLine = this.dialogueLines[this.dialogueIndex];
    const curText = typeof curLine?.text === 'string' ? curLine.text : String(curLine?.text?.text || '');
    if (this.typing) {
      this.typing = false;
      this.charIndex = curText.length;
      return;
    }
    // Weiter: erst durch die Seiten scrollen (keine neue TTS), dann nächste Zeile
    const pages = this._dialoguePages || 1;
    if (this.dialoguePage < pages - 1) {
      this.dialoguePage++;
      return;
    }
    // Wenn auf der letzten Seite eine WC3-Entscheidung offen ist, wartet der Dialog auf Option [1] oder [2]
    if (this.hasActiveChoices()) return;
    this.dialogueIndex++;
    this.dialoguePage = 0;
    if (this.dialogueIndex >= this.dialogueLines.length) {
      this.dialogueActive = false;
      this.talkingNPC = null;
      this._choiceRects = [];
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
    const curLine = this.dialogueLines[this.dialogueIndex];
    const curText = typeof curLine?.text === 'string' ? curLine.text : String(curLine?.text?.text || '');
    if (this.typing) {
      this.charIndex++;
      if (this.charIndex >= curText.length) this.typing = false;
    }
  },

  // ===== KLIK-BEHANDLUNG =====
  handleClick(mx, my) {
    // Save/Load-Panel oder Träger-Post-Overlay hat Vorrang
    if (this.savePanelOpen) { this.handleSavePanelClick(mx, my); return; }
    if (this.newspaperOpen) { this.newspaperOpen = false; SW.Audio.playCommBeep(); return; }

    // WC3-Stil Turbolift / Deck-Aufzug Klicks (Deckplan als Aufzug)
    if (this.elevatorOpen) {
      if (this._elevatorCloseRect && this._contains(this._elevatorCloseRect, mx, my)) {
        this.elevatorOpen = false;
        if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
        return;
      }
      if (this._cheatMapRects) {
        for (const r of this._cheatMapRects) {
          if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
            this.currentRoom = r.room;
            this.elevatorOpen = false;
            this.dialogueActive = false;
            this.talkingNPC = null;
            if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
            return;
          }
        }
      }
      if (this._elevatorButtons) {
        for (const btn of this._elevatorButtons) {
          if (this._contains(btn, mx, my)) {
            this.currentRoom = btn.roomId;
            this.elevatorOpen = false;
            if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
            return;
          }
        }
      }
      return;
    }

    // Frachter-Brücke (Privateer-Modus Basis) Klicks
    if (this.currentRoom === 'frachter_bruecke') {
      if (this._saveTerminalRect && this._contains(this._saveTerminalRect, mx, my)) {
        this.savePanelOpen = true;
        if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
        return;
      }
      if (this._freighterMarketRect && this._contains(this._freighterMarketRect, mx, my) && SW.ArmadaMap) {
        SW.ArmadaMap.open();
        return;
      }
      if (this._freighterNavRect && this._contains(this._freighterNavRect, mx, my) && SW.ArmadaMap) {
        SW.ArmadaMap.open();
        return;
      }
      if (this._freighterLaunchRect && this._contains(this._freighterLaunchRect, mx, my)) {
        SW.Player.shipClassId = 'frachter';
        SW.Game.prepareMission('m1');
        SW.Game.setState('TAKEOFF');
        return;
      }
      if (this._freighterDockRect && this._contains(this._freighterDockRect, mx, my)) {
        const curSecId = (SW.World && SW.World.currentSectorId) || 's1';
        const carrierSecId = (SW.ArmadaMap && SW.ArmadaMap.carrierSectorId) || 's1';
        const carrierHere = curSecId === carrierSecId;
        if (!carrierHere) {
          const carrierSec = (SW.ArmadaMap && SW.ArmadaMap.SECTORS) ? SW.ArmadaMap.SECTORS.find(s => s.id === carrierSecId) : null;
          const cName = carrierSec ? carrierSec.name.split(' (')[0] : carrierSecId.toUpperCase();
          this.showRoomNotice('BORDCOMPUTER', 'Träger abwesend! Die TCS Fax-Tragödie ankert aktuell in ' + cName + '. Springen Sie per Sprungtor dorthin, um wieder an Bord zu gehen.');
          if (SW.Audio && SW.Audio.playBeep) SW.Audio.playBeep(340, 0.12);
          return;
        }
        if (SW.CarrierEconomy && SW.CarrierEconomy.returnToMilitary) {
          SW.CarrierEconomy.returnToMilitary();
        }
        this.currentRoom = 'flugdeck';
        this.showRoomNotice('COMMANDER', 'Wiedereinstellung bewilligt. Kiste 47 bleibt im Hangar geparkt.');
        if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
        return;
      }
    }
    // Offene Wing Commander 3-Entscheidung: Klick auf Option [1] oder [2]
    if (this.dialogueActive && this.hasActiveChoices()) {
      for (const cr of (this._choiceRects || [])) {
        if (this._contains(cr, mx, my)) {
          this.selectDialogueChoice(cr.index);
          return;
        }
      }
      if (my >= SW.H - 128) return;
    }
    // Klick direkt auf die offene Dialogbox blättert weiter (oder beendet das Tippen)
    if (this.dialogueActive && mx >= 15 && mx <= SW.W - 15 && my >= SW.H - 92 && my <= SW.H - 28) {
      this.advanceDialogue();
      return;
    }
    // NPC geklickt? (Hat Vorrang vor Hintergrund-Möbeln, damit Klick auf NPC immer den Dialog startet!)
    for (const n of this._npcRects) {
      if (mx >= n.x && mx <= n.x + n.w && my >= n.y && my <= n.y + n.h) {
        if (this.dialogueActive && this.talkingNPC === n.name) {
          this.advanceDialogue();
        } else {
          this.talkingNPC = n.name;
          this.startNpcDialogue(n.name);
        }
        return;
      }
    }
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
    // Missionswahl + START-Button + Sektorkarte [K] / Staffel [S] im Flugdeck
    if (this.currentRoom === 'flugdeck') {
      if (this._sectorMapRect && this._contains(this._sectorMapRect, mx, my) && SW.ArmadaMap) {
        SW.ArmadaMap.open();
        return;
      }
      if (this._squadronRect && this._contains(this._squadronRect, mx, my) && SW.SquadronUI) {
        SW.SquadronUI.open();
        return;
      }
      if (this._missionRects) {
        for (const mr of this._missionRects) {
          if (this._contains(mr, mx, my)) {
            this.selectedMissionId = mr.id;
            SW.Game.mission = SW.Missions.get(mr.id);
            const sysId = SW.Game.mission.systemId || 's1';
            SW.World.systemId = sysId;
            SW.Audio.playCommBeep();
            this.showRoomNotice('FLUGLEITUNG', 'Einsatz gewählt: ' + SW.Game.mission.name);
            return;
          }
        }
      }
      if (this._startRect && this._contains(this._startRect, mx, my)) {
        const mId = this.selectedMissionId || (SW.Game.mission && SW.Game.mission.id) || 'm1';
        if (mId === 'm4' && SW.Quests) SW.Quests.start('kaltkammer_beschutzen');
        SW.Game.prepareMission(mId);
        SW.Game.setState('BRIEFING_BOARD');
        return;
      }
    }
    if (this.currentRoom === 'reparatur' && this._squadronRect && this._contains(this._squadronRect, mx, my) && SW.SquadronUI) {
      SW.SquadronUI.open();
      return;
    }
    // Interaktive Raum-Objekte (Büro: Aktenschrank, Fax/Zeitung, Versetzung)
    if (this.currentRoom === 'buerro') {
      if (this._faxRect && this._contains(this._faxRect, mx, my)) {
        this.newspaperOpen = true;
        SW.Audio.playCommBeep();
        return;
      }
      if (this._aktenschrankRect && this._contains(this._aktenschrankRect, mx, my)) {
        const akten = SW.Dialogues.akten || [];
        if (akten.length > 0) {
          if (SW.Quests && SW.Quests.status('akte_sechs') === 'available') SW.Quests.start('akte_sechs');
          const akte = akten[this._akteIdx % akten.length];
          this._akteIdx++;
          if (SW.Quests && akte.flag) SW.Quests.setFlag(akte.flag, true);
          if (SW.Quests) SW.Quests.setFlag('akten_gelesen', true);
          if (SW.Quests && akten.every(a => !a.flag || SW.Quests.getFlag(a.flag))) {
            SW.Quests.setFlag('alle_akten_gelesen', true);
          }
          this.dialogueLines = akte.lines;
          this.dialogueIndex = 0;
          this.dialoguePage = 0;
          this.charIndex = 0;
          this.typing = true;
          this.dialogueActive = true;
          this._choiceRects = [];
          SW.TTS.speak(akte.lines[0].text, akte.lines[0].npc);
        }
        return;
      }
      if (this._transferRect && this._contains(this._transferRect, mx, my)) {
        this.showRoomNotice('COMMANDER', 'Versetzungsgesuch abgewiesen! Versetzungen erfolgen ausschließlich auf Anordnung des Flottenkommandos bei mangelhafter Leistung.');
        if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
        return;
      }
    }
    // Kantine: Warmer Kaffee für den Commander
    if (this.currentRoom === 'kantine' && this._kaffeeRect && this._contains(this._kaffeeRect, mx, my)) {
      if (SW.Quests) {
        SW.Quests.start('kaffee_bringen');
        SW.Quests.setFlag('kaffee_abgeholt', true);
      }
      this.showRoomNotice('KANTINE', 'Einziger warmer Becher Kaffee aufgenommen. Ziel: Kapitän-Büro.');
      return;
    }
    // Klo: Wischmopp benutzen
    if (this.currentRoom === 'klo' && this._moppRect && this._contains(this._moppRect, mx, my)) {
      if (SW.Quests) {
        SW.Quests.start('klo_putzen');
        SW.Quests.setFlag('klo_geputzt', true);
      }
      this.dialogueLines = [
        { npc: 'KLO', text: 'Du hast gewischt. Der Toner geht nicht weg, aber er glänzt jetzt.' },
        { npc: 'KLO', text: 'Hör zu: In Kältekammer 7 liegt der erste Pilot von 1984. Er atmet zweimal pro Minute, weil Formular 83-B noch keine Unterschrift hat.' }
      ];
      this.dialogueIndex = 0; this.dialoguePage = 0; this.charIndex = 0; this.typing = true; this.dialogueActive = true;
      this._choiceRects = [];
      SW.TTS.speak(this.dialogueLines[0].text, 'KLO');
      return;
    }
    // Kapelle: Kerzenbank / Nachrufe lesen
    if (this.currentRoom === 'kapelle' && this._kerzeRect && this._contains(this._kerzeRect, mx, my)) {
      const nachrufe = (SW.World && SW.World.nachrufe) || [];
      if (nachrufe.length > 0) {
        this.dialogueLines = nachrufe.map(n => ({ npc: 'KLOPSTOCK', text: 'NACHRUF ' + n.name.toUpperCase() + ': ' + n.text }));
        this.dialogueIndex = 0; this.dialoguePage = 0; this.charIndex = 0; this.typing = true; this.dialogueActive = true;
        this._choiceRects = [];
        SW.TTS.speak(this.dialogueLines[0].text, 'KLOPSTOCK');
      }
      return;
    }
    // Tür / Schott / Aufzug geklickt?
    for (const d of this._doorRects) {
      if (mx >= d.x && mx <= d.x + d.w && my >= d.y && my <= d.y + d.h) {
        if (d.to === 'elevator') {
          this.elevatorOpen = true;
          if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
          return;
        }
        if (d.to === 'space_launch') {
          SW.Player.shipClassId = 'frachter';
          SW.Game.prepareMission('m1');
          SW.Game.setState('TAKEOFF');
          return;
        }
        if (d.to === 'player_quarters') {
          this.currentRoom = 'player_quarters';
          if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
          return;
        }
        if (d.to === 'quartiere') {
          this.currentRoom = 'quartiere';
          if (SW.Audio && SW.Audio.playCommBeep) SW.Audio.playCommBeep();
          return;
        }
        this.navigateTo(d.to);
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
    if (this._lastRoomId && this._lastRoomId !== room.id) {
      this.dialogueActive = false;
      this.talkingNPC = null;
      this._choiceRects = [];
    }
    this._lastRoomId = room.id;
    this._doorRects = [];
    this._npcRects = [];
    this._missionRects = [];
    this._aktenschrankRect = null;
    this._faxRect = null;
    this._transferRect = null;
    this._kaffeeRect = null;
    this._moppRect = null;
    this._kerzeRect = null;
    this._lockedQuartersRects = [];
    this._ownQuartersRect = null;
    this._freighterMarketRect = null;
    this._freighterNavRect = null;
    this._freighterLaunchRect = null;
    this._freighterDockRect = null;

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

    // Türen & Aufzug
    this.renderDoors(ctx, room);

    // Dialog-Box
    if (this.dialogueActive) this.renderDialogue(ctx, room);
    else if (this._roomNotice) this.renderRoomNotice(ctx, room);
    else this.renderHint(ctx, room);
    // Fax-Benachrichtigung (Thermopapier oben rechts)
    if (SW.Fax) SW.Fax.render(ctx);
    // Schiffszeitung & Auftrags-Journal Overlay ([J] oder Klick auf Fax im Büro)
    if (this.newspaperOpen) this.renderNewspaperOverlay(ctx, room);
    // Save/Load-Panel — oberstes Overlay
    if (this.savePanelOpen) this.renderSavePanel(ctx, room);
    // WC3-Stil Turbolift / Deck-Aufzug Overlay
    if (this.elevatorOpen) this.renderElevatorTransit(ctx, room);
  },

  // ===== PROZEDURALER ARTSTYLE PRO RAUM =====
  renderArt(ctx, room) {
    switch (room.art) {
      case 'frachter_bruecke': this.artFrachterBruecke(ctx, room); break;
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
    ctx.fillText(SW.Transfers.getCurrentPosting().name + '  /  DECK ' + room.deck, SW.W - 12, 197);
    ctx.restore();
    this.renderRoomBeautyFilter(ctx, room);
  },

  // 1990s VGA Bayer Pixel-Dither & Carrier-spezifische Raum-Atmosphäre (Beauty Pass)
  renderRoomBeautyFilter(ctx, room) {
    ctx.save();
    const postingId = (SW.Transfers && SW.Transfers.getCurrentPosting) ? SW.Transfers.getCurrentPosting().id : 'fax-traegodie';
    // 1. Decken-Lichtkegel (Volumetric Overhead Lighting)
    for (const lx of [42, 122, 202, 282]) {
      ctx.fillStyle = room.akzent || '#44aaff';
      ctx.globalAlpha = postingId === 'tcs-hermes' ? 0.08 : 0.05;
      ctx.beginPath();
      ctx.moveTo(lx - 8, 32);
      ctx.lineTo(lx + 8, 32);
      ctx.lineTo(lx + 24, 158);
      ctx.lineTo(lx - 24, 158);
      ctx.closePath();
      ctx.fill();
    }
    // 2. TCS Hermes: Kybernetische Neural-Leitungen & KI-Schwarm-Statusknoten in allen Räumen
    if (postingId === 'tcs-hermes') {
      ctx.strokeStyle = 'rgba(0, 255, 220, 0.28)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(10, 36); ctx.lineTo(SW.W - 10, 36);
      ctx.moveTo(10, 154); ctx.lineTo(SW.W - 10, 154);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const nx = 26 + i * 52;
        const pulse = ((this._frame + i * 9) % 24) < 12;
        ctx.fillStyle = pulse ? '#00ffee' : '#aa66ff';
        ctx.globalAlpha = 0.65;
        ctx.fillRect(nx, 35, 3, 2);
        ctx.fillRect(nx, 153, 2, 2);
      }
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#00ffee';
      ctx.font = '4px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('◈ HERMES KI-NETZ: AUTONOM · ROBOTER-CREW AKTIV', 12, 197);
    }
    // 3. Subtiler 1990er VGA Pixel-Dither & CRT Scanline-Filter über dem Raum
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    for (let y = 30; y < 182; y += 2) {
      ctx.fillRect(8, y, SW.W - 16, 1);
    }
    ctx.fillStyle = 'rgba(200, 230, 255, 0.035)';
    for (let y = 32; y < 180; y += 4) {
      for (let x = 12 + (y % 8 === 0 ? 0 : 2); x < SW.W - 12; x += 6) {
        ctx.fillRect(x, y, 1, 1);
      }
    }
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
    const posting = (SW.Transfers && SW.Transfers.getCurrentPosting) ? SW.Transfers.getCurrentPosting() : { id: 'fax-traegodie' };
    const isHermes = posting && posting.id === 'tcs-hermes';
    let mIds = ['m1', 'm2', 'm3', 'm4', 'm5'];
    if (SW.Quests && SW.Quests.getFlag('taktik_entscheidung_halten')) {
      mIds = ['m1', 'm2', 'm3', 'm4', 'm5_speer'];
    } else if (SW.Quests && SW.Quests.getFlag('taktik_entscheidung_rueckzug')) {
      mIds = ['m1', 'm2', 'm3', 'm4', 'm5_schatten'];
    }
    if (isHermes) {
      mIds = ['m5', 'm6a', 'm6b'];
    } else if (this.selectedMissionId === 'm6a' || this.selectedMissionId === 'm6b') {
      mIds = ['m1', 'm2', 'm3', 'm4', this.selectedMissionId];
    }
    const selId = this.selectedMissionId || 'm1';
    const selM = (SW.Missions && SW.Missions.get ? SW.Missions.get(selId) : SW.Missions[selId]) || { name: 'SEKTOR 7', systemId: 's1', waves: [] };
    const sysMap = { s1: 'SEKTOR 7', s2: 'SEKTOR 9', s3: 'SEKTOR 12' };
    // Screens (dynamisch für gewählte Mission)
    const screenTexts = [
      ['EINSATZ-ID: ' + selId.toUpperCase(), (selM.name || '').substring(0, 17), 'WELLEN: ' + (selM.waves ? selM.waves.length : 1)],
      ['ZIELGEBIET:', sysMap[selM.systemId] || 'SEKTOR 7', 'TRÄGER: ' + (posting.name ? posting.name.substring(0, 12) : 'FAX-TRAGÖDIE')],
      ['STATUS: BEREIT', (SW.World && SW.World.missionResults && SW.World.missionResults[selId]) ? ('AKTE: ' + SW.World.missionResults[selId].toUpperCase()) : 'AKTE: OFFEN', 'FORMULAR 12-A OK']
    ];
    for(let i=0;i<3;i++){ const sx=30+i*90;
      ctx.fillStyle='#001a1a'; ctx.fillRect(sx,46,80,34);
      ctx.strokeStyle='#00ff00'; ctx.strokeRect(sx,46,80,34);
      ctx.fillStyle='#0f0'; ctx.font='4px monospace';
      ctx.fillText(screenTexts[i][0], sx+4, 55);
      ctx.fillText(screenTexts[i][1], sx+4, 64);
      ctx.fillText(screenTexts[i][2], sx+4, 73);
    }
    // Missions-Auswahl-Buttons
    this._missionRects = [];
    for (let i = 0; i < mIds.length; i++) {
      const id = mIds[i];
      const mx = 30 + i * 38, my = 84, mw = 35, mh = 12;
      const isSel = id === selId;
      const done = SW.World && ((Array.isArray(SW.World.missionProgress) && SW.World.missionProgress.includes(id)) || (SW.World.missionResults && SW.World.missionResults[id] === 'sieg'));
      ctx.fillStyle = isSel ? '#004433' : '#08121a';
      ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = isSel ? '#00ffcc' : (done ? '#44aa66' : '#2a4a5a');
      ctx.strokeRect(mx, my, mw, mh);
      ctx.fillStyle = isSel ? '#00ffcc' : (done ? '#66dd88' : '#7799aa');
      ctx.font = 'bold 4px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(id.toUpperCase() + (done ? '✓' : ''), mx + mw / 2, my + 8);
      ctx.textAlign = 'left';
      this._missionRects.push({ x: mx, y: my, w: mw, h: mh, id });
    }
    // Sektorkarte (Armada / Privateer) Button
    this._sectorMapRect = { x: 228, y: 84, w: 66, h: 12 };
    ctx.fillStyle = '#082032';
    ctx.fillRect(228, 84, 66, 12);
    ctx.strokeStyle = '#44aaff';
    ctx.strokeRect(228, 84, 66, 12);
    ctx.fillStyle = '#88ddff';
    ctx.font = 'bold 4px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[K] SEKTORKARTE', 261, 92);

    // Start-Button
    this._startRect={x:120,y:102,w:56,h:18};
    const blink=Math.floor(this._frame/30)%2===0;
    ctx.fillStyle=blink?'#0f0':'#030'; ctx.fillRect(120,102,56,18);
    ctx.fillStyle='#000'; ctx.font='bold 7px monospace'; ctx.textAlign='center';
    ctx.fillText('START', 148, 114);

    // Staffel-Hangar Button
    this._squadronRect = { x: 184, y: 102, w: 58, h: 18 };
    ctx.fillStyle = '#182410';
    ctx.fillRect(184, 102, 58, 18);
    ctx.strokeStyle = '#88ff44';
    ctx.strokeRect(184, 102, 58, 18);
    ctx.fillStyle = '#88ff44';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('[S] STAFFEL', 213, 113);
    ctx.textAlign='left';

    // 3D Holo-Projektion des aktuellen Trägers (TCS Fax-Tragödie oder TCS Hermes) auf dem Taktiktisch
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      const holoYaw = (this._frame * 0.025) % (Math.PI * 2);
      const carrierKey = SW.Sprites.getCarrierAtlasKey ? SW.Sprites.getCarrierAtlasKey() : 'fax_traegodie';
      ctx.save();
      ctx.globalAlpha = 0.85;
      SW.Sprites.drawMultiAngle(ctx, carrierKey, 68, 118, 36, holoYaw, 0.25, '#00ffcc');
      ctx.restore();
    }
    // Boden
    ctx.fillStyle='#1a2530'; ctx.fillRect(0,SW.H-30,SW.W,30);
  },

  artBuerro(ctx, room) {
    // Schreibtisch
    ctx.fillStyle='#5a3a1a'; ctx.fillRect(40,110,240,30);
    ctx.fillStyle='#3a2a1a'; ctx.fillRect(40,140,240,10);
    // Aktenregale (interaktiv: 5 lesbare Akten!)
    for(let i=0;i<4;i++){ ctx.fillStyle='#2a1a0a'; ctx.fillRect(20+i*70,40,60,60);
      ctx.strokeStyle=i===0?room.akzent:'#5a3a1a'; ctx.strokeRect(20+i*70,40,60,60);
      for(let j=0;j<3;j++){ ctx.fillStyle='#4a3a2a'; ctx.fillRect(24+i*70,46+j*18,52,14); } }
    ctx.fillStyle='#ffcc00'; ctx.font='4px monospace'; ctx.fillText('[AKTEN]', 26, 38);
    this._aktenschrankRect = { x: 20, y: 36, w: 130, h: 64 };
    // Fax (interaktiv: Schiffszeitung & Quest-Ticker)
    ctx.fillStyle='#888'; ctx.fillRect(150,95,40,15);
    ctx.fillStyle='#0f0'; ctx.fillRect(155,98,10,4);
    ctx.fillStyle='#000'; ctx.font='5px monospace'; ctx.fillText('FAX', 170, 105);
    this._faxRect = { x: 146, y: 90, w: 48, h: 22 };
    // Personalakte / Dienstanweisung (rechts auf dem Tisch)
    ctx.fillStyle='#22303c'; ctx.fillRect(212,94,58,16);
    ctx.strokeStyle=room.akzent; ctx.strokeRect(212,94,58,16);
    ctx.fillStyle='#9edbff'; ctx.font='4px monospace'; ctx.textAlign='center';
    ctx.fillText('DIENSTAKTE', 241, 104); ctx.textAlign='left';
    this._transferRect = { x: 212, y: 92, w: 58, h: 18 };
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
    // Speisekarte + Kaffeekanne (interaktiv für Quest 1)
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(188,50,58,50);
    ctx.strokeStyle='#ff6644'; ctx.strokeRect(188,50,58,50);
    ctx.fillStyle='#ff6644'; ctx.font='5px monospace';
    ctx.fillText('MENÜ', 194, 60);
    ctx.fillText('Suppe: 2 DM', 194, 70);
    ctx.fillText('Nudeln: 3 DM', 194, 78);
    ctx.fillText('Kaffee: [KLICK]', 194, 86);
    this._kaffeeRect = { x: 186, y: 48, w: 62, h: 54 };
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
    // Kerzen (interaktiv: Nachrufe lesen)
    for(let i=0;i<5;i++){ const cx=80+i*40;
      ctx.fillStyle='#ccc'; ctx.fillRect(cx,110,4,15);
      ctx.fillStyle='#ffcc00';
      const flick=Math.floor(this._frame/8+i)%2===0;
      if(flick) ctx.fillRect(cx+1,106,2,4);
    }
    this._kerzeRect = { x: 74, y: 102, w: 176, h: 36 };
    // Trauerband
    ctx.fillStyle='#333'; ctx.fillRect(0,130,SW.W,8);
    ctx.fillStyle='#888'; ctx.font='5px monospace'; ctx.textAlign='center';
    ctx.fillText('IN STILLER TRAUER [KLICK: NACHRUFE]', SW.CX, 136); ctx.textAlign='left';
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
    // Geparktes 3D-Spieler-Schiff auf dem Hangar-Lift + Staffel/Hangar-Terminal
    const shipSpec = (SW.Player && SW.Player.getShipSpec) ? SW.Player.getShipSpec() : null;
    const atlasKey = (shipSpec && shipSpec.atlasKey) || 'hornet';
    ctx.fillStyle = '#222830';
    ctx.fillRect(160, 128, 120, 10);
    ctx.strokeStyle = '#ffcc00';
    ctx.strokeRect(160, 128, 120, 10);
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      const slowYaw = 0.7 + Math.sin(this._frame * 0.015) * 0.25;
      SW.Sprites.drawMultiAngle(ctx, atlasKey, 220, 104, 62, slowYaw, 0.2, '#88aa44');
    }
    this._squadronRect = { x: 168, y: 42, w: 120, h: 14 };
    ctx.fillStyle = '#182410';
    ctx.fillRect(168, 42, 120, 14);
    ctx.strokeStyle = '#88ff44';
    ctx.strokeRect(168, 42, 120, 14);
    ctx.fillStyle = '#88ff44';
    ctx.font = 'bold 4px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[S] STAFFEL & SCHIFFSWAHL (' + ((shipSpec && shipSpec.name) || 'SPATZ') + ')', 228, 51);
    ctx.textAlign = 'left';
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

  artFrachterBruecke(ctx, room) {
    // 1. Großes Panorama-Frontfenster des Frachters ins All
    const sys = SW.World.systemInfo();
    ctx.fillStyle = '#020408';
    ctx.fillRect(24, 30, SW.W - 48, 88);
    ctx.strokeStyle = '#5a3d1c';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 30, SW.W - 48, 88);

    // Sternenfeld
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 35; i++) {
      ctx.fillRect(28 + (i * 29) % (SW.W - 56), 34 + (i * 19) % 80, 1, 1);
    }
    // Planet des Sektors
    ctx.fillStyle = sys.farbe || '#ff9933';
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(220, 68, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = sys.farbe || '#ff9933';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(220, 68, 28, 7, -0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Träger im Sektor (wenn vorhanden)
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      SW.Sprites.drawMultiAngle(ctx, 'fax_traegodie', 85, 62, 34, 0.4, 0.1, '#88aacc');
    }
    ctx.fillStyle = '#ffff66';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('TRÄGER IN SICHTWEITE: TCS FAX-TRAGÖDIE', 32, 42);

    // 2. Cockpit-Aufbau und Brücken-Konsole der Kiste 47
    ctx.fillStyle = '#1c140a';
    ctx.fillRect(16, 118, SW.W - 32, 60);
    ctx.strokeStyle = '#ff9933';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 118, SW.W - 32, 60);

    // Linkes Terminal: LOGBUCH & SPEICHER-TERMINAL
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(24, 124, 62, 44);
    ctx.strokeStyle = '#00ff88';
    ctx.strokeRect(24, 124, 62, 44);
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOGBUCH / SAVE', 55, 136);
    ctx.font = '4px monospace';
    ctx.fillStyle = '#88ffaa';
    ctx.fillText('[KLICK: SPEICHERN]', 55, 148);
    ctx.fillText('Kabine Kiste 47', 55, 158);
    this._saveTerminalRect = { x: 24, y: 124, w: 62, h: 44 };

    // Mittleres Terminal: NAVIGATION & SEKTORKARTE
    ctx.fillStyle = '#0a1018';
    ctx.fillRect(94, 124, 64, 44);
    ctx.strokeStyle = '#3399ff';
    ctx.strokeRect(94, 124, 64, 44);
    ctx.fillStyle = '#3399ff';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('NAV-COMPUTER', 126, 136);
    ctx.font = '4px monospace';
    ctx.fillStyle = '#88ccff';
    ctx.fillText('[K] SEKTORKARTE', 126, 148);
    ctx.fillText('Sprungtore & Routen', 126, 158);
    this._freighterNavRect = { x: 94, y: 124, w: 64, h: 44 };

    // Rechtes Terminal: WARENBÖRSE & FRACHTHANDEL
    ctx.fillStyle = '#140c06';
    ctx.fillRect(166, 124, 64, 44);
    ctx.strokeStyle = '#ffaa33';
    ctx.strokeRect(166, 124, 64, 44);
    ctx.fillStyle = '#ffaa33';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('WARENBÖRSE', 198, 136);
    ctx.font = '4px monospace';
    ctx.fillStyle = '#ffcc88';
    const usedCargo = SW.CarrierEconomy ? SW.CarrierEconomy.getCargoUsed() : 0;
    const maxCargo = SW.CarrierEconomy ? SW.CarrierEconomy.getCargoMax() : 60;
    ctx.fillText('Fracht: ' + usedCargo + '/' + maxCargo + ' t', 198, 148);
    ctx.fillText('[KLICK: HANDELN]', 198, 158);
    this._freighterMarketRect = { x: 166, y: 124, w: 64, h: 44 };

    // Rechte Konsole: FLUGSTART & TRÄGER-DOCKING
    ctx.fillStyle = '#221105';
    ctx.fillRect(238, 124, 58, 20);
    ctx.strokeStyle = '#ff5533';
    ctx.strokeRect(238, 124, 58, 20);
    ctx.fillStyle = '#ff8866';
    ctx.font = 'bold 4.5px monospace';
    ctx.fillText('ABFLIEGEN [ALL]', 267, 136);
    this._freighterLaunchRect = { x: 238, y: 124, w: 58, h: 20 };

    // Träger-Docking Button (nur im selben Sektor ansteuerbar!)
    const curSecId = (SW.World && SW.World.currentSectorId) || 's1';
    const carrierSecId = (SW.ArmadaMap && SW.ArmadaMap.carrierSectorId) || 's1';
    const carrierHere = curSecId === carrierSecId;
    ctx.fillStyle = carrierHere ? '#0a2214' : '#141822';
    ctx.fillRect(238, 148, 58, 20);
    ctx.strokeStyle = carrierHere ? '#00ff88' : '#556677';
    ctx.strokeRect(238, 148, 58, 20);
    ctx.fillStyle = carrierHere ? '#00ffaa' : '#8899aa';
    ctx.font = 'bold 4px monospace';
    if (carrierHere) {
      ctx.fillText('TRÄGER ANHEUERN', 267, 157);
      ctx.fillText('[WIEDEREINTRITT]', 267, 164);
    } else {
      ctx.fillText('TRÄGER IN ' + carrierSecId.toUpperCase(), 267, 157);
      ctx.fillText('[IN SEKTOR]', 267, 164);
    }
    this._freighterDockRect = { x: 238, y: 148, w: 58, h: 20 };
    ctx.textAlign = 'left';
  },

  artBeobachtung(ctx, room) {
    const sys = SW.World.systemInfo();
    ctx.fillStyle = '#010306';
    ctx.fillRect(20, 32, 280, 115);
    ctx.strokeStyle = sys.farbe || '#3366ff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 32, 280, 115);

    // Sterne im Fenster
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 45; i++) {
      ctx.fillRect(24 + (i * 23) % 272, 36 + (i * 17) % 106, 1, 1);
    }

    // Sektor-spezifische Astronomie & Planeten
    if (sys.id === 's1') {
      // Sektor 7: Azurblauer Planet mit Eisringen und Atmosphärenschleier
      ctx.fillStyle = '#1a5599';
      ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.arc(235, 75, 24, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#aaddff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(235, 75, 38, 8, -0.22, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      // Orbitale Fax-Relais-Station
      ctx.fillStyle = '#6688aa';
      ctx.fillRect(175, 52, 14, 3);
      ctx.fillRect(181, 46, 3, 15);
    } else if (sys.id === 's2') {
      // Sektor 9: Roter Gasriese mit Eisenoxid-Nebel
      ctx.fillStyle = '#aa3311';
      ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(230, 75, 26, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ff7733'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(230, 75, 42, 10, 0.15, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
      // Rote Nebelwolken
      ctx.fillStyle = 'rgba(255, 60, 20, 0.12)';
      ctx.fillRect(22, 34, 276, 111);
    } else {
      // Sektor 12 & andere: Grauer / Violetter Eis-Himmelskörper
      ctx.fillStyle = sys.farbe || '#667788';
      ctx.globalAlpha = 0.65;
      ctx.beginPath(); ctx.arc(235, 75, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(235, 75, 32, 6, -0.1, 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 1. Stationierter Träger neben dem Planeten (liegt ruhig im Orbit)
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      // Der Träger liegt friedlich bei x=72, y=70 vor Anker
      SW.Sprites.drawMultiAngle(ctx, 'fax_traegodie', 72, 70, 36, 0.35, 0.08, '#6688aa');
    }

    // 2. Organische Patrouille: Ein Jäger startet ab und zu, dreht eine Runde um den Planeten und landet wieder
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      // 40-Sekunden Zyklus für die Patrouillen-Runde
      const pPhase = (this._frame * 0.009) % (Math.PI * 2);
      // Orbitale Flugbahn
      const ppx = 150 + Math.cos(pPhase) * 65;
      const ppy = 75 + Math.sin(pPhase) * 22;
      const pyaw = pPhase + Math.PI / 2;
      SW.Sprites.drawMultiAngle(ctx, 'hornet', ppx, ppy, 20, pyaw, 0.05, '#88cc44');
    }

    // 3. Gelegentlicher ferner Frachter-Transit im Hintergrund
    if (SW.Sprites && SW.Sprites.drawMultiAngle) {
      const ffx = 30 + ((this._frame * 0.18) % 260);
      SW.Sprites.drawMultiAngle(ctx, 'freighter', ffx, 118, 20, 1.45, 0.05, '#886633');
    }

    // System-Label
    ctx.fillStyle = sys.farbe || '#44aaff';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(sys.name, 110, 52);
    ctx.fillStyle = '#888';
    ctx.font = '5px monospace';
    ctx.fillText(sys.char ? sys.char.substring(0, 38) : '', 110, 62);

    // Sektorkarte Button im Beobachtungsraum
    this._sectorMapRect = { x: 30, y: 126, w: 68, h: 14 };
    ctx.fillStyle = '#082032';
    ctx.fillRect(30, 126, 68, 14);
    ctx.strokeStyle = '#44aaff';
    ctx.strokeRect(30, 126, 68, 14);
    ctx.fillStyle = '#88ddff';
    ctx.font = 'bold 4px monospace';
    ctx.fillText('[K] SEKTORKARTE', 64, 135);
    ctx.textAlign = 'left';

    // Automata
    ctx.fillStyle = '#333'; ctx.fillRect(250, 120, 40, 25);
    ctx.fillStyle = '#0f0'; ctx.fillRect(255, 125, 15, 8);
    ctx.fillStyle = '#000'; ctx.font = '5px monospace'; ctx.fillText('50 PF', 272, 132);

    // Boden
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, SW.H - 25, SW.W, 25);
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
    // Wischmopp (rechts — interaktiv!)
    ctx.fillStyle='#886644'; ctx.fillRect(250,60,4,60); // Stiel
    ctx.fillStyle='#ccaa88'; ctx.fillRect(245,115,14,15); // Moppkopf
    this._moppRect = { x: 242, y: 58, w: 20, h: 74 };
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

  // ===== TÜR & AUFZUG RENDER =====
  renderDoors(ctx, room) {
    this._doorRects = [];
    if (room.id === 'frachter_bruecke') {
      // In der Frachterbrücke: Ausstiegsluke / Schleuse
      const dx = 8, dy = 60, dw = 36, dh = 55;
      ctx.fillStyle = '#1c160e'; ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = '#ff9933'; ctx.strokeRect(dx, dy, dw, dh);
      ctx.fillStyle = '#ff9933'; ctx.font = 'bold 4px monospace'; ctx.textAlign = 'center';
      ctx.fillText('LUKE', dx + dw / 2, dy + 11);
      ctx.fillStyle = '#ccc'; ctx.fillText('ALL', dx + dw / 2, dy + 22);
      ctx.textAlign = 'left';
      this._doorRects.push({ x: dx, y: dy, w: dw, h: dh, to: 'space_launch' });
      return;
    }
    if (room.id === 'player_quarters') {
      // Eigenes Quartier hat nur die Schotttür zurück zum Flur
      const dx = 8, dy = 60, dw = 36, dh = 55;
      ctx.fillStyle = '#0f1722'; ctx.fillRect(dx, dy, dw, dh);
      ctx.strokeStyle = room.akzent || '#00ccff'; ctx.strokeRect(dx, dy, dw, dh);
      ctx.fillStyle = '#aebdcc'; ctx.font = 'bold 4px monospace'; ctx.textAlign = 'center';
      ctx.fillText('FLUR', dx + dw / 2, dy + 11);
      ctx.fillText('QUARTIERE', dx + dw / 2, dy + 22);
      ctx.textAlign = 'left';
      this._doorRects.push({ x: dx, y: dy, w: dw, h: dh, to: 'quartiere' });
      return;
    }

    // Für Träger-Räume: WC3-Stil Deck-Aufzug im Bulkhead links
    const liftX = 8, liftY = 60, liftW = 38, liftH = 55;
    ctx.fillStyle = 'rgba(8, 14, 22, 0.95)';
    ctx.fillRect(liftX, liftY, liftW, liftH);
    ctx.strokeStyle = '#5a7896';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(liftX, liftY, liftW, liftH);

    // Aufzugs-Anzeige oben (illuminierte Deck-Ziffern)
    ctx.fillStyle = '#050a10';
    ctx.fillRect(liftX + 3, liftY + 3, liftW - 6, 12);
    ctx.fillStyle = room.akzent || '#ffcc00';
    ctx.font = 'bold 5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LIFT D' + (room.deck || 1), liftX + liftW / 2, liftY + 11);

    // Vertikaler Schiebetür-Spalt
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(liftX + liftW / 2, liftY + 16);
    ctx.lineTo(liftX + liftW / 2, liftY + liftH - 2);
    ctx.stroke();

    // Beleuchteter Ruftaster / Bedienfeld
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(liftX + liftW - 8, liftY + 26, 5, 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(liftX + liftW - 7, liftY + 28, 3, 4);

    ctx.fillStyle = '#9fb3c6';
    ctx.font = '4px monospace';
    ctx.fillText('[AUFZUG]', liftX + liftW / 2 - 2, liftY + liftH - 6);
    ctx.textAlign = 'left';

    this._doorRects.push({ x: liftX, y: liftY, w: liftW, h: liftH, to: 'elevator' });

    // Wenn der Raum direkte Nachbar-Türen hat (z. B. Quartiere -> persönliches Pilotenzimmer)
    if (room.id === 'quartiere') {
      const qx = SW.W - 44, qy = 60, qw = 36, qh = 55;
      ctx.fillStyle = 'rgba(8, 14, 22, 0.95)';
      ctx.fillRect(qx, qy, qw, qh);
      ctx.strokeStyle = room.akzent || '#00ccff';
      ctx.strokeRect(qx, qy, qw, qh);
      ctx.fillStyle = '#aebdcc';
      ctx.font = 'bold 4px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('KABINE', qx + qw / 2, qy + 11);
      ctx.fillText('PILOT', qx + qw / 2, qy + 22);
      ctx.textAlign = 'left';
      this._doorRects.push({ x: qx, y: qy, w: qw, h: qh, to: 'player_quarters' });
    }
  },

  // ===== WC3-STIL TURBOLIFT / DECK-TRANSIT SCREEN (DECKPLAN IM AUFZUG) =====
  renderElevatorTransit(ctx, room) {
    this.renderCheatMap(ctx);
  },

  // ===== MINIMAP (WANDKARTE: KLEIN & SCHEMATISCH) =====
  renderMap(ctx, room) {
    const mx = SW.W - 56, my = 28, mw = 48, mh = 24;
    ctx.save();
    // Kleine, fest an der Wand montierte Träger-Plakette
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(mx + 2, my + 2, mw, mh);
    ctx.fillStyle = '#081018';
    ctx.fillRect(mx, my, mw, mh);
    ctx.strokeStyle = '#5a7288';
    ctx.lineWidth = 1;
    ctx.strokeRect(mx, my, mw, mh);

    // Stilisierte Träger-Keilform auf der Plakette
    ctx.fillStyle = 'rgba(25, 45, 68, 0.7)';
    ctx.beginPath();
    ctx.moveTo(mx + mw - 6, my + mh / 2); // Bug rechts
    ctx.lineTo(mx + 6, my + 4);           // Heck oben
    ctx.lineTo(mx + 6, my + mh - 4);      // Heck unten
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(90, 150, 210, 0.45)';
    ctx.stroke();

    // 3 Deckebenen im Keil
    ctx.strokeStyle = '#324a62';
    ctx.beginPath();
    ctx.moveTo(mx + 8, my + 8); ctx.lineTo(mx + mw - 14, my + 8);
    ctx.moveTo(mx + 8, my + 12); ctx.lineTo(mx + mw - 10, my + 12);
    ctx.moveTo(mx + 8, my + 16); ctx.lineTo(mx + mw - 14, my + 16);
    ctx.stroke();

    // Blinkende LED am aktuellen Standort ("SIE SIND HIER")
    const isBlink = Math.floor(Date.now() / 320) % 2 === 0;
    if (isBlink) {
      const ledX = mx + 10 + (room.deck === 1 ? 8 : (room.deck === 2 ? 16 : 24));
      const ledY = my + 6 + (room.deck - 1) * 4;
      ctx.fillStyle = '#ff2222';
      ctx.fillRect(ledX, ledY, 3, 3);
    }

    // Bewusst klein gehaltene Beschriftung (erst bei Klick lesbar)
    ctx.fillStyle = '#a8ccf0';
    ctx.font = '3.5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DECKPLAN [KLICK]', mx + mw / 2, my + mh - 2);
    ctx.textAlign = 'left';
    ctx.restore();

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

  renderNewspaperOverlay(ctx, room) {
    if (SW.Newspaper && !SW.Newspaper.currentIssue && SW.Newspaper.forceGenerate) {
      SW.Newspaper.forceGenerate();
    }
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, SW.W, SW.H);
    const px = 22, py = 18, pw = SW.W - 44, ph = SW.H - 36;
    ctx.fillStyle = '#e8e2d0';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#332b20';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
    ctx.lineWidth = 1;
    // Zeitungs-Header (Thermopapier / DIE TRÄGER-POST)
    ctx.fillStyle = '#181410';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    const issueDate = (SW.Newspaper && SW.Newspaper.currentIssue && SW.Newspaper.currentIssue.date) || 'TAG_001';
    ctx.fillText('DIE TRÄGER-POST — AUSGABE ' + issueDate, SW.CX, py + 12);
    ctx.fillStyle = '#554a3a';
    ctx.font = '4px monospace';
    ctx.fillText('AMTLICHES FAX-ORGAN DER TCS / VERTRIEB: ZWO (OHNE GEWÄHR)', SW.CX, py + 19);
    ctx.textAlign = 'left';
    ctx.strokeStyle = '#554a3a';
    ctx.beginPath(); ctx.moveTo(px + 8, py + 23); ctx.lineTo(px + pw - 8, py + 23); ctx.stroke();

    const articles = (SW.Newspaper && SW.Newspaper.currentIssue && SW.Newspaper.currentIssue.articles) || [];
    let ay = py + 32;
    for (let i = 0; i < Math.min(6, articles.length); i++) {
      const a = articles[i];
      ctx.fillStyle = a.type === 'subplot' ? '#551166' : (a.type === 'mission' ? '#004422' : '#221d16');
      ctx.font = 'bold 5px monospace';
      ctx.fillText('• ' + String(a.headline || '').substring(0, 68), px + 8, ay);
      ay += 12;
    }

    // Aktive Fax-Aufträge unten auf dem Blatt
    ctx.strokeStyle = '#887b66';
    ctx.beginPath(); ctx.moveTo(px + 8, py + ph - 44); ctx.lineTo(px + pw - 8, py + ph - 44); ctx.stroke();
    ctx.fillStyle = '#332211';
    ctx.font = 'bold 5px monospace';
    ctx.fillText('OFFENE FAX-AUFTRÄGE (QUEST-LOG):', px + 8, py + ph - 36);
    const qLines = (SW.Quests && SW.Quests.logText) ? SW.Quests.logText() : ['Keine offenen Aufträge.'];
    ctx.font = '4px monospace';
    for (let i = 0; i < Math.min(3, qLines.length); i++) {
      ctx.fillText(String(qLines[i]).substring(0, 72), px + 8, py + ph - 27 + i * 7);
    }

    ctx.fillStyle = '#665a48';
    ctx.font = '5px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[ KLICK / J / ESC: ZEITUNG WEGLEGEN ]', SW.CX, py + ph - 4);
    ctx.textAlign = 'left';
  },

  // ===== DIALOG BOX =====
  renderDialogue(ctx, room) {
    const line = this.dialogueLines[this.dialogueIndex];
    if (!line) return;
    const rawText = typeof line.text === 'string' ? line.text : String((line.text && line.text.text) || '');
    const displayText = this.typing ? rawText.substring(0, this.charIndex) : rawText;
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
    this._choiceRects = [];
    if (this.hasActiveChoices()) {
      const cBoxY = boxY - 34, cBoxH = 32;
      ctx.fillStyle = 'rgba(6,12,20,0.96)';
      ctx.fillRect(15, cBoxY, SW.W - 30, cBoxH);
      ctx.strokeStyle = '#ffcc00';
      ctx.lineWidth = 1;
      ctx.strokeRect(15, cBoxY, SW.W - 30, cBoxH);
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 5px monospace';
      ctx.fillText('ENTSCHEIDUNG TREFFEN [1/2 ODER KLICK]:', 21, cBoxY + 8);
      for (let i = 0; i < Math.min(2, line.choices.length); i++) {
        const ch = line.choices[i];
        const ry = cBoxY + 10 + i * 10;
        ctx.fillStyle = 'rgba(255,204,0,0.12)';
        ctx.fillRect(19, ry, SW.W - 38, 9);
        ctx.fillStyle = '#00ffcc';
        ctx.font = 'bold 5px monospace';
        ctx.fillText('[' + (i + 1) + '] ' + String(ch.label || '').substring(0, 72), 22, ry + 7);
        this._choiceRects.push({ x: 19, y: ry, w: SW.W - 38, h: 9, index: i });
      }
    }
    if (!this.typing) {
      const blink = Math.floor(this._frame/30)%2===0;
      const more = this.dialoguePage < this._dialoguePages-1;
      const waitingChoice = !more && this.hasActiveChoices();
      ctx.fillStyle = waitingChoice ? (blink ? '#ffcc00' : '#997700') : (blink ? '#fff' : '#666');
      ctx.font = '6px monospace';
      ctx.textAlign='right';
      const promptLabel = more
        ? ('[LEER: WEITER] '+(this.dialoguePage+1)+'/'+this._dialoguePages)
        : (waitingChoice ? '[1 / 2 WÄHLEN]' : '[LEER/KLICK: weiter]');
      ctx.fillText(promptLabel, SW.W-22, boxY+boxH-4);
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
    ctx.fillStyle = '#02050b';
    ctx.fillRect(0, 0, SW.W, SW.H);

    // Großes Träger-Rumpf Blaupausen-Profil (Keilform des Trägers TCS Fax-Tragödie / Hermes)
    ctx.save();
    ctx.strokeStyle = 'rgba(65, 125, 185, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Träger-Silhouette: Bug vorne (Mitte oben), breite Flugdeck-Flanken, Heck mit Triebwerken
    ctx.moveTo(SW.CX, 10);              // Bug-Spitze
    ctx.lineTo(SW.W - 10, 48);          // Steuerbord-Schulter
    ctx.lineTo(SW.W - 8, SW.H - 24);    // Steuerbord-Heck
    ctx.lineTo(SW.CX + 40, SW.H - 18);  // Triebwerks-Bucht rechts
    ctx.lineTo(SW.CX - 40, SW.H - 18);  // Triebwerks-Bucht links
    ctx.lineTo(8, SW.H - 24);           // Backbord-Heck
    ctx.lineTo(10, 48);                 // Backbord-Schulter
    ctx.closePath();
    ctx.fillStyle = 'rgba(10, 22, 36, 0.65)';
    ctx.fill();
    ctx.stroke();

    // Blaupausen-Gitter im Rumpf
    ctx.strokeStyle = 'rgba(40, 85, 130, 0.18)';
    ctx.lineWidth = 1;
    for (let gx = 20; gx < SW.W - 20; gx += 30) {
      ctx.beginPath(); ctx.moveTo(gx, 25); ctx.lineTo(gx, SW.H - 22); ctx.stroke();
    }
    for (let gy = 25; gy < SW.H - 20; gy += 25) {
      ctx.beginPath(); ctx.moveTo(15, gy); ctx.lineTo(SW.W - 15, gy); ctx.stroke();
    }
    ctx.restore();

    // Titel
    const curPosting = SW.Transfers.getCurrentPosting();
    ctx.fillStyle = '#b8d8ff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText((curPosting.name || 'TCS FAX-TRAGÖDIE') + ' — DECKPLÄNE & RUMPFSCHEMA', SW.CX, 13);
    ctx.textAlign = 'left';

    // Drei Deckbänder mit verbundenen Aufzugsschächten.
    this._cheatMapRects = [];
    const panelX = 14, panelW = SW.W - 28;
    const cardX = 17, cardGap = 3, cardW = 55, cardH = 32;
    for (let deck = 1; deck <= 3; deck++) {
      const top = 18 + (deck - 1) * 57;
      const rooms = SW.Rooms.filter(r => r.deck === deck && SW.Transfers.canVisit(r.id));
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
