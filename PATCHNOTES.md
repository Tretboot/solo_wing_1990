# SOLO WING 1990 — Patch Notes

> **Team-Note (Flotten-Commander):** Die Iteration ist superschnell geworden. v0.1 → v0.6.5-beta in Rekordzeit. Das Dorf lebt jetzt. 7 neue NPCs. Die Wandkarte hängt an der Wand. Das Team (Commander, Lead Story, No Thinking, Code Review) liefert. Lob an alle. Weiter so.

## v0.6.9-dev — "Wiederherstellung & Doku" (2026-10-12)

### Bugfixes
- **ui.js-Schaden (Major, stiller Ausfall):** `js/ui.js` war bei einer Shell-Operation
  in **eine einzige Zeile** zerlegt worden. Da Zeile 1 mit `//` (Header-Kommentar)
  beginnt, war das gesamte File zu einem einzigen Kommentar verkommen — `SW.UI` und
  `SW.Comm` wurden nie definiert, das Spiel lief weiter, bis `startMission()` an
  `SW.Comm.clear()` stürzte (Smoke-Test: "Cannot read properties of undefined").
  Die minimierte Datei enthielt keinen wiederherstellbaren Code mehr.
  **Fix:** Neuaufbau aus `release/v0.6.5-rc/js/ui.js` (intakt) + v0.6.6-Features
  nach KONZEPTE.md nachgebaut (Cockpit-Video in `SW.Comm.render()`, BriefingBoard
  als Typing-State-Machine). Recovery-Historie steht im Header von `js/ui.js`.
- **npc.js-Schaden (Major, Syntaxfehler):** Mehrere Methoden-Enden fehlten
  (`_drawHair`, `_drawFeatures`), ein `case 'side-part'`-Block stand nach
  `_drawBody` (verrutscht), der Körper von `drawFace()` (die zentrale API) fehlte
  komplett. **Fix:** Struktur repariert, `drawFace` rekonstruiert (Körper → Kopf →
  Accessoires, Bob bei `animated`), neuer Helfer `SW.NPC.resolve(name)` löst
  Display-Namen ('COMMANDER') auf Registry-Keys ('commander') — nötig, damit
  `renderCockpitVideo` die Sprechblasen-Namen aus `SW.Comm` versteht.
- **Audio/TTS-Lazy-Init:** Vorab-Init in `main.js` entfernt (Browser-Policy: Audio
  startet nur nach User-Geste). Läuft jetzt in `input.js` (Mouse/Touch) und beim
  ersten Key im INTRO (`main.js`) — beides war schon vorhanden.
- **Smoke-Test synchronisiert:** Skript-Liste enthielt `js/npc.js` + `js/manual.js`
  nicht (v0.6.6-Liste). Jetzt 26 Dateien = `index.html`. **Test: ALLE TESTS OK.**
- **Version-Banner:** `main.js` meldete noch `0.6.6-dev` → jetzt `0.6.9-dev`.

### Schreib-Block 2b: m4 Kältekammer-Klimax (2026-10-12)
- **Mission-Reaktiv m4 (Sieg UND Tod) für alle 11 NPCs** (`data/dialogues.js → smart`):
  Commander, Sechs, Neun, Zwo, Vier, Barkeep, Bolt, Pflaster, Diskettens, Klo, System —
  je 1–2 Sieg- und 1 Tod-Zeile (22 neue), alle mit `req`-Gate (`'m4_sieg'`/`'m4_tod'`).
  Wissen auf Subplot-Stufe 1 gehalten (atmet, 2/min, versiegelt, Formular 99-Z) —
  Stage-2/3-Wissen bleibt in den Subplot-Pools (A/B-Regel: Spoiler bleiben zu).

### Integration & Befunde (Wiring-Check, 2026-10-12)
- **Dialog-Brücke fehlte, ist jetzt da:** `SW.SmartDialogues.noteMission()` war definiert,
  aber von nirgendwo aufgerufen — `states.js` schrieb nur `World.missionResult`
  (Einzel-Feld), die req-Gates prüfen aber `World.missionResults[missionId]`.
  Folge: alle Mission-Reaktiv-Zeilen (Blöcke 2a + 2b) waren tote Daten.
  **Fix:** `states.js → triggerVictory()/triggerDeath()` ruft jetzt
  `noteMission(this.mission.id, 'sieg'|'tod')` auf (Guard: nur bei aktiver Mission,
  Sim-Modus bleibt unberührt).
- **Engine-Dateien waren nie eingebunden:** `js/dialogue.js` und `js/newspaper.js`
  existierten vollständig, standen aber nicht in `index.html`. Jetzt eingebunden
  (28 Skripte, Smoke-Test synchronisiert). Die Engines bleiben inert, bis
  `ui.js` (Raum-Integration, offen) `SmartDialogues.get()` bzw. `Newspaper.render()`
  aufruft.
- **Befund v0.6.8 (Checkboxen korrigiert):** `SW.Quests.flight()`, Quest-Ketten,
  Missions-Quests und Quest-Gates standen in TODO als erledigt, existieren aber nicht
  im Code (`js/quests.js` = altes tick-System, `data/quests.js` = 5 Einzel-Quests).
  TODO.md korrigiert. Die Schiffszeitung-Engine (`js/newspaper.js`) existiert dagegen —
  ist jetzt eingebunden und wartet auf Zeitungs-Raum + Artikel-Schreib-Block.
- **Smoke-Test:** 72/72 OK (10 neue Checks: m4-Abdeckung 11×Sieg/11×Tod, A/B-Gates,
  noteMission, Bridges, Script-Tags).

### Launch-Tube & Kamera-System (2026-10-12)
- **Launch-Tube-Cinematic (TAKEOFF):** Startsequenz ersetzt. WC-Stil: Röhren-Rippen
  (12 Ringe) + Streben + Lichterketten (48 Lichter) entstehen am Fluchtpunkt in der
  Mitte und fließen beschleunigt an die Bildschirmränder (Z-Achse-Skalierung, 1/z).
  Schiff zentriert, Triebwerk-Wackeln + Glow; Phase B = Freigang (Sterne + Träger),
  am Ende weißer Exit-Flash. Dauer 180 → 210 Frames. (`js/systems.js → SW.Flight.renderTube`)
- **Kamera-System (Taste [V] im COCKPIT):** zentraler ViewMode-State in
  `SW.Engine.view` — 'cockpit' (1. Person, wie bisher), 'chase' (3. Person: Schiff im
  unteren Drittel, Rückenansicht, weiter Winkel, rollt mit), 'topdown' (Arcade:
  Z-Achse auf Y-Achse, flache 2D-Ebene, eigenes Top-Down-Sprite, Aim = Maus relativ
  zum Schiff, vorne = +z). `SW.Engine.screenPos()` ist der einzige view-aware
  Projections-Einstiegspunkt — Physik und Kollision bleiben unangetastet.
  Mini-HUD (Schild, Score, Radar, [V]-Anzeige) für chase/topdown.
- **Smoke-Test:** 84/84 OK (12 neue Checks: View-Cycling, Top-Down-Aim, Tube-Durchlauf).

### Website-Style wiederhergestellt (2026-10-12)
- **Befund:** `site/style.css` (605 B) und `site/manual/index.html` waren
  Backtick-`n`-zerlegt (1 Zeile, `n statt \n) — die Seite lief komplett
  ohne CSS. Ursache: Shell-/Agent-Schaden, identisch zum ui.js-Fall.
- **Fix:** `style.css` bytegenau aus `release/v0.6.5-rc/site/style.css`
  wiederhergestellt (grünes Terminal-Look, „wie Früher") + neuer Block
  „Externes Handbuch" (`.manual-nav`, `.chapter-num`, `.manual-content`,
  `.manual-quote`). `site/manual/index.html` aus dem intakten Inhalt
  neu geschrieben (38 Zeilen, Tag-Balance geprüft).
- **Benchmarks:** `agent_benchmarks.html` hat eigene Inline-Styles — kein
  Handlungsbedarf. Verifikation: `_csscheck.js` (0 Backtick-`n`-Hits in
  site/, CSS-Klammern 65/65, HTML-Balance OK).

### Schulraum "ZWEIG" — 12. Raum + Git-Tutorial (2026-10-12)
- **Neuer Raum:** `data/rooms.js → id: 'schule'` (SCHULRAUM "ZWEIG", Farbe #1a2a1a,
  Akzent #ccff66, NPCs: Diskettens + Archiv), Türen von/zu BAR, MASCHINENRAUM und
  KAPITÄN-BÜRO (zuerst 3, dann 4. Tür — Raum 11/12).
- **Artstyle:** `js/ship.js → artSchule()` — Kreidetafel mit `git log --oneline`
  (Commit-Tree, Branch "tet", roter KATZE-Commit), Schülertische, Formular-14-C-Poster
  (Selbstanzeige), Katzensilhouette am Fenster ("Tastatur?").
- **Git-Tutorial-Dialog:** `data/dialogues.js → rooms.schule` (9 Zeilen, Sarkasmus-
  Lehrgang: status → add → commit → log, "Git lehnt leere Commits ab. Das ist auf
  diesem Schiff das Einzige, was zuverlässig funktioniert.").
- **Website:** Raum-Karte in `site/raeume.html` (12 Räume).
- **Befund (Test):** Die Raumeigenschaft heißt `toren` (Singular) — der neue
  Smoke-Check war erst mit `torren` geschrieben (1 roter Test, Rechtschreibung).
- **Smoke-Test:** 92/92 OK (4 neue Checks: 12. Raum, Tutorial, Türen, NPCs).

## v0.6.9-rc — "Handbuch & Website" (Release Candidate, 2026-10-10)

### Neue Features
- **Ingame-Handbuch (Taste [H]):** 6 Kapitel (Einführung, Steuerung, Cockpit,
  Kampf, Missionen, Crew), progressiv freigeschaltet (m1/m2 erforderlich),
  NPCs zitieren in jedem Kapitel, [ESC] schließt, Pfeiltasten wechseln.
  `js/manual.js` (Handbuch-Engine).
- **Externes Handbuch:** HTML unter `site/manual/` (Index + 6 Kapitel),
  Corporate Design (Sternenkorps-Standard), verknüpft mit Ingame-Inhalten.
- **Website-Überarbeitung:** Corporate Design v0.6.9 (Sternenkorps-Farben,
  Monospace + Sans-Serif, responsive für Desktop/Mobile/Switch),
  `site/style.css` neu.
- **Game ↔ Website Bridge:** Ingame [H] → Handbuch, Website verlinkt zurück
  zum Spiel, Handbuch-Links in der Navigation.
- **Switch-Port-Vorbereitung:** CSS Media Queries für 1280×720, UI-Scaling-System,
  Touch-Controls geplant (nicht implementiert), Performance-Checks.

### Offene Punkte (→ v0.6.9-final)
- Musik-System (1 Melodie, 7 Instrumentierungen), Sprite-Pass, Schiffskatalog
  (12. Raum), Beobachtungsdeck (Planet + System-Name), JUMP-Polish.
  Details: TODO.md → v0.6.9.

## v0.6.8-dev — "Quests, Trigger & Schiffszeitung" (Engines fertig, Schreib-Blöcke offen)

### Neue Features
- **Flug-Trigger:** `SW.Quests.flight(event)` + Ereignis-Log + Dialog-Brücke
  (mission_complete, kill, first_kill, shield_low, room, player_down) — Quests
  werden zum echten Spielrhythmus statt zur Checkbox-Liste.
- **Quest-Ketten:** Main (m1→m4), Alien, Audit, Crew (in `data/quests.js`).
- **Missions-Quests:** m1–m4 als formale Quests — Fortschritt wird sichtbar.
- **Quest-Gates:** `voraussetzung` (Flags) steuert Verfügbarkeit.
- **Schiffszeitung-Engine** (`js/newspaper.js`): Generierung, Rendering,
  Interaktion. Artikel-Typen: Missionserfolge (w:3.0), Special Events (w:4.0),
  NPC-Gossip (w:1.5, 40%), Subplot-Hints (w:2.5, 60% bei Stage>0),
  Front-Berichte (w:1.0, Füller). Integration nach Mission via
  `SW.Quests.onMissionComplete()`.
- Offene Punkte (Schreib-Blöcke + Zeitungs-Raum + 50+ Quests + Missionsbaum +
  Quest-Log-UI + Minimap-Fix): TODO.md → v0.6.8.

## v0.6.7-dev — "Smart Dialogues" (Engine + Schreib-Blöcke 1 & 2a)

### Neue Features
- **Dialogue-Engine** (`js/dialogue.js`): Context, Ereignis-Log, req-Gates
  (Flags steuern, welcher Text freigeschaltet ist), gewichtete Auswahl,
  Cooldown (kein Hamsterrad), Subplot-Stufen. Engine ist klein — der Aufwand
  liegt im Schreiben (daher die Schreib-Blöcke).
- **Schreib-Block 1: Base-Dialoge** (11 NPCs, ~110 Zeilen) — das Dorf hat eine
  Stimme.
- **Schreib-Block 2a: Mission-Reaktiv m1–m3** (Sieg UND Tod: das Dorf reagiert
  auf jeden Einsatz).
- Offene Punkte (Schreib-Blöcke 3/4, A/B-Story-Checks, Raum-Integration,
  Cooldown-Tuning): TODO.md → v0.6.7. (2b erledigt 2026-10-12, s. v0.6.9-dev oben.)

## v0.6.6-dev — "Sprung & Dialog" (fertig, Smoke-Test 62/62 OK, 2026-10-12 verifiziert)

### Neue Features
- **JUMP-Cinematic (6-Phasen-State-Machine, WC-Stil):** Nach der Briefing-Szene springt
  der Träger zum Einsatz-System: (1) Abflug — Träger fliegt von links ins Bild,
  (2) Jump-Blase — sternförmiges Portal wächst, (3) Sprung — Schiff fliegt in die Blase,
  (4) Star-Wars-Wipe + Whoosh-Sound, (5) Ankunft — neues System mit anderer
  Sternenverteilung + System-Tint + Planet + "ANKUNFT: SEKTOR X", (6) Austritt — neue
  Blase, Schiff fliegt rasant heraus, (7) Hold → `[LEERTASTE: ABHEBEN]`.
  Sterne bewegen sich auf der Z-Achse (aus der Mitte heraus), nicht mehr "wie Regen".
  Story mit TTS an Phasen-Grenzen, LEER = überspringen. Je Mission 3 eigene Zeilen
  (`data/dialogues.js → jumps`).
- **Briefing-Szene (statt statischer Tafel):** Einsatzleiter an der Tafel (Uniform,
  Kragenscheibe, Stock, leichte Bewegung), 3 Piloten auf Stühlen (Rückenansicht),
  Tafel mit Missionstext + WELLEN/SCHIFFE + Kurs, Commander-Zeilen mit Typing + TTS,
  danach `[LEERTASTE: ZUM SPRUNG]`.
- **KONSEPTE.md → KONZEPTE.md** umbenannt (alter Tippfehler, alle Referenzen aktualisiert).
- **World.systemId nach Mission:** Nach Sieg/Tod zeigt das Beobachtungsdeck das
  Einsatz-System an (der Träger "ist dort").
- **Dialog-Paging + Scrollbar:** Lange Dialoge werden nicht mehr abgeschnitten.
  Umbruch 44→110 Zeichen, 4 Zeilen/Seite, Scroll-Indikator (Track + Daumen) rechts
  in der Box, `[LEER: WEITER] n/m` pro Seite.
- **NPC-Overhaul (11 Charaktere):** `js/npc.js` mit zentraler NPC-Registry. Jeder NPC
  hat ein prozedural generiertes Gesicht (Canvas-Primitives) passend zur TTS-Stimme:
  Commander, Sechs, Neun, Zwo, Vier, Barkeep, Bolt, Pflaster, Diskettens, Klo, System.
  Jeder mit Stimme, Alter, Haut, Haar, Uniform, Gesichtszügen (Brille, Schnurrbart,
  Stethoskop, …), Persönlichkeit (→ Augenfarbe) und Pose-Varianten.
  Eine API für alle Szenen: `SW.NPC.drawFace(npcId, x, y, size, {pose, animated, frame})`.
- **Cockpit-Video:** 280×160px Video-Panel mit NPC-Porträt, Sprechblase und
  TTS-Typing-Indikator (blinkende LED, wenn TTS an). Verdrahtet in `SW.Comm.render()`
  (ui.js): Jede Funkzeile "NAME: Text" zeigt 2 Sekunden das Gesicht des Sprechers —
  im Briefing, im Cockpit, in den Träger-Räumen. Rahmen in System-Farbe.
- **Briefing-Szene mit echten Gesichtern:** Commander + Sechs/Neun/Zwo mit Gesichtern
  und animiertem Bobbing statt generischer Silhouetten (`states.js → renderBriefing`).
- **Workflow-Optimierung:** NPC-System in eigener Datei (`js/npc.js`, in `index.html`
  vor `ui.js` geladen), Dialoge datengetrieben über `npc`-Feld in `data/dialogues.js`,
  ein einziges Rendering-API `drawFace` für Briefing, Cockpit-Video und Träger-Räume.
- **Roadmap neu geordnet** in `KONZEPTE.md` + `TODO.md`:
  0.6.7 Smart Dialogues (Engine + Schreib-Blöcke + A/B-Story-Checks),
  0.6.8 Quests, Trigger & Missionsbaum (Flug-Trigger, 50+ Quests),
  0.6.9 Musik + Optik + Schiffskatalog,
  0.70 Enden, Fax, Aktenschrank, Optimierer,
  0.75–0.80 Freies Universum (eigenes Schiff, 20 Systeme, Fraktionen,
  Mission-Generator, Ökonomie) — Major-Overhaul mit Vorab-Plänen.

### Bekannte offene Punkte (bewusst verschoben, siehe TODO.md)
- Minimap-Grid (5×2) reicht nicht für 11 Räume → 11. Punkt (KLO) steht außerhalb
  des Rahmens (Fix in 0.6.7).
- `SW.Config.cheatEnabled` ist `true` (Testing) → für 0.6.6-RC auf `false`.

## v0.6.5-rc — "Cheatmenü, Wandkarte, Transfer, Hangar, Dorf lebt" (Release Candidate)

### Bugfixes
- **Transfer-Bug (Major):** Nach dem Akademie-Ergebnis blieb das Spiel im Cockpit und der Spieler flog ewig weiter. Ursache: Der `after()`-Countdown in `SW.Akademie` zählt nur in `SW.Akademie.update()` herunter — die läuft nur im AKADEMIE-State, das Ergebnis-Handling lief aber im COCKPIT-State. Fix: `bestanden()`/`durchgefallen()` setzen den State direkt auf AKADEMIE (ohne `init()`-Reset) → Countdown läuft → weiter zur Transfer-Szene.
- **NPC-Gesichter im Dialog:** Dialog-Namen (UPPERCASE) trafen nicht auf die `RoomNPCs`-Keys (camelCase) → neue NPCs wären grau gerendert. Jetzt case-insensitive Fallback-Suche.
- **Menü-Overlap:** Die 9-Zeilen-Steuerungsliste kollidierte mit dem Cheat-Block → Cheat-Block in die rechte Spalte.

### Neue Features (v0.6.5)
- **Cheatmenü (ESC):** `[1] ZUM TRÄGER` (Spawn auf Träger), `[2] KARTE` (Fullscreen-Raumkarte). Nur für Testing. Flag `SW.Config.cheatEnabled` (Release: `false`).
- **Wandkarte (klickbar):** Die Minimap in jedem Raum ist jetzt klickbar → öffnet Fullscreen-Karte. Schiff-Umriss + alle 11 Räume als Boxen (Name, Zweck, NPC-Count). Klick auf Raum = dorthin. ESC = zurück.
- **7 neue NPCs:** Archiv (Büroklammer), Löffel (Kellner), Stille (Novize), Mutters (Schweißerin), Spiegel (Astronom), Rohr (Kühlsystem), Nadel (Sanitäter). Jeder Raum hat jetzt mindestens 1-2 NPCs (Beobachtungsdeck nicht mehr leer).
- **Erweiterte Raum-Dialoge:** Alle 11 Räume haben jetzt mehr Dialog-Zeilen. Neue NPCs sprechen (Stille sagt nur "...", Löffel nur "*Klirren.*", Nadel nur "*Stechen.*").
- **Hangar-Szene (nach Landung):** Neuer `HANGAR`-State. Bolt geht zum Schiff und kommentiert — abhängig von der Schadenslage (3 Stufen: sauber / angekratzt / blutend). Ersetzt das Sieg-Debriefing; Tod geht weiter direkt ins `DEBRIEFING` (KONTAKT VERLOREN).
- **Rollen (Q/E):** Reine Sicht-Rotation im Cockpit (Sterne, Feinde, Projektile), federt in Ruhe zurück zur Mitte.
- **Nav-Karte (N):** Vergrößerte Übersicht im Cockpit mit nummerierten Waypoints (nächster WP weiß), Feinden und Spieler.
- **Key-Remap:** Autopilot A → **T**, **N** = Nav-Karte.
- **Transfer-Zwischenszene (ARRIVAL):** Nach dem Akademie-Ergebnis. Der Träger fliegt von fern nah heran (Pixel-Silhouette, 2,5 s), "WILLKOMMEN AN BORD, {Pilot}" + Deadpan-Zeilen (Spinde 14, Aufzug in Arbeit), TTS-Begrüßung. Danach entlassen in die Räume (BAR → SHIP). Skippbar mit Leertaste.
- **Landung → Hangar → Debriefing:** Die Landung endet im Hangar (Bolt kommentiert, 3 Schadensstufen), danach das Sieg-Debriefing ("MISSION ABGESCHLOSSEN", EINSATZBEWERTUNG) → zurück zum Träger. Tod bleibt unverändert: KONTAKT VERLOREN → Debriefing → Träger.
- **Info-Panel ([I] im Menü):** Kleines Panel mit Version (0.6.5-rc), MIT-Lizenz, Credits und Team-Bekanntmachung.
- **MIT-Lizenz:** `LICENSE` im Projekt- und RC-Ordner.
- **Website:** Betriebsbekanntmachung (Agentenverbund aufgelöst, jetzt VS Code + API), Danksagung an das Qwen-Team, neues Captain's-Log, aktualisierte Steuerungs-Tabelle.

### NPC-Platzierung (v0.6.5)
| Raum | NPCs |
|------|------|
| BAR | Sechs, Neun, Zwo |
| FLUGDECK | Commander |
| KAPITÄN-BÜRO | Commander, **Archiv** |
| KANTINE | Ragnhild, **Löffel** |
| KAPELLE | Klopstock, **Stille** |
| REPARATUERRAUM | Bolt, **Mutters** |
| FRISUR | Scherenflick |
| BEOBACHTUNGSDT | **Spiegel** |
| MASCHINENRAUM | Diskettens, **Rohr** |
| KRANKENSTATION | Pflaster, **Nadel** |
| KLO | KLO |

### Architektur-Entscheidungen
| Entscheidung | Begründung |
|---|---|
| Cheatmenü im ESC-Menü | "Im Hauptmenü auch ein Cheatmenü" — Nutzer-Wunsch. Testing. |
| Wandkarte = Minimap klickbar | "Die hängt klein an der Wand, klickt man drauf sieht man alle Räume" — Nutzer-Wunsch. |
| Fullscreen-Karte mit Schiff-Umriss | "Umrisse vom Schiff drum rum" — Nutzer-Wunsch. |
| Stille/Löffel/Nadel sagen nur "..." / "*Klirren.*" / "*Stechen.*" | Deadpan. Nicht jeder muss reden. Die Stille ist auch ein Dialog. |
| CHEAT_MAP als eigener State | Saubere Trennung. Kein Klick-Through. ESC = zurück zum Träger. |
| `SW.Config.cheatEnabled` in `config.js` | Flag laut Konzept: im Release einfach `false`. |
| HANGAR = eigener State nach Landung | Handoff: Landung → Bolt kommentiert → Träger. Schaden-basierter Dialog (`_hangarDialog()`). |
| Roll als Sicht-Rotation (keine Physik) | WC1-Feeling, aber die Inertial-Physik bleibt unangetastet. |
| NPC-Gesichter case-insensitiv | Dialog-Namen (UPPERCASE) treffen jetzt auf `RoomNPCs`-Keys (camelCase) — neue NPCs nicht mehr grau. |

### Bekannte Limitationen
- Cheatmenü ist im Release entfernt (Flag `SW.Config.cheatEnabled`).
- Wandkarte zeigt keine Türen/Verbindungen (nur Räume).
- Neue NPCs haben noch keine eigenen Quests.
- Hangar-Szene nur bei Rückkehr (Sieg); Tod = DEBRIEFING.
- Fax-Drucker UI, Aktenschrank, Optimierer, 3 Enden: noch offen (aus v0.6.4).

---

## v0.6.4 — "Intro, Rap, Ethikrat, Doku"

### Neue Features
- **Intro-Sequenz** (`js/intro.js`): Spiel startet in `INTRO`. Phase 1: Asteroidenfeld (prozedural, grau, unregelmäßig, Drift + Ausweichen, nicht tot, i-Frames, Painter's-Algorithm). Phase 2: Pilotenname (Edge-Detect, max 12, Backspace/Enter, leer→FLUG DREI). Phase 3: Zuordnung → AKADEMIE.
- **Rap-Pirat:** Der Kugelschreiber hört Rapmusik. Funk-Dialoge mit `*Rapmusik*`/`*Musik leiser*`. "Mach mal die Musik leiser, wenn du mich hier überfällst und erpressen willst!"
- **Ethikrat-Blog** (`site/ethikrat.html`): A/B-Test. Lead Story Writer (PRO, "Formular 17-K", KLO als Vorsitz) vs. No Thinking (CONTRA, "Das Audit IST der Ethikrat"). Fazit: Kein Ethikrat-Minispiel. KLO <i>ist</i> der Ethikrat — ein Ein-Personen-Rat, ein Blick, kein Gegenzeichen.
- **Doku-Pass:** `README.md` (komplett neu, Flughandbuch-Stil), `TIMELINE.md` (Story-Zeitachse für die Bible), `TODO.md` (geordnet nach Priorität), `WC1_PCI_ANALYSE.md` (echter WC1-Quellcode als KI-Referenz).
- **Agent-Benchmarks** (`site/agent_benchmarks.html`): Sideprojekt. Orchestrierungs-Regel v0.6.2b (Lead Dev = Top-Level, No Thinking = Code, Code Review = Score, Commander = Fix-Pass). Test-Protokoll + CSS-Balken-Graphen + Messdaten.
- **State Machine:** `INTRO → AKADEMIE → BAR → SHIP → …`

### Orchestrierung (v0.6.2b)
| Rolle | Aufgabe |
|-------|---------|
| Lead Developer | nur Top-Level-Spec (Architektur, Schnittstellen, Edge-Cases) |
| No Thinking | Code liefern + Pingpong (hin und her verbessern) |
| Code Review | Score (1-5) + Fix-Liste |
| Commander | Fix-Pass + Integration |
| NoThink Code | nur Text/Daten (crasht bei Coding: Recursion 9 + Unable to initialize) |

### Bekannte Limitationen
- Fax-Drucker UI (Quest-Feedback) noch nicht implementiert.
- Aktenschrank (5 Akten → neuer Dialog) noch nicht implementiert.
- Optimierer-Erscheinen (nach m4, Bar) noch nicht implementiert.
- 3 Enden (Sieg / Tod / Geheim) noch nicht implementiert.
- Externes Handbuch (HTML + PDF) noch nicht implementiert.

---

## v0.6.3 — "Das Dorf lebt"

### Bugfixes
- **Dialog-Text-Bug:** Text lief über die Box (Maschinenraum, Bar). Fix: Box höher (54px), 3 Zeilen, Font 6px, Umbruch 44. Jetzt passt alles.
- **Cockpitbug:** Cockpit v2 (braune Panels, Joystick, Beine) wurde im Flug nicht gerendert. Fix: Fallback-Cockpit (falls Frame null) + Frame heller (TAN #9a7d4b). Jetzt sichtbar.

### Neue Features
- **SW.World State:** Das "fliegende Dorf" lebt jetzt. Seed, aktuelles System, gesammelte Nachrufe, NPC-Placements.
- **Observationsdeck ändert sich je nach System:** Zeigt jetzt die System-Farbe, den Planeten in System-Farbe + System-Name + Char. SEKTOR 7 (blau), SEKTOR 9 (rot), SEKTOR 12 (neutral).
- **Kapelle sammelt Nachrufe:** Neue "NACHRUF"-Tafel rechts. Zeigt gesammelte Nachrufe (Name + Text). Kerzen-Anzahl = 3 + Nachrufe. Bei Tod: "Flug Drei" wird als Nachruf hinzugefügt.
- **NPCs je nach Seed/Mission:** `SW.World.npcInRoom()` — ein Pilot "gastiert" deterministisch in einem Raum (Seed-basiert). Nach Sieg: Sechs sitzt in der Bar. Nach Tod: Neun sitzt in der Kapelle.
- **Missionsergebnis:** `SW.World.missionResult` ('sieg' | 'tod') beeinflusst NPC-Placements + Nachrufe.

### Architektur-Entscheidungen
| Entscheidung | Begründung |
|---|---|
| SW.World als State | Seed, System, Nachrufe, NPC-Placements in einem Ort. Deterministisch. |
| Observationsdeck = System-Anzeiger | "Wenn sich das bei jedem System ändert" — Nutzer-Wunsch. |
| Kapelle-Nachrufe | "Da können dann noch Nachrufe und sowas gesammelt werden" — Nutzer-Wunsch. |
| NPC-Placements Seed-basiert | "Etwas zufällig, bzw. je nach Seed und wie die Missionen gelaufen sind" — Nutzer-Wunsch. |
| Dialog-Box 54px/3 Zeilen | Text lief über. Höher + mehr Zeilen + kleinerer Font. |
| Cockpit-Fallback | Falls Frame null ist, zeichne ein einfaches Cockpit. Robust. |

### Bekannte Limitationen
- Cockpit v2: Frame ist prozedural (Pixel-Art), nicht so detailliert wie WC1-Original.
- NPCs sind prozedurale Silhouetten (nicht so detailliert wie Star Control 2).
- Beerdigungs-Event (Kapelle nach Tod, interaktiv) noch nicht implementiert — Nachrufe werden gesammelt, aber noch kein "Kerze zünden"-Interakt.
- Intro-Sequenz (Asteroidenfeld + Name + Kreide-Tafel) noch nicht implementiert.
- Mission Select (m2/m3 wählbar) fehlt noch.
- Carrier-Interaktion (3-Treffer-Warnung) offen.
- Siedler-Mission m3: "KEIN FEUER"-Logik noch nicht implementiert.
- Musik-Wechsel (Takeoff → Cockpit) noch nicht implementiert.

---

## v0.6.2 — "Website lebt"

### Neue Features
- Website mit 6 Unterseiten (Start, Design-Bibel, Team, Crew, Räume, Konzepte)
- Gemeinsame CSS (style.css)
- Navigation auf allen Seiten

---

## v0.6.1 — "Fliegendes Dorf"

### Neue Features
- 10 prozedurale Räume (Tür-Klick, Minimap, NPC-Dialoge)
- START-Button im Flugdeck
- TTS-Fix: Stage-Directions werden ignoriert
- Konzepte-Doku (Elite, ewig leben, Versionierung)

---

## v0.6.0 — "Cockpit v2 & Menü"

### Neue Features
- Escape-Menü (ESC): Anleitung + Optionen
- Cockpit v2 (WC1-Stil): braune Panels, Gauges, Joystick, Beine
- Carrier größer (64×32), TTS-Tonalitäten (10 Profile)
- Sound-Toggle (O), Bar-Fenster polygonal

---

## v0.5.0 — "Crew & Pingpong"

### Neue Features
- 18 Crew-Charaktere (Pingpong-Konferenz, 4 Runden)
- Scoreboard aus Crew-Data

---

## v0.4.1 — "Bar-Redesign & Flow-Fix"

### Bugfixes
- Flow-Bug: Klick in der Bar startete sofort Mission.
- TTS-Toggle: M in allen States. TTS standardmäßig AN.

### Neue Features
- Bar-Redesign (Star Control 2 Richtung)
- Cockpit-Frame sichtbarer

---

## v0.4.0 — "Bar, Briefing & Systeme"

### Neue Features
- VGA-Auflösung (640×400)
- Bar-Setting, Briefing-Tafel, 3 Systeme
- TTS (Beta), Touch-Support, Inertial-Physik

---

## v0.3.0 — "Crew, Schiffe & Backstory"

### Neue Features
- 3 Schiffs-Varianten + Flug-KI
- Backstory, Autopilot auf A, Konferenz-Dialoge

---

## v0.2.0 — "Multi-File & Cockpit"

### Neue Features
- Multi-File Restructure, Star Field Parallax
- Cockpit Frame, Carrier, Takeoff + Landing
- Data-Driven Missions, 7 Bugfixes

---

## v0.1.0 — "Vertical Slice"

### Features
- 3D Engine, Player, Multi-Input, 3 Waves
- Shield System, Procedural Audio, Comm

---

## Changelog Format
```
## vX.Y.Z — "Codename" (Datum)
### Neue Features
### Bugfixes
### Architektur-Entscheidungen
### Bekannte Limitationen
```
