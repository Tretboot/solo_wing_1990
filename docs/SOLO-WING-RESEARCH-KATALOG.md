# SOLO WING: OPEN-SOURCE-RECHERCHE, ASSET-KATALOG & AMIGA 1200 EVALUATION
## Dokumentation der Referenzen, Tools, Fangames & Backport-Architektur

---

### 1. Das `WCR_GL`-Web-Projekt & Die Unity-Frage

#### Was ist `WCR_GL` (`https://www.hedfiles.net/WCR_GL/index.html`)?
* **Status:** Der exakte Build aus Howard Days Demo läuft lokal auf Port **8087** (`http://127.0.0.1:8087/index.html`).
* **Technologie:** Es handelt sich um einen **Unity WebGL / WebAssembly (wasm)**-Export des `WCUnity`-Repositories.
* **Features der Demo:**
  - Voll animiertes Hornet-Cockpit mit Steuerknüppel (Piloten-Handschuhe folgen Neigung & Rollen).
  - Vollständige 544-Blickwinkel-Shader-Projektion für Dralthi und Hornet.
  - Funktionierende MFDs (Drahtgittermodelle, Schildanzeigen, Geschwindigkeit, Waffenwahl).
  - Dynamisches Normal-Mapping für Cockpit-Instrumente bei Laser- und Triebwerksfeuer.

#### Ist Unity Open Source?
* **Nein.** Unity ist eine **proprietäre, kommerzielle Game-Engine** (Unity Technologies).
* Der C#-Code von Howard Day (`WCUnity`) ist zwar auf GitHub frei einsehbar und nutzbar, die zugrundeliegende C++-Runtime von Unity ist jedoch geschlossen.
* **Konsequenzen für unser Projekt:**
  - *Unity:* Sehr schnelle Prototypen, aber große WebGL-Builds (~25 MB), proprietäres Ökosystem, keine Portierbarkeit auf Retro-Hardware (Amiga/PS1).
  - *Godot Engine (C# / GDScript):* **100% Open Source (MIT-Lizenz)**, leichtgewichtig (~50 MB Editor, ~10 MB Web-Export), modern, frei auf GitHub veröffentlichbar.
  - *WebGL / Three.js / Canvas:* **100% Open Source**, direkt im Browser ohne Build-Pipeline lauffähig, maximale Freiheit.
  - *ANSI C + SDL2 (`wc2-re` / Raylib):* **100% Open Source**, höchste Portabilität – vom PC über Web (via Emscripten) bis hin zum Amiga!

---

### 2. Evaluation: Amiga 1200 Backport (AGA-Architektur)

Ein späterer Backport auf den **Amiga 1200 (AGA)** ist machbar, wenn von Tag 1 an saubere architektonische Leitplanken eingehalten werden:

#### Die Hardware-Grenzen des A1200:
* **CPU:** Motorola 68EC020 @ 14,32 MHz (reine Integer-Rechenleistung, **KEINE FPU** im Standardmodell!).
* **RAM:** 2 MB Chip RAM (wird von Video, Blitter, Audio und CPU geteilt; Bandbreite ca. 7 MB/s).
* **Grafik:** AGA-Chipsatz (Advanced Graphics Architecture) – 256 Farben aus 16,7 Millionen (8 Bitplanes, planar) oder Dual Playfield (2x 16 Farben).
* **Chunky-to-Planar (C2P):** 3D-Software-Rendering erfordert Umrechnung von linearen Pixelpuffern (Chunky) in Bitplanes (Planar) – ein klassischer Flaschenhals auf 14 MHz 68020.

#### Was wir ab sofort beachten müssen (Vermeidung späterer Sackgassen):
1. **Fixed-Point Mathematik (16.16) statt Floating Point:**
   - Flugphysik, Vektoren, Matrix-Multiplikation und Distanzberechnungen müssen mit 32-Bit Integern (`int32_t`) implementiert werden. Ein 68020 ohne 68882-Koprozessor bricht bei `float`/`double` auf unter 2 FPS ein.
2. **Strikte Trennung von Game-Core und Renderer:**
   - Die gesamte Spiel-, Sektor-, KI- und Missionslogik muss in reinem, plattformunabhängigem ANSI C formuliert sein. Der Renderer (WebGL / SDL2 / Amiga AGA C2P) ist lediglich ein austauschbares Frontend.
3. **Farbtiefen- & Asset-Stufen (Palette-Pipeline):**
   - Die 544 Schiffs-Perspektiven bei 256x256 in 32-Bit RGBA belegen unkomprimiert ~130 MB – unmöglich für 2 MB Chip RAM!
   - *Lösung für Amiga:* Schiffe werden auf 32 oder 64 Blickwinkel und 64x64/96x96 Pixel in 16 oder 32 indizierten Farben herunterquantisiert (wie im originalen Amiga WC1 von Mindscape). Die Skalierung im Raum übernimmt der Blitter oder eine optimierte CPU-Skalierungsroutine.
4. **Audio:**
   - Audio-Effekte und Musik direkt kompatibel zu ProTracker 4-Kanal MOD / TFMX halten.

---

### 3. Open-Source-Katalog: Tools, Engines & Fangames

#### A. Reverse-Engineering & Rekonstruktionen
* **`neuromancer/wc1-re` & `wc2-re` (GitHub, GPLv3):**
  - Vollständige ANSI C Rekonstruktion der Kilrathi Saga mit modernem SDL2-Wrapper.
  - Enthält sauberen C-Quelltext für Missionsaufbau (`cmpgn.c`), Flugphysik (`ship.c`), Schiffs-KI (`brains.c`) und Zwischensequenzen.
* **HCl's Wing Commander Tools (Mario Brito / WCNews):**
  - `wcmf` (Wing Commander Movie File Extractor), `treman` (Resource Archive Packer), `iffconv` (Palette- und Sprite-Konverter für Original-Dateien).

#### B. Fangames & Community-Engines
* **`Howard-Day/WCUnity` (GitHub):**
  - Unity-Projekt mit vollem Quelltext des SpritePickers, C#-AtlasEncoders und Shaders.
  - Enthält sämtliche 2x-Upscale-Sprites von Arne Niklas Jansson für 11 Schiffe, Cockpits und Normal-Maps.
* **`Vega Strike` (Open Source C++ / Python, GPL):**
  - Die Basis für *Wing Commander: Privateer Gemini Gold* und *Wing Commander Universe*. Große Open-World-Raumfahrt, aber sehr schwergewichtige C++-Codebase.
* **`Flight Commander` (Eddie Lun, Open Source C++):**
  - Klassischer WC1/WC2-Klon mit integriertem Missions- und Schiffs-Editor.
* **`Wing Commander Saga: The Darkest Dawn` (Freespace 2 SCP Engine):**
  - Vollständiges Fan-Spiel auf Basis des Quellcodes von Freespace 2 (FS2_Open). Fokus auf moderne 3D-Modelle statt Sprite-Art.

#### C. Amiga Homebrew & Retro-Engines
* **Scorpion Engine (Erik Hogan):**
  - Leistungsfähige Amiga-Engine für OCS/ECS/AGA mit automatischer Asset-Konvertierung, optimal für Hangar- und Dialog-Zwischensequenzen.
* **Dread Engine (Krzysztof Kluczek):**
  - Hochoptimierte 3D-Software-Engine für Stock Amiga 500/1200 (beweist, wie flüssig 3D-Projektion auf 14 MHz 68020 mit optimiertem Assembler-C2P läuft).
