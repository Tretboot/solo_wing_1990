# SOLO WING 1990

> **Sternenkorps — Flughandbuch — Formular 1-A**
> *Gedruckt auf Faxpapier. 1990. Auflage: 1. Exemplar: 1.*

Ein 1990er-Space-Shooter im Stil von Wing Commander 1. Browser-basiert, 2D, Pixel-Art,
Deadpan-Bürokratie-Humor. Der Träger **FAX-TRAGÖDIE** ist ein fliegendes Dorf.
Wir sind die müde Bürokratie — und das Audit will uns "optimieren".

---

## STARTEN

```
index.html im Browser öffnen.
```

Kein Server nötig. Kein Internet. Kein Tracking. Nur Fax.

**Steuerung:**
| Eingabe | Funktion |
|---------|----------|
| W/A/S/D oder Pfeile | Bewegen (Drift + animierte Piloten-Hand am Joystick) |
| SHIFT | Nachbrenner / höherer Vorschub (animierter Schubregler) |
| Q / E | Rollen |
| Maus | Zielen |
| Leertaste / Klick | Feuer (mit dynamischer RGBA-Mündungsfeuer-Beleuchtung für Cockpit & nahe Schiffe) |
| 1 / 2 / 3 / 4 (Im Flug) | Interaktiver Staffelfunk im **Linken Cockpit-VDU** + WC3 Video-Monitor oben links (`1` Angriff, `2` Formation, `3` Träger decken, `4` Feind-Funk) |
| Y / L (Im Flug) | Feindziel durchschalten / Auf dem aktuellen Träger (*TCS Fax-Tragödie* oder *TCS Hermes*) landen |
| ESC → [C] | Cheat- & Testmenü: Schiffsklasse wechseln (\[B]\), Grafikmodus umschalten (\[G]\: **Wingnut HD** 80 Ansichten ↔ **Amiga VGA \/2\** 40 Ansichten), Sofort-Reparatur aller Systeme (\[R]\) |
| K (Auf Träger & im Flug) | **Armada / Privateer 16-Sektor-Sternenkarte** (Flottenkommando, Rohstoffhandel, `[F]`/`[ENTER]` Sektor-Transitflug, `[Q]` Dienst quittieren -> Zwischensequenz & Geschenkschiff!) |
| N / J (Im Flug) | **Sektor-Navigationscomputer** einblenden (`[N]`) / Direkter Sprung zum nächsten verbundenen Nachbarsektor (`[J]`) |
| S / C (Auf Träger) | **Staffel-Hangar** (3D-Turntable, Upgrades, Reparatur) / **Holo-Chat** mit der Crew |
| T / V | Autopilot / Kamera-Ansicht (Cockpit → Chase → Top-Down) |
| M / O / P | TTS ein/aus / Sound ein/aus / Musik ein/aus |
| ESC | Menü / Offenes Overlay schließen |
| Klick (im Träger) | Türen / NPCs / START / Sektorkarte / Staffel / Deckplan / Savegame-Terminal / Versetzungsschalter |

> **Multi-Input:** Jedes aktive Gerät = +1 Laser-Slot (max 3).
> Wer mehr hat, der kann mehr. Das ist kein Bug. Das ist Physik.

---

## STATE MACHINE

```
INTRO → AKADEMIE → COCKPIT (Sim) → AKADEMIE (Ergebnis) → ARRIVAL → BAR → SHIP → BRIEFING_BOARD → …
  │         │                                                          │
  │         └── Sim-Flug (bestanden / nicht bestanden, Pro forma)      └── [ Taste ] → SHIP
  └── Asteroidenfeld → Pilotenname → Zuordnung

Mission: SHIP → … → TAKEOFF → COCKPIT → LANDING → HANGAR → DEBRIEFING (Sieg) → CREDITS → SHIP
Tod:     COCKPIT → DEBRIEFING (KONTAKT VERLOREN) → SHIP
```

- **ARRIVAL:** Zwischenszene nach der Akademie — Träger kommt näher, "Willkommen an Bord", dann in die Räume.
- **HANGAR:** Nach Landung. Bolt geht zum Schiff, kommentiert (je nach Schaden) → Sieg-Debriefing → Abspann (CREDITS) → Träger.
- **INFO:** Kleines Panel ([I] im Menü) — Version, MIT-Lizenz, Credits.

- **INTRO:** Asteroidenfeld (Drift + Ausweichen, nicht tot) → Pilotenname → Zuordnung
- **AKADEMIE:** Tutorial (Steuerung in der Story erklärt), Sim-Flug
- **BAR:** Scoreboard, Crew-Dialoge
- **SHIP:** 14 Räume auf drei Decks, Tür-Klick, Deckplan-Minimap und NPC-Dialoge
- **QUARTIERE:** Crew-Kabinen-Hub; zuerst ist das eigene, nach Pilotennamen benannte Quartier zugänglich
- **SAVE/LOAD:** Persönliches Terminal im Pilotenzimmer; Migration alter Kabinen-IDs erhält ältere Spielstände
- **COCKPIT:** WC1-Style mit Radar, Schilden, dynamischem Zielpanel, getrenntem Public- und Staffelfunk sowie persistentem Systemschaden mit optionaler Hangar-Reparatur
- **HANDBUCH:** Ingame- und Web-Handbuch mit sieben Kapiteln; Kapitel 7 erklärt Flug, Navigation, Schaden und Reparatur

---

## DATEISTRUKTUR

```
solo_wing_1990/
├── index.html          ← Spiel (Browser öffnen)
├── README.md           ← Diese Datei
├── PATCHNOTES.md       ← Patch Notes
├── KONZEPTE.md         ← Design-Überlegungen
├── TIMELINE.md         ← Story-Timeline (für die Bible)
├── TODO.md             ← Todo-Liste
├── WC1_PCI_ANALYSE.md  ← WC1 NPC-KI Referenz
├── js/ (20 Dateien)    ← Engine, Entities, Systems, UI, States, Ship, Quests,
│                         Akademie, Intro, NPC, Dialogue, Savegame, Newspaper, Manual
├── data/ (9 Dateien)   ← Missions, Dialogues, Systeme, Crew, Räume, Lore, Schiffe, Quests, Akademie
├── _smoke_test.js      ← Test (node _smoke_test.js)
├── sprites/            ← (leer, für PNG-Sprites)
└── site/               ← Projekt-Website
    ├── index.html      ← Start + Evaluation
    ├── design.html     ← Design-Bibel
    ├── team.html       ← Team
    ├── crew.html       ← Crew (18 Charaktere)
    ├── raeume.html     ← Räume (13)
    ├── konzepte.html   ← Konzepte
    ├── wiki.html       ← Wiki-Hub (organische Sammlung)
    ├── agent_benchmarks.html ← Agenten-Orchestrierung (Sideprojekt)
    ├── ethikrat.html   ← Blog: Ethikrat A/B-Test
    └── style.css       ← Gemeinsames CSS
```

---

## ARCHITEKTUR

**Vanilla JS, kein Framework.** Globaler Namespace `SW.*`.

| Datei | Inhalt |
|-------|--------|
| `js/config.js` | Konstanten (Canvas, Physik, Shield, Laser) |
| `js/engine.js` | 3D-Projection, Stars, Z-Sort |
| `js/sprites.js` | Prozedurale Pixel-Art (Schiffe, Carrier, Cockpit-Frame) |
| `js/entities.js` | Player, ShipRegistry, Enemies, Projectiles, Explosions, Carrier |
| `js/systems.js` | Collision, Autopilot, Flight, Briefing, Comm |
| `js/ship.js` | Träger-Interior (14 Räume auf 3 Decks, Quartiere, Deckplan und Save/Load-Panel) |
| `js/ui.js` | Cockpit-Overlay, Radar, Space Map, Comm, Briefing Board |
| `js/states.js` | State Machine (Game), Rendering pro State |
| `js/world.js` | World-State (Seed, System, Nachrufe, NPC-Placements) |
| `js/savegame.js` | Save/Load (localStorage, Export, Delete, rückwärtskompatible Schema-Migration) |
| `js/quests.js` | Quest-System (Overlay, Event-basiert) |
| `js/akademie.js` | Tutorial (Sim-Flug, Pro-forma) |
| `js/intro.js` | Intro (Asteroidenfeld, Name, Zuordnung) |
| `js/audio.js` | Prozedurales Audio (Web Audio API) |
| `js/tts.js` | Text-to-Speech (Web Speech API, 14 Profile) |
| `js/input.js` | Multi-Device Input (WASD/Pfeile/Maus/Gamepad) |
| `js/main.js` | Game Loop, Init, State-Dispatch |
| `js/npc.js` | NPC-Registry (11 Charaktere, prozedurale Gesichter, `drawFace`-API, Cockpit-Video) |
| `js/dialogue.js` | Smart-Dialogue-Engine (Context, req-Gates, Cooldown, Subplot-Stufen) |
| `js/newspaper.js` | Schiffszeitung (Generierung, Rendering, 5 Artikel-Typen) |
| `js/manual.js` | Ingame-Handbuch (7 Kapitel, progressiv freigeschaltet, Taste [H]) |

**Data-Dateien (reine Daten, kein DOM):**
| Datei | Inhalt |
|-------|--------|
| `data/missions.js` | 4 Missionen (m1–m4, m4 = DER FRACHTER) |
| `data/dialogues.js` | NPC-Dialoge (Bar, Räume, Briefings, Funkstörungs) |
| `data/systems.js` | 3 Sektoren (Sektor 7, 9, 12) |
| `data/crew.js` | 18 Crew-Charaktere + 5 Piloten |
| `data/rooms.js` | 14 Räume (Decks, Artstyle, NPCs, Türen) |
| `data/lore.js` | Worldbuilding (Audit, Piraten, Optimierer, KLO, Alien) |
| `data/ships.js` | 4 Schiffsklassen, 3 Cockpit-Layouts |
| `data/quests.js` | 5 Quests (Fax-basiert) |
| `data/akademie.js` | Tutorial-Dialog + Sim-Konfiguration |

---

## GIT (Kurzanleitung für Menschen, die Git noch nie geflogen sind)

Git ist das Logbuch des Schiffs. Jeder gesicherte Stand des Codes heißt
**Commit** — unänderlich, mit Zeitstempel und Begründung. So kann man
jederzeit zurückkehren, vergleichen oder einen Fehler auf eine Person
verweisen. In diesem Fall: auf niemanden. Formular 14-C (Selbstanzeige).

```
git status              Was ist geändert? (vor JEDEM Commit)
git diff                So sieht die Änderung aus
git add <datei>         Datei in den nächsten Commit geben
git commit -m "Text"    Commit: geaddete Dateien sichern + benennen
git log --oneline       Historie (neueste oben)
git checkout <datei>    Datei auf den letzten Commit zurücksetzen
```

**Commit-Convention (Sternenkorps-Standard):**
- Ein Commit = eine logische Änderung. Nicht "alles von heute um 23:47".
- Zeile 1: sachlich — was + warum. Beispiel: `fix: ui.js wiederhergestellt (Shell-Schaden)`
- Zeile 2 (optional): darf Deadpan sein. Konzept: `KONZEPTE.md` → v0.6.10.

**Regel:** Vor der Pause committen. Unverteilte Dateien sind unbekannte Flugobjekte.

**Unfall-Protokoll (Katze über der Tastatur):**
Wenn der Terminal-Fokus springt, Chat-Text im Terminal landet, die Shell
sich verspricht oder die Katze wieder über die Tastatur läuft: hier eintragen.
Git selbst lehnt leere Commits ab — der Rest ist Dokumentationspflicht.

- **2026-10-12 — „Der parallele Comitter":** Chat-Text landete im Terminal
  (Fokus-Sprung), die Shell spuckte zweimal „i" bzw. „man " vor `git` aus.
  Git lehnte die leeren Commits beide Male sauber ab (danke, `git status`
  vorher). Nebenprodukt: eine Handvoll Commits mit Namen wie `tet`, `test`,
  `ok`, `Sehr Fließig`, `Ich weiß nicht warum ich das kommentieren soll` —
  identifiziert als Katzenüberfall, nicht als zweiter Agent. Die Temp-Dateien
  aus dem Verwirrspiel sind aus dem Index entfernt (`9be090c`); die History
  bleibt, weil Katzenarbeit Arbeit ist.

- **2026-10-12 — „Die Website ohne Anzug":** `site/style.css` und
  `site/manual/index.html` waren in eine einzige Zeile zerlegt, in der
  `n` statt Zeilenumbrüchen stand (selbe Handschrift wie der
  ui.js-/npc.js-Schaden). Symptom: die Seite renderte komplett ohne
  Style, ohne dass ein einziger Link fehlerhaft war. Fix: `style.css`
  bytegenau aus `release/v0.6.5-rc/` wiederhergestellt (grünes
  Terminal-Look „wie Früher") + Regeln für den neuen manual/-Ordner
  ergänzt; `manual/index.html` aus dem intakten Inhalt umgeschrieben.
  Scan-Skript: `_csscheck.js` (Backtick-`n`-Detection über die ganze
  site/-Bäume).

---

## DER FEIND

- **Piraten (Kugelschreiber):** Tutorial-Gegner. Selbstmörderisch, in Schwärmen. Hört Rapmusik.
- **Das Audit:** Außerirdische Bürokratie. "Optimiert" Zivilisationen. Wireframe-Schiffe. Stempel statt Explosionen.
- **Das eingefrorene Alien (Kältekammer 7):** Es atmet. Man weiß nicht, was es ist.

> "But Sir, we ARE the bureaucracy." — Wir sind die müde Art. Die, die noch lacht.

---

## VERSION

**v0.85-rc (Wingnut / Dynamic Lighting / WC4-Intro / Armada-Privateer / TCS Hermes Pass)** — Umfassendes Grafik-, Physik-, Story- und Open-World-Upgrade durch **Antigravity / Gemini 4 Argon** für den GitHub-Release:
- **14 kompakte 80-View Multi-Angle Schiffs-Atlanten (`sprites/ships/*.png`):** Extrahiert und per Alpha-Unpremultiply + 1px Kontur veredelt aus HowieDays `WCUnity` (`hornet`, `hornet_ace`, `scimitar`, `valtar`, `talon`, `dralthi`, `salthi`, `krant`, `strakha`, `grikath`) sowie 4 eigene 3D-gerenderte Modelle (`fax_traegodie`, `hermes_carrier`, `hermes_drone`, `freighter`). Exakte 360°-Winkelmathematik (`YAW_STEPS = [31, 1, 3, ..., 29]`) passend zu `SpritePicker.cs` sowie echte 3D-Flugvektor-Rotation für alle Schiffe. Alle Texturen sind für einen Amiga-Port exakt durch 2 teilbar (`[G]` schaltet zwischen 80-View HD und 40-View Amiga `/2` um).
- **9 interaktive Cockpits & Dynamische Waffen-/Explosions-Beleuchtung:** Alle 9 fliegbaren Schiffe (`[B]`) besitzen eigene Cockpits inkl. echter transparenter RGBA-Waffenfeuer-Lightmaps (`_left_gun.png`, `_right_gun.png`), Schadens-Overlays, Terran- oder Kilrathi-Krallen-Steuerknüppel (`kilrathi_joystick.png`) und Echtzeit-Silhouette-Beleuchtung (`computeDynamicLight` + `source-atop`), bei der Laserfeuer und Explosionen nahe Schiffe und die eigene Cockpitkanzel einfärben.
- **Neues 3-Akt-Intro (WC1-Technik + WC4-Storytelling):** Einsamer Transporter im Asteroidenfeld mit WC4-Introschrift → Piraten-Hinterhalt → Sprung-Rettung durch die *TCS Fax-Tragödie* und ihre Hornets → Jobangebot nach Simulator-Test („Wird besser bezahlt, als sich von Piraten abschießen zu lassen — Hauptaufgabe: Piraten abschießen!").
- **Dienst Quittieren (`RESIGNATION`-Zwischensequenz), Geschenkschiff & Sektor-zu-Sektor-Navigation:** Wer den Militärdienst per `[Q]` oder im Dialog quittiert, erlebt eine 3-teilige Zwischensequenz, erhält eine nach gespielten Missionen skalierte Abfindung (`1.800 + Missionen × 950 CR`) sowie ein geschenktes Veteranen-Schiff (*Kiste 47*, *Alte Scimitar*, *Beute-Dralthi* oder *KIWI-Mk.IV*) und kann über die 16-Sektor-Sternenkarte (`[K]` → `[F]`/`[ENTER]`) oder den Cockpit-Navcomputer (`[N]` → `[J]`) echte Sektor-zu-Sektor-Transitflüge mit Sprungbojen (`nav_light.png`), Handelskonvois und Zoll-/Piraten-Begegnungen absolvieren.
- **KI-Träger *TCS Hermes* & Branching Storylines (`m5`, `m6a`, `m6b`):** Neuer Träger *TCS Hermes* (`tcs-hermes`), betrieben von Robotern und KI (`HERMES-KERN`, `WORKER-7`, `REVIEWER-9`) als Hommage an den Hermes-Agentenschwarm, mit eigenem Raum-Pixel-Filter, kybernetischen Neural-Leitungen und verzweigenden Missionen.

**v0.75-dev (Argon-Pass)** — IM RAUM (Flugmodell & Kampfspür) + Argon-Vollverkabelung: Vorschub + Nachbrenner [SHIFT], relative Projektion, Feind-KI (`approach → strafe → break`), Wingman "SECHS", Träger im Feld, Phantom-Start-Bugfix, Missionsbaum, SmartDialogues, Fax-Quests, *DIE TRÄGER-POST*, 5 Geheimakten, 3 Enden (Sieg / Tod / Geheim).

**v0.70-dev** — Abspann/Credits: Nach dem Sieg-Debriefing läuft der rollende Abspann (1990-Style) — Crew-Liste aus `SW.Crew`, Pilotenname, Produktions-Credits; [LEER] = Weiterspulen, [ESC] = schließen. Tod geht ohne Abspann direkt zum Träger. GitHub-Repo ist live: `tretboot/solo_wing_1990` (Push + Tag `v0.6.9-final`).

**v0.6.9-final** — Quartiere auf dem Träger: Jeder Charakter bekommt einen eigenen Raum, inklusive NPCs; Save/Load-Panel (Speichern/Laden/Export/Löschen, localStorage), Intro-Musik-Fix (loop, Stille in Menüs, [P] für beide Systeme), Dialog-Box (Höhe, Umbruch, Paging, Sprecher-Gesichter), Repo-Cleanup für GitHub.

**v0.6.5-rc** — Cheatmenü + Wandkarte + 7 neue NPCs + Transfer-Zwischenszene + Hangar→Debriefing + Rollen (Q/E) + Nav-Karte (N) + Info-Panel + MIT-Lizenz.

---

## HANDOFF-DOKUMENTATION FÜR ZUKÜNFTIGE AGENTEN (ARCHITEKTUR & INVARIANTEN)

Wenn du als zukünftiger KI-Agent (oder menschlicher Entwickler) an `solo_wing_1990` weiterarbeitest, beachte bitte folgende Architektur-Regeln:

1. **Smoke-Test als oberste Wahrheit (`node _smoke_test.js`):**
   - Vor und nach jeder Änderung **muss** `node _smoke_test.js` mit `0` Fehlern (`ALLE TESTS OK`) durchlaufen.
   - `SW.Game.startMission(id)` setzt am Ende `this.setState('SHIP')` (vom Smoke-Test als Invariante geprüft). Für das Vorbereiten einer Mission im Flugdeck ohne State-Reset wird `SW.Game.prepareMission(id)` genutzt; für dynamisch generierte Sektor-Transit-Missionen `SW.Game.startMissionWithData(missionData)`.
2. **Multi-Angle Sprite-Pipeline (`tools/build_wingnut_assets.py` & `js/sprites.js`):**
   - Alle 14 Schiffs-Atlanten in `sprites/ships/*.png` bestehen aus **16 Yaw-Spalten × 5 Pitch-Reihen = 80 Ansichten**.
   - **Wichtig zum Yaw-Winkel (`YAW_STEPS`):** In HowieDays `WCUnity` (`SpritePicker.cs`) gilt `theta = (yaw + 1) * (PI / 16)`. Die exakten Hauptachsen (`0°` Front, `90°` Steuerbord, `180°` Heck, `270°` Backbord) liegen daher auf den **ungeraden** Indizes `[31, 7, 15, 23]`. `build_wingnut_assets.py` nutzt `YAW_STEPS = [31, 1, 3, ..., 29]`, sodass `col 0` exakt `0°` Frontalansicht und `col 8` exakt `180°` Heckansicht ist.
   - `SW.Sprites.drawMultiAngle` unterstützt **beide** Aufruf-Signaturen:
     - **3D-Welt (12/13 Argumente):** `(ctx, key, sx, sy, scale, wx, wy, wz, entityYaw, entityPitch, fallbackSprite, tintColor, dynamicLight)`
     - **UI / Hangar / Cutscene / Turntable (8/9 Argumente):** `(ctx, key, sx, sy, pixelSize, yaw, pitch, tintColor, fallbackSprite)`
     - Gibt immer `true` zurück, wenn ein Atlas-Sprite gezeichnet wurde (wichtig für Fallbacks).
   - Alle PNG-Dimensionen in `sprites/ships/` sind **gerade Zahlen (durch 2 teilbar)** für verlustfreie Amiga-Halbierung (`amiga_vga`).
3. **Dynamische Beleuchtung (`computeDynamicLight` & `renderCockpitDynamicLighting`):**
   - `SW.Sprites.computeDynamicLight(wx, wy, wz)` berechnet aus nahen Projektilen (`SW.Projectiles.list`) und Explosionen (`SW.Explosions.list`) Farbe und Intensität (`{ color, alpha }`).
   - Die Cockpit-Waffenblitzer (`sprites/cockpits/*_left_gun.png` und `*_right_gun.png`) sind transparente RGBA-Overlays (keine schwarzen opaken Masken!).
4. **Träger, Crew & Branching (`data/postings.js`, `js/transfers.js`, `js/npc.js`):**
   - Neue NPCs müssen sowohl in `SW.NPC.registry` (`js/npc.js`) als auch im jeweiligen Träger-Posting (`data/postings.js`) eingetragen sein, damit `SW.Transfers.hasCrew()` und `SW.NPC.resolve()` sie finden.

---

## OPEN-SOURCE-CREDITS & DRITTANBIETER-ASSETS (DANK & LIZENZEN)

Wir danken der Open-Source- und Wing-Commander-Community herzlich für ihre großartigen Projekte, Werkzeuge und Referenzen, die in **SOLO WING 1990** eingeflossen sind:

* **Howard Day ([HowieDay](https://github.com/HowieDay)) — `Wingnut` / `WCUnity` (`Wing-Commander-Unity-Clone`):**
  * Open-Source Wing-Commander-Remake-Framework sowie 3D-gerenderte Multi-Angle-Sprites, Cockpits, Piloten-Hände und VFX-Assets (`nav_light`, `debris`, `shield_impact`, `engine_flare`, `photon_blast`, `meson_bolt`).
* **Niklas „Arne" Jansson ([PromMode / Arne](https://androidarts.com/)):**
  * Überarbeitete 3D-/Pixel-Art-Schiffsdesigns und Cockpit-Grafiken (Hornet, Hornet Ace, Scimitar, Valtar/Raptor, Talon, Dralthi, Salthi, Krant, Strakha, Grikath) aus dem `Wingnut`/`WCUnity`-Asset-Paket.
* **neuromancer ([`wc1-re`](https://github.com/neuromancer/wc1-re) & [`wc2-re`](https://github.com/neuromancer/wc2-re)):**
  * Open-Source C/SDL2-Rekonstruktion von *Wing Commander I & II* — unschätzbare Referenz für das 3D-Flugmodell, die Feind-Manöver-State-Machine (`approach → strafe → break`), Wingman-Formationsflug und die PCI-Dialogarchitektur.
* **[`OpenReliant/openreliant`](https://github.com/OpenReliant/openreliant) & [FreeSpace Open (`scp-fs2open`)](https://github.com/scp-fs2open/fs2open.github.com):**
  * Architektur-Referenzen für Raumkampf-HUD, Vorhaltepunkt-Berechnung (Lead Indicator) und Geschwindigkeitsgefühl.
* **Origin Systems / Chris Roberts, Paul Neurath, Warren Spector & Team (1990–1996):**
  * Historische Inspiration und Verneigung vor *Wing Commander I* (1990), *Wing Commander: Privateer* (1993), *Wing Commander: Armada* (1994), *Wing Commander III: Heart of the Tiger* (1994) und *Wing Commander IV: The Price of Freedom* (1996).
* **Alle beteiligten KI-Agenten-Ären & Entwickler:**
  * **Tretboot** (Konzept, Regie, Musik, Design, Code, Formulare)
  * **Ära 1:** Qwen-Agentenverbund (Commander, Qwen No Thinking, Qwen NoThink Code, Lead Story Writer, Lead Developer, Code Review Agent)
  * **Ära 2:** Hermes Agent & Kiwi-Schwarm (Migration auf `AgentHome`, `BYOA`-Bridge, Ökonomie-Grundstein, verewigt als KI-Träger *TCS Hermes*)
  * **Ära 3:** VS Code + Cline & GitHub Copilot (`IM RAUM`, 3 Decks, Systemschäden, Hangar-Reparatur, Savegames)
  * **Ära 4 & 5:** Antigravity / Gemini 4 Argon (Vollverkabelung v0.75 + Wingnut 80-View Sprites, Dynamisches Waffen-Lighting, WC4-Intro, Resignation-Cutscene, Sektor-Navigation & *TCS Hermes* Story-Pass v0.85)

## LIZENZ

MIT — siehe [`LICENSE`](LICENSE). Die Sterne sind künstlich. Die Lizenz ist echt.

Siehe [`PATCHNOTES.md`](PATCHNOTES.md) für Details. Siehe [`site/index.html`](site/index.html) für Evaluation & Schiffslog.

---

© 1990–2026 STERNENKORPS. GEDRUCKT AUF FAXPAPIER. KEINE HAFTUNG FÜR VERLUSTE IM FLUG.
