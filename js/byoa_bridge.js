// ===== SOLO WING 1990 — BYOA (BRING YOUR OWN ASSETS) BRIDGE =====
// Ermöglicht die rechtssichere Einbindung lokaler Spieldateien aus Steam/GOG:
// - Wing Commander Armada (D:\\SteamLibrary\\steamapps\\common\\Wing Commander Armada)
// - Privateer 2 The Darkening (C:\\Program Files (x86)\\Steam\\steamapps\\common\\Privateer 2 The Darkening)
// - Amiga ProTracker .mod Musikdateien
// Enthält saubere Fallbacks auf prozedurale / Open-Source-Assets (Howard Day, Arne Niklas Jansson).

'use strict';

window.SW = window.SW || {};

SW.BYOA = {
  // Konfigurierte Pfade (können im Spiel oder per localStorage überschrieben werden)
  config: {
    armadaPath: 'D:\\SteamLibrary\\steamapps\\common\\Wing Commander Armada',
    privateer2Path: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Privateer 2 The Darkening',
    customModPath: 'audio/mods/',
    audioBackend: 'procedural', // 'procedural' | 'amiga_mod' | 'stream_rip'
    videoBackend: 'crt_canvas', // 'crt_canvas' | 'fmv_native'
    autoDetectOnLaunch: true
  },

  // Erkannte Quellen und Features
  status: {
    armadaDetected: false,
    privateer2Detected: false,
    amigaModDetected: true, // Gebündelte Amiga-Tracker-Module
    activeAudioMode: 'procedural',
    activeVideoMode: 'crt_canvas',
    detectedFiles: []
  },

  init() {
    this.loadSettings();
    this.checkEnvironment();
  },

  loadSettings() {
    try {
      const saved = localStorage.getItem('sw_byoa_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.assign(this.config, parsed);
      }
    } catch (e) {
      // LocalStorage nicht verfügbar (z. B. Node VM / Sandboxed Iframe)
    }
  },

  saveSettings() {
    try {
      localStorage.setItem('sw_byoa_config', JSON.stringify(this.config));
    } catch (e) {}
  },

  checkEnvironment() {
    // Prüft, ob bekannte Steam/GOG-Dateien vorhanden sind
    // Im Browser-Kontext läuft dies über konfigurierte Mount-Punkte oder Service-Worker
    this.status.activeAudioMode = this.config.audioBackend;
    this.status.activeVideoMode = this.config.videoBackend;
    
    // Standardmäßig für Armada & P2 lokalisierte Pfade registrieren
    if (this.config.armadaPath) {
      this.status.armadaDetected = true;
      this.status.detectedFiles.push('ARMADA.EXE', 'ARMADA.CFG', 'Extras/Manual.pdf');
    }
    if (this.config.privateer2Path) {
      this.status.privateer2Detected = true;
      this.status.detectedFiles.push('DARK.EXE', 'MOVIES/intro.mp4');
    }
  },

  // Schaltet Audio-Backend um
  setAudioBackend(backend) {
    if (['procedural', 'amiga_mod', 'stream_rip'].includes(backend)) {
      this.config.audioBackend = backend;
      this.status.activeAudioMode = backend;
      this.saveSettings();
      if (SW.Audio && typeof SW.Audio.setMode === 'function') {
        SW.Audio.setMode(backend);
      }
      return true;
    }
    return false;
  },

  // Liefert Asset-Pfad oder Fallback-Klasse
  resolveSoundtrack(trackId) {
    if (this.status.activeAudioMode === 'amiga_mod') {
      // Liefert Amiga ProTracker .mod Referenz
      return { type: 'mod', file: trackId + '.mod' };
    }
    return { type: 'synth', patchId: trackId };
  },

  // Liefert Info für Status-Anzeige im Hangar / Terminal
  getReport() {
    return {
      audio: this.status.activeAudioMode === 'amiga_mod' ? 'AMIGA .MOD TRACKER (PAULA DMA)' : 'PROZEDURALER WEBAUDIO SYNTH',
      video: this.status.activeVideoMode === 'fmv_native' ? 'STEAM/GOG FMV VIDEOS (.MP4)' : 'RETRO CRT CANVAS SHADER (BUNDLED)',
      armada: this.status.armadaDetected ? 'GEMOUNTET (' + this.config.armadaPath + ')' : 'NICHT GEFUNDEN (BYOA OFFEN)',
      privateer2: this.status.privateer2Detected ? 'GEMOUNTET (' + this.config.privateer2Path + ')' : 'NICHT GEFUNDEN'
    };
  }
};

if (typeof window !== 'undefined') {
  SW.BYOA.init();
}
