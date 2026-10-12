# SOLO WING 1990 — Konzepte & Design-Überlegungen

## v0.6.6-CYCLE: Sprung, Story, Musik, Optik (Plan, 2026-10)

> Feedback (Flotten-Commander): öfter Sprung von System X nach Y mit Backdrop + Story
> während des Flugs, Story-Test mit Briefing/Missionen/Missionsbaum, NPC-Verteilung +
> Dialoge pro Mission ändern, Dialog-Box scrollen (Text wird abgeschnitten),
> Optik aufhübschen (Sprites: Schiffe, Planeten, Sternenbasen), neuer Raum wie X-Wing
> (Schiffskatalog: Modelle anschauen + Infos), düdelnde Raum-Musik (eine Melodie,
> pro Raum anders instrumentiert: Bar=Jazz, Maschinenraum=Hall, Büro=offiziell).

### v0.6.6 — "Sprung & Dialog" (Grundlagen, diese Session)
- [x] **JUMP-Cinematic (6-Phasen-State-Machine, WC-Stil nach Regie-Anweisung):**
      1 Abflug (Träger fliegt von links ins Bild, statisches Sternenfeld) →
      2 Jump-Blase (sternförmiges Portal wächst) → 3 Sprung (Schiff fliegt beschleunigt
      in die Blase, Flash) → 4 Star-Wars-Wipe (weißer Kreis von der Blase) + Whoosh-Sound →
      5 Ankunft (neues System: ANDERE Sternenverteilung + System-Tint + Planet,
      "ANKUNFT: SEKTOR X") → 6 Austritt (neue Blase öffnet, Schiff fliegt rasant heraus) →
      7 Hold (`[LEERTASTE: ABHEBEN]`).
      Sterne bewegen sich auf der **Z-Achse (aus der Mitte heraus auf den Betrachter zu)**,
      nie vertikal wie Regen. Story-Zeilen mit TTS an Phasen-Grenzen (Abflug/Ankunft/Austritt),
      LEER/Klick = Sequenz überspringen. Alle 4 Missionen mit eigener Story
      (`data/dialogues.js → jumps`).
      → Nach Sieg/Tod: `World.systemId` = Einsatz-System (Beobachtungsdeck zeigt es an).
      Handoff: Briefing-Szene → JUMP → Takeoff.
- [x] **Briefing-Szene (statt statischer Tafel):** Einsatzleiter an der Tafel (Uniform,
      Kragenscheibe, zeigt mit Stock, leichte Bewegung), 3 Piloten auf Stühlen
      (Rückenansicht, Bob), Tafel mit Missionstext + WELLEN/SCHIFFE + gestrichelter Kurs,
      Commander-Zeilen mit Typing + TTS, danach `[LEERTASTE: ZUM SPRUNG]`.
      Daten: `dialogues.briefings` (m1–m3) bzw. `mission.briefing` (m4).
- [x] **Dialog-Paging + Scrollbar:** Umbruch 44→110 Zeichen, 4 Zeilen/Seite,
      Scroll-Indikator (Track + Daumen) rechts in der Box, `[LEER: WEITER]` pro Seite.
      Lange Dialoge werden nicht mehr abgeschnitten.
- [x] **NPC-Overhaul (11 Charaktere, `js/npc.js`):** Jeder NPC hat ein generiertes
      Gesicht (Canvas-Primitives: Kopf, Frisur, Gesichtszüge, Uniform, Pose) passend
      zur TTS-Stimme. Registry: Commander, Sechs, Neun, Zwo, Vier, Barkeep, Bolt,
      Pflaster, Diskettens, Klo, System — jeweils Stimme, Alter, Haut, Haar, Uniform,
      Features (Brille, Schnurrbart, Stethoskop, …), Persönlichkeit, Pose-Varianten.
- [x] **Cockpit-Video (280×160px):** NPC-Porträt + Sprechblase + TTS-Typing-Indikator.
      Verdrahtet in `SW.Comm.render()` (ui.js): jede Funkzeile "NAME: Text" zeigt 2 s
      das Gesicht des Sprechers. System-Farb-Rahmen, animiertes Bobbing.
- [x] **Briefing-Szene mit echten Gesichtern:** Commander + Sechs/Neun/Zwo (statt
      generischer Silhouetten) — `states.js → renderBriefing`.
- [x] **Workflow-Optimierung:** NPC-System in eigener Datei (`js/npc.js`, geladen vor
      `ui.js`), Dialoge datengetrieben (`npc`-Feld in `data/dialogues.js`), ein einziges
      Rendering-API `drawFace(npcId, x, y, size, options)` für alle Szenen.
- [ ] **JUMP-Polish (in 0.6.9 mit Optik-Pass):** Sternenbasis bei SEKTOR 7
      (`location:'station'`) als Silhouette, feinere Träger-Silhouette, Planet mit Ring.

### v0.6.7 — "Smart Dialogues" (das Dorf reagiert)
> Das Dorf muss **reagieren**: Wer eine Mission fliegt, wird danach im Dorf angesprochen.
> Wer eine Quest macht, hört davon im Klo. Engine ist klein, der Aufwand ist das
> **Schreiben** (geplanter Schreib-Block: 2–3 Wochen).

- [ ] **Dialogue-Engine** (`js/dialogue.js`): Context-Manager (Raum, letzte Mission,
      Quest-Flags, Ereignis-Log der letzten 20 Events), gewichtete Auswahl,
      Cooldown gegen Wiederholung, `req`-Gates ("sag das erst, wenn…").
- [ ] **Schreib-Block 1: Base-Dialoge** — 10–15 Zeilen pro NPC (~130 Zeilen). Jeder
      NPC im eigenen Ton: Sechs=Sarkasmus, Neun=Angst, Zwo=Professional, KLO=Weisheit,
      Bolt=Graus, Pflaster=Sorge, Diskettens=Technik, Vier=Optimismus,
      Barkeep=Synthetisch, Commander=Stoizismus, System=Neutral.
- [ ] **Schreib-Block 2: Mission-Reaktiv** — post-m1…m4 für alle 11 NPCs
      (Sieg UND Tod: das Dorf reagiert auf jeden Einsatz — Torte, Kältekammer, Siedler).
- [ ] **Schreib-Block 3: Quest-Dialoge** — Auftrag (via Fax/T), Erfolg, Fehlschlag.
- [ ] **Schreib-Block 4: Subplots** — Alien (Kältekammer), Audit, Optimierer:
      Stufen-Flags, die ALLE NPCs langsam auf die Wahrheit hinführen.
- [ ] **A/B-Story-Checks:** Subplot-Flags + Verzweigungs-Validierung — welcher Text
      bei welchem Spielstand, nichts bricht ab, keine Spoiler vor Freigabe,
      Subplot-Dialoge laufen parallel und konsistent.
- [ ] **Raum-Integration:** NPC-Klick → Smart-Dialogue (statt linearer Zeilen).
      Sprechblasen + NPC-Porträt (schon da: `SW.NPC.drawFace` / `renderCockpitVideo`).

### v0.6.8 — "Quests, Trigger & Missionsbaum"
- [ ] **Quest-Datenbank:** 5 → 50+ Quests (Main, Alien-Subplot, Audit-Subplot,
      Crew-Persönlichkeits-Arcs, wiederholbare Side-Quests, Hidden).
- [ ] **Quest-Ketten:** Main (m1→m4), Alien (4 Stufen), Audit (3 Stufen), Crew (pro NPC).
- [ ] **Flug-Trigger:** `SW.Quests.flight(event)` — onKill, onMissionComplete,
      onShieldLow, onRoomEnter → Quests spawnen/fortschreiten/abschließen.
- [ ] **Missions-Spawner:** Quests können Missionen spawnen (Ziel-System, Wellen,
      `onMissionSpawn`-Hook) statt nur zu belohnen.
- [ ] **Missionsbaum:** Briefing-Tafel zeigt m1→m2→m3→m4 mit gesperrt/frei
      (Fortschritts-Flags in `SW.World.missionProgress`).
- [ ] **Quest-Log-UI:** Fax-Stil (T-Display): aktive Quests, Fortschritt, Belohnung.
- [ ] **NPC-Verteilung pro Mission:** `World.init(missionId, seed)` → die Gast-Piloten
      stehen je nach aktueller Mission in anderen Räumen (Seed inkl. missionId).
- [ ] **Full Story-Test:** m1→m2→m3 durchspielen, Deck + Dialoge unterscheiden sich.
- [ ] **Fix: Minimap-Grid** (5×2 = 10 Slots, aber 11 Räume → 11. Punkt steht außerhalb).
      Auto-Berechnung von cols/rows (z.B. 6×2 ab 11 Räumen).

### v0.6.9 — "Musik, Optik & Katalog"
- [ ] **Eine Melodie** (4-Akkord-Drone-Loop, prozedural WebAudio) + pro Raum andere
      Instrumentierung (gleiche Grundmelodie, anderes Kleid):
      | Raum | Klang |
      |------|-------|
      | BAR | Jazzy: Swing-Rhythmus, Triangle, hohe Lage |
      | MASCHINENRAUM | Low, viel Hall (Delay-Loop), Sawtooth |
      | BÜRO | Offiziell: Square, Staccato, marschartig |
      | KAPELLE | Spärlich: lange Sine-Noten, wenige Stimmen |
      | KANTINE | Rund: Sine, weich, leicht schwankend |
      | FLUGDECK | Militärisch: Square, gleichmäßig, "Appell" |
      | KLO | Fast keine (Stille + ein einzelner Ton) |
- [ ] **Musik-Wechsel Takeoff → Cockpit** (altes P2-Item) + JUMP-Musik (Spannung, hoch).
      Sound (O) schaltet SFX + Musik; TTS (M) bleibt separat.
- [ ] **Sprite-Pass:** 5 Schiffs-Varianten aufhübschen (mehr Pixel, Cockpit-Lichter,
      Triebwerk-Flammen), **Planeten-Renderer** (für JUMP + Beobachtungsdeck: Rings,
      Krater, Atmosphäre in System-Farbe), **Sternenbasis** (SEKTOR 7) als Silhouette.
- [ ] **Neuer Raum: SCHIFFSKATALOG** (X-Wing-/TIE-Stil): alle Modelle aus `data/ships.js`
      groß + prozedural gezeichnet, Klick → Info-Panel (Rolle, Waffen, Formulare).
      12. Raum → Minimap-Grid + Cheat-Map-Layout + Tür-Anbindung (Flugdeck).
- [ ] **Beobachtungsdeck:** Planet in System-Farbe + System-Name (steht seit v0.6.4 offen).

### v0.70 — "Enden & Papierkram"
- [ ] **3 Enden** (Sieg / Tod / Geheim)
- [ ] **Fax-Drucker UI** (Quest-Feedback), **Aktenschrank** (5 Akten → Flag),
      **Optimierer-Erscheinen** (nach m4, Bar)
- [ ] **Externes Handbuch** (HTML, 12 Kapitel)
- [ ] **RC-Paket v0.70-rc** + Doku-Pass

### v0.75 → v0.80 — "Freies Universum" (das große Um- und Auf)

> Nach der Kampagne (m1–m4) bekommt der Spieler **sein eigenes Schiff** und das
> Universum wird offen: selbst wählen, wo man hinfliegt. Totaler Major-Overhaul —
> daher eigene Versionsserie. Pläne stehen IM VORAUS, damit die Architektur (Engine,
> Ökonomie, Missionsdesign, Fraktionen) nicht nachträglich verbogen werden muss.

- **v0.75 — Eigenes Schiff:**
  - Schiffskatalog wird **Schiffs-Markt** (12 Modelle, Stats, Preise in Credits).
  - Kaufsystem: Credits, Bestätigung, Eigentum in `SW.World.ownShip`.
  - Schiffswechsel: Träger-Jäger ↔ eigenes Schiff, Flugphysik von Stats abhängig.
- **v0.76 — Universum wächst:**
  - 3 → 20 Systeme (Station, Planet, Anomalie, leer, Siedler-Kolonie).
  - Jump-Gates: Treibstoff-Kosten, Reisezeit, neue JUMP-Phasen pro Systemtyp.
  - Zufalls-Encounter während des Flugs (Kontakt, Frachter, Stille).
- **v0.77 — Fraktionen:**
  - Reputations-Tracking 0–100: Sternenkorps, Piraten, Audit, Siedler, Optimierer.
  - Fraktions-Missionen, Konflikt-/Neutral-/Freundschafts-Encounter.
  - Reputation steuert Preise, Missionsangebote, Dialog-Varianten (Smart Dialogues).
- **v0.78 — Mission Generator:**
  - Prozedurale Missions-Generierung (Kontakt, Eskort, Abfang, Anomalie).
  - Missionsbrett in Stationen; Kopfgeld-System; Zufalls-Events (Notruf, Handel).
- **v0.79 — Ökonomie:**
  - Credit-System (verdienen, ausgeben, speichern); Wartung (Treibstoff, Reparaturen).
  - Upgrade-Shop: Waffen, Schild, Antrieb, Cockpit-Optionen.
- **v0.80 — Freies Universum komplett:**
  - NPC-Erscheinen im Freiflug: Sechs, Neun, Zwo fliegen eigene Posten (Rivalen).
  - Subplot-Fortsetzung (Alien, Audit, Optimierer) jenseits der Kampagne.
  - Zufalls-Lore (Logs, Nachrichten, Fundstücke); mehrere Enden (Wahl + Reputation).

### Warum diese Reihenfolge?
1. **JUMP + Dialog + NPC zuerst (0.6.6):** Die Story-Infrastruktur (State, Datenformat,
   TTS-Flow, NPC-Gesichter, Cockpit-Video) wird einmal gebaut und von allem späteren
   genutzt. Günstigste Zeit, weil 0.6.5-rc gerade frisch getestet ist.
2. **Smart Dialogues danach (0.6.7):** Das Dorf muss REAGIEREN, bevor Quests es
   ausbauen. Engine ist klein (1 Datei); der Aufwand ist das Schreiben, und das
   passiert am besten, während die Kampagne frisch in den Händen liegt.
3. **Quests + Missionsbaum (0.6.8):** Braucht World-Flags (0.6.6) und die
   Dialog-Engine (0.6.7, weil Quest-Erfolg Reaktions-Dialoge triggert).
   Flug-Trigger machen Quests zum echten Spielrhythmus.
4. **Musik + Optik (0.6.9):** Eigenes System (WebAudio + Sprites), kein
   Abhängigkeits-Chaos mit Story. 0.6.9 kann Optik UND Klang haben.
5. **0.70:** Die verbliebenen Story-Schnitte (Enden, Papierkram) — dann ist die
   Kampagne komplett und das freie Universum kann angegangen werden.
6. **0.75–0.80:** Freies Universum. Eigene Serie, weil es Engine, Ökonomie und
   Missionsdesign verändert — nicht mehr ein Patch, sondern ein neues Spiel
   auf derselben Basis.

## Versionierungs-Regel (ab sofort)
- **Keine Major-Bumps mehr.** Wir bleiben bewusst "weiter zurück".
- v0.6.0 → v0.6.1 → v0.6.2 ... (Minor-Patches)
- Ein neuer Feature-Block = Minor (v0.6.1). Kein v0.7.0, v1.0.0.
- Begründung: Das Spiel ist ein lebendes Projekt, kein "Release". Die Versionszahl ist ein
  Fortschritts-Marker, kein Qualitätsversprechen.

## Vom Träger "ewig leben" (Elite-Vergleich)
- **Elite:** Viele Systeme, jeder mit eigener Wirtschaft, NPC-Flotten, Missionen. Der
  Spieler springt zwischen Systemen. Der Träger ist nur ein Stützpunkt.
- **Wir (SOLO WING 1990):** Wir lernen von Elite, aber **einschränken**:
  - Der **Träger ist die Heimat**. Nicht nur Startpunkt, sondern der Ort, an dem man
    "ewig leben" kann. Bar, Büro, Kantine, Friseur, Kapelle — ein kleines **fliegendes Dorf**.
  - **Systeme sind Einsätze.** Man verlässt den Träger für eine Mission (1-3 Systeme),
    kommt zurück, lebt weiter.
  - **Wie viele Systeme?** Wir brauchen NICHT 20 wie Elite. Für die Kampagne: **3 Systeme**
    (SEKTOR 7, 9, 12). Das reicht für eine Kampagne mit Verzweigung.
  - **Der Träger lebt weiter:** Je nachdem wie die Mission läuft, verändert sich das Dorf:
    - Wie oft man zur **Beerdigung** muss (Kapelle)
    - Wie oft der **Reparaturraum** meckert (wenn man beschädigt zurückkommt)
    - Wer in der **Bar** sitzt (Piloten, die zurückgekommen sind vs. die, die nicht)
- **Fazit:** 3 Systeme + 1 Träger (als lebendes Dorf). Der Träger ist der emotionale Anker.

## Der Träger als "fliegendes Dorf"
- Der Träger ist kein toter Startpunkt. Er hat **Orte für Dialoge**:
  - Bar (Piloten, Scoreboard)
  - Kapitän-Büro (Akten, Befehle)
  - Kantine (Küche-NPC, Essen)
  - Friseur (absurd, Dialog)
  - Observationsdeck (Ausblick, Ruhe)
  - Maschinenraum (Technik)
  - Reparaturraum (meckert bei Beschädigung)
  - Kapelle (Beerdigung)
  - Flugdeck (Mission-Start)
- **Raumlogik:** Tür-Klick von Raum zu Raum. Karte in jedem Raum (wo man ist).
- **Artstyle:** Jeder Raum nach einer anderen Grafik (einfach, prozedural, für Agenten
  gut benutzbar). Kein einheitliches Design — jeder Raum hat seinen eigenen Look.

## Handoff zu den Szenen
- Der Übergang zwischen Szenen (Bar → Briefing → Takeoff → Cockpit) muss **flüssig** sein.
- Kein "leeres All" zwischen den Szenen. Der Handoff ist der Moment, wo die Geschichte
  weitergeht.
- **Cockpit-Bug:** "Ich sehe von dem Cockpit nichts" → auf die Todo. Nicht jetzt fixen.

## Nächste Schritte
1. TTS-Fix (Stage-Directions ignorieren) — ✅
2. Konferenz: Wieviele Räume hat der Träger?
3. Raumlogik implementieren (Tür-Klick, Karte, Artstyle pro Raum)
4. Handoff zu den Szenen sicherstellen
5. Cockpit-Bug fixen (Todo)
6. Intro-Sequenz (Asteroidenfeld + Name + Kreide-Tafel)
