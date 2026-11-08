// ===== SOLO WING 1990 — HOLO-CHAT & SPACE-IRC (MIT NOTFALL-FAX FALLBACK) =====
// Snappy Wing-Commander-Terminal in der Pilotenkabine / auf der TCS Fax-Tragödie:
// - Kanäle (#staffel-7, #flotten-intel, #technik) mit Wechsel per [TAB] oder [1]/[2]/[3]
// - Echte Crew der TCS Fax-Tragödie (Sechs, Neun, Zwo, Bolt, Diskettens, Commander, Pflaster)
// - NOTFALL-FAX FALLBACK [F]: Alien-/Audit-Jamming löst analoges 90er-Jahre-Fax aus!

'use strict';

window.SW1990 = window.SW1990 || {};

SW.HoloChat = {
  active: false,
  channel: '#staffel-7',
  nickname: 'Flug_Drei',
  inputText: '',
  blinkTimer: 0,
  scrollOffset: 0,
  jammed: false,

  channels: ['#staffel-7', '#flotten-intel', '#technik'],

  history: {
    '#staffel-7': [
      { sender: 'Sechs', text: 'Verbindung steht mit 9600 Baud. Wer hat schon wieder die Kaffeekanne in der Bar leer gemacht?', time: '08:14' },
      { sender: 'Neun', text: 'Sektor 9 riecht nach verbranntem Kupfer. Meine Scimitar zieht leicht nach links.', time: '08:16' },
      { sender: 'Zwo', text: 'Habe Formular 83-B unterschrieben, ohne Anhang C zu lesen. Lebe noch.', time: '08:19' },
      { sender: 'Vier', text: 'Kiste 47 hat angedockt. Kältekammer 7 atmet ruhig (2/min).', time: '08:22' },
      { sender: 'Barkeep', text: 'Synthehol-Lieferung aus Station Gemma 4 eingetroffen. Erste Runde geht aufs Haus.', time: '08:25' }
    ],
    '#flotten-intel': [
      { sender: 'Commander', text: 'PRIORITÄT: Piraten-Vorhut und unbekannte Dralthi-Silhouetten in Sektor 7 & 9 gemeldet.', time: '07:50' },
      { sender: 'Das_Audit', text: 'HINWEIS: Die TCS Fax-Tragödie weist eine Papier-Ineffizienz von 14,2% auf. Prüfer unterwegs.', time: '08:02' },
      { sender: 'Commander', text: 'WARNUNG: Subraum-Jamming in Sektor 12. Bei Störung sofort auf analoges Thermopapier-Fax [F] wechseln!', time: '08:28' }
    ],
    '#technik': [
      { sender: 'Diskettens', text: 'Zwei 5,25-Zoll-Disketten ins Nav-Terminal gesteckt. Wenn Laufwerk A: rattert, NICHT ausschalten!', time: '06:30' },
      { sender: 'Bolt', text: 'Der Hangar-Kran läuft wieder. Wer Kaffeeflecken auf meine Hornet-Panzerung macht, putzt das Katapultrohr.', time: '07:11' }
    ]
  },

  init() {
    this.loadState();
  },

  loadState() {
    try {
      const saved = localStorage.getItem('sw_holochat_nick');
      if (saved) this.nickname = saved;
    } catch (e) {}
  },

  open() {
    this.active = true;
    if (SW.World && SW.World.pilotName) {
      this.nickname = String(SW.World.pilotName).replace(/\s+/g, '_');
    }
    if (SW.Audio && typeof SW.Audio.playBeep === 'function') {
      SW.Audio.playBeep(880, 0.08);
    }
  },

  close() {
    this.active = false;
    if (SW.Audio && typeof SW.Audio.playBeep === 'function') {
      SW.Audio.playBeep(440, 0.06);
    }
  },

  switchChannel(ch) {
    if (this.channels.includes(ch)) {
      this.channel = ch;
      this.scrollOffset = 0;
      if (SW.Audio && typeof SW.Audio.playBeep === 'function') {
        SW.Audio.playBeep(660, 0.05);
      }
    }
  },

  sendMessage(msg) {
    const text = (msg || this.inputText).trim();
    if (!text) return;

    if (!this.history[this.channel]) this.history[this.channel] = [];
    this.history[this.channel].push({
      sender: this.nickname,
      text: text,
      time: new Date().toTimeString().slice(0, 5)
    });
    this.inputText = '';

    if (SW.Audio && typeof SW.Audio.playBeep === 'function') {
      SW.Audio.playBeep(1040, 0.04);
    }

    this.simulateCrewResponse(text);
  },

  simulateCrewResponse(userText) {
    const lower = userText.toLowerCase();
    setTimeout(() => {
      let reply = null;
      if (lower.includes('fax') || lower.includes('jam') || lower.includes('störung')) {
        reply = { sender: 'Diskettens', text: 'Wenn die Leitung wackelt, drück [F] für Thermopapier-Fax! Das Audit kann kein CCITT Gruppe 3 dekodieren.', ch: '#technik' };
      } else if (lower.includes('rep') || lower.includes('schaden') || lower.includes('bolt')) {
        reply = { sender: 'Bolt', text: 'Bring die Mühle in den Hangar oder drück [S]. Ersatzteile hab ich noch in Kiste 12.', ch: '#technik' };
      } else if (lower.includes('angriff') || lower.includes('feind') || lower.includes('mission')) {
        reply = { sender: 'Commander', text: 'Alle Rotten für Katapultstart bereitmachen! Sektorkarte mit [K] prüfen!', ch: '#flotten-intel' };
      } else {
        reply = { sender: 'Sechs', text: 'Verstanden, ' + this.nickname + '. Wir sehen uns in der Bar oder draußen im Sektor.', ch: this.channel };
      }
      if (reply && this.history[reply.ch]) {
        this.history[reply.ch].push({
          sender: reply.sender,
          text: reply.text,
          time: new Date().toTimeString().slice(0, 5)
        });
        if (this.active && SW.Audio && typeof SW.Audio.playBeep === 'function') {
          SW.Audio.playBeep(1200, 0.08);
        }
      }
    }, 650);
  },

  triggerEmergencyFax() {
    this.jammed = true;
    if (SW.Audio && typeof SW.Audio.playFax === 'function') {
      SW.Audio.playFax();
    }
    if (SW.Fax && typeof SW.Fax.push === 'function') {
      SW.Fax.push('NOTFALL-FAX 9600 BAUD', 'Subraum-Jamming umgangen: Analoge Thermopapier-Leitung steht.');
    }
    if (!this.history[this.channel]) this.history[this.channel] = [];
    this.history[this.channel].push({
      sender: 'NOTFALL_FAX',
      text: '[THERMOPAPIER-DRUCK] Jamming durch 9600-Baud-Analogprotokoll umgangen! Formular 91-F bestätigt.',
      time: new Date().toTimeString().slice(0, 5)
    });
  },

  handleKeyDown(e) {
    if (!this.active) return false;
    if (e.key === 'Escape') {
      this.close();
      return true;
    }
    if (e.key === 'Tab') {
      const idx = this.channels.indexOf(this.channel);
      this.switchChannel(this.channels[(idx + 1) % this.channels.length]);
      return true;
    }
    if ((e.key === 'f' || e.key === 'F') && this.inputText.length === 0) {
      this.triggerEmergencyFax();
      return true;
    }
    if (e.key === 'Enter') {
      this.sendMessage();
      return true;
    }
    if (e.key === 'Backspace') {
      this.inputText = this.inputText.slice(0, -1);
      return true;
    }
    if (e.key.length === 1 && this.inputText.length < 48) {
      this.inputText += e.key;
      return true;
    }
    return false;
  },

  render(ctx) {
    if (!this.active) return;

    ctx.save();
    // Wichtig: Native 640x400 Koordinaten wiederherstellen (statt 2x Skalierung über den Rand hinaus!)
    if (ctx.setTransform) ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Halbtransparenter Hintergrund
    ctx.fillStyle = 'rgba(10, 15, 25, 0.96)';
    ctx.fillRect(40, 25, 560, 350);

    // Bevelled Border
    ctx.strokeStyle = '#3366aa';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 25, 560, 350);
    ctx.strokeStyle = '#5599ff';
    ctx.strokeRect(43, 28, 554, 344);

    // Header Bar
    ctx.fillStyle = '#182b48';
    ctx.fillRect(44, 29, 552, 26);
    ctx.fillStyle = '#88ccff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SPACE-IRC // TCS FAX-TRAGÖDIE HOLO-TERMINAL v1.99', 54, 46);

    ctx.fillStyle = '#ffaa44';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('[TAB] KANAL  |  [F] NOTFALL-FAX  |  [ESC] SCHLIESSEN', 585, 46);

    // Linke Spalte: Kanäle & Nickname
    ctx.fillStyle = '#0f1a2c';
    ctx.fillRect(44, 56, 130, 275);
    ctx.strokeStyle = '#224477';
    ctx.strokeRect(44, 56, 130, 275);

    ctx.fillStyle = '#88aacc';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('KANÄLE [TAB]:', 52, 72);

    this.channels.forEach((ch, idx) => {
      const y = 92 + idx * 24;
      const isSel = ch === this.channel;
      if (isSel) {
        ctx.fillStyle = '#225599';
        ctx.fillRect(48, y - 12, 122, 18);
        ctx.fillStyle = '#ffffff';
      } else {
        ctx.fillStyle = '#6688aa';
      }
      ctx.font = '10px monospace';
      ctx.fillText(ch, 54, y);
    });

    // Pilot Identity Box
    ctx.fillStyle = '#142238';
    ctx.fillRect(48, 240, 122, 82);
    ctx.strokeStyle = '#335588';
    ctx.strokeRect(48, 240, 122, 82);
    ctx.fillStyle = '#88bbdd';
    ctx.font = '8px monospace';
    ctx.fillText('PILOT STATUS:', 54, 254);
    ctx.fillStyle = '#44ff88';
    ctx.fillText(this.nickname, 54, 268);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Modem: 9600 Baud', 54, 282);
    ctx.fillText('Fax-Fallback: AKTIV', 54, 296);
    ctx.fillStyle = '#ffcc44';
    ctx.fillText((SW.CarrierEconomy && SW.CarrierEconomy.getSummary().rankShort) || 'RANG: GEFREITER', 54, 312);

    // Rechtes Nachrichten-Fenster
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(178, 56, 418, 275);
    ctx.strokeStyle = '#224477';
    ctx.strokeRect(178, 56, 418, 275);

    // Nachrichten rendern
    const msgs = this.history[this.channel] || [];
    const maxVisible = 10;
    const slice = msgs.slice(-maxVisible);
    slice.forEach((m, i) => {
      const my = 76 + i * 24;
      ctx.fillStyle = '#4477aa';
      ctx.font = '8.5px monospace';
      ctx.fillText('[' + m.time + ']', 184, my);

      ctx.fillStyle = m.sender === this.nickname ? '#44ff88' : m.sender.includes('Audit') ? '#ff4444' : '#ffbb44';
      ctx.font = 'bold 8.5px monospace';
      ctx.fillText('<' + m.sender.substring(0, 11) + '>', 226, my);

      ctx.fillStyle = '#dddddd';
      ctx.font = '8.5px monospace';
      ctx.fillText(String(m.text).substring(0, 48), 305, my);
    });

    // Eingabe-Leiste unten
    ctx.fillStyle = '#101c30';
    ctx.fillRect(44, 334, 552, 36);
    ctx.strokeStyle = '#3366aa';
    ctx.strokeRect(44, 334, 552, 36);

    ctx.fillStyle = '#44ff88';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('[' + this.nickname + ']>', 54, 356);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(this.inputText, 155, 356);

    this.blinkTimer = (this.blinkTimer + 1) % 40;
    if (this.blinkTimer < 20) {
      const textW = ctx.measureText ? ctx.measureText(this.inputText).width : (this.inputText.length * 6);
      ctx.fillStyle = '#44ff88';
      ctx.fillRect(157 + textW, 345, 7, 13);
    }

    ctx.restore();
  }
};

if (typeof window !== 'undefined') {
  SW.HoloChat.init();
}
