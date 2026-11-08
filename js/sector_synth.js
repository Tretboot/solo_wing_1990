// ===== SOLO WING 1990 — PROCEDURAL SECTOR SYNTHESIZER (Strudel / Algorithmic Space Audio) =====
// Generiert dynamische, prozedurale Ambient-Klanglandschaften für offene Sternensektoren,
// Transitflüge und Planeten-Orbits, basierend auf Sektor-Seed, Faktion und Umgebung.
(function() {
  'use strict';

  const SectorSynth = {
    ctx: null,
    masterGain: null,
    active: false,
    timer: null,
    currentSectorId: null,
    stepIndex: 0,
    nodes: [],

    // Harmonische Tonskalen für unterschiedliche Sektor-Atmosphären
    SCALES: {
      deep_space: [110, 130.81, 146.83, 164.81, 196, 220, 261.63, 293.66], // Am / Dm Deep Space
      pirate:     [98, 116.54, 130.81, 138.59, 146.83, 174.61, 196, 233.08], // Phrygisch Piraten-Sektor
      border:     [82.41, 110, 123.47, 130.81, 146.83, 164.81, 196, 220],    // Grenzsektor / Kalt
      confed:     [130.81, 146.83, 164.81, 174.61, 196, 220, 246.94, 261.63] // Konföderations-Territorium / Maj
    },

    init(audioCtx, masterGainNode) {
      if (typeof window === 'undefined') return;
      if (this.ctx) return;
      try {
        this.ctx = audioCtx || (SW.Audio && SW.Audio.ctx);
        if (!this.ctx) return;
        this.masterGain = masterGainNode || (SW.Audio && SW.Audio.masterGain) || this.ctx.destination;
      } catch (err) {}
    },

    start(sectorId, seed = 42) {
      if (typeof window === 'undefined') return;
      this.init();
      if (!this.ctx) return;
      if (this.active && this.currentSectorId === sectorId) return;
      this.stop();

      this.active = true;
      this.currentSectorId = sectorId;
      this.stepIndex = 0;

      // Bestimme Stil aus Sektor-ID
      let scaleKey = 'deep_space';
      if (String(sectorId).match(/pirat|schatten|raub/i)) scaleKey = 'pirate';
      else if (String(sectorId).match(/grenz|nadel|eis/i)) scaleKey = 'border';
      else if (String(sectorId).match(/konfed|sol|basis|träger/i)) scaleKey = 'confed';

      const scale = this.SCALES[scaleKey] || this.SCALES.deep_space;
      const bpm = 72 + (seed % 28);
      const stepMs = Math.round((60000 / bpm) / 2); // 8tel-Puls

      const gain = this.ctx.createGain();
      gain.gain.value = 0.0001;
      gain.connect(this.masterGain);
      const now = this.ctx.currentTime;
      gain.gain.linearRampToValueAtTime(0.045, now + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1600 + (seed % 800);
      filter.connect(gain);

      this.nodes.push(gain, filter);

      const playStep = () => {
        if (!this.active || !this.ctx) return;
        const t = this.ctx.currentTime;
        const s = this.stepIndex;

        // Bass-Drone alle 4 Schritte
        if (s % 4 === 0) {
          const rootNote = scale[0];
          this._playNote(rootNote * 0.5, t, 1.8, 'triangle', 0.16, filter);
        }

        // Arpeggio / Melodie-Puls
        const noteIdx = (s * 3 + seed) % scale.length;
        if (s % 2 === 0 || (s + seed) % 3 === 0) {
          const freq = scale[noteIdx] * (s % 8 >= 4 ? 2 : 1);
          this._playNote(freq, t, 0.35, 'sine', 0.12, filter);
        }

        this.stepIndex++;
        this.timer = setTimeout(playStep, stepMs);
      };

      playStep();
    },

    _playNote(freq, t, dur, wave, level, destNode) {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, t);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(level, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g);
        g.connect(destNode);
        osc.start(t);
        osc.stop(t + dur + 0.05);
      } catch (e) {}
    },

    stop() {
      this.active = false;
      this.currentSectorId = null;
      if (this.timer) { clearTimeout(this.timer); this.timer = null; }
      if (this.nodes.length && this.ctx) {
        const g = this.nodes[0];
        try {
          g.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
          setTimeout(() => {
            this.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} });
            this.nodes = [];
          }, 400);
        } catch (e) {
          this.nodes = [];
        }
      }
    }
  };

  if (typeof SW !== 'undefined') {
    SW.SectorSynth = SectorSynth;
  } else if (typeof window !== 'undefined') {
    window.SW = window.SW || {};
    window.SW.SectorSynth = SectorSynth;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SectorSynth;
  }
})();
