// ===== SOLO WING 1990 — QUEST SYSTEM =====
// Quests sind ein OVERLAY. Kein neuer State. Kein DOM.
// Reine Logik: tick(event) → complete(id) → reward.
// UI-Feedback über Hooks: onNewQuest, onReward.

'use strict';

SW.Quests = {
  list: [],
  active: [],
  completed: [],
  flags: {},
  onNewQuest: null,  // ui.js: Fax-Drucker
  onReward: null,    // ui.js: Fax-Drucker

  init() {
    if (this.list.length) return;
    this.list = (SW.QuestData?.quests || []).slice();
  },

  get(id) { return this.list.find(q => q.id === id) || null; },

  status(id) {
    if (this.completed.indexOf(id) !== -1) return 'completed';
    if (this.active.indexOf(id) !== -1) return 'active';
    return 'available';
  },

  setFlag(name, value) {
    this.flags[name] = !!value;
    if (name === 'kaltkammer_gesichert' && value && SW.SmartDialogues) {
      SW.SmartDialogues.setStage('alien', 3);
    }
    // Quest-Tick bei Flag-Änderung
    this.tick({ typ: 'flag', name: name });
  },

  getFlag(name) { return !!this.flags[name]; },

  start(id) {
    this.init();
    const q = this.get(id);
    if (!q) return;
    if (this.status(id) !== 'available') return;
    this.active.push(id);
    if (SW.TTS) SW.TTS.speak(q.fax, q.npc);
    if (this.onNewQuest) this.onNewQuest(q);
  },

  complete(id) {
    const q = this.get(id);
    if (!q || this.status(id) !== 'active') return;
    this.active.splice(this.active.indexOf(id), 1);
    this.completed.push(id);
    const r = q.belohnung || {};
    if (r.flag) this.setFlag(r.flag, true);
    if (SW.TTS) SW.TTS.speak(r.text, q.npc);
    if (this.onReward) this.onReward(q);
  },

  // Event-Entry-Point. Wird aufgerufen bei:
  // - Raum betreten: tick({typ:'raum', raum:id})
  // - Flag gesetzt: tick({typ:'flag', name})
  // - Mission beendet: tick({typ:'mission', ergebnis})
  tick(event) {
    this.init();
    const snapshot = this.active.slice();
    for (let i = 0; i < snapshot.length; i++) {
      const q = this.get(snapshot[i]);
      if (!q) continue;
      const conds = Array.isArray(q.bedingung) ? q.bedingung : [q.bedingung];
      const done = conds.every(c => this._check(c, event));
      if (done) this.complete(snapshot[i]);
    }
  },

  // Flug-Events (aus entities.js / systems.js / states.js) an SmartDialogues
  // und Subplot-Stufen weiterleiten.
  flight(ev) {
    this.init();
    if (!ev || !ev.typ) return;
    if (ev.typ === 'kill') {
      if (!this.getFlag('first_kill_logged')) {
        this.setFlag('first_kill_logged', true);
        if (SW.SmartDialogues) SW.SmartDialogues.event('first_kill');
      }
      return;
    }
    if (ev.typ === 'shield_low' || ev.typ === 'heard_rap' || ev.typ === 'player_down' || ev.typ === 'first_kill') {
      if (SW.SmartDialogues) SW.SmartDialogues.event(ev.typ);
      return;
    }
    if (ev.typ === 'mission') {
      const mId = ev.missionId || (SW.Game && SW.Game.mission && SW.Game.mission.id) || 'm1';
      const erg = ev.ergebnis || 'sieg';
      if (SW.SmartDialogues) {
        if (mId === 'm1' && erg === 'sieg') SW.SmartDialogues.setStage('audit', 1);
        if (mId === 'm4') {
          SW.SmartDialogues.setStage('alien', 2);
          if (erg === 'sieg') SW.SmartDialogues.setStage('optimierer', 1);
        }
      }
      this.tick({ typ: 'mission', ergebnis: erg, missionId: mId });
    }
  },

  _check(c, event) {
    switch (c.typ) {
      case 'besuche': return (event.typ === 'raum' && event.raum === c.raum) || (SW.Ship && SW.Ship.currentRoom === c.raum);
      case 'flag':    return this.getFlag(c.name) === true;
      case 'mission': return event.typ === 'mission' && event.ergebnis === c.ergebnis;
      default:        return false;
    }
  },

  // Hat ein NPC eine Quest für uns?
  hasQuestFor(npcName) {
    this.init();
    const upper = String(npcName || '').toUpperCase();
    return this.list.some(q => {
      if (this.status(q.id) !== 'available') return false;
      if (q.npc === upper) return true;
      if (upper === 'RAGNHILD' && q.npc === 'KANTINE') return true;
      return false;
    });
  },

  // Nächste verfügbare Quest eines NPCs starten (falls vorhanden)
  startForNpc(npcName) {
    this.init();
    const upper = String(npcName || '').toUpperCase();
    const q = this.list.find(item => {
      if (this.status(item.id) !== 'available') return false;
      if (item.npc === upper) return true;
      if (upper === 'RAGNHILD' && item.npc === 'KANTINE') return true;
      return false;
    });
    if (q) {
      this.start(q.id);
      return q;
    }
    return null;
  },

  // Quest-Log (Text)
  logText() {
    this.init();
    const lines = ['AUFTRÄGE: ' + this.active.length, 'ERLEDIGT: ' + this.completed.length, ''];
    this.active.forEach((id, i) => {
      const q = this.get(id);
      lines.push((i+1) + '. ' + q.titel);
    });
    if (this.completed.length) {
      lines.push('');
      lines.push('ERLEDIGT:');
      this.completed.forEach(id => {
        const q = this.get(id);
        lines.push('  x ' + q.titel);
      });
    }
    return lines.join('\n');
  }
};
