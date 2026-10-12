// ===== SOLO WING 1990 — INGAME HANDBUCH (v0.6.9) =====
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
      content:['FLUGSTEUERUNG:','  W/A/S/D    Schiff bewegen','  Maus       Zielen','  LEERTASTE  Schießen','  Q/E        Rollen (Banken)','','SYSTEME:','  N          Nav-Karte öffnen','  V          Ansicht: Cockpit/Verfolgung/Top-Down','  I          Informations-Panel','  H          Handbuch öffnen/schließen','  ESC        Menü / Zurück','','GAMEPAD:','  Links-Stick    Bewegen','  Rechts-Stick   Zielen','  A/X          Schießen','  B/O          Rollen'],
      quote:'"Wenn du nicht rollen kannst, bist du ein Ziel." — Vier' },
    { id:'cockpit', title:'COCKPIT', subtitle:'Instrumente & Anzeigen', lockedBy:null,
      content:['RADAR (oben links):','  Grüne Punkte  Verbündete','  Rote Punkte   Gegner','  Weiße Punkte  Neutral','','SCHILDANZEIGE (Mitte):','  [====]  Vollständig','  [==--]  Beschädigt','  [----]  Kritisch!','','ZIELSYSTEM (rechts):','  Ziel, Distanz, Geschwindigkeit','','WAFFEN (unten):','  Laser 1-3  Verfügbarkeit','  Energie    Balken links'],
      quote:'"Das Cockpit lügt nie. Manchmal verschweigt es." — Bolt' },
    { id:'combat', title:'KAMPF', subtitle:'Taktiken & Waffen', lockedBy:null,
      content:['WAFFENSYSTEME:','  Laser    Standard, unbegrenzt','  Missile  Begrenzt, hoher Schaden','  Plasma   Langsam, Area Damage','','TAKTIKEN:','  1. Distanz zu stärkeren Gegnern','  2. Rolle (Q/E) um Schüsse','  3. Planeten als Deckung','  4. Zuerst schwache Schilde','','SCHILDE:','  Regenerieren nach 3s ohne Treffer','  Unter 30%: Sofort reparieren!'],
      quote:'"Wer zuerst schießt, lebt länger." — Unbekannter Pilot' },
    { id:'missions', title:'MISSIONEN', subtitle:'Aufträge & Belohnungen', lockedBy:'m1_complete',
      content:['MISSIONSTYPEN:','  HAUPT  Story-relevant (m1–m4)','  SEITE  Optional, Belohnung','  HIDDEN Nur durch Entdecken','','ABLAUF:','  1. Briefing (Einsatzleiter-Raum)','  2. JUMP zum Ziel-System','  3. Einsatz durchführen','  4. Debriefing nach Rückkehr','','BELOHNUNGEN:','  Sieg: Credits + Reputation','  Tod:  Game Over, Neustart'],
      quote:'"Jede Mission hat einen Preis." — Barkeep' },
    { id:'crew', title:'CREW', subtitle:'NPCs & Beziehungen', lockedBy:'m2_complete',
      content:['HAUPTCREW:','  COMMANDER  Einsatzleitung','  SECHS      Navigation, Sarkasmus','  NEUN       Medizin, Angst','  ZWO        Technik, Professional','  VIER       Logistik, Optimismus','','SPEZIALISTEN:','  BOLT         Maschinenraum','  PFLASTER     Medizin, Sorge','  DISKETTENS   Computer','  KLO          Reinigung','','INTERAKTION:','  Klicke NPCs für Dialoge','  Reagiert auf Missionen'],
      quote:'"Wir sind keine Familie. Wir sind ein Schiff." — Neun' }
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
    const W=SW.W, H=SW.H, mx=30, my=30, mw=W-60, mh=H-60;
    ctx.fillStyle='rgba(10,10,5,0.95)'; ctx.fillRect(mx,my,mw,mh);
    ctx.strokeStyle='#8b8500'; ctx.lineWidth=2; ctx.strokeRect(mx,my,mw,mh);
    ctx.strokeStyle='#555533'; ctx.lineWidth=1; ctx.strokeRect(mx+4,my+4,mw-8,mh-8);
    ctx.fillStyle='#8b8500'; ctx.font='bold 14px "Courier New",monospace'; ctx.textAlign='left';
    ctx.fillText('STERNENKORPS — FLUGHANDBUCH', mx+15, my+28);
    ctx.fillStyle='#555533'; ctx.font='8px "Courier New",monospace';
    ctx.fillText('Formular 12-B | MITTELKLASSE | Sektor 7, 1990', mx+15, my+40);
    ctx.strokeStyle='#8b8500'; ctx.lineWidth=1; ctx.beginPath();
    ctx.moveTo(mx+10,my+48); ctx.lineTo(mx+mw-10,my+48); ctx.stroke();
    const ch=this.chapters[this.currentChapter]; if(!ch) return;
    ctx.fillStyle=ch._locked?'#555533':'#8b8500'; ctx.font='bold 11px "Courier New",monospace';
    ctx.fillText(ch.title, mx+15, my+68);
    ctx.fillStyle='#555533'; ctx.font='9px "Courier New",monospace';
    ctx.fillText(ch.subtitle||'', mx+15, my+82);
    const cy=my+100;
    if(ch._locked) {
      ctx.fillStyle='#553300'; ctx.font='bold 10px "Courier New",monospace';
      ctx.fillText('ZUGRIFF VERWEIGERT', mx+15, cy+20);
      ctx.fillStyle='#555533'; ctx.font='9px "Courier New",monospace';
      ctx.fillText('Noch nicht freigeschaltet.', mx+15, cy+40);
      ctx.fillText('Erreiche die erforderliche Mission.', mx+15, cy+54);
    } else {
      ctx.fillStyle='#8b8500'; ctx.font='9px "Courier New",monospace';
      let y=cy; const maxL=Math.floor((mh-160)/14);
      for(let i=0;i<ch.content.length && i<maxL;i++){
        const ln=ch.content[i]; if(ln===''){y+=6;continue;}
        ctx.fillText(ln, mx+15, y); y+=14;
      }
      if(ch.quote){ ctx.fillStyle='#555533'; ctx.font='italic 8px "Courier New",monospace';
        ctx.fillText(ch.quote, mx+15, my+mh-50); }
    }
    ctx.fillStyle='#333320'; ctx.fillRect(mx+8,my+56,6,mh-80);
    for(let i=0;i<this.chapters.length;i++){
      const c2=this.chapters[i], ny=my+60+i*20;
      ctx.fillStyle=c2._locked?'#333320':(i===this.currentChapter?'#8b8500':'#555533');
      ctx.fillRect(mx+10,ny,3,12);
      ctx.fillStyle=c2._locked?'#333320':'#555533'; ctx.font='7px "Courier New",monospace';
      ctx.fillText(String(i+1).padStart(2,'0'), mx+16, ny+9);
    }
    ctx.fillStyle='#555533'; ctx.font='8px "Courier New",monospace'; ctx.textAlign='right';
    ctx.fillText('[←/→: KAPITEL] [H/ESC: SCHLIESSEN]', mx+mw-15, my+mh-10);
    ctx.textAlign='left';
    ctx.fillStyle='rgba(0,0,0,0.03)';
    for(let sy=my;sy<my+mh;sy+=4) ctx.fillRect(mx,sy,mw,1);
  }
};