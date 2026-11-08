// ===== SOLO WING 1990 — POSTINGS & VERSETZUNGEN =====
// Die Flottenzuweisung ist optionaler Weltzustand; alte Spielstände bleiben beim Träger.

SW.Transfers = {
  DEFAULT_POSTING_ID: 'fax-traegodie',

  getById(postingId) {
    return SW.PostingData.find(posting => posting.id === postingId) || null;
  },

  getCurrentPosting() {
    const postingId = (SW.World && SW.World.postingId) || this.DEFAULT_POSTING_ID;
    return this.getById(postingId) || this.getById(this.DEFAULT_POSTING_ID);
  },

  allowedRooms() {
    const posting = this.getCurrentPosting();
    return posting ? posting.roomIds : SW.Rooms.map(room => room.id);
  },

  canVisit(roomId) {
    return this.allowedRooms().indexOf(roomId) >= 0;
  },

  transferTo(postingId, reason) {
    const next = this.getById(postingId);
    if (!next) {
      console.warn('Transfers: Unbekanntes Posting "' + postingId + '"; Zuweisung blieb unverändert.');
      return false;
    }
    if (!SW.World) {
      console.error('Transfers: Weltzustand fehlt; Versetzung wurde nicht ausgeführt.');
      return false;
    }

    const previous = this.getCurrentPosting();
    if (previous.id === next.id) return true;
    SW.World.transferHistory.push({
      from: previous.id,
      to: next.id,
      reason: typeof reason === 'string' && reason.trim() ? reason.trim() : 'Versetzung',
      timestamp: Date.now()
    });
    SW.World.postingId = next.id;
    if (next.defaultShipClassId && SW.Player) {
      SW.Player.shipClassId = next.defaultShipClassId;
    }
    if (SW.Squadron && SW.Squadron.syncWithPosting) {
      SW.Squadron.syncWithPosting(next);
    }
    if (!this.canVisit(SW.Ship.currentRoom)) SW.Ship.currentRoom = next.startRoom;
    SW.Ship.savePanelOpen = false;
    SW.Ship._saveTerminalRect = null;
    SW.Ship._roomNotice = null;
    SW.Ship.dialogueActive = false;
    SW.Ship.talkingNPC = null;
    return true;
  },

  restore(postingId, history) {
    if (postingId === undefined || postingId === null) {
      SW.World.postingId = this.DEFAULT_POSTING_ID;
    } else if (typeof postingId === 'string') {
      if (this.getById(postingId)) SW.World.postingId = postingId;
      else console.warn('Transfers: Posting "' + postingId + '" ist unbekannt; vorhandene Zuweisung bleibt erhalten.');
    }
    if (Array.isArray(history)) {
      SW.World.transferHistory = history.filter(entry =>
        entry && typeof entry === 'object' &&
        typeof entry.from === 'string' && typeof entry.to === 'string' &&
        typeof entry.reason === 'string' && Number.isFinite(entry.timestamp)
      );
    } else if (history === undefined) {
      SW.World.transferHistory = [];
    }
  }
};
