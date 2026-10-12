// ===== SOLO WING 1990 — SAVE/LOAD SYSTEM (v0.6.9-final) =====
// Die Barraken: Jeder Pilot hat seine eigene Spinde (Luxus). An der Tür mit
// dem Namen aus dem Intro öffnet sich das Save/Load-Menü. Andere kommen nicht
// rein. Später: Trophäen und Deko im Bunker.
//
// Gespeichert wird: Pilotenname, System, Missions-Fortschritt, Nachrufe,
// Quests (aktiv/erledigt/Flags), Subplot-Stufen, Score.
// Sarkastischer Kommentar: "Sie haben bisher ohne Savegame überlebt."

SW.SaveGame = {
  STORAGE_KEY: 'solowing1990_save',
  lastMessage: null,     // Feedback-Zeile fürs Menü (mit TTL)
  lastMessageTimer: 0,

  // ===== SPEICHERN =====
  save() {
    const data = {
      version: '0.6.9-final',
      timestamp: Date.now(),
      world: SW.World ? {
        pilotName: SW.World.pilotName || null,
        systemId: SW.World.systemId || null,
        missionResult: SW.World.missionResult || null,
        missionProgress: SW.World.missionProgress || [],
        nachrufe: SW.World.nachrufe || []
      } : null,
      quests: SW.Quests ? {
        active: SW.Quests.active || [],
        completed: SW.Quests.completed || [],
        flags: SW.Quests.flags || {}
      } : null,
      dialogues: (SW.SmartDialogues && SW.SmartDialogues.stages) ? {
        stages: SW.SmartDialogues.stages
      } : null,
      game: {
        score: SW.Game.score || 0
      }
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      this._msg('GESPEICHERT. Formular 83-D liegt in der Spinde.');
      return true;
    } catch (e) {
      console.error('SaveGame: Speichern fehlgeschlagen', e);
      this._msg('SPEICHER FEHLGESCHLAGEN. Der Datenträger meckert.');
      return false;
    }
  },

  // ===== LADEN =====
  load() {
    let raw = null;
    try { raw = localStorage.getItem(this.STORAGE_KEY); } catch (e) {}
    if (!raw) { this._msg('NICHTS ZU LADEN. Die Spinde war leer.'); return null; }
    let data = null;
    try { data = JSON.parse(raw); } catch (e) { this._msg('SAVE DEFECT. Formular 83-D unlesbar.'); return null; }
    try {
      if (data.world) {
        if (SW.World) {
          if (data.world.pilotName) SW.World.pilotName = data.world.pilotName;
          if (data.world.systemId) SW.World.systemId = data.world.systemId;
          SW.World.missionResult = data.world.missionResult || null;
          SW.World.missionProgress = data.world.missionProgress || [];
          SW.World.nachrufe = data.world.nachrufe || [];
        }
      }
      if (data.quests && SW.Quests) {
        SW.Quests.active = data.quests.active || [];
        SW.Quests.completed = data.quests.completed || [];
        SW.Quests.flags = data.quests.flags || {};
      }
      if (data.dialogues && SW.SmartDialogues) {
        SW.SmartDialogues.stages = data.dialogues.stages || {};
      }
      if (data.game) SW.Game.score = data.game.score || 0;
      this._msg('GELADEN. Willkommen zurück, ' + (SW.World && SW.World.pilotName ? SW.World.pilotName : 'PILOT'));
      return data;
    } catch (e) {
      console.error('SaveGame: Laden fehlgeschlagen', e);
      this._msg('LADEN FEHLGESCHLAGEN. Der Träger hat abgewinkelt.');
      return null;
    }
  },

  hasSave() {
    try { return localStorage.getItem(this.STORAGE_KEY) !== null; } catch (e) { return false; }
  },

  lastSaveTime() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      return d && d.timestamp ? d.timestamp : null;
    } catch (e) { return null; }
  },

  // ===== EXPORT (JSON-Download, wenn DOM verfügbar) =====
  export() {
    try {
      const ok = this.save();
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!ok || !raw) return false;
      if (typeof document === 'undefined' || !document.createElement) { this._msg('EXPORT UNMÖGLICH. Kein Datenträger angeschlossen.'); return false; }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'solowing1990_save_' + Date.now() + '.json';
      if (typeof a.click !== 'function') { this._msg('EXPORT UNMÖGLICH. Die Hand ist nicht kooperativ.'); return false; }
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this._msg('EXPORTIERT. Fax-Archiv: +1 Blatt.');
      return true;
    } catch (e) {
      console.error('SaveGame: Export fehlgeschlagen', e);
      this._msg('EXPORT FEHLGESCHLAGEN.');
      return false;
    }
  },

  // ===== LÖSCHEN =====
  delete() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this._msg('GELÖSCHT. Die Spinde ist wieder leer. Wie immer.');
      return true;
    } catch (e) {
      this._msg('LÖSCHEN FEHLGESCHLAGEN. Der Papierkorb ist voll.');
      return false;
    }
  },

  _msg(text) {
    this.lastMessage = text;
    this.lastMessageTimer = 180; // 3 s
  },

  update() {
    if (this.lastMessageTimer > 0) this.lastMessageTimer--;
    if (this.lastMessageTimer <= 0) this.lastMessage = null;
  }
};
