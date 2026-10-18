// ===== SOLO WING 1990 — TEXT-TO-SPEECH (Beta v2) =====
// Web Speech API. Feature-Detection. Toggle mit M.
// v2: Verschiedene Stimmen pro Charakter + extremere Pitch-Unterschiede
//     + Voice-Rotation (jeder NPC bekommt eine eigene Stimme, wenn verfügbar)
//     + Mikro-Variation pro Satz (klingt weniger roboterhaft)

SW.TTS = {
  enabled: true,
  supported: false,
  utterance: null,
  _voicePool: [],       // alle verfügbaren de-Stimmen
  _charVoiceMap: {},    // charKey → voice-Index (stabil pro Session)

  init() {
    this.supported = ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
    console.log('[TTS] supported:', this.supported);
    if (!this.supported) return;
    const load = () => {
      this.voices = window.speechSynthesis.getVoices();
      // Deutsche Stimmen sammeln (für Voice-Rotation)
      this._voicePool = this.voices.filter(v => v.lang && v.lang.toLowerCase().indexOf('de')===0);
      console.log('[TTS] de voices found:', this._voicePool.length, this._voicePool.map(v=>v.name).join(', '));
      // Pro Charakter eine feste Stimme zuweisen (Hash → Index)
      this._charVoiceMap = {};
      const keys = Object.keys(this.profiles);
      for (const k of keys) {
        let h = 0;
        for (let i=0; i<k.length; i++) h = (h*31 + k.charCodeAt(i)) & 0xffff;
        this._charVoiceMap[k] = this._voicePool.length > 1 ? (h % this._voicePool.length) : 0;
      }
    };
    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  },

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) window.speechSynthesis.cancel();
    return this.enabled;
  },

  // Char-Profil: rate/pitch/lang — EXTREME Unterschiede für Erkennbarkeit
  profiles: {
    commander: { rate: 0.72, pitch: 0.55, lang: 'de-DE' },  // müde, SEHR flach, langsam
    sechs:     { rate: 0.82, pitch: 0.35, lang: 'de-DE' },  // angetrunken, SEHR tief
    neun:      { rate: 1.35, pitch: 1.80, lang: 'de-DE' },  // nervös, SEHR hoch
    barkeep:   { rate: 1.05, pitch: 0.50, lang: 'de-DE' },  // maschinell, monoton, tief
    zwo:       { rate: 0.88, pitch: 1.00, lang: 'de-DE' },  // zynisch, normal, ruhig
    vier:      { rate: 1.25, pitch: 1.50, lang: 'de-DE' },  // optimistisch, hell, schnell
    admiral:   { rate: 0.65, pitch: 0.45, lang: 'de-DE' },  // wichtig, SEHR langsam, tief
    kuche:     { rate: 1.10, pitch: 1.30, lang: 'de-DE' },  // scharf, hoch
    technik:   { rate: 0.95, pitch: 0.85, lang: 'de-DE' },  // sachlich, leicht tief
    stempel:   { rate: 0.90, pitch: 1.10, lang: 'de-DE' },  // bürokratisch, leicht hoch
    ausbilder: { rate: 0.80, pitch: 0.70, lang: 'de-DE' },  // müde, deadpan, 1990
    klo:       { rate: 0.95, pitch: 1.05, lang: 'de-DE' },  // ruhig, wahr, knapp
    optimierer:{ rate: 1.00, pitch: 1.00, lang: 'de-DE' },  // PERFECT. Nicht zu tief. Nicht zu hoch.
    kugelschreiber: { rate: 1.10, pitch: 0.75, lang: 'de-DE' } // frei, tief, lacht
  },

  // NPC-Name → Profil-Key (vollständig, mit Fallback)
  charKey(npc) {
    const n = (npc||'').toUpperCase();
    if (n.indexOf('COMMANDER')>=0) return 'commander';
    if (n.indexOf('SECHS')>=0) return 'sechs';
    if (n.indexOf('NEUN')>=0) return 'neun';
    if (n.indexOf('BARKEEP')>=0 || n.indexOf('KAFFEE')>=0) return 'barkeep';
    if (n.indexOf('ZWO')>=0) return 'zwo';
    if (n.indexOf('VIER')>=0) return 'vier';
    if (n.indexOf('ADMI')>=0 || n.indexOf('KLETT')>=0 || n.indexOf('KLAPP')>=0) return 'admiral';
    if (n.indexOf('KRÜMEL')>=0 || n.indexOf('WURST')>=0 || n.indexOf('KÜCHE')>=0 || n.indexOf('RAGNHILD')>=0) return 'kuche';
    if (n.indexOf('DISKETTEN')>=0 || n.indexOf('BOLZEN')>=0 || n.indexOf('INGENIEUR')>=0 || n.indexOf('BOLT')>=0) return 'technik';
    if (n.indexOf('STEMPEL')>=0 || n.indexOf('STECH')>=0 || n.indexOf('PROTOKOLL')>=0) return 'stempel';
    if (n.indexOf('KLOPSTOCK')>=0) return 'admiral';
    if (n.indexOf('SCHERENFLICK')>=0) return 'vier';
    if (n.indexOf('PFLASTER')>=0) return 'kuche';
    if (n.indexOf('SYSTEM')>=0) return 'barkeep';
    if (n.indexOf('AUSBILDER')>=0) return 'ausbilder';
    if (n.indexOf('KLO')>=0 && n.indexOf('KLOPSTOCK')<0) return 'klo';
    if (n.indexOf('OPTIMIERER')>=0) return 'optimierer';
    if (n.indexOf('KUGELSCHREIBER')>=0) return 'kugelschreiber';
    // Fallback: Hash → Profil (damit jeder Char eine eigene Tonalität hat)
    let h = 0;
    for (let i=0; i<n.length; i++) h = (h*31 + n.charCodeAt(i)) & 0xffff;
    const keys = Object.keys(this.profiles);
    return keys[h % keys.length];
  },

  // Bereinigt den Text: entfernt Stage-Directions (*Klicken*, *seufzt*) und NPC-Präfixe.
  // NUR der eigentliche Dialog wird gesprochen.
  cleanText(text) {
    let t = (text||'').trim();
    // NPC-Präfix entfernen (z.B. "COMMANDER: ...")
    const colon = t.indexOf(':');
    if (colon > 0 && colon < 20) t = t.substring(colon+1).trim();
    // Stage-Directions in Sternchen entfernen (*Klicken*, *seufzt*, *Koffein nicht verfügbar* ...)
    t = t.replace(/\*[^*]*\*/g, ' ');
    // Mehrere Leerzeichen zusammenfassen
    t = t.replace(/\s+/g, ' ').trim();
    return t;
  },

  // Wählt die Stimme für einen Charakter (stabil pro Session, variiert pro Satz)
  _pickVoice(charKey) {
    if (!this._voicePool || this._voicePool.length === 0) return null;
    if (this._voicePool.length === 1) return this._voicePool[0];
    // Feste Zuweisung pro Charakter (aus _charVoiceMap)
    const idx = this._charVoiceMap[charKey] || 0;
    return this._voicePool[idx % this._voicePool.length];
  },

  speak(text, npc) {
    if (!this.enabled || !this.supported) { console.log('[TTS] skip:', !this.enabled?'disabled':'unsupported'); return; }
    const clean = this.cleanText(text);
    if (!clean) { console.log('[TTS] skip: empty after clean'); return; }
    const key = this.charKey(npc);
    console.log('[TTS] speak:', npc, '→', key, clean.substring(0,40));
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(clean);
      const prof = this.profiles[key] || this.profiles.commander;
      // Mikro-Variation: ±5% Pitch, ±3% Rate (macht es weniger roboterhaft)
      const pitchVar = 1 + (Math.random()*0.10 - 0.05);
      const rateVar = 1 + (Math.random()*0.06 - 0.03);
      u.rate = Math.max(0.5, Math.min(2.0, prof.rate * rateVar));
      u.pitch = Math.max(0.1, Math.min(2.0, prof.pitch * pitchVar));
      u.lang = prof.lang;
      // Stimme: Charakter-spezifisch aus Pool
      const voice = this._pickVoice(key);
      if (voice) u.voice = voice;
      else if (this.voices && this.voices.length) {
        const de = this.voices.find(v => v.lang && v.lang.toLowerCase().indexOf('de')===0);
        if (de) u.voice = de;
      }
      this.utterance = u;
      window.speechSynthesis.speak(u);
    } catch(e) { /* TTS ist Beta — Fehler still ignorieren */ }
  },

  cancel() {
    if (this.supported) { try { window.speechSynthesis.cancel(); } catch(e){} }
  }
};
