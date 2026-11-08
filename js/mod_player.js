// ===== SOLO WING 1990 — AMIGA PROTRACKER MOD ENGINE (Mark TDK Knight WC1 OST) =====
// Autonome WebAudio Replay-Routine für 4-Kanal ProTracker 2.x Module (M.K. / Paula Chip).
// Unterstützt Pitch-Bends, Portamento, Vibrato, Sample-Loops, Pattern Breaks & Amiga LED Low-Pass Filter.
(function() {
  'use strict';

  const ModPlayer = {
    ctx: null,
    node: null,
    filterNode: null,
    gainNode: null,
    masterGain: null,
    currentTrackKey: null,
    currentMod: null,
    currentBuffer: null,
    cache: {},
    enabled: true,
    volume: 0.65,
    isFading: false,
    paulaFilterEnabled: true,

    // Register der authentischen Amiga Wing Commander 1 MOD-Tracks (Mark Knight)
    TRACKS: {
      recroom:         'audio/mod/wing_commander_recroom.mod',
      briefing:        'audio/mod/wing_commander_briefing1+2+3.mod',
      office:          'audio/mod/wing_commander_commanderoffice.mod',
      barracks:        'audio/mod/wing_commander_barracks.mod',
      flyingtobattle:  'audio/mod/wing_commander_flyingtobattle.mod',
      regularcombat:   'audio/mod/wing_commander_regularcombat.mod',
      intensecombat:   'audio/mod/wing_commander_intensecombat.mod',
      beingtailed:     'audio/mod/wing_commander_beingtailed.mod',
      tailingenemy:    'audio/mod/wing_commander_tailingenemy.mod',
      landing:         'audio/mod/wing_commander_landing.mod',
      debrief0:        'audio/mod/wing_commander_debrief0.mod',
      debrief1:        'audio/mod/wing_commander_debrief1.mod',
      medalceremony:   'audio/mod/wing_commander_medalceremony.mod',
      overallvictory:  'audio/mod/wing_commander_overallvictory.mod',
      overalldefeat:   'audio/mod/wing_commander_overalldefeat.mod',
      funeral:         'audio/mod/wing_commander_funeral.mod',
      eject_rescue:    'audio/mod/wing_commander_eject-rescue.mod',
      scramble:        'audio/mod/wing_commander_scrambleii.mod',
      strikemission:   'audio/mod/wing_commander_strikemission.mod'
    },

    // Aktiver Player-State während der Wiedergabe
    state: {
      playing: false,
      looping: true,
      curOrder: 0,
      curRow: 0,
      curTick: 0,
      speed: 6,
      bpm: 125,
      samplesPerTick: 0,
      tickSampleCounter: 0,
      jumpOrder: null,
      breakRow: 0,
      channels: [
        { sample: null, pos: 0, period: 0, volume: 0, targetPeriod: 0, portSpeed: 0, vibPos: 0, vibSpeed: 0, vibDepth: 0, retrigCount: 0 },
        { sample: null, pos: 0, period: 0, volume: 0, targetPeriod: 0, portSpeed: 0, vibPos: 0, vibSpeed: 0, vibDepth: 0, retrigCount: 0 },
        { sample: null, pos: 0, period: 0, volume: 0, targetPeriod: 0, portSpeed: 0, vibPos: 0, vibSpeed: 0, vibDepth: 0, retrigCount: 0 },
        { sample: null, pos: 0, period: 0, volume: 0, targetPeriod: 0, portSpeed: 0, vibPos: 0, vibSpeed: 0, vibDepth: 0, retrigCount: 0 }
      ]
    },

    init(audioCtx, masterGainNode) {
      if (typeof window === 'undefined') return;
      if (this.ctx && this.node) return;
      try {
        this.ctx = audioCtx || (SW.Audio && SW.Audio.ctx);
        if (!this.ctx) return;
        this.masterGain = masterGainNode || (SW.Audio && SW.Audio.masterGain) || this.ctx.destination;

        // Amiga Paula Hardware Low-Pass Filter (der berühmte LED-Filter der A500)
        if (!this.filterNode) {
          this.filterNode = this.ctx.createBiquadFilter();
          this.filterNode.type = 'lowpass';
          this.filterNode.frequency.value = 5200;
          this.filterNode.Q.value = 0.7;
        }

        if (!this.gainNode) {
          this.gainNode = this.ctx.createGain();
          this.gainNode.gain.value = this.volume;
          this.filterNode.connect(this.gainNode);
          this.gainNode.connect(this.masterGain);
        }

        this._ensureNode();
      } catch (err) {
        // Safe fail
      }
    },

    // Einzelner persistenter Audio-Verarbeitungsknoten (verhindert Mehrfach-Instanzen & Tempo-Verdopplungen)
    _ensureNode() {
      if (typeof window === 'undefined' || !this.ctx || !this.filterNode) return;
      if (this.node) return;
      if (window._swModNode && window._swModNode !== this.node) {
        try {
          window._swModNode.disconnect();
          window._swModNode.onaudioprocess = null;
        } catch (e) {}
        window._swModNode = null;
      }
      try {
        const bufSize = 4096;
        try {
          this.node = this.ctx.createScriptProcessor(bufSize, 0, 2);
        } catch (e) {
          this.node = this.ctx.createScriptProcessor(bufSize, 2, 2);
        }
        this.node.onaudioprocess = (e) => this._onAudioProcess(e);
        this.node.connect(this.filterNode);
        window._swModNode = this.node;
      } catch (err) {
        // Safe fail
      }
    },

    parseMod(buffer) {
      if (!buffer) return null;
      let ab;
      if (buffer instanceof ArrayBuffer) {
        ab = buffer;
      } else if (ArrayBuffer.isView(buffer)) {
        ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
      } else {
        ab = new Uint8Array(buffer).buffer;
      }
      const view = new DataView(ab);
      const u8 = new Uint8Array(ab);

      let title = '';
      for (let i = 0; i < 20; i++) {
        const c = u8[i];
        if (c > 31 && c < 127) title += String.fromCharCode(c);
      }
      title = title.trim();

      const samples = [];
      let offset = 20;
      for (let i = 0; i < 31; i++) {
        let name = '';
        for (let n = 0; n < 22; n++) {
          const c = u8[offset + n];
          if (c > 31 && c < 127) name += String.fromCharCode(c);
        }
        const length = view.getUint16(offset + 22, false) * 2;
        const finetuneRaw = u8[offset + 24] & 0x0F;
        const finetune = finetuneRaw > 7 ? finetuneRaw - 16 : finetuneRaw;
        const volume = Math.min(64, u8[offset + 25]);
        const repeatOffset = view.getUint16(offset + 26, false) * 2;
        const repeatLength = view.getUint16(offset + 28, false) * 2;

        samples.push({
          name: name.trim(),
          length,
          finetune,
          volume,
          repeatOffset,
          repeatLength,
          data: null
        });
        offset += 30;
      }

      const songLength = u8[offset];
      const restartPos = u8[offset + 1];
      offset += 2;

      const order = [];
      let maxPat = 0;
      for (let i = 0; i < 128; i++) {
        const p = u8[offset + i];
        order.push(p);
        if (i < songLength && p > maxPat) maxPat = p;
      }
      offset += 128;
      offset += 4; // Tag 'M.K.'

      const numPatterns = maxPat + 1;
      const patterns = [];
      for (let p = 0; p < numPatterns; p++) {
        const pat = [];
        for (let r = 0; r < 64; r++) {
          const row = [];
          for (let c = 0; c < 4; c++) {
            const b0 = u8[offset];
            const b1 = u8[offset + 1];
            const b2 = u8[offset + 2];
            const b3 = u8[offset + 3];
            offset += 4;

            const sampleIdx = (b0 & 0xF0) | (b2 >> 4);
            const period = ((b0 & 0x0F) << 8) | b1;
            const effect = b2 & 0x0F;
            const param = b3;

            row.push({ sample: sampleIdx, period, effect, param });
          }
          pat.push(row);
        }
        patterns.push(pat);
      }

      // Signed 8-bit Sample PCM
      for (let i = 0; i < 31; i++) {
        const smp = samples[i];
        if (smp.length > 0 && offset < u8.length) {
          const end = Math.min(u8.length, offset + smp.length);
          smp.data = new Int8Array(ab, offset, end - offset);
          offset += smp.length;
        } else {
          smp.data = new Int8Array(0);
        }
      }

      return { title, samples, songLength, restartPos, order, numPatterns, patterns };
    },

    async load(key) {
      if (this.cache[key]) return this.cache[key];

      // 1. Eingebettetes Offline Base64-Archiv (spielt 100% offline auch bei file:// ohne CORS-Blocker!)
      if (typeof SW !== 'undefined' && SW.ModArchive && SW.ModArchive[key]) {
        try {
          const b64 = SW.ModArchive[key];
          const bin = (typeof atob === 'function') ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
          const len = bin.length;
          const u8 = new Uint8Array(len);
          for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i);
          const parsed = this.parseMod(u8.buffer);
          if (parsed) {
            this.cache[key] = parsed;
            return parsed;
          }
        } catch (e) {}
      }

      // 2. Fetch-Fallback für HTTP(S) oder externe Tracks
      const url = this.TRACKS[key] || key;
      if (typeof fetch === 'undefined') return null;
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const ab = await res.arrayBuffer();
        const parsed = this.parseMod(ab);
        if (parsed) this.cache[key] = parsed;
        return parsed;
      } catch (e) {
        return null;
      }
    },

    playTrack(key, loop = true, fadeSec = 0.25) {
      if (!this.enabled || !key) return;
      if (this._targetKey === key && (this.state.playing || this._isLoading)) return;
      this._targetKey = key;
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        try { this.ctx.resume(); } catch(e) {}
      }

      this._isLoading = true;
      this.load(key).then(mod => {
        this._isLoading = false;
        if (!mod || this._targetKey !== key) return;
        this._startPlayback(mod, key, loop, fadeSec);
      }).catch(() => { this._isLoading = false; });
    },

    _startPlayback(mod, key, loop, fadeSec) {
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        try { this.ctx.resume(); } catch(e) {}
      }
      this.init();
      this._ensureNode();

      this.currentMod = mod;
      this.currentTrackKey = key;
      this._targetKey = key;

      const s = this.state;
      s.playing = true;
      s.looping = loop !== false;
      s.curOrder = 0;
      s.curRow = 0;
      s.curTick = 0;
      s.speed = 6;
      s.bpm = 125;
      s.jumpOrder = null;
      s.breakRow = 0;
      const sampleRate = (this.ctx && this.ctx.sampleRate) ? this.ctx.sampleRate : 44100;
      s.samplesPerTick = Math.round(sampleRate * 2.5 / 125);
      s.tickSampleCounter = 0;

      for (let i = 0; i < 4; i++) {
        const ch = s.channels[i];
        ch.sample = null; ch.pos = 0; ch.period = 0; ch.volume = 0;
        ch.targetPeriod = 0; ch.portSpeed = 0; ch.vibPos = 0; ch.vibSpeed = 0;
        ch.vibDepth = 0; ch.retrigCount = 0;
      }

      // Sanfter Einblend-Fade
      if (this.gainNode && this.ctx) {
        const t = this.ctx.currentTime;
        this.gainNode.gain.cancelScheduledValues(t);
        this.gainNode.gain.setValueAtTime(0.001, t);
        this.gainNode.gain.linearRampToValueAtTime(this.volume, t + Math.max(0.05, fadeSec));
      }
    },

    toggleFilter() {
      this.paulaFilterEnabled = !this.paulaFilterEnabled;
      if (this.filterNode && this.ctx) {
        const freq = this.paulaFilterEnabled ? 5200 : 22050;
        this.filterNode.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);
      }
      return this.paulaFilterEnabled;
    },

    getTrackTitle() {
      if (this.currentMod && this.currentMod.title) return this.currentMod.title;
      if (this.currentTrackKey) return this.currentTrackKey;
      return 'KEIN TITEL';
    },

    stop(fadeSec = 0.2) {
      this._targetKey = null;
      this._isLoading = false;
      this.currentTrackKey = null;

      if (this.gainNode && this.ctx) {
        const t = this.ctx.currentTime;
        this.gainNode.gain.cancelScheduledValues(t);
        this.gainNode.gain.linearRampToValueAtTime(0.001, t + fadeSec);
      }
      setTimeout(() => {
        if (!this._targetKey) {
          this.state.playing = false;
          this.currentMod = null;
        }
      }, Math.round((fadeSec + 0.05) * 1000));
    },

    setVolume(v) {
      this.volume = Math.max(0, Math.min(1, v));
      if (this.gainNode && this.ctx) {
        this.gainNode.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
      }
    },

    // ProTracker Row-Verarbeitung (Noten, Instrumentenwechsel, Effekte)
    _processRow() {
      const s = this.state;
      const mod = this.currentMod;
      if (!mod) return;
      const patIdx = mod.order[s.curOrder];
      const pat = mod.patterns[patIdx];
      if (!pat) return;
      const row = pat[s.curRow];

      for (let ch = 0; ch < 4; ch++) {
        const note = row[ch];
        const state = s.channels[ch];

        if (note.sample > 0 && note.sample <= 31) {
          state.sample = mod.samples[note.sample - 1];
          state.volume = state.sample.volume;
        }

        if (note.period > 0) {
          if (note.effect === 0x03) { // Tone Portamento
            state.targetPeriod = note.period;
          } else {
            state.period = note.period;
            state.pos = 0;
            state.vibPos = 0;
          }
        }

        // Effekte bei Tick 0
        const eff = note.effect;
        const p = note.param;

        if (eff === 0x0B) { // Position Jump (Bxx)
          s.jumpOrder = p;
          s.breakRow = 0;
        } else if (eff === 0x0D) { // Pattern Break (Dxx)
          if (s.jumpOrder === null) {
            s.jumpOrder = s.curOrder + 1;
          }
          // BCD dekodierte Zielzeile
          s.breakRow = ((p >> 4) * 10) + (p & 0x0F);
        } else if (eff === 0x0C) { // Set Volume
          state.volume = Math.min(64, p);
        } else if (eff === 0x0F) { // Set Speed / BPM
          if (p < 32 && p > 0) {
            s.speed = p;
          } else if (p >= 32) {
            s.bpm = p;
            s.samplesPerTick = Math.round(this.ctx.sampleRate * 2.5 / s.bpm);
          }
        } else if (eff === 0x03 && p > 0) { // Tone Portamento Speed
          state.portSpeed = p;
        } else if (eff === 0x04) { // Vibrato
          if ((p & 0xF0) !== 0) state.vibSpeed = (p >> 4);
          if ((p & 0x0F) !== 0) state.vibDepth = (p & 0x0F);
        } else if (eff === 0x0E && (p & 0xF0) === 0xA0) { // Fine Volslide Up
          state.volume = Math.min(64, state.volume + (p & 0x0F));
        } else if (eff === 0x0E && (p & 0xF0) === 0xB0) { // Fine Volslide Down
          state.volume = Math.max(0, state.volume - (p & 0x0F));
        }
      }
    },

    // ProTracker Tick-Verarbeitung (Pitch/Vol Slides auf Ticks > 0)
    _processTick() {
      const s = this.state;
      const mod = this.currentMod;
      if (!mod) return;
      const patIdx = mod.order[s.curOrder];
      const pat = mod.patterns[patIdx];
      if (!pat) return;
      const row = pat[s.curRow];

      for (let ch = 0; ch < 4; ch++) {
        const note = row[ch];
        const state = s.channels[ch];
        const eff = note.effect;
        const p = note.param;

        if (eff === 0x01) { // Portamento Up
          state.period = Math.max(113, state.period - p);
        } else if (eff === 0x02) { // Portamento Down
          state.period = Math.min(856, state.period + p);
        } else if (eff === 0x03) { // Tone Portamento Slide
          if (state.targetPeriod > 0) {
            const spd = state.portSpeed || p;
            if (state.period < state.targetPeriod) {
              state.period = Math.min(state.targetPeriod, state.period + spd);
            } else if (state.period > state.targetPeriod) {
              state.period = Math.max(state.targetPeriod, state.period - spd);
            }
          }
        } else if (eff === 0x0A) { // Volume Slide
          const up = (p >> 4), dn = (p & 0x0F);
          if (up > 0) state.volume = Math.min(64, state.volume + up);
          else if (dn > 0) state.volume = Math.max(0, state.volume - dn);
        } else if (eff === 0x0E && (p & 0xF0) === 0xC0) { // Note Cut
          if (s.curTick === (p & 0x0F)) state.volume = 0;
        } else if (eff === 0x0E && (p & 0xF0) === 0x90) { // Retrigger Note
          const intv = p & 0x0F;
          if (intv > 0 && s.curTick % intv === 0) state.pos = 0;
        }
      }
    },

    // WebAudio ScriptProcessor Render Loop (4 Kanäle stereo gemischt)
    _onAudioProcess(e) {
      const outL = e.outputBuffer.getChannelData(0);
      const outR = e.outputBuffer.getChannelData(1);
      const len = outL.length;
      const s = this.state;
      const mod = this.currentMod;

      if (!s.playing || !mod) {
        outL.fill(0); outR.fill(0);
        return;
      }

      const sampleRate = (this.ctx && this.ctx.sampleRate) ? this.ctx.sampleRate : 44100;
      for (let i = 0; i < len; i++) {
        if (s.tickSampleCounter <= 0) {
          if (s.curTick === 0) {
            this._processRow();
          } else {
            this._processTick();
          }
          s.curTick++;
          const curSpeed = (s.speed > 0) ? s.speed : 6;
          if (s.curTick >= curSpeed) {
            s.curTick = 0;
            if (s.jumpOrder !== null) {
              s.curOrder = s.jumpOrder;
              s.curRow = s.breakRow || 0;
              s.jumpOrder = null;
              s.breakRow = 0;
              if (s.curOrder >= mod.songLength) {
                if (s.looping) {
                  s.curOrder = (mod.restartPos < mod.songLength) ? mod.restartPos : 0;
                  s.curRow = 0;
                  s.speed = 6;
                  s.bpm = 125;
                  s.samplesPerTick = Math.round(sampleRate * 2.5 / 125);
                } else {
                  s.playing = false;
                  break;
                }
              }
            } else {
              s.curRow++;
              if (s.curRow >= 64) {
                s.curRow = 0;
                s.curOrder++;
                if (s.curOrder >= mod.songLength) {
                  if (s.looping) {
                    s.curOrder = (mod.restartPos < mod.songLength) ? mod.restartPos : 0;
                    s.speed = 6;
                    s.bpm = 125;
                    s.samplesPerTick = Math.round(sampleRate * 2.5 / 125);
                  } else {
                    s.playing = false;
                    break;
                  }
                }
              }
            }
          }
          const spt = (s.samplesPerTick > 0) ? s.samplesPerTick : Math.round(sampleRate * 2.5 / 125);
          s.tickSampleCounter += spt;
        }
        s.tickSampleCounter--;

        let mixL = 0, mixR = 0;
        for (let ch = 0; ch < 4; ch++) {
          const state = s.channels[ch];
          const smp = state.sample;
          if (!smp || !smp.data || smp.data.length === 0 || state.period <= 0 || state.volume <= 0) continue;

          let intPos = Math.floor(state.pos);
          if (intPos >= smp.length) {
            if (smp.repeatLength > 2) {
              state.pos = smp.repeatOffset + (state.pos - smp.length) % smp.repeatLength;
              intPos = Math.floor(state.pos);
            } else {
              continue;
            }
          }

          if (intPos < smp.data.length) {
            const raw = smp.data[intPos] / 128.0;
            const vol = (state.volume / 64.0) * 0.22;
            // Amiga Stereo-Panning (75/25 Verteilung für angenehmen Kopfhörerklang)
            const panL = (ch === 0 || ch === 3) ? 0.75 : 0.25;
            const panR = (ch === 1 || ch === 2) ? 0.75 : 0.25;
            mixL += raw * vol * panL;
            mixR += raw * vol * panR;

            // Pitch Modifikation (Vibrato)
            let period = state.period;
            if (state.vibDepth > 0) {
              const vibOffset = Math.sin(state.vibPos * (Math.PI / 16)) * state.vibDepth;
              period = Math.max(113, period + vibOffset);
              state.vibPos = (state.vibPos + (state.vibSpeed || 4)) % 32;
            }

            const freq = 3546895.0 / period;
            state.pos += freq / sampleRate;
          }
        }
        outL[i] = mixL;
        outR[i] = mixR;
      }
    }
  };

  if (typeof SW !== 'undefined') {
    SW.ModPlayer = ModPlayer;
  } else if (typeof window !== 'undefined') {
    window.SW = window.SW || {};
    window.SW.ModPlayer = ModPlayer;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModPlayer;
  }
})();
