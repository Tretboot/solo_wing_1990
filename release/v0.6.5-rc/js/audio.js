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
  }
};
