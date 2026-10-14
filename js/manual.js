// ===== SOLO WING 1990 — INGAME HANDBUCH (v0.75-dev) =====
// Taste [H] = öffnen/schließen | [ESC] = schließen | [Pfeile] = Kapitel
// Nur in erlaubten States. Kein globaler Event-Listener.
// CRT-Bernstein-Optik, 80er/90er Militär-Style.

SW.Manual = {
  isOpen: false,
  currentChapter: 0,
  _allowedStates: ['MENU','COCKPIT','SHIP','BAR','HANGAR','DEBRIEFING','BRIEFING_BOARD'],
  chapters: [
    { id:'intro', title:'EINFÜHRUNG', subtitle:'Willkommen im Sternenkorps', lockedBy:null,
      content:['Willkommen, Rekrut.','Du hast gerade deinen Dienst im Sternenkorps angetreten.','','Dieses Handbuch begleitet dich durch deine','Karriere — von der Akademie bis zum ersten Einsatz.','','WICHTIG: Dieses Dokument ist MITTELKLASSE.','Formular 12-B erforderlich.','Unbefugtes Weitergeben wird mit sofortiger','Entlassung geahndet.','','— Sternenkorps, Sektor 7, Jahr 1990'],
      quote:'"Der erste Tag ist der längste. Der letzte auch." — Commander' },
    { id:'controls', title:'STEUERUNG', subtitle:'Flugmanöver & Systeme', lockedBy:null,
      content:['FLUGSTEUERUNG:','  W/A/S/D    Schiff bewegen','  SHIFT      Nachbrenner (Vorschub hoch)','','  Maus       Zielen','  LEERTASTE  Schießen','  Q/E        Rollen (Banken)','','SYSTEME:','  T          Autopilot (NAV-Punkte)','  N          Nav-Karte öffnen','  V          Ansicht: Cockpit/Verfolgung/Top-Down','  I          Informations-Panel','  H          Handbuch öffnen/schließen','  ESC        Menü / Zurück','','GAMEPAD:','  Links-Stick    Bewegen','  Rechts-Stick   Zielen','  A/X          Schießen','  B/O          Rollen'],
      quote:'"Wenn du nicht rollen kannst, bist du ein Ziel." — Vier' },
    { id:'cockpit', title:'COCKPIT', subtitle:'Instrumente & Anzeigen', lockedBy:null,
      content:['RADAR (mittig): Gegner rot, Wegpunkte blau.','Schild und Tempo stehen links im Panel.','Zielname, Entfernung und Trefferpunkte: rechts.','Systemwerte: E Antrieb, W Waffen,','S Schilde, R Sensoren.'],
      quote:'"Das Cockpit lügt nie. Manchmal verschweigt es." — Bolt' },
    { id:'combat', title:'KAMPF', subtitle:'Taktiken & Waffen', lockedBy:null,
      content:['WAFFE: Leertaste oder Mausklick feuert Laser.','Mehrere Eingabegeräte können zusätzliche','Laser-Slots aktivieren (maximal drei).','','Bewege dich, um gegnerischen Schüssen','nicht als ruhendes Ziel entgegenzusehen.','Treffer können Schiffssysteme beschädigen.','Bolt repariert nach der Landung im Hangar.'],
      quote:'"Wer zuerst schießt, lebt länger." — Unbekannter Pilot' },
    { id:'missions', title:'MISSIONEN', subtitle:'Aufträge & Belohnungen', lockedBy:'m1_complete',
      content:['ABLAUF:','  1. Einsatz an der Briefing-Tafel wählen.','  2. Briefing und Start im Flugdeck.','  3. Wegpunkte und Auftrag abfliegen.','  4. Zurück zum Träger und landen.','  5. Debriefing; Sieg führt zum Abspann.'],
      quote:'"Jede Mission hat einen Preis." — Barkeep' },
    { id:'crew', title:'CREW', subtitle:'NPCs & Beziehungen', lockedBy:'m2_complete',
      content:['HAUPTCREW:','  COMMANDER  Einsatzleitung','  SECHS      Navigation, Sarkasmus','  NEUN       Medizin, Angst','  ZWO        Technik, Professional','  VIER       Logistik, Optimismus','','SPEZIALISTEN:','  BOLT         Maschinenraum','  PFLASTER     Medizin, Sorge','  DISKETTENS   Computer','  KLO          Reinigung','','INTERAKTION:','  Klicke NPCs für Dialoge','  Reagiert auf Missionen'],
      quote:'"Wir sind keine Familie. Wir sind ein Schiff." — Neun' },
    { id:'flight', title:'FLIEGEN', subtitle:'Vorschub, Navigation & Rückkehr', lockedBy:null,
      content:['VORSCHUB: SHIFT = Nachbrenner.','WASD oder Pfeile steuern den Drift;','Maus zielt, Leertaste feuert.','NAVIGATION: T schaltet den Autopiloten','zu den Missionspunkten ein/aus. N zeigt','Route und Entfernung zum nächsten Punkt.','SCHADEN: Systeme verschlechtern sich','durch Treffer. Rückkehr zum Träger:','Bolt repariert im Hangar mit [R].','Reparatur überspringen? Schaden bleibt.'],
      quote:'"Geradeaus ist auch eine Richtung." — Sechs' }
  ],
  open() {
    if (!this._allowedStates.includes(SW.Game.state)) return;
    this.isOpen = true; this.currentChapter = 0; this._checkLocks();
  },
  close() { this.isOpen = false; this.currentChapter = 0; },
  next() {
    if (this.currentChapter < this.chapters.length - 1 && !this.chapters[this.currentChapter+1]._locked) {
      this.currentChapter++;
    }
  },
  prev() { if (this.currentChapter > 0) this.currentChapter--; },
  _checkLocks() {
    const p = (SW.World && SW.World.missionProgress) || {};
    for (const ch of this.chapters) {
      if (ch.lockedBy === 'm1_complete') ch._locked = p.m1 !== 'sieg';
      else if (ch.lockedBy === 'm2_complete') ch._locked = p.m2 !== 'sieg';
      else ch._locked = false;
    }
  },
  render(ctx) {
    if (!this.isOpen) return;
    const W=SW.W, H=SW.H, mx=8, my=8, mw=W-16, mh=H-16;
    ctx.fillStyle='rgba(10,10,5,0.95)'; ctx.fillRect(mx,my,mw,mh);
    ctx.strokeStyle='#8b8500'; ctx.lineWidth=1; ctx.strokeRect(mx,my,mw,mh);
    ctx.strokeStyle='#555533'; ctx.strokeRect(mx+3,my+3,mw-6,mh-6);
    ctx.fillStyle='#8b8500'; ctx.font='bold 8px "Courier New",monospace'; ctx.textAlign='left';
    ctx.fillText('STERNENKORPS — FLUGHANDBUCH', mx+8, my+12);
    ctx.fillStyle='#555533'; ctx.font='5px "Courier New",monospace';
    ctx.fillText('Formular 12-B | MITTELKLASSE | Sektor 7, 1990', mx+8, my+20);
    ctx.strokeStyle='#8b8500'; ctx.lineWidth=1; ctx.beginPath();
    ctx.moveTo(mx+7,my+25); ctx.lineTo(mx+mw-7,my+25); ctx.stroke();
    const ch=this.chapters[this.currentChapter]; if(!ch) return;
    ctx.fillStyle=ch._locked?'#555533':'#8b8500'; ctx.font='bold 7px "Courier New",monospace';
    ctx.fillText(String(this.currentChapter+1).padStart(2,'0')+'. '+ch.title, mx+8, my+35);
    ctx.fillStyle='#555533'; ctx.font='5px "Courier New",monospace';
    ctx.fillText(ch.subtitle||'', mx+8, my+42);
    const cy=my+52;
    if(ch._locked) {
      ctx.fillStyle='#553300'; ctx.font='bold 7px "Courier New",monospace';
      ctx.fillText('ZUGRIFF VERWEIGERT', mx+8, cy+8);
      ctx.fillStyle='#555533'; ctx.font='6px "Courier New",monospace';
      ctx.fillText('Erreiche die erforderliche Mission.', mx+8, cy+19);
    } else {
      ctx.fillStyle='#8b8500'; ctx.font='6px "Courier New",monospace';
      let y=cy; const maxL=Math.floor((mh-70)/8);
      for(let i=0;i<ch.content.length && i<maxL;i++){
        const ln=ch.content[i]; if(ln===''){y+=4;continue;}
        ctx.fillText(ln, mx+8, y); y+=8;
      }
      if(ch.quote){ ctx.fillStyle='#555533'; ctx.font='italic 5px "Courier New",monospace';
        ctx.fillText(ch.quote, mx+8, my+mh-12); }
    }
    ctx.fillStyle='#555533'; ctx.font='5px "Courier New",monospace'; ctx.textAlign='right';
    ctx.fillText('[←/→: KAPITEL] [H/ESC: SCHLIESSEN]', mx+mw-8, my+mh-5);
    ctx.textAlign='left';
    ctx.fillStyle='rgba(0,0,0,0.03)';
    for(let sy=my;sy<my+mh;sy+=4) ctx.fillRect(mx,sy,mw,1);
  }
};