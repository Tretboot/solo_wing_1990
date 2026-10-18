// ===== SOLO WING 1990 — AUDIO SYSTEM (Procedural Web Audio API) =====
SW.Audio = {
  ctx: null, masterGain: null, enabled: true,
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopMusic();
    else if (this.musicEnabled && SW.Game && SW.Game.state === 'INTRO') {
      this.startMusic(SW.Intro && SW.Intro.phase === 1 ? 'asteroid' : 'title');
    }
    return this.enabled;
  },
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
  // 1988er Thermopapier-Faxgerät: kurzes Rattern + Piepton
  playFax() {
    if (!this.ready || !this.enabled) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(i === 3 ? 1320 : 280 + i * 90, t + i * 0.045);
      gain.gain.setValueAtTime(0.05, t + i * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.035);
      osc.connect(gain).connect(this.masterGain);
      osc.start(t + i * 0.045);
      osc.stop(t + i * 0.045 + 0.038);
    }
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
  // ===== PROZEDURALE MUSIK =====
  // Eigene Motive: weiter Synth-Horizont im Titel, bewegter Puls im Asteroidenfeld.
  musicEnabled: true,
  music: null,
  startMusic(kind) {
    if (!this.ready || !this.enabled || !this.musicEnabled) return;
    const theme = kind === 'asteroid' ? 'asteroid' : 'title';
    if (this.music && this.music.kind === theme) return;
    this.stopMusic();

    const gain = this.ctx.createGain();
    gain.gain.value = 0.0001;
    gain.connect(this.masterGain);
    const now = this.ctx.currentTime;
    const music = { gain: gain, timer: null, step: 0, kind: theme };
    const score = theme === 'asteroid'
      ? {
        melody: [293.66, 0, 349.23, 392, 440, 0, 392, 329.63, 293.66, 0, 261.63, 293.66, 349.23, 392, 329.63, 0],
        bass: [73.42, 73.42, 87.31, 87.31, 65.41, 65.41, 98, 98],
        stepMs: 230,
        noteLength: 0.19,
        voice: 'square',
        level: 0.16,
        bassLevel: 0.22,
        filterHz: 1500
      }
      : {
        melody: [220, 261.63, 293.66, 392, 349.23, 329.63, 261.63, 196],
        bass: [110, 82.41],
        stepMs: 390,
        noteLength: 0.34,
        voice: 'triangle',
        level: 0.2,
        bassLevel: 0.14,
        filterHz: 2400
      };
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = score.filterHz;
    filter.connect(gain);
    music.filter = filter;
    gain.gain.setTargetAtTime(theme === 'asteroid' ? 0.045 : 0.035, now, 0.45);

    const playNote = (frequency, t, duration, wave, level) => {
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(frequency, t);
      noteGain.gain.setValueAtTime(0.0001, t);
      noteGain.gain.linearRampToValueAtTime(level, t + 0.018);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(noteGain);
      noteGain.connect(filter);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    };

    const playStep = () => {
      if (!this.music || this.music !== music || !this.musicEnabled || !this.enabled || !this.ready) return;
      const t = this.ctx.currentTime;
      const s = music.step;
      const note = score.melody[s % score.melody.length];
      if (note) playNote(note, t, score.noteLength, score.voice, score.level);
      if (theme === 'asteroid' ? s % 2 === 0 : s % 4 === 0) {
        const bass = score.bass[Math.floor(s / (theme === 'asteroid' ? 2 : 4)) % score.bass.length];
        playNote(bass, t, theme === 'asteroid' ? 0.32 : 1.35, 'triangle', score.bassLevel);
      }
      music.step++;
      music.timer = setTimeout(playStep, score.stepMs);
    };
    this.music = music;
    playStep();
  },
  stopMusic() {
    if (!this.music) return;
    const m = this.music;
    this.music = null;
    if (m.timer) clearTimeout(m.timer);
    if (this.ready) {
      m.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.07);
      setTimeout(() => {
        m.gain.disconnect();
        m.filter.disconnect();
      }, 300);
    }
  },

  playIntroMusic() {
    this.startMusic('title');
  },
  stopIntroMusic() {
    this.stopMusic();
  },
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
      return this.musicEnabled;
    }
    if (!this.ready || !this.enabled) return this.musicEnabled;
    if (SW.Game && SW.Game.state === 'INTRO') {
      this.startMusic(SW.Intro && SW.Intro.phase === 1 ? 'asteroid' : 'title');
    } else {
      this.playIntroMusic();
    }
    return this.musicEnabled;
  }
};
