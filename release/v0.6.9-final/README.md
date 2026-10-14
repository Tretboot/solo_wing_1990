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
| W/S/D oder Pfeile | Bewegen (Drift) |
| Q / E | Rollen |
| Maus | Zielen |
| Leertaste / Klick | Feuer |
| T | Autopilot |
| N | Nav-Karte |
| M | TTS ein/aus |
| O | Sound ein/aus |
| ESC | Menü |
| Klick (im Träger) | Türen / NPCs / START / Wandkarte / Spinde-Tür |

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
- **SHIP:** 13 Räume (12 besetzt + SPINDE, Tür-Klick, Minimap, NPC-Dialoge)
- **SPINDE:** Eigene Kabine (13. Raum) — Bunker-Tür öffnet das Save/Load-Panel
- **COCKPIT:** WC1-Style, Radar, Shields, Score, Weapon/Target

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
| `js/ship.js` | Träger-Interior (13 Räume, Tür-Klick, NPC-Dialoge, Save/Load-Panel) |
| `js/ui.js` | Cockpit-Overlay, Radar, Space Map, Comm, Briefing Board |
| `js/states.js` | State Machine (Game), Rendering pro State |
| `js/world.js` | World-State (Seed, System, Nachrufe, NPC-Placements) |
| `js/savegame.js` | Save/Load (localStorage, Export, Delete — SPINDE-Panel) |
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
| `js/manual.js` | Ingame-Handbuch (6 Kapitel, progressiv freigeschaltet, Taste [H]) |

**Data-Dateien (reine Daten, kein DOM):**
| Datei | Inhalt |
|-------|--------|
| `data/missions.js` | 4 Missionen (m1–m4, m4 = DER FRACHTER) |
| `data/dialogues.js` | NPC-Dialoge (Bar, Räume, Briefings, Funkstörungs) |
| `data/systems.js` | 3 Sektoren (Sektor 7, 9, 12) |
| `data/crew.js` | 18 Crew-Charaktere + 5 Piloten |
| `data/rooms.js` | 13 Räume (Artstyle, NPCs, Türen) |
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

**v0.75-dev** — IM RAUM (Flugmodell & Kampfspür): Auslöser Playtest 2026-10-13 ("wir fliegen, aber es fühlt sich nicht an, keine wirklichen Gegner, keine anderen Schiffe"). Recherche über Open-Source-WC-Clones (`neuromancer/wc1-re` = WC1-Quellrekonstruktion, `wc2-re`, `OpenReliant/openreliant` = StarLancer, FreeSpace Open). Drin: Vorschub + Nachbrenner [SHIFT] (Sternen-Flow, Motor-Sound, VORW-Anzeige), relative Projektion (Kamera am Spieler, Welt rutscht), Banken, Feind-KI (approach → strafe → break, Vorhaltschuss), Wingman "SECHS" (Formation, Deckungsfeuer, Funk), Träger im Feld, "FEIND NAH"-Warnung. Offene v0.70-Punkte (3 Enden, Fax-UI, Aktenschrank, Optimierer) wandern in den v0.75-rc.

**v0.70-dev** — Abspann/Credits: Nach dem Sieg-Debriefing läuft der rollende Abspann (1990-Style) — Crew-Liste aus `SW.Crew`, Pilotenname, Produktions-Credits; [LEER] = Weiterspulen, [ESC] = schließen. Tod geht ohne Abspann direkt zum Träger. GitHub-Repo ist live: `tretboot/solo_wing_1990` (Push + Tag `v0.6.9-final`).

**v0.6.9-final** — SPINDE (13. Raum, Bunker) mit Save/Load-Panel (Speichern/Laden/Export/Löschen, localStorage), Intro-Musik-Fix (loop, Stille in Menüs, [P] für beide Systeme), Dialog-Box (Höhe, Umbruch, Paging, Sprecher-Gesichter), Repo-Cleanup für GitHub. Darunter: Ingame-Handbuch [H] + externes Handbuch + Website (Corporate Design) + Game↔Website-Bridge + Switch-Port-Prep. Roadmap: `TODO.md` + `KONZEPTE.md` (0.6.10 Humor-Overhaul, 0.70 Enden & Papierkram, 0.75+ Freies Universum).

**v0.6.5-rc** — Cheatmenü + Wandkarte + 7 neue NPCs + Transfer-Zwischenszene + Hangar→Debriefing + Rollen (Q/E) + Nav-Karte (N) + Info-Panel + MIT-Lizenz.

Release Candidate liegt in `release/v0.6.5-rc/` (sauberer Unterordner, mit ZIP: `release/solo_wing_1990_v0.6.5-rc.zip`).

## LIZENZ

MIT — siehe `LICENSE`. Die Sterne sind künstlich. Die Lizenz ist echt.

Siehe `PATCHNOTES.md` für Details. Siehe `site/index.html` für Evaluation.

---

© 1990 STERNENKORPS. GEDRUCKT AUF FAXPAPIER. KEINE HAFTUNG FÜR VERLUSTE IM FLUG.
