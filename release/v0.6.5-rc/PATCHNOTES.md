# SOLO WING 1990 — Patch Notes

> **Team-Note (Flotten-Commander):** Die Iteration ist superschnell geworden. v0.1 → v0.6.5-beta in Rekordzeit. Das Dorf lebt jetzt. 7 neue NPCs. Die Wandkarte hängt an der Wand. Das Team (Commander, Lead Story, No Thinking, Code Review) liefert. Lob an alle. Weiter so.

## v0.6.5-rc — "Cheatmenü, Wandkarte, Transfer, Hangar, Dorf lebt" (aktuell, Release Candidate)

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
