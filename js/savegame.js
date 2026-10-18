// ===== SOLO WING 1990 — SAVE/LOAD SYSTEM =====
// Das Feldformat bleibt stabil; optionale neue Weltfelder werden additiv ergänzt,
// damit alte Saves ohne Zwangs-Neustart weiter funktionieren.

SW.SaveGame = {
  STORAGE_KEY: 'solowing1990_save',
  CURRENT_SCHEMA_VERSION: 1,
  lastMessage: null,
  lastMessageTimer: 0,

  save() {
    const data = {
      version: SW.VERSION,
      schemaVersion: this.CURRENT_SCHEMA_VERSION,
      timestamp: Date.now(),
      world: SW.World ? {
        pilotName: SW.World.pilotName || null,
        systemId: SW.World.systemId || null,
        missionResult: SW.World.missionResult || null,
        missionResults: SW.World.missionResults || {},
        missionProgress: SW.World.missionProgress || [],
        nachrufe: SW.World.nachrufe || [],
        shipSystems: SW.World.shipSystems || SW.Player.defaultSystems(),
        postingId: SW.World.postingId || SW.Transfers.DEFAULT_POSTING_ID,
        transferHistory: SW.World.transferHistory || []
      } : null,
      ship: SW.Ship ? { currentRoom: SW.Ship.currentRoom, selectedMissionId: SW.Ship.selectedMissionId || 'm1' } : null,
      quests: SW.Quests ? {
        active: SW.Quests.active || [],
        completed: SW.Quests.completed || [],
        flags: SW.Quests.flags || {}
      } : null,
      dialogues: SW.SmartDialogues ? {
        stages: SW.SmartDialogues.stages || {},
        state: SW.SmartDialogues._state || null
      } : null,
      newspaper: (SW.Newspaper && SW.Newspaper.currentIssue) ? {
        currentIssue: SW.Newspaper.currentIssue
      } : null,
      game: {
        score: SW.Game ? SW.Game.score || 0 : 0
      }
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      this._msg('GESPEICHERT. Persönliches Quartierprotokoll aktualisiert.');
      return true;
    } catch (e) {
      console.error('SaveGame: Speichern fehlgeschlagen', e);
      this._msg('SPEICHER FEHLGESCHLAGEN. Der Datenträger meckert.');
      return false;
    }
  },

  // Alte Spielstände ohne schemaVersion werden nur im Arbeitsspeicher ergänzt.
  // Der gespeicherte Originaltext bleibt beim Laden unangetastet.
  _migrate(data) {
    if (!this._isRecord(data)) return null;
    let schemaVersion = data.schemaVersion === undefined ? 0 : data.schemaVersion;
    if (!Number.isInteger(schemaVersion) || schemaVersion < 0 || schemaVersion > this.CURRENT_SCHEMA_VERSION) return null;

    if (schemaVersion === 0) {
      const oldRoom = (this._isRecord(data.ship) && data.ship.currentRoom) ||
        data.currentRoom || (this._isRecord(data.world) && data.world.currentRoom);
      if (!this._isRecord(data.ship)) data.ship = {};
      if (typeof oldRoom === 'string') data.ship.currentRoom = this._canonicalRoomId(oldRoom);
      data.schemaVersion = 1;
      schemaVersion = 1;
    }

    if (schemaVersion !== this.CURRENT_SCHEMA_VERSION) return null;
    if (this._isRecord(data.ship) && typeof data.ship.currentRoom === 'string') {
      data.ship.currentRoom = this._canonicalRoomId(data.ship.currentRoom);
    }
    return data;
  },

  _canonicalRoomId(roomId) {
    // Keep old private-cabin saves pointed at the pilot's own room, regardless of rank.
    return roomId === 'spinde' || roomId === 'captain_quarters' || roomId === 'captains_quarters'
      ? 'player_quarters'
      : roomId;
  },

  _isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  },

  _isValid(data) {
    if (data.world !== null && data.world !== undefined && !this._isRecord(data.world)) return false;
    if (data.ship !== null && data.ship !== undefined && !this._isRecord(data.ship)) return false;
    if (data.quests !== null && data.quests !== undefined && !this._isRecord(data.quests)) return false;
    if (data.dialogues !== null && data.dialogues !== undefined && !this._isRecord(data.dialogues)) return false;
    if (data.game !== null && data.game !== undefined && !this._isRecord(data.game)) return false;
    if (data.world && ((data.world.missionProgress !== undefined && !Array.isArray(data.world.missionProgress)) ||
        (data.world.nachrufe !== undefined && !Array.isArray(data.world.nachrufe)))) return false;
    if (data.world && data.world.shipSystems !== undefined &&
        !SW.Player.isValidSystems(data.world.shipSystems)) return false;
    if (data.world && data.world.postingId !== undefined && typeof data.world.postingId !== 'string') return false;
    if (data.world && data.world.transferHistory !== undefined && !Array.isArray(data.world.transferHistory)) return false;
    if (data.quests && ((data.quests.active !== undefined && !Array.isArray(data.quests.active)) ||
        (data.quests.completed !== undefined && !Array.isArray(data.quests.completed)) ||
        (data.quests.flags !== undefined && !this._isRecord(data.quests.flags)))) return false;
    if (data.dialogues && data.dialogues.stages !== undefined && !this._isRecord(data.dialogues.stages)) return false;
    if (data.game && data.game.score !== undefined &&
        (typeof data.game.score !== 'number' || !Number.isFinite(data.game.score))) return false;
    return true;
  },

  load() {
    let raw;
    try {
      raw = localStorage.getItem(this.STORAGE_KEY);
    } catch (e) {
      console.error('SaveGame: Speicher konnte nicht gelesen werden', e);
      this._msg('LADEN FEHLGESCHLAGEN. Der Datenträger antwortet nicht.');
      return null;
    }
    if (!raw) {
      this._msg('NICHTS ZU LADEN. Das Quartierprotokoll ist leer.');
      return null;
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('SaveGame: Save-Datei ist kein gültiges JSON', e);
      this._msg('SAVE DEFECT. Formular 83-D unlesbar.');
      return null;
    }

    data = this._migrate(data);
    if (!data || !this._isValid(data)) {
      console.error('SaveGame: Unbekanntes oder ungültiges Savegame-Format; Spielstand wurde nicht verändert.');
      this._msg('SAVE-FORMAT UNBEKANNT. Der Spielstand blieb unverändert.');
      return null;
    }

    try {
      if (data.world && SW.World) {
        if (typeof data.world.pilotName === 'string') SW.World.pilotName = data.world.pilotName;
        if (typeof data.world.systemId === 'string') SW.World.systemId = data.world.systemId;
        if (data.world.missionResult !== undefined) SW.World.missionResult = data.world.missionResult;
        if (this._isRecord(data.world.missionResults)) SW.World.missionResults = data.world.missionResults;
        if (data.world.missionProgress !== undefined) SW.World.missionProgress = data.world.missionProgress;
        if (data.world.nachrufe !== undefined) SW.World.nachrufe = data.world.nachrufe;
        SW.Transfers.restore(data.world.postingId, data.world.transferHistory);
        if (data.world) {
          const savedSystems=data.world.shipSystems || {};
          for (const key of ['engines','weapons','shields','sensors']) {
            SW.World.shipSystems[key]=savedSystems[key] === undefined ? 100 : savedSystems[key];
          }
          if (SW.Player) {
            SW.Player.systems=SW.World.shipSystems;
            const capacity=SW.Player.shieldCapacity();
            SW.Player.frontShield=Math.min(SW.Player.frontShield,capacity);
            SW.Player.rearShield=Math.min(SW.Player.rearShield,capacity);
          }
        }
      }
      if (data.ship && typeof data.ship.currentRoom === 'string' && SW.Ship) {
        if (typeof data.ship.selectedMissionId === 'string') SW.Ship.selectedMissionId = data.ship.selectedMissionId;
        const roomExists = SW.Rooms.some(room => room.id === data.ship.currentRoom);
        if (roomExists && SW.Transfers.canVisit(data.ship.currentRoom)) {
          SW.Ship.currentRoom = data.ship.currentRoom;
          SW.Ship.savePanelOpen = false;
        } else {
          const posting = SW.Transfers.getCurrentPosting();
          console.warn('SaveGame: Raum "' + data.ship.currentRoom + '" ist unbekannt oder für das aktuelle Posting gesperrt; Startbereich wird geladen.');
          SW.Ship.currentRoom = posting.startRoom;
        }
      }
      if (data.quests && SW.Quests) {
        if (data.quests.active !== undefined) SW.Quests.active = data.quests.active;
        if (data.quests.completed !== undefined) SW.Quests.completed = data.quests.completed;
        if (data.quests.flags !== undefined) SW.Quests.flags = data.quests.flags;
      }
      if (data.dialogues && SW.SmartDialogues) {
        if (data.dialogues.stages !== undefined) SW.SmartDialogues.stages = data.dialogues.stages;
        if (this._isRecord(data.dialogues.state)) SW.SmartDialogues._state = data.dialogues.state;
      }
      if (data.newspaper && this._isRecord(data.newspaper.currentIssue) && SW.Newspaper) {
        SW.Newspaper.currentIssue = data.newspaper.currentIssue;
      }
      if (data.game && SW.Game && data.game.score !== undefined) SW.Game.score = data.game.score;
      this._msg('GELADEN. Willkommen zurück, ' + (SW.World && SW.World.pilotName ? SW.World.pilotName : 'PILOT'));
      return data;
    } catch (e) {
      console.error('SaveGame: Laden fehlgeschlagen', e);
      this._msg('LADEN FEHLGESCHLAGEN. Das Schiff hat abgewinkelt.');
      return null;
    }
  },

  hasSave() {
    try {
      return localStorage.getItem(this.STORAGE_KEY) !== null;
    } catch (e) {
      console.error('SaveGame: Speicherstatus konnte nicht gelesen werden', e);
      return false;
    }
  },

  lastSaveTime() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return data && data.timestamp ? data.timestamp : null;
    } catch (e) {
      console.error('SaveGame: Zeitstempel konnte nicht gelesen werden', e);
      return null;
    }
  },

  // ===== EXPORT (JSON-Download, wenn DOM verfügbar) =====
  export() {
    try {
      const ok = this.save();
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!ok || !raw) return false;
      if (typeof document === 'undefined' || !document.createElement) {
        this._msg('EXPORT UNMÖGLICH. Kein Datenträger angeschlossen.');
        return false;
      }
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'solowing1990_save_' + Date.now() + '.json';
      if (typeof a.click !== 'function') {
        this._msg('EXPORT UNMÖGLICH. Die Hand ist nicht kooperativ.');
        return false;
      }
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

  delete() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this._msg('GELÖSCHT. Das Quartierprotokoll ist entfernt.');
      return true;
    } catch (e) {
      console.error('SaveGame: Löschen fehlgeschlagen', e);
      this._msg('LÖSCHEN FEHLGESCHLAGEN. Der Papierkorb ist voll.');
      return false;
    }
  },

  _msg(text) {
    this.lastMessage = text;
    this.lastMessageTimer = 180;
  },

  update() {
    if (this.lastMessageTimer > 0) this.lastMessageTimer--;
    if (this.lastMessageTimer <= 0) this.lastMessage = null;
  }
};
