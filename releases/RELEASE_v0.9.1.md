# SOLO WING 1990 — Release v0.9.1

> **Audio-Zentrale, Escape-Menü Redesign, Wing Commander MOD-Soundtrack & Dogfight AI**

Herzlich willkommen zu **SOLO WING 1990 v0.9.1**! Dieses Release liefert ein generalüberholtes Escape-Menü mit einer dezidierten Audio-Zentrale, voller Amiga Paula ProTracker MOD-Musikunterstützung (inklusive Offline-Fallback für `file://`), spürbar intensiverem Dogfight-Gefühl und taktischen Story-Entscheidungen.

---

## 📦 Download & Prüfsummen

- **Release-Archiv:** [`solo_wing_1990-v0.9.1.zip`](solo_wing_1990-v0.9.1.zip) (4.90 MB)
- **SHA-256:**
  ```
  9e284f8c69b09cef32a1979530d63789fabff80e69719ee84ceb3cfb493216d9
  ```

---

## 🕹️ Schnellanleitung zum Spielen

1. Archiv `solo_wing_1990-v0.9.1.zip` herunterladen und entpacken.
2. Doppelklick auf `index.html` im Browser eurer Wahl (Chrome, Edge, Firefox, Safari).
3. **Keine Installation, kein Node.js, kein Build-Tool notwendig!** Alles läuft 100% offline in reinem Vanilla JavaScript und HTML5 Canvas.

---

## 🚀 Die wichtigsten Neuerungen in v0.9.1

### 1. Generalüberholtes Escape-Menü & Neue Audio-Zentrale (`[ESC]` -> `[A]`)
- **Strukturierte 2-Spalten-Architektur:**
  - Linke Spalte: Steuerungsübersicht, Flugmanöver und Staffelfunk.
  - Rechte Spalte: Audio & Sound, Systemhilfe und geschützter Testbetrieb.
- **Dezidierte Audio- & Sound-Zentrale (`[A]` / Klick):**
  - **Amiga Paula 5.2 kHz Hardware-Filter:** Echter A500 LED-Tiefpassfilter umschaltbar (`[F]`) für den warmen Amiga-Originalklang.
  - **Master-Lautstärke:** Präzise regelbar über Schieberegler, Pfeiltasten `[← / →]` oder `[+]`/`[-]` mit Prozentanzeige.
  - **Toggles:** Effektsound `[O]`, Amiga MOD-Musik `[P]` und Sprachausgabe `[M]`.
  - **Integrierte Jukebox / Test-Presets:** Direktanwahl von `[1] MESSE`, `[2] FLUG`, `[3] KAMPF`, `[4] ALARM`, `[5] ORDEN` sowie `[0] STOPP`.

### 2. Wing Commander 1 Amiga MOD-Soundtrack (Mark TDK Knight)
- **Autonome 4-Kanal ProTracker WebAudio Engine:** Echte 1990er Amiga Paula-Synthese ohne externe Abhängigkeiten.
- **Offline Base64-Archiv (`data/mod_archive.js`):** 14 Kern-Soundtracks spielen sofort und ohne CORS-Blockaden, auch wenn das Spiel direkt per Dateisystem (`file://`) gestartet wird.
- **Dynamische Gefechts-Hysterese:** Der Soundtrack schaltet im Raumkampf intelligent und ohne Stottern zwischen Reiseflug, Dogfight, Alarm (Gegner im Heck) und Zielverfolgung um.

### 3. Echtes Dogfight-Gefühl & Kampfdynamik
- **Tailing-KI:** Feinde versuchen aktiv, sich auf die 6 des Spielers zu setzen.
- **Ausweich-Schlangen:** Anvisierte Jäger fliegen Kurven und Schlangenlinien.
- **Wingman-Balancing:** Wingman Sechs feuert mit natürlicher Streuung – Abschüsse müssen vom Piloten selbst erarbeitet werden.

### 4. Taktische Story-Entscheidungen & Quests
- **Commander-Wahl:** Entscheidung zwischen *"Stellung halten"* (Frontlinie & Orden *"Sternenkreuz am Bande"*) und *"Taktischer Rückzug"* (Guerilla- & Privateer-Handelspfad).
- **Protokoll Argon-Flash:** Meta-Quest und Koprozessor-Upgrade bei Ingenieur Löffel.

---

## ⌨️ Steuerung

| Taste | Aktion |
|---|---|
| **WASD / Pfeiltasten** | Flugsteuerung (Steuerdüsen & Drift) |
| **Shift** | Nachbrenner (Vorschub-Boost) |
| **Leertaste / Linksklick** | Laser feueren |
| **Q / E** | Rollen |
| **1 – 4 (Flug)** | Staffelfunk VDU (Angriff, Formation, Rückzug, Spott) |
| **Y / L (Flug)** | Ziel erfassen / Landeanflug starten |
| **T / N** | Autopilot / Navigationscomputer |
| **K (Träger)** | Armada- & Sektorkarte |
| **S / H (Träger)** | Staffel-Terminal / Holo-Chat |
| **J (Träger)** | Schiffszeitung (Fax-Journal) |
| **ESC** | Menü & Pause |
| **A (Im Menü)** | Audio- & Sound-Zentrale öffnen |

---

*„Wir fliegen allein. Wir fliegen zusammen.“*
