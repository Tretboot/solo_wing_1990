// ===== SOLO WING 1990 — SMART DIALOGUE ENGINE (v0.6.7) =====
// Das Dorf reagiert: NPCs wissen, WANN sie WAS sagen dürfen.
// - req-Gates: eine Zeile wird nur gesagt, wenn ihre Bedingung erfüllt ist
//   (Mission erledigt, Quest-Flag gesetzt, Event passiert, Subplot-Stage erreicht).
// - Ereignisse: letztes Ereignis-Log (Kills, Missionen, Rap-Pirat, …) — NPCs
//   reagieren auf das, was der Spieler ERLEBT hat, nicht auf das, was er kennt.
// - Gewichtete Auswahl + Cooldown: keine Wiederholung im Hamsterrad.
// - Subplots (alien, audit, optimierer): Stufen, die alle NPCs langsam auf
//   die Wahrheit hinführen. A/B-Check: req-Gate verhindert Spoiler vor Freigabe.
//
// Daten: SW.Dialogues.smart (data/dialogues.js). Engine: diese Datei.
// Aufruf: SW.SmartDialogues.get(npcId) → {npc, text, id} | null

SW.SmartDialogues = {
  eventLog: [],     // [{typ, data, frame}] — letzte 20 Ereignisse
  recent: {},       // npcId → [ids] — zuletzt gesagte Zeilen (max 8)
  stages: {},       // topic → Stufe (alien: 0-3, audit: 0-2, optimierer: 0-1)
  lastSpoke: null,  // {npc, frame}

  EVENT_WINDOW: 1800, // Event gilt "frisch" für 30 s (60 fps)

  init() {
    if (this._inited) return;
    this._inited = true;
    // Subplot-Startzustände aus Daten
    const s = SW.Dialogues.smartSubplots;
    if (s) for (const t of Object.keys(s)) this.stages[t] = s[t].start || 0;
  },

  // ===== ERREIGNISSE =====
  // Flug-/Quest-Events landen hier und werden zu Dialog-Reaktionen.
  event(typ, data) {
    this.eventLog.unshift({ typ, data: data || {}, frame: SW.Game?.frame || 0 });
    if (this.eventLog.length > 20) this.eventLog.pop();
  },

  hasEvent(typ) {
    const now = SW.Game?.frame || 0;
    return this.eventLog.some(e => e.typ === typ && now - e.frame < this.EVENT_WINDOW);
  },

  // Mission abgeschlossen: speichert Ergebnis + setzt Ereignis.
  noteMission(missionId, ergebnis) {
    const w = SW.World;
    if (w) {
      w.missionResults = w.missionResults || {};
      w.missionResults[missionId] = ergebnis;
      w.missionProgress = w.missionProgress || [];
      if (ergebnis === 'sieg' && w.missionProgress.indexOf(missionId) === -1) {
        w.missionProgress.push(missionId);
      }
    }
    this.event('mission_complete', { mission: missionId, ergebnis });
    this.event('mission_' + ergebnis, { mission: missionId });
  },

  // ===== SUBPLOTS (A/B-Story-Checks) =====
  // stage: 0 = noch niemand ahnt es, 1 = erste Hinweise, 2 = es bahnt sich an,
  // 3 = aufgedeckt. setStage() geht nur nach oben (keine Spoiler-Rücknahme).
  setStage(topic, stage) {
    this.init();
    if ((this.stages[topic] || 0) < stage) {
      this.stages[topic] = stage;
      SW.Quests?.setFlag('subplot_' + topic + '_' + stage, true);
      this.event('stage_' + topic, { stage });
    }
  },

  stage(topic) {
    this.init();
    return this.stages[topic] || 0;
  },

  // ===== REQ-GATES =====
  // r: null | String | Object | Array (Array = UND)
  // Strings: 'm1_sieg', 'm1_tod', 'm1', 'flag:xxx', 'quest:xxx',
  //          'questdone:xxx', 'event:xxx', 'stage:alien>=2'
  // Objekte: {mission:'m2', ergebnis:'sieg'} | {flag:'x'} | {quest:'x'} |
  //          {questDone:'x'} | {event:'x'} | {stage:{topic:'alien', min:2}} | {state:'BAR'}
  checkReq(r) {
    if (r === null || r === undefined || r === true) return true;
    const list = Array.isArray(r) ? r : [r];
    for (const x of list) if (!this._checkOne(x)) return false;
    return true;
  },

  _checkOne(r) {
    if (typeof r === 'object' && r !== null) {
      if (r.mission) {
        const w = SW.World;
        const done = (w?.missionProgress || []).indexOf(r.mission) !== -1;
        if (!done) return false;
        if (r.ergebnis) {
          const res = (w?.missionResults || {})[r.mission];
          return res === r.ergebnis;
        }
        return true;
      }
      if (r.flag !== undefined) return SW.Quests?.getFlag(r.flag) === true;
      if (r.quest) return (SW.Quests?.active || []).indexOf(r.quest) !== -1;
      if (r.questDone) return (SW.Quests?.completed || []).indexOf(r.questDone) !== -1;
      if (r.event) return this.hasEvent(r.event);
      if (r.stage) return this.stage(r.stage.topic) >= (r.stage.min || 1);
      if (r.state) return (SW.Game?.state) === r.state;
      return true;
    }
    if (typeof r === 'string') {
      if (r === '' || r === 'none') return true;
      if (r.indexOf('flag:') === 0) return SW.Quests?.getFlag(r.slice(5)) === true;
      if (r.indexOf('questdone:') === 0) return (SW.Quests?.completed || []).indexOf(r.slice(10)) !== -1;
      if (r.indexOf('quest:') === 0) return (SW.Quests?.active || []).indexOf(r.slice(6)) !== -1;
      if (r.indexOf('event:') === 0) return this.hasEvent(r.slice(6));
      if (r.indexOf('stage:') === 0) {
        const m = r.slice(6).match(/^(\w+)(?:>(\d+))?$/);
        if (!m) return false;
        return this.stage(m[1]) >= (m[2] ? parseInt(m[2]) : 1);
      }
      // 'm1_sieg', 'm1_tod', 'm1'
      const mm = r.match(/^(m\d)_(sieg|tod)$/);
      if (mm) return (SW.World?.missionResults || {})[mm[1]] === mm[2];
      if (/^m\d$/.test(r)) return (SW.World?.missionProgress || []).indexOf(r) !== -1;
      return true; // unbekannt → offen (dev-freundlich)
    }
    return true;
  },

  // ===== AUFWÄHLEN: was sagt der NPC JETZT? =====
  get(npcId, opts) {
    opts = opts || {};
    const pools = SW.Dialogues.smart?.[npcId];
    if (!pools) return null;
    this.init();

    const seen = this.recent[npcId] || (this.recent[npcId] = []);
    const cands = [];

    const consider = (lines, weight) => {
      if (!Array.isArray(lines)) return;
      for (const l of lines) {
        if (!this.checkReq(l.req)) continue;            // A/B-Gate: Spoiler bleiben zu
        if (l.id && seen.indexOf(l.id) !== -1) continue; // Cooldown: keine Wiederholung
        cands.push({ line: l, w: (l.w || 1) * weight });
      }
    };

    // Prioritäten (hohes Gewicht = wird eher gewählt):
    // 5.0 frische Events (Rap gehört, Schild kritisch, erster Abschuss)
    // 3.0 Quest-Zustand + 3.0 Mission-Reaktionen
    // 2.5 Subplot-Stufen
    // 1.0 Base (eigener Ton, immer da)
    if (pools.events) {
      for (const e of this.eventLog) {
        if ((SW.Game?.frame || 0) - e.frame < (opts.eventWindow || this.EVENT_WINDOW)) {
          if (pools.events[e.typ]) consider(pools.events[e.typ], 5);
        }
      }
    }
    consider(pools.quest, 3);
    consider(pools.mission, 3);
    consider(pools.subplot, 2.5);
    consider(pools.base, 1);

    if (!cands.length) return null;

    // Gewichteter Zufall
    const total = cands.reduce((s, c) => s + c.w, 0);
    let roll = Math.random() * total;
    let chosen = cands[0].line;
    for (const c of cands) {
      roll -= c.w;
      if (roll <= 0) { chosen = c.line; break; }
    }

    const id = chosen.id || chosen.text.slice(0, 40);
    seen.push(id);
    if (seen.length > 8) seen.shift();
    this.lastSpoke = { npc: npcId, frame: SW.Game?.frame || 0 };
    return { npc: npcId, text: chosen.text, id };
  },

  // Für UI: Sprechblase-Text + optional TTS
  chat(npcId, opts) {
    const d = this.get(npcId, opts);
    if (!d) return null;
    if (SW.TTS && !opts?.silent) SW.TTS.speak(d.text, npcId);
    return d;
  }
};