// ===== SOLO WING 1990 — AKADEMIE (Tutorial) =====
// Pro forma. Jeder besteht. Sogar die, die nicht.
// Phasen: dialog → flug → bestanden/durchgefallen
// Der Simulationsflug reutilisiert den COCKPIT-Loop mit Sim-Konfiguration.

'use strict';

SW.Akademie = {
  phase: 'dialog',   // 'dialog' | 'flug' | 'bestanden' | 'durchgefallen'
  dialogIndex: 0,
  versuche: 0,
  _wait: 0,
  _fn: null,

  init() {
    this.phase = 'dialog';
    this.dialogIndex = 0;
    this.versuche = 0;
    this._wait = 0;
    this._fn = null;
  },

  update() {
    if (this._wait > 0) {
      this._wait--;
      if (this._wait === 0) {
        const f = this._fn;
        this._fn = null;
        if (f) f();
      }
    }
  },

  after(frames, fn) { this._wait = frames; this._fn = fn; },

  // Nächste Dialog-Zeile (Click/Space)
  nextDialogLine() {
    const dialog = SW.AkademieData.dialog;
    if (this.dialogIndex >= dialog.length) {
      this.startFlight();
      return null;
    }
    const line = dialog[this.dialogIndex++];
    if (SW.TTS) SW.TTS.speak(line.text, line.npc);
    return line;
  },

  // Sim-Flug starten
  startFlight() {
    this.phase = 'flug';
    this.versuche++;
    // Sim-Mission: 1 Welle, 3 Feinde, generös
    const simMission = {
      id: 'sim',
      name: 'SIMULATION',
      waves: [{ count: 3, z: 200, y: 0, ship: 'd_b' }],
      navPoints: [{x:0,y:0}],
      waveMessages: ['AUSBILDER: Eine Welle. Drei Feinde. Überleben Sie. Das ist die Prüfung.']
    };
    // Bestehende Engine-Initialisierung nutzen
    SW.Player.init();
    SW.Engine.initStars();
    SW.Projectiles.clear();
    SW.Explosions.clear();
    SW.Comm.clear();
    SW.Enemies.init(simMission);
    SW.Autopilot.init(simMission.navPoints || []);
    SW.Carrier.init();
    SW.Game.setState('COCKPIT');
    SW.Game._simMode = true; // Flag: Sim-Modus aktiv
  },

  // Prüfung bestanden
  bestanden() {
    this.phase = 'bestanden';
    this._wait = 0; this._fn = null;
    SW.Game._simMode = false;
    SW.Game.state = 'AKADEMIE';  // FIX: direkt setzen (setState wuerde init() + Phase-Reset ausloesen).
                                  // after() zahlt nur in SW.Akademie.update() runter — frueher blieb der
                                  // State COCKPIT und der Spieler flog ewig weiter.
    if (SW.TTS) SW.TTS.speak('Bestanden. Sie werden dem Träger FAX-TRAGÖDIE zugeteilt. ', 'AUSBILDER');
    this.after(210, () => { SW.Game.startArrival(); });
  },

  // Prüfung nicht bestanden (Pro forma: trotzdem zugeteilt)
  durchgefallen() {
    this.phase = 'durchgefallen';
    this._wait = 0; this._fn = null;
    SW.Game._simMode = false;
    SW.Game.state = 'AKADEMIE';  // FIX: wie bei bestanden() — direkt, ohne init()
    if (SW.TTS) SW.TTS.speak('Nicht bestanden. Sie werden trotzdem dem Träger FAX-TRAGÖDIE zugeteilt. Formular 83-B liegt bereit. Teil C: Nicht bestanden.', 'AUSBILDER');
    this.after(270, () => { SW.Game.startArrival(); });
  }
};
