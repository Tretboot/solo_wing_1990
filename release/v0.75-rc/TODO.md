# SOLO WING 1990 — TODO

> Stand: v0.75-dev Argon-Pass (2026-10-18, Gemini 4 Argon). Geordnet nach Version (Roadmap: KONZEPTE.md → v0.6.6-CYCLE + v0.6.10 Humor-Overhaul + IM RAUM + Freies Universum).

---

## v0.75-dev (Argon-Pass) — "Die große Verkabelung & IM RAUM" (2026-10-18, Gemini 4 Argon)
> **Priorität: KRITISCH** — Alle bisher isolierten Subsysteme (SmartDialogues, Quests, Newspaper, Missionsbaum, 3 Enden, Aktenschrank, Optimierer, Postings) sind nun im Live-Spiel verbunden; kritische Spielbarkeits-Bugs behoben.
- [x] **Gemini-4-Argon-Übernahme & Evaluation dokumentiert:** `site/index.html`, `site/entwicklung.html`, `site/team.html`, `site/agent_benchmarks.html`, `site/last_passes.html`, `site/wiki.html` dokumentieren die 4 Agenten-Epochen (Qwen-Verbund, Cline, GitHub Copilot, Gemini 4 Argon) und die technischen Befunde.
- [x] **Bugfix Phantom-Start-Bug (Flugdeck):** Klick auf `START` im Flugdeck rief `startMission('m1')` auf, was am Ende `setState('SHIP')` ausführte und `BRIEFING_BOARD` sofort wieder überschrieb → gelöst über `SW.Game.prepareMission(id)` (Smoke-Test-Invariante `startMission -> SHIP` bleibt erhalten).
- [x] **Bugfix Geisterräume auf der Fax-Tragödie:** `data/postings.js` nutzte `Object.keys(SW.RoomNPCs)`, wodurch `Commander`, `Sechs`, `Neun`, `Zwo`, `Vier` und `Optimierer` aus den Räumen gefiltert wurden → alle Stamm-NPCs wieder in ihren Räumen.
- [x] **Bugfix Handbuch-Freischaltung:** Kapitel 5 & 6 prüfen nun sowohl `SW.World.missionProgress` (Array) als auch `SW.World.missionResults`, und `[←]/[→]` überspringt gesperrte Kapitel sauber.
- [x] **Copilot-Handover dokumentiert:** `site/entwicklung.html` + `site/index.html` vermerken den neuen Agenten-Context und die Regeln des Handoffs
- [x] **Lesbarkeits- und Kommentierungsregeln verankert:** `Agents.md` verlangt nachvollziehbaren, menschlich lesbaren Code als Qualitätskriterium
- [x] **Projekt-Status als LLM-Test dokumentiert:** Entwicklungsseite notiert, dass das Projekt chaotisch, aber noch nicht kaputt ist — genau das ist der aktuelle Zustand
- [x] **Recherche:** Open-Source-WC-Clones analysiert — wc1-re (WC1-Quellrekonstruktion:
      3D-Flugmodell, brains-Manöver-Vokabular, Formation/Wingman, Autopilot)
      → Konzept + Prinzipien in KONZEPTE.md
- [x] **M1 Flug-Gefühl:** Vorschub + Nachbrenner [SHIFT] (Sternen-Flow = Speed,
      Sternengleit beim Driften, Motor-Sound mit Tonhöhe = Speed), relative
      Projektion (Kamera am Spieler — Welt rutscht mit), Banken (Blick wankt
      mit Seitengeschwindigkeit), VORW-Anzeige (KT + Burn-Balken im Cockpit,
      V: im Mini-HUD), "FEIND NAH"-Warnung (WC1 "Enemy Near"), Nachbrenner-Warpstreifen im Sternenfeld
- [x] **M2 Feind-Brains:** WC1-Style State-Machine — `approach → strafe → break`
      (Jäger/Piraten halten Distanz, Wabbel-Zucken), Drohnen gradeaus
      (Selbstmörder), Kreuzer/Kapitän auf großer Distanz, Vorhaltschuss
      (Interpunkt + Drift), Salven (burst). Niemand fliegt mehr "durch".
- [x] **M3 Andere Schiffe + Funk:** Wingman **SECHS** (Formation vorn-links,
      Deckungsfeuer, IFF-blau, Funk: Start/Treffer/erster Kill/Idle/
      "Funkstille" bei Tod), Träger im Feld (nach Takeoff vorne, rückt davon),
      zivile Siedler-Eskorte in Mission 3 (`civilian: true`, grüne IFF),
      Idle-Funkzeilen in `dialogues.js` (wingmanIdle)
- [x] **Version-Banner → 0.75-dev** (Intro, console.log, Savegame, Credits,
      README, Wiki)
- [x] **Intro-Musik-Polish:** eigenes, zurückhaltendes Synth-Thema auf dem
      Titelbild und rhythmischerer eigener Loop im Asteroidenfeld; Start nach
      erster Eingabe (Browser-Audio-Policy), weicher Fade bei Szenenwechsel
- [x] **Smoke-Test:** +14 IM-RAUM-Checks + Argon-Integrations-Checks — ALLE TESTS OK
- [x] **M4a NAV & Flyby (2026-10-13):** Nav-Punkte mit Welt-z (Route ab
      Takeoff), Welle i am WP i (Gegner an den Waypoints), Autopilot [T] mit
      z-Ebenen-Passage + WP-Handover + Funk, Flyby-Burn auf der Ausstreckung,
      Nav-Karte (Route, Distanz, nächster WP), NAV-HUD (Distanz + Pfeil),
      Radar/Space-Map spieler-relativ, [A]-Fix (WASD) — +9 Smoke-Checks OK
- [x] **M4 Wellen-Formation & Stagger:** gemischte Gegnergruppen pro Nav-Punkt;
      optionale `staggerFrames` setzen nach und nach Verstärkung ein und
      verhindern, dass die ganze Gruppe im selben Frame erscheint
- [x] **Spec-Sheet WC1-Flugmodell:** `SPEC-FLUGMODELL.md` (Ist/Ziel/Phasen
      P1–P5, Mathematik, Konstanten, Akzeptanzkriterien, Datei-Map).
      P1 (NAV) steht; P2 = Vektor-Flugmodell (vel + yaw/pitch + Trägheit),
      P4 = Bewegung auf der Karte (Sektor-Geometrie)
- [x] **Systemschaden & Hangar-Reparatur:** Treffer beschädigen Antrieb,
      Waffen, Schilde oder Sensoren; Zustand bleibt in Savegames erhalten,
      Bolt repariert nach der Landung auf Wunsch mit [R]
- [x] **M5 Polish (Argon-Pass):** Ziel-Markierung (`SW.UI.renderTargetBracket` mit WC1-Target-Bracket, Name/Schild/Distanz und Vorhaltepunkt / Lead-Indicator-Pip), Wingman- & Zivil-Radar-Blips, Träger-Funk im Feld + Eigenverteidigung bei Friendly Fire, Nachbrenner-Sternstreifen
- [x] **Handbuch-Kapitel "Fliegen":** Ingame- und Web-Handbuch erklären
      Vorschub, Navigation, Systemschaden und Reparatur
- [ ] **M4 Missionen & Balance (Rest):** Schwierigkeitskurve im echten Langzeit-Browsertest weiter feinschleifen
- [ ] **Cockpit-Pass nach Schiffsklassen:** Layout, Anzeigen und Schaden
      später je Klasse gestalten, sobald Klassen und ihre Systeme feststehen;
      bis dahin keine weitere visuelle Cockpit-Überarbeitung
- [ ] **RC-Paket v0.75-rc**

## v0.70-dev — "Enden & Papierkram" (im Argon-Pass komplett integriert)
- [x] **Playtest (Pilot, 2026-10-13):** SPINDE besichtigt, Save/Load-Runde
      (Speichern → Neuladen → Laden, alter Name wieder da) OK, Musik [P] im
      Menü funktioniert
- [x] **Credits/Abspann:** neuer `CREDITS`-State nach dem Sieg-Debriefing — rollender Abspann (1990-Style) über Sternenfeld, Crew-Liste dynamisch aus `SW.Crew` (Status "gefallen" rot), Pilotenname aus dem Intro, Produktions-Credits, [LEER] = Weiterspulen / am Ende zum Träger, [ESC] = schließen, nach 5 s automatisch weiter. Tod → ohne Abspann direkt zum Träger. Debriefing-Prompt: "[ ZUM ABSPANN ]"
- [x] **GitHub:** Repo `tretboot/solo_wing_1990` angelegt, Push + Tag `v0.6.9-final` (2026-10-13)
- [x] **Version-Banner → 0.70-dev** (Intro-Titel, console.log, Savegame-Feld)
- [x] **Doku-Korrektur:** Beobachtungsdeck-Licht ist seit v0.6.9-rc implementiert (Sektoren-Licht in Fenster + Deck) — KONZEPTE-Checkbox + PATCHNOTES-Limitation waren Wunschdenken
- [x] **Screenshot-Pipeline verifiziert** (Agent-Chat, für den künftigen Grafik-Overhaul)
- [x] **3 Enden** (Sieg / Tod / Geheim „Akte 99-Z" über `SW.Game.getEndingType()`, Debriefing & Abspann reagieren)
- [x] **Fax-Drucker UI** (`SW.Fax` animiertes Thermopapier-Banner + `SW.Audio.playFax()` bei neuen/erledigten Quests)
- [x] **Aktenschrank** (Büro: 5 lesbare Geheimakten in `SW.Dialogues.akten` → setzt `akten_gelesen` + schaltet neue Dialoge frei)
- [x] **Optimierer-Erscheinen** (nach `m4_sieg` in der Bar, eigenes Gesicht in `SW.NPC.registry`, eigener SmartDialogue-Pool)
- [ ] **Externes Handbuch:** 7 → 12 Kapitel (Rest für v0.76)

## v0.6.9-final — "SPINDE, Save/Load & Audio-Fix" (2026-10-13)
- [x] **SPINDE (13. Raum, Bunker):** Daten (Kantine angebaut, `npcs: []`) + prozedurale Art (Spindwand, eigener Spind mit Pilotennamen, Lagerbett, Plakat) + Bunker-Tür (Name, blinkt)
- [x] **Save/Load-Panel:** [1] Speichern / [2] Laden / [3] Export / [4] Löschen / [5] Schließen (Klick + Tasten), ESC schließt zuerst das Panel, `js/savegame.js` eingebunden (29 Skripte)
- [x] **Audio-Fix:** Intro-Musik-Loop (ended → interne Sequenz), `stopMusic()` = volle Stille (alle Systeme), `[P]`/`toggleMusic()` für beide Systeme
- [x] **Dialog-Box (Bar):** Höhe 60px, Umbruch 65 Zeichen, `SW.NPC.renderRoomFace()`
- [x] **Minimap + Cheat-Map:** 13 Räume (Grids auto)
- [x] **Repo-Cleanup für GitHub:** 12 Temp-Dateien + `Last Changes/` entfernt, `WC1_PCI_ANALYSE.md` → C-Auszüge durch Beschreibungstext ersetzt
- [x] **Doku:** README v0.6.9-final, PATCHNOTES, KONZEPTE, Wiki-Hub (`site/wiki.html`) + Nav-Link
- [x] **Smoke-Test:** ALLE TESTS OK (13 Räume, SPINDE, Save/Load-API)
- [x] **Playtest im Browser:** SPINDE-Besuch + Save/Load-Runde (Speichern → Neuladen → Laden) (Pilot, 2026-10-13: OK)
- [x] **GitHub-Push:** Repo angelegt + Push + Tag `v0.6.9-final` (2026-10-13)

## WIEDERHERSTELLUNG (2026-10-12, nach Unterbrechung)
> Der Spieler hatte eine Shell-Operation geflogen, die `js/ui.js` in eine
> einzige Kommentar-Zeile zerlegt und `js/npc.js` an 5 Stellen beschädigt
> hatte. Alles wiederhergestellt, Smoke-Test grün. Details: PATCHNOTES.md.
- [x] ui.js wiederhergestellt (Basis 0.6.5-rc + Cockpit-Video + BriefingBoard v2)
- [x] npc.js repariert (Method-Enden, side-part-case, drawFace + resolve())
- [x] Smoke-Test synchronisiert (28 Skripte = index.html, +dialogue.js +newspaper.js) → ALLE TESTS OK
- [x] Audio/TTS-Lazy-Init (Browser-Policy, kein Vorab-Init)
- [x] Doku-Pass (PATCHNOTES v0.6.7/0.6.8/0.6.9) + Version-Banner 0.6.9-dev

## v0.6.6 — "Sprung & Dialog" (fertig)
- [x] JUMP-Cinematic (6 Phasen, Z-Achse-Sterne, Story-Zeilen mit TTS, LEER=skip)
- [x] Briefing-Szene (Commander + 3 Piloten mit echten NPC-Gesichtern)
- [x] Dialog-Paging + Scrollbar (lange Dialoge nicht abgeschnitten)
- [x] World.systemId nach Mission (Beobachtungsdeck zeigt Einsatz-System)
- [x] NPC-Overhaul (11 Charaktere, prozedurale Gesichter, TTS-Stimmen, `js/npc.js`)
- [x] Cockpit-Video (280×160px, NPC-Porträt + Sprechblase, `SW.Comm`-Integration)
- [x] KONZEPTE.md → KONZEPTE.md umbenannt (Tippfehler)
- [x] Workflow-Optimierung (NPC in eigener Datei, datengetriebene Dialoge, eine drawFace-API)
- [x] Doku-Update (KONZEPTE.md ✅, PATCHNOTES.md ✅, TODO.md ✅) — 2026-10-12
- [x] Smoke-Test: Briefing → JUMP → Cockpit → Funk (Video) → Landung (62/62, 2026-10-12)

## v0.6.7 — "Smart Dialogues" (im Argon-Pass komplett integriert)
- [x] **Dialogue-Engine** (`js/dialogue.js`): Context, Ereignis-Log, req-Gates,
      gewichtete Auswahl, Cooldown, Subplot-Stufen
- [x] **Schreib-Block 1: Base-Dialoge** (11 NPCs, ~110 Zeilen)
- [x] **Schreib-Block 2a: Mission-Reaktiv m1–m3** (Sieg/Tod, Hauptbesetzung)
- [x] **Schreib-Block 2b: Mission-Reaktiv m4** (Kältekammer-Klimax, alle 11 NPCs, Sieg + Tod — 22 Zeilen, `req`-Gates `m4_sieg`/`m4_tod`, 2026-10-12)
- [x] **Schreib-Block 3: Quest-Dialoge** (Auftrag, Erfolg, Akten-Reaktionen, Kaffee, Strafversetzung)
- [x] **Schreib-Block 4: Subplots ausbauen** (Audit 2 Stufen, Alien 3 Stufen, Optimierer, alle Raum-NPCs inkl. Ragnhild, Klopstock, Scherenflick, Archiv, Löffel, Stille, Mutters, Spiegel, Rohr, Nadel)
- [x] **A/B-Story-Checks** (Verzweigungs-Validierung, Spoiler-Gates im Smoke-Test geprüft)
- [x] **Raum-Integration:** NPC-Klick in Räumen → `SW.Ship.startNpcDialogue()` nutzt `SW.SmartDialogues.get()` + startet Quests

## v0.6.8 — "Quests, Trigger & Missionsbaum" + Schiffszeitung (im Argon-Pass integriert)
- [x] **Flug-Trigger:** `SW.Quests.flight(event)` + Ereignis-Log + Dialog-Brücke
      (mission, kill, first_kill, shield_low, heard_rap, player_down)
- [x] **Quest-Ketten & Gates:** 5 Fax-Quests mit Raum-, Flug- und Flag-Triggern sowie Belohnungs-Flags (`kaffee_gebracht`, `klo_wahrheit_gehoert`, `strafversetzung_bereit`)
- [x] **Schiffszeitung-Engine** (`js/newspaper.js`): Templates, Generierung nach jedem Einsatz, `SW.Newspaper.latest()`
- [x] **Artikel-Typen:** Missionserfolge, Special Events, NPC-Gossip, Subplot-Hints, Front-Berichte
- [x] **Zeitungs-Lesemodus im Schiff:** Taste `[J]` oder Klick aufs Büro-Faxgerät öffnet *DIE TRÄGER-POST* samt aktivem Quest-Log (`renderNewspaperOverlay`)
- [x] **Missionsbaum im Flugdeck:** `M1`–`M4` frei wählbar, zeigt Sektor, Wellen und Aktenstatus (`✓` nach Abschluss)
- [x] **Quest-Log-UI:** Thermopapier-Fax-Banner (`SW.Fax`) + *TRÄGER-POST*-Overlay
- [x] **NPC-Verteilung pro Mission:** `World.init(missionId, seed)` unterstützt `m1`–`m4` und `s1`–`s3`

## v0.6.9-rc — "Sektoren-Licht, Glas, Ethikrat & RC" (2026-10-12)
- [x] **Sektoren-Licht:** Fenster in Sektoren-Farbe (Bar, Schule, Beobachtung) + Cheat [3]/[4]/[5] im Menü
- [x] **Glass-Design** (Website): durchsichtige Glas-Elemente, Umschalter TERMINAL/GLASS
- [x] **Ethikrat-Meeting** (Selbst-Meeting) + Protokoll als Blog-Post + Update in ethikrat.html
- [x] **Aufsatz "Entwicklung"** (site/entwicklung.html) + Nav-Link auf allen 8 Seiten
- [x] **Release Candidate:** release/v0.6.9-rc/ + Zip, Smoke-Test aus dem RC-Ordner grün (105/105)

## v0.6.9-dev — "Launch-Tube & Kamera-System" (2026-10-12)
- [x] **Launch-Tube-Cinematic** (TAKEOFF: Rippen, Streben, Lichterketten, Triebwerk-Wackeln, Exit-Flash)
- [x] **ViewMode-System** (Taste [V] im COCKPIT, zentral in `SW.Engine.view`): cockpit / chase / topdown
- [x] **Top-Down-Projektion** (Z→Y, flache 2D-Ebene) + eigenes Top-Down-Sprite + Aim-Mapping
- [x] **Mini-HUD** (chase/topdown: Schild, Score, Radar, [V]-Anzeige)
- [x] Handbuch: [V] im Steuerungs-Kapitel
- [x] **Schulraum "ZWEIG"** (12. Raum: Git-Tutorial mit Diskettens + Archiv, Kreidetafel, Formular 14-C, Katze am Fenster)
- [x] **Website-Theme-Umschalter:** Terminal (grün) / Corporate (blau-orange), localStorage, alle 15 Seiten

## v0.6.9 — "Musik, Optik, Katalog & Website"
- [x] **Ingame Handbuch** (Taste [H], 7 Kapitel, progressiv freigeschaltet)
- [x] **Externes Handbuch** (HTML, 7 Kapitel, verknüpft mit Ingame-Inhalten)
- [x] **Website-Überarbeitung** (Corporate Design v0.6.9, Sternenkorps-Standard)
- [x] **Game ↔ Website Bridge** (Ingame [H], Website → Spiel, Handbuch-Links)
- [x] **Switch-Port-Vorbereitung** (CSS Media Queries, UI-Scaling, Touch-Controls geplant)
- [x] **Planeten-Renderer & Sternenbasis SEKTOR 7** (Ringe, Krater und Sektor-7-Sternenbasis in `renderJump` und `artBeobachtung`)
- [x] **Beobachtungsdeck: Planet + System-Name**

## v0.6.10 — "Humor-Overhaul" (laufend gepflegt, im Argon-Pass erweitert)
- [x] **Dialog-Pass:** 1990-Deadpan über Raum-Dialoge, 5 Geheimakten, Funksprüche, Zeitungs-Artikel
- [x] **Doku-Humor:** Patch Notes, Handbuch, Website im Sternenkorps-Ton (inkl. Formular 91-X)

## v0.76 → v0.81 — "Freies Universum" (Major-Overhaul, Grundlagen gelegt)
- [x] **Flotten-Grundlage:** stabile Posting-IDs, Posting-Katalog,
      Crew-/Raum-Zuweisungen und rückwärtskompatible Savegame-Erweiterung
- [x] **Erster Versetzungsprototyp:** kleiner Zerstörer (`test-destroyer`) mit sechs zugänglichen
      Bereichen, zwei Jäger-Stellplätzen und reduzierter Crew (Sechs + Bolt)
- [x] **Posting-Wechsel im Spiel & Außenposten (`outpost-31`):** Versetzungsschalter im Büro wechselt ohne Entwicklerkonsole zwischen *TCS Fax-Tragödie*, *Zerstörer Kiesel* und dem monotonen 3. Posting *Außenposten 31*
- [ ] **Zerstörer-Innenraum:** eigene Räume, Decks, Artworks und Schiffssysteme
      statt der vorläufig wiederverwendeten Träger-Raumgrafiken
- [ ] **v0.76 Eigenes Schiff:** Schiffs-Markt (12 Modelle), Kaufsystem, Schiffswechsel,
      Stats → Flugphysik
- [ ] **v0.77 Universum wächst:** 3 → 20 Systeme, Jump-Gates (Treibstoff),
      Zufalls-Encounter
- [ ] **v0.78 Fraktionen:** Reputation 0–100 (Sternenkorps, Piraten, Audit, Siedler,
      Optimierer), Fraktions-Missionen, Reputation steuert Preise/Dialoge
- [ ] **v0.79 Mission Generator:** prozedurale Missionen, Missionsbrett, Kopfgeld,
      Zufalls-Events
- [ ] **v0.80 Ökonomie:** Credits, Schiffs-Markt, Upgrade-Shop, Wartungskosten
- [ ] **v0.81 Komplett:** NPC-Rivalen im Freiflug (Sechs/Neun/Zwo), Subplot-Fortsetzung,
      Zufalls-Lore, mehrere Enden

> Laufzeit-Builds beziehen ihre angezeigte Version aus `SW.VERSION` in
> `js/config.js`; Versionsnummern in statischen Dokumenten bleiben Teil des
> jeweiligen Dokumentationsstands.

## BACKLOG (später)
- [ ] **Klassenbezogener Cockpit-UI-Pass** (Weapon Display, Target Data, Throttle, Radar und Schadensoptik erst mit echten Schiffsklassen abstimmen) — Mittel
- [ ] **Würfelspiel** (Bar, Minispiel) — Klein
- [ ] **Simulator-Nachholung** (für Nicht-Bestandene) — Klein
- [x] **Kältekammer-Ende / Geheimes Ende** (Akte 99-Z, 2026-10-18)
- [ ] **Audit-Schiffe** (eigenes Wireframe-Gegnerverhalten) — Mittel
- [x] **Beerdigungs-/Nachruf-Interaktion** (Kapelle: Klick auf Kerzen liest Nachrufe vor, 2026-10-18)
- [x] **Carrier-Interaktion** (Friendly-Fire-Warnung + Abwehrfeuer ab 3. Treffer, 2026-10-18)
- [x] **Escort-Logik** (Zivile Siedler-Frachter in Mission 3, 2026-10-18)

---

## FERTIG (v0.6.5-rc + v0.6.6-dev)

- [x] Engine (3D, Stars, Kollision, Drift-Physik)
- [x] Cockpit (WC1-Style, Frame, Radar, Shields, Score)
- [x] Audio (prozedural, Web Audio API)
- [x] TTS (14 Profile, Voice-Pool, Mikro-Variation)
- [x] Input (Multi-Device, WASD/Pfeile/Maus/Gamepad, Laser-Slots)
- [x] State Machine (INTRO→AKADEMIE→BAR→SHIP→…→DEBRIEFING)
- [x] Träger (11 Räume, Tür-Klick, Minimap, NPC-Dialoge)
- [x] Crew (18 + 5 Piloten, Scoreboard, Backstories)
- [x] Missionen (m1–m4, m4 = DER FRACHTER)
- [x] Quests (5, Fax-basiert, Event-System)
- [x] Lore (Audit, Piraten, Optimierer, KLO, Alien)
- [x] Schiffsklassen (4, Barebones)
- [x] Akademie (Tutorial, Sim-Flug, Pro-forma)
- [x] Intro (Asteroidenfeld + Name + Zuordnung)
- [x] Rap-Pirat (Kugelschreiber hört Rapmusik)
- [x] Ethikrat-Blog (A/B-Test, KLO ist der Ethikrat)
- [x] WC1 PCI Analyse (Referenz für Flug-KI)
- [x] Agent-Benchmarks (Sideprojekt, Orchestrierung messen)
- [x] Website (Evaluation, Patch Notes, Blog, Benchmarks, Ethikrat)
- [x] JUMP-Cinematic v2 (6-Phasen-State-Machine, Z-Achse-Sterne)
- [x] Briefing-Szene (echte NPC-Gesichter statt Silhouetten)
- [x] NPC-Overhaul (11 Charaktere, prozedurale Gesichter, TTS-Stimmen)
- [x] Cockpit-Video (280×160px Video-Panel, NPC-Porträt, Sprechblase)

---

## ORCHESTRIERUNG (v0.6.2b)

> **Lead Dev = Top-Level-Spec. No Thinking = Code. Code Review = Score + Fix-Liste. Commander = Fix-Pass + Integration. NoThink Code = nur für Text/Daten.**

Siehe `site/agent_benchmarks.html` für Messdaten + Graphen.
