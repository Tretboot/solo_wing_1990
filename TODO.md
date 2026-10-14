# SOLO WING 1990 — TODO

> Stand: v0.75-dev (2026-10-14). Geordnet nach Version (Roadmap: KONZEPTE.md → v0.6.6-CYCLE + v0.6.10 Humor-Overhaul + IM RAUM + Freies Universum).

---

## v0.75-dev — "IM RAUM" (Flugmodell & Kampfspür, in Arbeit, seit 2026-10-13)
> **Priorität: KRITISCH** (Pilot-Playtest 2026-10-13: "Wir fliegen, aber nicht
> so wirklich gefühlt — immer gradeaus, mal etwas links/rechts. Keine
> wirklichen Gegner, keine anderen Schiffe auf der Karte.")
> Konzept + Recherche: KONZEPTE.md → "v0.75 — IM RAUM" (wc1-re/wc2-re/
> OpenReliant/FreeSpace Open).
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
      V: im Mini-HUD), "FEIND NAH"-Warnung (WC1 "Enemy Near")
- [x] **M2 Feind-Brains:** WC1-Style State-Machine — `approach → strafe → break`
      (Jäger/Piraten halten Distanz, Wabbel-Zucken), Drohnen gradeaus
      (Selbstmörder), Kreuzer/Kapitän auf großer Distanz, Vorhaltschuss
      (Interpunkt + Drift), Salven (burst). Niemand fliegt mehr "durch".
- [x] **M3 Andere Schiffe + Funk:** Wingman **SECHS** (Formation vorn-links,
      Deckungsfeuer, IFF-blau, Funk: Start/Treffer/erster Kill/Idle/
      "Funkstille" bei Tod), Träger im Feld (nach Takeoff vorne, rückt davon),
      Idle-Funkzeilen in `dialogues.js` (wingmanIdle)
- [x] **Version-Banner → 0.75-dev** (Intro, console.log, Savegame, Credits,
      README, Wiki)
- [x] **Smoke-Test:** +14 IM-RAUM-Checks (Vorschub, Burn, relative Projektion,
      Sternen-Flow, Brains-Distanz, Wingman-Formation, Träger-Feld) — ALLE TESTS OK
- [x] **M4a NAV & Flyby (2026-10-13):** Nav-Punkte mit Welt-z (Route ab
      Takeoff), Welle i am WP i (Gegner an den Waypoints), Autopilot [T] mit
      z-Ebenen-Passage + WP-Handover + Funk, Flyby-Burn auf der Ausstreckung,
      Nav-Karte (Route, Distanz, nächster WP), NAV-HUD (Distanz + Pfeil),
      Radar/Space-Map spieler-relativ, [A]-Fix (WASD) — +9 Smoke-Checks OK
- [x] **Spec-Sheet WC1-Flugmodell:** `SPEC-FLUGMODELL.md` (Ist/Ziel/Phasen
      P1–P5, Mathematik, Konstanten, Akzeptanzkriterien, Datei-Map).
      P1 (NAV) steht; P2 = Vektor-Flugmodell (vel + yaw/pitch + Trägheit),
      P4 = Bewegung auf der Karte (Sektor-Geometrie)
- [x] **Systemschaden & Hangar-Reparatur:** Treffer beschädigen Antrieb,
      Waffen, Schilde oder Sensoren; Zustand bleibt in Savegames erhalten,
      Bolt repariert nach der Landung auf Wunsch mit [R]
- [ ] **M4 Missionen & Balance (Rest):** Wellen an den WPs feintunen
      (Typen-Mix pro WP, Stagger), Schwierigkeitskurve,
      Damage/HP/Fire-Rate-Balance (Playtest)
- [ ] **M5 Polish:** Ziel-Markierung (WC1-Target-Bracket), Wingman-Tod als
      Ereignis (Radar + Nachruf), Träger-Funk im Feld, Burn-Flash,
      Top-Down-Balancing mit Brains
- [x] **Handbuch-Kapitel "Fliegen":** Ingame- und Web-Handbuch erklären
      Vorschub, Navigation, Systemschaden und Reparatur
- [ ] **Cockpit-Pass nach Schiffsklassen:** Layout, Anzeigen und Schaden
      später je Klasse gestalten, sobald Klassen und ihre Systeme feststehen;
      bis dahin keine weitere visuelle Cockpit-Überarbeitung
- [ ] **Playtest im Browser:** Speed-Gefühl, Nachbrenner, Brains, Wingman,
      Funk, Träger im Feld, alle drei Ansichten
- [ ] **RC-Paket v0.75-rc** (inkl. offener v0.70-Punkte, siehe unten)

## v0.70-dev — "Enden & Papierkram" (weitestgehend fertig, Rest → v0.75-rc, seit 2026-10-13)
- [x] **Playtest (Pilot, 2026-10-13):** SPINDE besichtigt, Save/Load-Runde
      (Speichern → Neuladen → Laden, alter Name wieder da) OK, Musik [P] im
      Menü funktioniert
- [x] **Credits/Abspann:** neuer `CREDITS`-State nach dem Sieg-Debriefing — rollender Abspann (1990-Style) über Sternenfeld, Crew-Liste dynamisch aus `SW.Crew` (Status "gefallen" rot), Pilotenname aus dem Intro, Produktions-Credits, [LEER] = Weiterspulen / am Ende zum Träger, [ESC] = schließen, nach 5 s automatisch weiter. Tod → ohne Abspann direkt zum Träger. Debriefing-Prompt: "[ ZUM ABSANN ]"
- [x] **GitHub:** Repo `tretboot/solo_wing_1990` angelegt, Push + Tag `v0.6.9-final` (2026-10-13)
- [x] **Version-Banner → 0.70-dev** (Intro-Titel, console.log, Savegame-Feld)
- [x] **Doku-Korrektur:** Beobachtungsdeck-Licht ist seit v0.6.9-rc implementiert (Sektoren-Licht in Fenster + Deck) — KONZEPTE-Checkbox + PATCHNOTES-Limitation waren Wunschdenken
- [x] **Screenshot-Pipeline verifiziert** (Agent-Chat, für den künftigen Grafik-Overhaul)
- [ ] **3 Enden** (Sieg / Tod / Geheim)
- [ ] **Fax-Drucker UI** (Quest-Feedback als animiertes Fax)
- [ ] **Aktenschrank** (Büro: 5 Akten lesen → Flag → neuer Dialog)
- [ ] **Optimierer-Erscheinen** (nach m4, Bar, Dialog)
- [ ] **Externes Handbuch:** 6 → 12 Kapitel
- [ ] **RC-Paket v0.70-rc**

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

## NÄCHSTE OFFENE PAKETE (in Reihenfolge, Stand 2026-10-12)
1. **v0.6.7 Schreib-Block 3** — Quest-Dialoge (Auftrag, Erfolg, Fehlschlag)
2. **v0.6.7 Schreib-Block 4** — Subplots ausbauen (Audit 2 Stufen, Optimierer, mehr NPCs)
3. **v0.6.7 A/B-Story-Checks** — Verzweigungs-Validierung, Spoiler-Gates testen
4. **v0.6.7 Raum-Integration** — ui.js ruft `SW.SmartDialogues.get()` auf (NPC-Klick →
   Porträt + Sprechblase). Engine, Bridge (states.js) und alle Texte (Blöcke 1/2a/2b) stehen.
5. **v0.6.7 Cooldown-Tuning** im Playtest
6. **v0.6.8** — Flug-Trigger `SW.Quests.flight()` (⚠ Code fehlt, s. unten), Zeitungs-Artikel
   (40+), Zeitungs-Raum, 50+ Quests, Missionsbaum, Quest-Log-UI
7. **GitHub** — ✅ Repo angelegt + Push + Tag v0.6.9-final (2026-10-13); Tags v0.6.5-rc/v0.6.9-rc noch offen
8. **v0.70** — ✅ Credits/Abspann (v0.70-dev, 2026-10-13); Rest: 3 Enden, Fax-UI, Aktenschrank, Optimierer

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

## v0.6.7 — "Smart Dialogues" (das Dorf reagiert)
> Engine ist klein, Aufwand = Schreiben. Schreib-Blöcke: 2–3 Wochen eingeplant.
- [x] **Dialogue-Engine** (`js/dialogue.js`): Context, Ereignis-Log, req-Gates,
      gewichtete Auswahl, Cooldown, Subplot-Stufen
- [x] **Schreib-Block 1: Base-Dialoge** (11 NPCs, ~110 Zeilen)
- [x] **Schreib-Block 2a: Mission-Reaktiv m1–m3** (Sieg/Tod, Hauptbesetzung)
- [x] **Schreib-Block 2b: Mission-Reaktiv m4** (Kältekammer-Klimax, alle 11 NPCs, Sieg + Tod — 22 Zeilen, `req`-Gates `m4_sieg`/`m4_tod`, 2026-10-12)
- [ ] **Schreib-Block 3: Quest-Dialoge** (Auftrag, Erfolg, Fehlschlag)
- [ ] **Schreib-Block 4: Subplots ausbauen** (Audit 2 Stufen, Optimierer, mehr NPCs)
- [ ] **A/B-Story-Checks** (Verzweigungs-Validierung, Spoiler-Gates testen)
- [ ] **Raum-Integration:** NPC-Klick in Räumen → Smart-Dialogue (Porträt + Sprechblase)
- [ ] Cooldown-Tuning im Playtest (kein Hamsterrad von 3 Sätzen)

## v0.6.8 — "Quests, Trigger & Missionsbaum" + Schiffszeitung
- [ ] **Flug-Trigger:** `SW.Quests.flight(event)` + Ereignis-Log + Dialog-Brücke
      (mission_complete, kill, first_kill, shield_low, room, player_down)
- [ ] **Quest-Ketten:** Main (m1→m4), Alien, Audit, Crew (in `data/quests.js`)
- [ ] **Missions-Quests:** m1–m4 als formale Quests (Fortschritt wird sichtbar)
- [ ] **Quest-Gates:** `voraussetzung` (Flags) steuert Verfügbarkeit
      > ⚠ Stand 2026-10-12: Die vier Punkte oben standen als [x], existieren aber
      > nicht im Code — `js/quests.js` ist das alte tick-System, `data/quests.js`
      > hat 5 Einzel-Quests (ohne Ketten, ohne `voraussetzung`). Checkboxen korrigiert.
      > Details: PATCHNOTES.md → v0.6.9-dev → „Integration & Befunde".
- [x] **Schiffszeitung-Engine** (`js/newspaper.js`): Templates, Generierung, Rendering
- [x] **Artikel-Typen:** Missionserfolge, Special Events, NPC-Gossip, Subplot-Hints, Front-Berichte
- [ ] **Schreib-Block 3: Zeitungs-Artikel** (40+ Vorlagen: Gossip, Specials, Subplots)
- [ ] **Zeitungs-Raum** (`js/states/newspaper_room.js`): Leseecke, Pinnwand, Monitor
- [ ] **Neue NPCs:** Redakteur, Leser-Gruppe (3), Archivar
- [ ] **TTS-Vorlesung:** Artikel werden vorgelesen bei Raum-Betreten
- [ ] **NPC-Reaktionen:** NPCs diskutieren aktuelle Artikel im Raum
- [ ] **Quest-Datenbank ausbauen:** 5 → 50+ Quests (Crew-Arcs, Side, Hidden) — Schreib-Blöcke
- [ ] **Missions-Spawner:** Quests spawnen Missionen (`onMissionSpawn`-Hook)
- [ ] **Missionsbaum:** Briefing-Tafel zeigt m1→m2→m3→m4 gesperrt/frei
- [ ] **Quest-Log-UI:** Fax-Stil (T-Display): aktive Quests, Fortschritt, Belohnung
- [ ] **NPC-Verteilung pro Mission:** `World.init(missionId, seed)`
- [ ] **Full Story-Test:** m1→m2→m3 durchspielen, Deck + Dialoge unterscheiden sich
- [ ] **Fix: Minimap-Grid** (5×2 = 10 Slots, aber 11 Räume → 11. Punkt steht außerhalb)

## v0.6.9-rc — "Sektoren-Licht, Glas, Ethikrat & RC" (2026-10-12)
- [x] **Sektoren-Licht:** Fenster in Sektoren-Farbe (Bar, Schule, Beobachtung) + Cheat [3]/[4]/[5] im Menü
- [x] **Glass-Design** (Website): durchsichtige Glas-Elemente, Umschalter TERMINAL/GLASS
- [x] **Ethikrat-Meeting** (Selbst-Meeting) + Protokoll als Blog-Post + Update in ethikrat.html
- [x] **Aufsatz "Entwicklung"** (site/entwicklung.html) + Nav-Link auf allen 8 Seiten
- [x] **Release Candidate:** release/v0.6.9-rc/ + Zip, Smoke-Test aus dem RC-Ordner grün (105/105)
- [ ] **Playtest:** Glas-Theme + Sektoren-Licht im Browser, Top-Down-Balancing, Tube-Timing

## v0.6.9-dev — "Launch-Tube & Kamera-System" (2026-10-12)
- [x] **Launch-Tube-Cinematic** (TAKEOFF: Rippen, Streben, Lichterketten, Triebwerk-Wackeln, Exit-Flash)
- [x] **ViewMode-System** (Taste [V] im COCKPIT, zentral in `SW.Engine.view`): cockpit / chase / topdown
- [x] **Top-Down-Projektion** (Z→Y, flache 2D-Ebene) + eigenes Top-Down-Sprite + Aim-Mapping
- [x] **Mini-HUD** (chase/topdown: Schild, Score, Radar, [V]-Anzeige)
- [x] Handbuch: [V] im Steuerungs-Kapitel
- [ ] **Playtest:** Top-Down-Balancing (Aim-Feeling, Radar-Abgleich, Feind-Skalierung)
- [ ] **Playtest:** Launch-Tube-Timing (210 Frames) + Whoosh-Sound beim Freigang?
- [x] **Schulraum "ZWEIG"** (12. Raum: Git-Tutorial mit Diskettens + Archiv, Kreidetafel, Formular 14-C, Katze am Fenster)
- [x] **Website-Theme-Umschalter:** Terminal (grün) / Corporate (blau-orange), localStorage, alle 15 Seiten

## v0.6.9 — "Musik, Optik, Katalog & Website"
- [x] **Ingame Handbuch** (Taste [H], 6 Kapitel, progressiv freigeschaltet)
- [x] **Externes Handbuch** (HTML, 6 Kapitel, verknüpft mit Ingame-Inhalten)
- [x] **Website-Überarbeitung** (Corporate Design v0.6.9, Sternenkorps-Standard)
- [x] **Game ↔ Website Bridge** (Ingame [H], Website → Spiel, Handbuch-Links)
- [x] **Switch-Port-Vorbereitung** (CSS Media Queries, UI-Scaling, Touch-Controls geplant)
- [ ] **Eine Melodie, 7 Instrumentierungen** (Bar=Jazz, Maschinenraum=Hall, Büro=offiziell,
      Kapelle=spärlich, Kantine=rund, Flugdeck=militärisch, KLO=Stille)
- [ ] **Musik-Wechsel Takeoff → Cockpit** + JUMP-Musik (Spannung, hoch)
- [ ] **Sprite-Pass** (Schiffe aufhübschen, Planeten-Renderer, Sternenbasis SEKTOR 7)
- [ ] **Raum: SCHIFFSKATALOG** (X-Wing-Stil, Modelle + Infos, 12. Raum)
- [x] **Beobachtungsdeck: Planet + System-Name** (Code-Check 2026-10-12: war da — Checkbox war Wunschdenken)
- [ ] **JUMP-Polish** (Quell-System schrumpft, Ziel wächst)

## v0.6.10 — "Humor-Overhaul" (geplant, Konzept: KONZEPTE.md → "v0.6.10")
> Auslöser (2026-10-12): Piloten-Commit „Ich hab keine Ahnung was ich hier
> warum committe". Der 1990-Deadpan-Ton ist schon überall — jetzt wird er
> systematisch gepflegt. Lässt sich parallel zum Schreiben anderer Blöcke laufen.
- [ ] **Dialog-Pass:** 1990-Deadpan über Raum-Dialoge, Funksprüche, Zeitungs-Artikel
      (Regel: Humor ist Situation, nie Kommentar — niemand erklärt den Witz)
- [ ] **Doku-Humor:** Patch Notes, Handbuch, Website im Sternenkorps-Ton
      (Formulare, Stempel, „Formular 12-B erforderlich")
- [ ] **Git-Commit-Convention:** Zeile 1 sachlich, Zeile 2 darf Deadpan sein
      (Doku in README.md → GIT)
- [ ] **Ton-Regeln finalisieren** (KONZEPTE.md → „v0.6.10", TON-REGEL-Block)

## v0.70 — "Enden & Papierkram"
- [ ] **3 Enden** (Sieg / Tod / Geheim)
- [x] **Credits/Abspann** (in v0.70-dev umgesetzt, 2026-10-13: CREDITS-State nach Sieg)
- [ ] **Fax-Drucker UI** (Quest-Feedback als animiertes Fax)
- [ ] **Aktenschrank** (Büro: 5 Akten lesen → Flag → neuer Dialog)
- [ ] **Optimierer-Erscheinen** (nach m4, Bar, Dialog)
- [ ] **Externes Handbuch** (HTML + PDF, 12 Kapitel + Crew-Zitate)
- [ ] **RC-Paket v0.70-rc**

## v0.76 → v0.81 — "Freies Universum" (Major-Overhaul, Pläne stehen)
> Eigene Versionsserie. Details: KONZEPTE.md → "v0.76 → v0.81".
> (Renommage 2026-10-13: v0.75 ist jetzt "IM RAUM" — die Serie rückt um eine
> Version nach rechts.)
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

## BACKLOG (später)
- [ ] **Klassenbezogener Cockpit-UI-Pass** (Weapon Display, Target Data, Throttle, Radar und Schadensoptik erst mit echten Schiffsklassen abstimmen) — Mittel
- [ ] **Würfelspiel** (Bar, Minispiel) — Klein
- [ ] **Simulator-Nachholung** (für Nicht-Bestandene) — Klein
- [ ] **Kältekammer-Ende** (Alien wird real, Futurion-Logik) — Mittel
- [ ] **Audit-Schiffe** (Wireframe, Stempel statt Explosionen) — Mittel
- [ ] **Beerdigungs-Event** (Kapelle nach Tod, Kerzen zünden) — Klein
- [ ] **Carrier-Interaktion** (3-Treffer-Warnung, One-Hit-Kill) — Klein
- [ ] **Romantik-System**, **Waffenausbau**, **Formation-Burst**, **Determination-Knob**,
      **Rout-Logik**, **Escort-Logik**, **Mehr Systeme**

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
