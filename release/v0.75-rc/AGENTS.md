# Agents.md

Diese Datei ist für zukünftige KI-Agenten, Mitwirkende und nachfolgende Autoren gedacht. Sie dokumentiert den aktuellen Stand des Projekts, die technischen Regeln und die wichtigsten Lehren aus der bisherigen Entwicklung.

## 1) Architektur-Übersicht

### Projektidee
SOLO WING 1990 ist ein Browser-basierter 2D-Space-Shooter im Stil eines 1990er Wing Commander-ähnlichen Spiels. Die Welt ist bewusst nicht „modern“ aufgebaut: Die Kunst wirkt wie prozedurale 1990er-Daten, die UI ist textlastig, der Humor ist bürokratisch und deadpan, und das Spiel nutzt Canvas und Vanilla JS statt eines Frameworks.

### Kernprinzipien
- Keine Bundler- oder Build-Logik.
- Keine Assets-Pipeline im klassischen Sinn.
- Alles läuft im Browser als statische HTML-Seite.
- Die gesamte Logik lebt im globalen Namespace `SW`.
- Grafiken werden prozedural auf dem Canvas gerendert.
- Daten und Logik sind bewusst getrennt: Daten in `data/*.js`, Logik in `js/*.js`.

### Einstiegspunkt
Die Website startet über `index.html`.

Das ist die zentrale Lade-Reihenfolge:
- `js/config.js` setzt die globale Konfiguration
- Datenmodule in `data/*.js` laden Missions-, Crew-, Raum-, Dialog- und Systemdaten
- `js/*.js` initialisiert Engine, Sprites, Entities, Systems, UI und State-Handling
- zuletzt `js/main.js` startet den Hauptloop und die State Machine

Wichtig: Die Reihenfolge ist relevant. Das Projekt funktioniert nicht als moderne Module-Architektur; es erwartet, dass jeder Script-Block vor den Abhängigkeiten geladen wird.

### Prinzipien der Spiel-Architektur
- `SW` ist das globale Objekt, auf dem Spielstate, Engine, Player, NPCs, UI und World liegen.
- `SW.Engine` kapselt 3D-Projektion, camera/view logic und Sternenfluss.
- `SW.Sprites` ist die prozedurale Grafik-Schicht; hier werden Schiffe, Cockpit, Carrier und andere Objekte im Canvas gezeichnet.
- `SW.Game` und `SW.State`-ähnliche Logiken steuern die State-Machine (`INTRO`, `SHIP`, `TAKEOFF`, `COCKPIT`, `DEBRIEFING`, usw.).
- `data/*.js` enthält nur Daten und Textblöcke; keine Rendering-Logik.

### Raum- und Space-System
Das Spiel hat zwei wesentliche Sichtweisen:
- Raum-/Raumschiff-System: Innenräume, Türen, NPCs, Inventar, Dialoge, Crew-Quartiere
- Space-System: Sternenhimmel, Bewegung im Weltraum, Flugsimulation, Gegner, Projectiles, Träger im Feld

Der entscheidende Code-Teil liegt in:
- `js/engine.js` — Spielkameras, Perspektive, Sternenfluss, Projektion
- `js/config.js` — physikalische Konstanten, Flug- und Geschwindigkeitswerte
- `js/sprites.js` — prozedurale Pixel-Art/Cockpit/Grafik
- `js/entities.js` — Enemy-, Player-, Projectile- und Carrier-Logik
- `js/systems.js` — Flug, Autopilot, Physics, Gegner-Interaktionen

### Architektur-Merkmale
- Flat-perspective rendering statt echter 3D-Engine
- Canvas-Rendering statt WebGL oder Assets
- “Deadpan” Narrative ist Teil der Spielidee, nicht nur Optik
- Die Inhalte sind „funktional“ mit den Spielmechaniken verbunden, nicht nur dekorativ

---

## 2) Eiserne Regeln für dieses Projekt

### 2.1 Grafiken ohne Assets rendern
Das Projekt ist bewusst auf prozedurale Grafik gesetzt. Das heißt:
- Keine PNG-Assets als Standard-Workflow
- Keine Abhängigkeit von externen Grafikinhalten
- Schiffe, Cockpit, Träger und UI müssen im Canvas gezeichnet werden
- Sichtbarkeit, Design und Stil müssen durch kleine, klare Pixel-Matrizen und Farbblöcke entstehen

Wenn eine Grafik „zu modern“ oder „zu detailliert“ aussieht, ist sie wahrscheinlich falsch.

### 2.2 Keine moderne Module-Architektur erzwingen
Das Projekt ist kein ES-Module-Projekt. Ein Agent darf nicht einfach mit `import`/`export` starten und das gesamte System umstrukturieren, ohne die globale Lade-Reihenfolge zu prüfen.

Werden Scripts verschoben, neu sortiert oder in Module umgewandelt, muss das Spiel nachfolgend mit dem Smoke-Test validiert werden.

### 2.3 State-Machine ist heilig
Das Spiel basiert auf klaren Zuständen. Jeder neue State muss nachvollziehbar sein:
- `INTRO`
- `AKADEMIE`
- `ARRIVAL`
- `BAR`
- `SHIP`
- `BRIEFING`
- `TAKEOFF`
- `COCKPIT`
- `LANDING`
- `HANGAR`
- `DEBRIEFING`
- `CREDITS`

Wenn ein State hinzugefügt wird, muss klar sein:
- Welche Eingaben sind dort gültig?
- Welche UI entsteht dort?
- Welche Übergänge bestehen?
- Welche Daten werden von dort übernommen?

### 2.4 Daten und Logik nicht vermischen
`data/*.js` enthält Inhalte und Inhalte allein.
`js/*.js` enthält Verhalten, Rendering und Mechanik.

Ein Agent darf nicht Funktionen aus dem Rendering in die Daten-Dateien verschieben oder NPC-Strings in der Logik „verstecken“.

### 2.5 Code-Lesbarkeit und menschliche Verständlichkeit
Das Projekt ist nicht nur ein funktionierender Spielcode, sondern auch ein Arbeitsmaterial für Menschen. Ein guter Change muss deshalb nicht nur laufen, sondern auch nachvollziehbar sein.

Regeln:
- Code sollte für andere Entwickler lesbar bleiben: klare Namen, kleine Funktionen, keine „Magie" ohne Erklärung.
- Sonderfälle und historische Eigenheiten müssen kommentiert werden, wenn sie nicht sofort aus dem Kontext ersichtlich sind.
- Architektur-Entscheidungen (Global-Namespaces, Load-Order, State-Handling, UI-Callbacks) sollten durch Namen und kurze Kommentare verständlich bleiben.
- Der Code soll auch als Lernmaterial dienen: Ein anderer Mensch oder ein späterer Agent muss verstehen, warum etwas so gebaut ist und welche Risiken bestehen.

Wenn ein Feature nur „funktioniert, aber nicht klar ist“, ist es noch nicht reif. Das Spiel darf chaotisch sein, aber das darf nicht in unlesbaren, nicht erklärbaren Code ausarten.

### 2.6 Smoke-Test vor Merge/Release
Vor großen Änderungen muss der Status mit `node _smoke_test.js` geprüft werden.

Das Projekt hat bereits genug Regressionsfälle gezeigt, um ein solches Test-Tool nicht als optional anzusehen.

### 2.7 Kein “Quick Fix” bei Shell/Datei-Explosionsfehlern
Der Verlauf zeigt: Dateibeschädigungen sind nicht immer ein Codefehler, sondern oft ein Dateiformat-/Shell-/Git-Fokusproblem. Wenn Dateien plötzlich „in eine Zeile“ fallen oder `n` statt Zeilenumbrüche auftauchen, muss die Ursache nicht im Game-Loop liegen; sie liegt oft im Text-/Datei-Handling.

---

## 3) Lessons Learned aus den letzten Fehlern

### 3.1 Git und Dateiwächterprobleme
Es gab bereits mehrfach Probleme mit:
- Shell-/Fokus-Fehlersprüngen
- komprimierten oder beschädigten Dateien
- „in eine Zeile zusammengezogene“ Script-Dateien
- Katzen- oder halbinteraktiven Commits

Das ist das Wichtigste: Git-Historie und Text-Dateien sind nicht „sicher“, wenn die Umgebung unkontrolliert ist. Deshalb:
- vor der Pause committen
- vor größeren Änderungen `git status` prüfen
- vor einem wichtigen Merge/Release nicht im Stress arbeiten
- bei verdächtigen Dateizerstörungen zuerst die Datei selbst prüfen, nicht sofort auf die Logik schließen

### 3.2 UI-Bugs sind oft nicht nur UI-Bugs
Ein scheinbar kleines Rendering-Problem kann aus einer Schädigung der Datei, einer falschen Ausführungsliste oder einer unkontrollierten Sichtweite entstehen.

Beispiele:
- `ui.js` oder `style.css` in eine Zeile zusammengezogen
- Handbuch- oder Theme-Dateien ohne korrekte Zeilenumbrüche
- CSS statt Codefehler diagnostiziert

### 3.3 Load-Order und Globals sind ein echtes Risiko
Dieses Projekt hängt an Sequential-Script-Loading. Wenn ein neues Skript zwischen zwei bestehenden eingefügt wird oder ein File in einem anderen Abschnitt geladen wird, kann das Spiel subtile oder massive Regressionsfehler produzieren.

Tatsächliche Regel: Bevor ein neues Script hinzugefügt wird, prüfen:
- braucht es `SW`-Globals?
- ist es vor allen Abhängigkeiten geladen?
- ist die Reihenfolge konsistent mit `index.html`?

### 3.4 Prozedurale Grafik ist gut – aber sie muss sauber gehalten werden
Die prozedurale Pixel-Art ist eine Stärke. Sie ist schnell, flexibel und passend zum Stil. Aber:
- Zu viel Code in einer Render-Funktion führt zu unlesbaren Musterungen
- Jede neue Schiffsklasse oder UI-Elemente sollten klar benannt und als Funktion oder Muster definiert werden
- “NoThink” ist kein Qualitätsmerkmal; es ist ein Warnhinweis

### 3.5 Spezialfälle verzögern das Spiel mehr als erwartet
Der Träger, die Schiffs-Interior-Struktur, NPC-Dialoge, die Gegend bei `ARRIVAL`, Save/Load, Audio/TTS und UI-Komponenten sind alle Gruppen von Sonderfällen. Sie sind nicht “nice to have”; sie sind Risiken.

Ein Agent muss bei jedem neuen großen Feature fragen:
- Welche Sonderfälle gibt es?
- Was passiert bei `ESC`?
- Was passiert bei fehlender TTS/Audio?
- Was passiert bei tiefem/kurzem Render-Zyklus?
- Was passiert bei unvollständigen Daten?

### 3.6 Freude und Stil sind keine Entschuldigung für schlechte Architektur
Das Projekt lebt von Deadpan-Stil, 1990-Ästhetik und bewusster Unordnung. Das ist cool. Aber das darf keine Entschuldigung für fragile Architektur sein.

Wenn eine Lösung „funktioniert, aber nur in einem bestimmten Laufzustand“, ist sie noch nicht reif.

---

## 4) Technische Schulden (Tech Debt) und Risikobereiche

### 4.1 Globaler Namespace / unstrukturierte Abhängigkeiten
Hauptproblem:
- Alles hängt am globalen `SW`
- Abhängigkeiten sind nicht per Module klar
- Dateien erwarten, dass andere Files bereits ausgeführt wurden

Risiko:
- neue Feature lassen sich nicht sauber isolieren
- Refactors sind riskant
- ein Agent kann mit einem kleinen Change ganze Flugsysteme destabilisieren

### 4.2 Rendering und Logik sind eng verwoben
In diesem Projekt sind Logik, Vektoren, UI-Meldungen und Zeichnung oft im selben Block. Das macht das Projekt schnell adaptiert, aber später schwer verständlich.

Es entsteht Tech Debt dort, wo:
- Spielzustand und UI-Darstellung unklar getrennt sind
- Rendering-Details in State-Logic eingemischt werden
- neue Features direkt an bestehende Renderfunktionen hängen

### 4.3 Data-Modelle sind als flache Datenstrukturen implementiert
Das Spiel hat viele Datenblöcke, aber nicht immer ein sauberes Datenmodell darüber. Das ist praktisch für schnelle Iteration, aber schwer für langfristige Erweiterung.

Risikofelder:
- save/load
- dialog progression
- room metadata
- mission configuration
- NPC room-assignment

### 4.4 Teilweise doppelte oder „historische“ Implementierungen
Es gibt mehrere historische Iterationen in `release/` und `ui.js.bak`. Das zeigt, dass die Projektgeschichte nicht immer clean ist. Für zukünftige Agenten ist klar:
- `release/*.rc` und ältere Versionsordner sind Referenzen, keine „Autoritätsquellen“
- `ui.js.bak` ist kein aktiver Code; es ist Archiv und kann irreführend sein
- Wer einen Fix sucht, muss zuerst den aktuellen Live-Code prüfen, nicht den Archivcode

### 4.5 UI- und Story-Logik ist in vielen Fällen „schräg aber funktional“
Das Spiel funktioniert, weil es viel Handling mit der Story und mit Spezialfällen gelernt hat. Das ist nicht falsch, aber die Stabilität ist fragil. Wenn du am nächsten Feature arbeitest, prüfe immer die Nebenwirkungen auf:
- ESC-Menüs
- Briefing- und Debriefing-State
- TTS-Audio ausfallsicher
- Dialog-Endlosschleifen
- Raumportal-/Tür-Interaktionen

---

## 5) Empfehlungen für die nächsten Refactoring-Schritte

### Priorität 1: Die globale Abhängigkeitsstruktur stabilisieren
Ziel:
- `SW` als klar definierte, dokumentierte zentrale Struktur
- konsistente Initialisierung Reihenfolge
- weniger „ideomatische” Abhängigkeit zwischen Dateien

Mögliche Schritte:
- Ein `init()`-Muster für die Initialisierung zentralisieren
- `SW`-struktur explizit deklarieren und dokumentieren
- Load-Order und Script-Abhängigkeiten in einer klaren Datei festhalten

### Priorität 2: UI und State entkoppeln
Ziel:
- Rendering und State-Logik räumlich und semantisch trennen
- UI-Funktionen nicht in game-state code verschachteln

Empfehlung:
- `SW.UI` sollte eher reine Darstellung übernehmen
- `SW.Game` sollte eher Zustände und Übergänge steuern
- Event-Schlag-Logik in bestimmte Handler auslagern

### Priorität 3: Raum- und Schiffslogik entwirren
Der Innenraum des Trägers und die Crew-/Quartier-Struktur sind entscheidend für die Zukunft. Es sollte klar getrennt werden:
- Raum-Definition
- Raum-Interaktion
- NPC-Assignments
- Save/Load-Panel
- Quest-/Narrativ-Zustand

Das ist der wahrscheinlichste Bereich, in dem das Spiel in den nächsten Schritten wirklich „spielbar“ wird.

### Priorität 4: Rendering-Loop sauberer strukturieren
`updateStars`, Sichtmodi, Projektionen und `screenPos` sollten klar dokumentiert bleiben. Die Hauptschwäche hier ist nicht das Konzept, sondern die Unschärfe zwischen:
- Physik
- Kamera
- Rendering
- UI overlays

### Priorität 5: Tests erweitern, nicht nur auf Smoke-Test verlassen
Es gibt bereits `_smoke_test.js`, das ist gut. Für die nächsten Schritte sollte aber die Testbasis auf semantische und kleinere Einzelfunktionen erweitert werden:
- Player movement
- camera transitions
- room interactions
- savegame logic
- dialog progression gates

### Priorität 6: Prozedurale Grafik weiter standardisieren
Die Grafik muss konsistent bleiben und nach klaren Regeln funktionieren:
- keine unsichtbare „Magie“ in Canvas-Rendering-Funktionen
- Farben und Größen müssen benannt und nachvollziehbar sein
- neue Schiffe und UI-Elemente mit Muster und “sprite factory” bauen, nicht ad hoc

---

## 6) Empfehlungen für zukünftige Agenten

### Was man nicht tun sollte
- keine großen „Refactor-PRs“ ohne Smoke-Test
- keine Module-Umstellung ohne Reihenfolge- und Initialisierungsprüfung
- keine neuen Features am Space-Loop ohne Kamerawirkung zu prüfen
- keine Änderungen an `index.html` ohne Script-Ladeordnung zu kontrollieren
- keine Asset-Änderungen ohne den Stil des Projekts zu reflektieren

### Was man immer prüfen sollte
- `index.html`-Script-Reihenfolge
- `SW` und globale Objekt-Initialisierung
- `ESC`-Menüs und Player-Input
- Space- und Cockpit-Renderings
- Audio/TTS-Unsupported-Szenarien
- Savegame- und Dialog-Fluss bei State-Wechseln

### Der wichtigste Satz für den nächsten Agenten
Das Projekt ist kein „sauberes“ modernes Spielframework. Es ist ein bewusst händisch gebautes, bürokratisch-absurdes 1990er-Browser-Spiel mit Canvas-Rendern, globalem State und prozeduralen Grafiken. Es funktioniert nicht wegen perfekter Architektur, sondern wegen klarer Regeln, konsistenter Stil-Entscheidungen und einer gut verstandenen State-Machine.

Wenn du also weiterbaust, mach das mit Respekt vor diesen Regeln.

---

## 7) Kurzfassung für den nächsten Agenten

- Das Spiel läuft direkt in einem Browser über `index.html`.
- Alles läuft über das globale `SW`-Objekt.
- Raum-Systeme, UI und Space-Systeme sind getrennte, aber gekoppelte Bereiche.
- Grafiken werden prozedural gerendert, nicht über Asset-Dateien.
- Der Smoke-Test ist die Mindest-Validierung vor Release.
- Der größte technische Schulden-Bereich ist die unstrukturierte globale Architektur.
- Der nächste wichtige Schritt ist nicht „mehr Features“, sondern sauberere Verantwortungsteilung zwischen State, UI und Rendering.
- Das Projekt wird erst dann wirklich spielbar, wenn Räume, Crew, Dialoge und Gameplay konsequent zusammenwachsen.

"Wir fliegen allein. Wir fliegen zusammen."
