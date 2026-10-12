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
    // Quest-Tick bei Flag-Änderung
    this.tick({ typ: 'flag', name: name });
  },

  getFlag(name) { return !!this.flags[name]; },

  start(id) {
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
    const snapshot = this.active.slice();
    for (let i = 0; i < snapshot.length; i++) {
      const q = this.get(snapshot[i]);
      if (!q) continue;
      const conds = Array.isArray(q.bedingung) ? q.bedingung : [q.bedingung];
      const done = conds.every(c => this._check(c, event));
      if (done) this.complete(snapshot[i]);
    }
  },

  _check(c, event) {
    switch (c.typ) {
      case 'besuche': return event.typ === 'raum' && event.raum === c.raum;
      case 'flag':    return this.getFlag(c.name) === true;
      case 'mission': return event.typ === 'mission' && event.ergebnis === c.ergebnis;
      default:        return false;
    }
  },

  // Hat ein NPC eine Quest für uns?
  hasQuestFor(npcName) {
    return this.list.some(q => q.npc === npcName && this.status(q.id) === 'available');
  },

  // Quest-Log (Text)
  logText() {
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
