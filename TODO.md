# SOLO WING 1990 — TODO

> Stand: v0.6.6-dev (2026-10-12). Geordnet nach Version (Roadmap: KONZEPTE.md → v0.6.6-CYCLE + Freies Universum).

---

## v0.6.6 — "Sprung & Dialog" (fast fertig)
- [x] JUMP-Cinematic (6 Phasen, Z-Achse-Sterne, Story-Zeilen mit TTS, LEER=skip)
- [x] Briefing-Szene (Commander + 3 Piloten mit echten NPC-Gesichtern)
- [x] Dialog-Paging + Scrollbar (lange Dialoge nicht abgeschnitten)
- [x] World.systemId nach Mission (Beobachtungsdeck zeigt Einsatz-System)
- [x] NPC-Overhaul (11 Charaktere, prozedurale Gesichter, TTS-Stimmen, `js/npc.js`)
- [x] Cockpit-Video (280×160px, NPC-Porträt + Sprechblase, `SW.Comm`-Integration)
- [x] KONZEPTE.md → KONZEPTE.md umbenannt (Tippfehler)
- [x] Workflow-Optimierung (NPC in eigener Datei, datengetriebene Dialoge, eine drawFace-API)
- [ ] Doku-Update (KONZEPTE.md ✅, PATCHNOTES.md, TODO.md ✅) — diese Session
- [ ] Smoke-Test: Briefing → JUMP → Cockpit → Funk (Video) → Landung

## v0.6.7 — "Smart Dialogues" (das Dorf reagiert)
> Engine ist klein, Aufwand = Schreiben. Schreib-Blöcke: 2–3 Wochen eingeplant.
- [x] **Dialogue-Engine** (`js/dialogue.js`): Context, Ereignis-Log, req-Gates,
      gewichtete Auswahl, Cooldown, Subplot-Stufen
- [x] **Schreib-Block 1: Base-Dialoge** (11 NPCs, ~110 Zeilen)
- [x] **Schreib-Block 2a: Mission-Reaktiv m1–m3** (Sieg/Tod, Hauptbesetzung)
- [ ] **Schreib-Block 2b: Mission-Reaktiv m4** (Kältekammer-Klimax, alle 11 NPCs)
- [ ] **Schreib-Block 3: Quest-Dialoge** (Auftrag, Erfolg, Fehlschlag)
- [ ] **Schreib-Block 4: Subplots ausbauen** (Audit 2 Stufen, Optimierer, mehr NPCs)
- [ ] **A/B-Story-Checks** (Verzweigungs-Validierung, Spoiler-Gates testen)
- [ ] **Raum-Integration:** NPC-Klick in Räumen → Smart-Dialogue (Porträt + Sprechblase)
- [ ] Cooldown-Tuning im Playtest (kein Hamsterrad von 3 Sätzen)

## v0.6.8 — "Quests, Trigger & Missionsbaum" + Schiffszeitung
- [x] **Flug-Trigger:** `SW.Quests.flight(event)` + Ereignis-Log + Dialog-Brücke
      (mission_complete, kill, first_kill, shield_low, room, player_down)
- [x] **Quest-Ketten:** Main (m1→m4), Alien, Audit, Crew (in `data/quests.js`)
- [x] **Missions-Quests:** m1–m4 als formale Quests (Fortschritt wird sichtbar)
- [x] **Quest-Gates:** `voraussetzung` (Flags) steuert Verfügbarkeit
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

## v0.6.9 — "Musik, Optik & Katalog"
- [ ] **Eine Melodie, 7 Instrumentierungen** (Bar=Jazz, Maschinenraum=Hall, Büro=offiziell,
      Kapelle=spärlich, Kantine=rund, Flugdeck=militärisch, KLO=Stille)
- [ ] **Musik-Wechsel Takeoff → Cockpit** + JUMP-Musik (Spannung, hoch)
- [ ] **Sprite-Pass** (Schiffe aufhübschen, Planeten-Renderer, Sternenbasis SEKTOR 7)
- [ ] **Raum: SCHIFFSKATALOG** (X-Wing-Stil, Modelle + Infos, 12. Raum)
- [ ] **Beobachtungsdeck: Planet + System-Name** (seit v0.6.4 offen)
- [ ] **JUMP-Polish** (Quell-System schrumpft, Ziel wächst)

## v0.70 — "Enden & Papierkram"
- [ ] **3 Enden** (Sieg / Tod / Geheim)
- [ ] **Fax-Drucker UI** (Quest-Feedback als animiertes Fax)
- [ ] **Aktenschrank** (Büro: 5 Akten lesen → Flag → neuer Dialog)
- [ ] **Optimierer-Erscheinen** (nach m4, Bar, Dialog)
- [ ] **Externes Handbuch** (HTML + PDF, 12 Kapitel + Crew-Zitate)
- [ ] **RC-Paket v0.70-rc**

## v0.75 → v0.80 — "Freies Universum" (Major-Overhaul, Pläne stehen)
> Eigene Versionsserie. Details: KONZEPTE.md → "v0.75 → v0.80".
- [ ] **v0.75 Eigenes Schiff:** Schiffs-Markt (12 Modelle), Kaufsystem, Schiffswechsel,
      Stats → Flugphysik
- [ ] **v0.76 Universum wächst:** 3 → 20 Systeme, Jump-Gates (Treibstoff),
      Zufalls-Encounter
- [ ] **v0.77 Fraktionen:** Reputation 0–100 (Sternenkorps, Piraten, Audit, Siedler,
      Optimierer), Fraktions-Missionen, Reputation steuert Preise/Dialoge
- [ ] **v0.78 Mission Generator:** prozedurale Missionen, Missionsbrett, Kopfgeld,
      Zufalls-Events
- [ ] **v0.79 Ökonomie:** Credits, Schiffs-Markt, Upgrade-Shop, Wartungskosten
- [ ] **v0.80 Komplett:** NPC-Rivalen im Freiflug (Sechs/Neun/Zwo), Subplot-Fortsetzung,
      Zufalls-Lore, mehrere Enden

## BACKLOG (später, unverändert)
- [ ] **Cockpit-UI-Pass** (Weapon Display, Target Data, Throttle, grüner Radar) — Mittel
- [ ] **Würfelspiel** (Bar, Minispiel) — Klein
- [ ] **Simulator-Nachholung** (für Nicht-Bestandene) — Klein
- [ ] **Kältekammer-Ende** (Alien wird real, Futurion-Logik) — Mittel
- [ ] **Audit-Schiffe** (Wireframe, Stempel statt Explosionen) — Mittel
- [ ] **Beerdigungs-Event** (Kapelle nach Tod, Kerzen zünden) — Klein
- [ ] **Carrier-Interaktion** (3-Treffer-Warnung, One-Hit-Kill) — Klein
- [ ] **Romantik-System**, **Waffenausbau**, **Formation-Burst**, **Determination-Knob**,
      **Rout-Logik**, **Escort-Logik**, **Mehr Systeme**, **Save/Load**

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
