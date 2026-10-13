// ===== SOLO WING 1990 — AUDIO SYSTEM (Procedural Web Audio API) =====
SW.Audio = {
  ctx: null, masterGain: null, enabled: true,
  toggle() { this.enabled = !this.enabled; return this.enabled; },
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    } catch(e) { this.ctx = null; }
  },
  get ready() { return !!this.ctx; },
  playLaser() {
    if (!this.ready || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.05);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.05);
  },
  playExplosion() {
    if (!this.ready || !this.enabled) return;
    const t = this.ctx.currentTime;
    const len = this.ctx.sampleRate * 0.2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(2000, t);
    filt.frequency.exponentialRampToValueAtTime(200, t + 0.2);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    src.connect(filt).connect(gain).connect(this.masterGain);
    src.start(t); src.stop(t + 0.2);
  },
  playShieldHit() {
    if (!this.ready || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(100, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.1);
  },
  playCommBeep() {
    if (!this.ready || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = 'square'; osc.frequency.setValueAtTime(440, t);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.setValueAtTime(0.06, t + 0.03);
    gain.gain.setValueAtTime(0, t + 0.06);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.06);
  },
  playEngine() {
    if (!this.ready || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.setValueAtTime(55, t);
    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(gain).connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.3);
  },
  // ===== MOTOR-SOUND (IM RAUM, v0.75-dev): kontinuierlicher Summton,
  // Tonhöhe + Lautstärke folgen der Vorschub-Geschwindigkeit (Cruise → Burn).
  engineOsc: null, engineOsc2: null, engineGain: null, engineFilt: null,
  setEngine(speed) {
    if (!this.ready) return;
    if (speed <= 0 || !this.enabled) { this._stopEngine(); return; }
    if (!this.engineOsc) {
      const t = this.ctx.currentTime;
      this.engineOsc = this.ctx.createOscillator(); this.engineOsc.type = 'sawtooth';
      this.engineOsc2 = this.ctx.createOscillator(); this.engineOsc2.type = 'triangle';
      this.engineFilt = this.ctx.createBiquadFilter();
      this.engineFilt.type = 'lowpass'; this.engineFilt.frequency.value = 320;
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0.0001;
      this.engineOsc.connect(this.engineFilt); this.engineOsc2.connect(this.engineFilt);
      this.engineFilt.connect(this.engineGain); this.engineGain.connect(this.masterGain);
      this.engineOsc.start(t); this.engineOsc2.start(t);
    }
    const t = this.ctx.currentTime;
    const s = Math.max(0, Math.min(1, (speed - SW.FORWARD_BASE) / (SW.FORWARD_BURN - SW.FORWARD_BASE)));
    const f = 40 + s * 34;
    this.engineOsc.frequency.setTargetAtTime(f, t, 0.12);
    this.engineOsc2.frequency.setTargetAtTime(f * 0.5, t, 0.12);
    this.engineGain.gain.setTargetAtTime(0.02 + 0.04 * s, t, 0.2);
  },
  _stopEngine() {
    if (!this.engineOsc) return;
    const o1 = this.engineOsc, o2 = this.engineOsc2, g = this.engineGain;
    this.engineOsc = null; this.engineOsc2 = null; this.engineGain = null; this.engineFilt = null;
    try { g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.12); } catch (e) {}
    setTimeout(() => { try { o1.stop(); o2.stop(); g.disconnect(); } catch (e) {} }, 500);
  },
  // JUMP-Sprungsound: Noise-Sweep (Bandpass 150→2500→200 Hz) + tiefer Thump
  playJumpWhoosh() {
    if (!this.ready || !this.enabled) return;
    const t = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * 0.7);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'bandpass'; filt.Q.value = 1.2;
    filt.frequency.setValueAtTime(150, t);
    filt.frequency.exponentialRampToValueAtTime(2500, t + 0.35);
    filt.frequency.exponentialRampToValueAtTime(200, t + 0.7);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    src.connect(filt); filt.connect(gain); gain.connect(this.masterGain);
    src.start(t); src.stop(t + 0.7);
    const osc = this.ctx.createOscillator(), og = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.5);
    og.gain.setValueAtTime(0.15, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(og); og.connect(this.masterGain);
    osc.start(t); osc.stop(t + 0.5);
  },
  // ===== MUSIK (v0.6.9-final) =====
  // Prozeduraler Loop als Platzhalter (wird später durch echte Musik ersetzt).
  // startMusic('intro'): leises A-moll-Arpeggio über Drohn-Bass (A2/E2).
  // stopMusic(): Fade-out + Disconnect. Menü = Stille (Musik pausiert).
  musicEnabled: true,
  music: null,
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) this.stopMusic();
    else if (this.ready && this.enabled && SW.Game && SW.Game.state === 'INTRO') this.startMusic('intro');
    return this.musicEnabled;
  },
  startMusic(kind) {
    if (!this.ready || !this.enabled || !this.musicEnabled) return;
    this.stopMusic();
    const gain = this.ctx.createGain();
    gain.gain.value = 0.07; // leise: Atmosphäre, nicht Hauptdarsteller
    gain.connect(this.masterGain);
    const music = { gain: gain, timer: null, step: 0 };
    // A-moll: A3 C4 E4 G4 E4 C4 A3 G3 (Melodie), A2/E2 (Drohn)
    const melody = [220, 261.63, 329.63, 392, 329.63, 261.63, 220, 196];
    const drone = [110, 82.41];
    const STEP = 320; // ms pro Schritt → 8 Schritte ≈ 2.6 s pro Loop
    const playStep = () => {
      if (!this.music || this.music !== music || !this.musicEnabled || !this.enabled || !this.ready) return;
      const t = this.ctx.currentTime;
      const s = music.step;
      // Drohn-Bass auf Schritt 0 und 4 (wechselnd A2/E2)
      if (s % 4 === 0) {
        const dOsc = this.ctx.createOscillator(), dGain = this.ctx.createGain();
        dOsc.type = 'triangle'; dOsc.frequency.value = drone[Math.floor(s / 4) % 2];
        dGain.gain.setValueAtTime(0.5, t);
        dGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        dOsc.connect(dGain); dGain.connect(gain);
        dOsc.start(t); dOsc.stop(t + 1.25);
      }
      // Melodie (ein Ton pro Schritt, 1990er-FM-Flair)
      const mOsc = this.ctx.createOscillator(), mGain = this.ctx.createGain();
      mOsc.type = 'sine'; mOsc.frequency.value = melody[s % melody.length];
      mGain.gain.setValueAtTime(0.55, t);
      mGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      mOsc.connect(mGain); mGain.connect(gain);
      mOsc.start(t); mOsc.stop(t + 0.32);
      music.step++;
      music.timer = setTimeout(playStep, STEP);
    };
    playStep();
    this.music = music;
  },
  stopMusic() {
    // Stille (Menü/Dialog): ALLE Musik-Systeme stoppen, auch Intro-Musik
    this.stopIntroMusic();
    if (!this.music) return;
    const m = this.music;
    this.music = null;
    if (m.timer) clearTimeout(m.timer);
    if (this.ready) {
      try {
        m.gain.gain.setValueAtTime(m.gain.gain.value, this.ctx.currentTime);
        m.gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      } catch (e) {}
      setTimeout(function () { try { m.gain.disconnect(); } catch (e) {} }, 350);
    }
  },

  // ===== INTRO-MUSIK (prozeduraler Loop, Platzhalter) =====
  // sanfte, melodische Sequenz (C-E-G-C-G-E-C) über 12 Takte
  introMusicOscillator: null,
  introMusicGain: null,
  introMusicStarted: false,

  playIntroMusic() {
    if (!this.ready || !this.enabled || this.introMusicStarted) return;
    this.introMusicStarted = true;
    this._startIntroMusicSeq();
  },

  // Interne Sequenz (ohne Gate): der ended-Handler ruft sie für den Loop auf.
  // (Früher rief der Loop playIntroMusic() erneut auf, das early-returnete,
  //  weil introMusicStarted noch true war → Musik spielte nur einmal.)
  _startIntroMusicSeq() {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    this.introMusicGain = ctx.createGain();
    this.introMusicGain.gain.setValueAtTime(0.3, t);
    this.introMusicGain.connect(this.masterGain);

    // Melodie: C4 -> E4 -> G4 -> C5 -> G4 -> E4 -> C4
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63];
    const durations = [0.5, 0.5, 1.0, 2.0, 1.0, 0.5, 1.0]; // in Sekunden

    this.introMusicOscillator = ctx.createOscillator();
    this.introMusicOscillator.type = 'triangle';
    this.introMusicOscillator.connect(this.introMusicGain);

    let next = t;
    for (let i = 0; i < notes.length; i++) {
      this.introMusicOscillator.frequency.setValueAtTime(notes[i], next);
      next += durations[i];
    }
    // sanfter Ausklang, dann loop
    this.introMusicOscillator.frequency.setValueAtTime(261.63, next);
    this.introMusicGain.gain.setValueAtTime(0.3, next);
    this.introMusicGain.gain.exponentialRampToValueAtTime(0.001, next + 2);
    this.introMusicOscillator.start(t);
    this.introMusicOscillator.stop(next + 2);

    // Nach Ende der Sequenz neu starten (Loop)
    this.introMusicOscillator.addEventListener('ended', () => {
      if (this.introMusicStarted) this._startIntroMusicSeq();
    });
  },

  stopIntroMusic() {
    if (!this.introMusicStarted) return;
    this.introMusicStarted = false;
    if (this.introMusicOscillator) {
      try { this.introMusicOscillator.stop(); } catch (e) {}
      this.introMusicOscillator = null;
    }
    if (this.introMusicGain) {
      try { this.introMusicGain.disconnect(); } catch (e) {}
      this.introMusicGain = null;
    }
  },

  toggleMusic() {
    if (!this.ready || !this.enabled) return false;
    // ALLE Musik-Systeme betrachten (State-Musik + Intro-Musik)
    if (this.music || this.introMusicStarted) {
      this.stopMusic();
      return false;
    }
    this.playIntroMusic();
    return true;
  }
};
