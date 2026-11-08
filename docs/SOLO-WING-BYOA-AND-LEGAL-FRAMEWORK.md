# SOLO WING 1990 — BYOA & RECHTSSICHERE FAN-PROJECT ARCHITEKTUR

**Autor:** Antigravity (Hermes Agent / Lead Architect)  
**Datum:** 2026-11-07  
**Status:** Verifiziert & Implementiert (`js/byoa_bridge.js`, `js/squadron.js`, `js/carrier_economy.js`, `js/holo_chat.js`, `js/squadron_ui.js`)  
**Geltungsbereich:** `C:/Users/tretboot/AgentHome/solo_wing_1990`  

---

## 1. Executive Summary & Leitprinzip

Um ein vollständiges, hochqualitatives Weltraumkampfspiel mit der epischen Atmosphäre von *Wing Commander 1 & 2*, *Wing Commander: Armada* und *Privateer 1 & 2* zu schaffen, ohne urheberrechtliche Risiken einzugehen, folgt *Solo Wing 1990* dem etablierten Gold-Standard moderner Fan-Projekte (analog zu *OpenRA*, *ScummVM*, *OpenXcom*, *Ship of Harkinian*):

> **Leitsatz:** "Das Spiel wird vollständig spielbar mit eigenen, freien Assets ausgeliefert. Urheberrechtlich geschützte Originalinhalte (FMV-Videos, Sprachausgabe, CD-Audio, originale Sprites) werden niemals gebündelt, sondern dynamisch aus lokalen Installationen des Spielers (Steam / GOG) eingebunden (Bring-Your-Own-Assets)."

---

## 2. Die drei Asset-Ebenen

```
+--------------------------------------------------------------------------------+
|                               SOLO WING 1990                                   |
+--------------------------------------------------------------------------------+
|  EBENE 1: CORE REPO & BASE BUILD (100% Frei / Redistributable)                |
|  - Vollständige Spiel-Engine, States, Flugmodell, Canvas/WebGL-Renderer       |
|  - Howard Day & Arne Niklas Jansson Pixel-Art (544 Blickwinkel, CC-BY)         |
|  - Prozeduraler WebAudio Synthesizer für SFX und Chiptune-Soundtrack          |
|  - Prozedurales CRT-Cockpit, MFDs, UI-Karten, Notfall-Fax-Renderer             |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
|  EBENE 2: BRING-YOUR-OWN-ASSETS (BYOA BRIDGE — Lokal gemountet)              |
|  - Steam: Privateer 2 The Darkening (C:...\Steam\...\Privateer 2 The Darkening) |
|    -> Echte FMV-Videos (.mp4 / Movies), Dialogszenen (Bex, Hephaestus)         |
|  - Steam: Wing Commander Armada (D:\SteamLibrary\...\Wing Commander Armada)    |
|    -> Sektor-Layouts, Kampagnen-Templates, Handbuch-Referenzen                 |
|  - GOG / Kilrathi Saga Installationspfade                                     |
+--------------------------------------------------------------------------------+
                                       |
                                       v
+--------------------------------------------------------------------------------+
|  EBENE 3: AMIGA 1200 AGA RETRO-SOUNDTRACK (.MOD TRACKER PIPELINE)              |
|  - Originale 4-Kanal ProTracker-Module aus Wing Commander 1 (Amiga)            |
|  - Browser: chiptune2.js / libopenmpt WASM Wiedergabe                         |
|  - Amiga Hardware: Direkte Paula 8-Bit DMA Wiedergabe (0% CPU Last)           |
+--------------------------------------------------------------------------------+
```

---

## 3. Technische Umsetzung der BYOA-Bridge (`js/byoa_bridge.js`)

Die `SW.BYOA`-Komponente überwacht die lokale Laufzeitumgebung und ermöglicht ein nahtloses Umschalten zwischen prozeduralem Standard und externen Original-Assets:

1. **Lokale Pfad-Erkennung:**
   - Armada: `D:\SteamLibrary\steamapps\common\Wing Commander Armada`
   - Privateer 2: `C:\Program Files (x86)\Steam\steamapps\common\Privateer 2 The Darkening`
2. **Audio-Backend Umschaltung:**
   - `SW.BYOA.setAudioBackend('procedural')` -> 8-Bit WebAudio Synthesizer mit dynamischer FM-Synthese.
   - `SW.BYOA.setAudioBackend('amiga_mod')` -> Authentischer ProTracker `.mod` Sound via Paula DMA Emulation.
   - `SW.BYOA.setAudioBackend('stream_rip')` -> CD-Audio / digitalisierter Soundtrack.
3. **Video-Backend Umschaltung:**
   - `crt_canvas` -> Integrierter Vektorgrafik- und CRT-Phosphor-Dialog-Renderer.
   - `fmv_native` -> Lokales Einbetten der extrahierten `.mp4`-Videoclips aus dem Privateer 2 Verzeichnis.

---

## 4. Armada-Staffelverwaltung (`js/squadron.js` & `js/squadron_ui.js`)

Nach dem Vorbild von *Wing Commander: Armada* besitzt jedes Raumschiff auf dem Träger `TCS Nadir` eine dauerhafte Identität:

- **Schiffsklassen:** Hornet (Standardjäger), Scimitar (Schwerer Jäger), Rapier (Überlegenheit), Drakhri/Bomber.
- **Individuelle Persistenz:** Jedes Schiff besitzt Seriennummer (z. B. `ALPHA-01`, `BRAVO-02`), Rumpfintegrität, Schildgenerator-Effizienz, Triebwerksleistung sowie getrennte Statusanzeigen für linke und rechte Bordkanone (`OK`, `DAMAGED`, `OFFLINE`).
- **Pilotenzuweisung:** Piloten aus `crew.js` (Dieter Modem, Konstanze Röhre, Sechs, Unit 0-B) können interaktiv per Tastendruck (`[P]`) oder Klick auf Schiffe verteilt werden.
- **Hangar-Reparatur & Upgrades:**
  - Reparatur (`[R]`): Kostet 25 Credits und 1 Ersatzteilkiste.
  - Upgrades (`[U]`): Afterburner Mk II (+25% Speed), Verstärkte Panzerung (+30% Rumpf), Militär-Schilde (+40% Laderate), Übertaktete Laser (+20% Schaden).

---

## 5. Privateer 1 Versorgungsökonomie (`js/carrier_economy.js`)

Die Wirtschaft folgt einer dreistufigen Heldenreise:

- **Rang 1 (Flugoffizier):** Der Spieler fliegt Einsätze. Die Versorgung des Trägers (Treibstoff, Munition, Rationen) erfolgt automatisch im Hintergrund durch die KI-Schiffsverwaltung. Knappheit spürt der Spieler nur indirekt durch beschränkte Hangar-Ressourcen.
- **Rang 2 (Staffelführer / Hangar-Lead):** Freischaltung der Budgetkontrolle. Reparaturen und Schiffs-Upgrades müssen mit verdienten Missions-Credits und erbeuteten Ersatzteilkisten bezahlt werden.
- **Rang 3 (Flotten-Admiral):** Vollständige Sektorlogistik analog zu *Armada*. Koordination von Versorgungsfrachtern (`TCS Haiku-Supply`, `Bex Express`, `Nemotron Cargo VII`), Aufbau von Asteroiden-Minenstationen und Sicherung von Konvoi-Routen.

---

## 6. Space-IRC & Holochat mit Notfall-Fax (`js/holo_chat.js`)

- **Pilotenkabinen-Terminal:** Im Quartier des Spielers ermöglicht ein 56k-Terminal schnellen Zugriff auf `#staffel-42`, `#flotten-intel` und `#technik`.
- **Crew-Chatter:** Lebendige Dialoge mit Dieter Modem, Konstanze Röhre, Wartungsdrohne Unit 0-B und Hangar-Ingenieurin Tina Bolzen.
- **Notfall-Fax Fallback (`[F]`):** Bei Subraum-Störsendern oder Kilrathi-ECM schaltet die taktische Führung automatisch auf analoges Endlos-Thermopapier-Fax um — der absurde Humor des Spiels erklärt: *Die feindlichen Alien-Systeme verfügen über keinerlei Treiber für 8-Pin-Nadeldrucker und analoge Zweidraht-Modems!*

---

## 7. Amiga 1200 AGA Backport-Spezifikation

Für den späteren Export auf Amiga 1200 AGA Hardware (Motorola 68EC020 @ 14,32 MHz, 2 MB Chip-RAM) gelten folgende verbindliche Architektur-Regeln:

1. **Fixed-Point Mathematik:** Alle Vektoroperationen müssen in `int32_t` 16.16 Fixed Point formuliert sein (keine Hardware-FPU vorhanden).
2. **Tracker-Audio:** 4-Kanal 8-Bit Amiga ProTracker `.mod`-Dateien belasten die CPU mit 0% Rechenzeit, da die Paula-Hardware Audiodaten per DMA autonom aus dem Chip-RAM streamt.
3. **Speicher-Budget (2 MB Chip-RAM):**
   - Framebuffer Dual-Playfield 320x256 (5 Bitplanes): ~80 KB
   - Audio-Samples & Module: ~350 KB
   - Schiffs-Sprites (quantisiert auf 32 Blickwinkel à 64x64, 16 Farben): ~600 KB
   - Freier Puffer für Spiellogik & UI: ~970 KB

---

## 8. Verifikations-Nachweis

- **Smoke-Test:** Alle 33 Skripte in `_smoke_test.js` erfolgreich validiert (9/9 Testsuiten grün).
- **Headless Browser Verifikation:**
  - Screenshot `v1.0_05_holochat_space_irc.png` (Space-IRC auf Port 8088 erfasst).
  - Screenshot `v1.0_06_squadron_armada_hangar.png` (Armada Staffelverwaltung auf Port 8088 erfasst).
- **Dauerhafte Sicherung:** Alle Bildnachweise und Release-Archive liegen konsistent unter `solo_wing_1990/releases/v0.9-classic-archive/screenshots/`.
